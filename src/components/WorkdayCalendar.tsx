'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Home, Settings, List, Printer } from 'lucide-react'
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  addDays, 
  addMonths,
  subMonths,
  addYears,
  subYears,
  isSameMonth,
  isToday,
  parseISO,
  differenceInDays,
  eachMonthOfInterval
} from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { CustomDayWithId } from '../types/workday'
import { getDayStatus, loadAllCustomDays, WorkdayCalculationDetails, loadCustomDaysFromStorage } from '../utils/workday-helpers'
import { UnifiedCalendarSettings } from './UnifiedCalendarSettings'
import { generatePrintableHTML } from './SimplePrintCalendar'

interface WorkdayCalendarProps {
  calculationRange?: {
    startDate: string
    endDate: string
    startTime?: string
    endTime?: string
  }
  calculationDetails?: WorkdayCalculationDetails
  selectedCardType?: string
  calculationMode?: 'inputDays' | 'inputRange' | 'calculateHours'
  calculationType?: 'workdays' | 'calendarDays'
  inclusionMode?: 'current' | 'next'
}

export function WorkdayCalendar({ calculationRange, calculationDetails, selectedCardType, calculationMode, calculationType, inclusionMode }: WorkdayCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [customDays, setCustomDays] = useState<CustomDayWithId[]>([])
  const [showSettings, setShowSettings] = useState(false)
  const [selectedYear, setSelectedYear] = useState<string>('')
  const [showYearPicker, setShowYearPicker] = useState(false)
  const [showMonthPicker, setShowMonthPicker] = useState(false)

  // 當設定模式開啟時，初始化年份選擇器
  useEffect(() => {
    if (showSettings && !selectedYear) {
      const allCustomDays = loadAllCustomDays()
      const yearlySettings: { [year: string]: CustomDayWithId[] } = {}
      
      allCustomDays.forEach(day => {
        const year = day.date.substring(0, 4)
        if (!yearlySettings[year]) {
          yearlySettings[year] = []
        }
        yearlySettings[year].push(day)
      })
      
      const availableYears = Object.keys(yearlySettings).sort((a, b) => b.localeCompare(a))
      if (availableYears.length > 0) {
        // 優先選擇當前年度，如果沒有則選擇最新年份
        const currentYear = new Date().getFullYear().toString()
        const targetYear = availableYears.includes(currentYear) ? currentYear : availableYears[0]
        setSelectedYear(targetYear)
      }
    }
  }, [showSettings])

  useEffect(() => {
    loadCustomDays()
  }, [])

  // 點擊外部關閉選擇器
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showYearPicker || showMonthPicker) {
        setShowYearPicker(false)
        setShowMonthPicker(false)
      }
    }

    if (showYearPicker || showMonthPicker) {
      document.addEventListener('click', handleClickOutside)
      return () => {
        document.removeEventListener('click', handleClickOutside)
      }
    }
  }, [showYearPicker, showMonthPicker])

  // 當計算範圍變化時，自動跳轉到開始日期的月份
  useEffect(() => {
    if (calculationRange?.startDate) {
      try {
        const startDate = parseISO(calculationRange.startDate)
        // 只有當開始日期不在當前顯示月份時才跳轉
        if (!isSameMonth(startDate, currentDate)) {
          setCurrentDate(startDate)
        }
      } catch (error) {
        // 靜默處理錯誤
      }
    }
  }, [calculationRange?.startDate])

  const loadCustomDays = () => {
    try {
      const days = loadAllCustomDays()
      setCustomDays(days)
    } catch (error) {
      setCustomDays([])
    }
  }

  const generateCalendarDays = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

    const days = []
    let day = calendarStart

    while (day <= calendarEnd) {
      days.push(day)
      day = addDays(day, 1)
    }

    return days
  }

  const getDaySequenceNumber = (day: Date): number | null => {
    if (!calculationRange || !calculationDetails || !selectedCardType) {
      return null
    }
    
    const { startDate, endDate } = calculationRange
    try {
      const start = parseISO(startDate)
      const end = parseISO(endDate)
      
      // 統一時間為當日開始時間進行比較
      const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate())
      const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate())
      const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate())
      
      // 檢查日期是否在範圍內
      if (dayStart < startDay || dayStart > endDay) {
        return null
      }
      
      const dayStatus = getDayStatus(day, customDays)
      
      // 根據選中卡片類型決定要顯示序號的日期類型
      let shouldShowSequence = false
      switch (selectedCardType) {
        case 'totalDays':
          shouldShowSequence = true // 所有日期都顯示
          break
        case 'workdays':
          shouldShowSequence = dayStatus.type === 'workday'
          break
        case 'weekends':
          shouldShowSequence = dayStatus.type === 'holiday' // 包含所有假日：週末假日和自訂假日
          break
        case 'customHolidays':
          shouldShowSequence = dayStatus.type === 'holiday' && dayStatus.isCustom
          break
        case 'workHours':
          shouldShowSequence = dayStatus.type === 'workday'
          break
        default:
          return null
      }
      
      if (!shouldShowSequence) {
        return null
      }
      
      // 計算序號
      let count = 0
      let currentDay = new Date(startDay)
      
      while (currentDay <= dayStart) {
        const currentDayStatus = getDayStatus(currentDay, customDays)
        let shouldCount = false
        
        switch (selectedCardType) {
          case 'totalDays':
            shouldCount = true
            break
          case 'workdays':
            shouldCount = currentDayStatus.type === 'workday'
            break
          case 'weekends':
            shouldCount = currentDayStatus.type === 'holiday' // 包含所有假日：週末假日和自訂假日
            break
          case 'customHolidays':
            shouldCount = currentDayStatus.type === 'holiday' && currentDayStatus.isCustom
            break
          case 'workHours':
            shouldCount = currentDayStatus.type === 'workday'
            break
        }
        
        if (shouldCount) {
          count++
        }
        
        if (currentDay.getTime() === dayStart.getTime()) {
          return count
        }
        
        currentDay = addDays(currentDay, 1)
      }
      
    } catch (error) {
      // 靜默處理錯誤
    }
    
    return null
  }

  const handleYearChange = (direction: 'prev' | 'next') => {
    const newDate = direction === 'prev' 
      ? subYears(currentDate, 1) 
      : addYears(currentDate, 1)
    setCurrentDate(newDate)
  }

  const handleMonthChange = (direction: 'prev' | 'next') => {
    const newDate = direction === 'prev' 
      ? subMonths(currentDate, 1) 
      : addMonths(currentDate, 1)
    setCurrentDate(newDate)
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  const handlePrint = () => {
    if (!calculationRange || !selectedCardType) {
      return
    }

    // 創建新視窗來顯示可列印的月曆
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('請允許彈出視窗以進行列印')
      return
    }

    try {
      // 生成可列印的HTML內容
      const printHTML = generatePrintableHTML({
        calculationRange,
        calculationDetails,
        selectedCardType,
        customDays,
        calculationMode,
        calculationType,
        inclusionMode
      })
      
      printWindow.document.open()
      printWindow.document.write(printHTML)
      printWindow.document.close()
      
      // 使用 setTimeout 確保內容完全載入後再執行列印
      setTimeout(() => {
        try {
          printWindow.print()
        } catch (error) {
          // 靜默處理錯誤
        }
      }, 500)
      
    } catch (error) {
      alert('生成列印內容失敗，請稍後再試')
      printWindow.close()
    }
  }



  const days = generateCalendarDays()
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']

  return (
    <Card className="flex flex-col h-full md:border md:rounded-lg md:shadow md:bg-card border-0 rounded-none shadow-none bg-transparent">
      <CardHeader className="md:px-6 md:pt-6 md:pb-0 px-[21px] pt-[21px] pb-0 py-[0px]">
        <CardTitle className="grid grid-cols-3 items-center">
          {/* 左側回到今天按鈕 */}
          <div className="justify-self-start">
            {!showSettings && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleToday}
                title="回到今天"
              >
                <Home className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* 中央標題或年份月份控制 */}
          <div className="justify-self-center">
            {!showSettings ? (
              <div className="flex items-center gap-2 relative" onClick={(e) => e.stopPropagation()}>
                {/* 左箭頭按鈕 */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMonthChange('prev')}
                  title="上個月"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                {/* 年份和月份按鈕 */}
                <div className="flex items-center gap-1">
                  <span
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowYearPicker(!showYearPicker)
                      setShowMonthPicker(false)
                    }}
                    className="px-3 py-1.5 rounded-md hover:bg-accent cursor-pointer transition-colors"
                  >
                    {format(currentDate, 'yyyy')}
                  </span>
                  <span className="text-muted-foreground">/</span>
                  <span
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowMonthPicker(!showMonthPicker)
                      setShowYearPicker(false)
                    }}
                    className="px-3 py-1.5 rounded-md hover:bg-accent cursor-pointer transition-colors"
                  >
                    {format(currentDate, 'M')}
                  </span>
                </div>

                {/* 右箭頭按鈕 */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMonthChange('next')}
                  title="下個月"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>

                {/* 年份選擇器彈出層 */}
                {showYearPicker && (
                  <div 
                    className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-popover border rounded-md shadow-lg z-50 p-2 grid grid-cols-4 gap-1 w-64"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {Array.from({ length: 21 }, (_, i) => {
                      const year = currentDate.getFullYear() - 10 + i
                      return (
                        <Button
                          key={year}
                          variant={year === currentDate.getFullYear() ? "default" : "ghost"}
                          size="sm"
                          className="h-8"
                          onClick={(e) => {
                            e.stopPropagation()
                            const newDate = new Date(currentDate)
                            newDate.setFullYear(year)
                            setCurrentDate(newDate)
                            setShowYearPicker(false)
                          }}
                        >
                          {year}
                        </Button>
                      )
                    })}
                  </div>
                )}

                {/* 月份選擇器彈出層 */}
                {showMonthPicker && (
                  <div 
                    className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-popover border rounded-md shadow-lg z-50 p-2 grid grid-cols-4 gap-1 w-48"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {Array.from({ length: 12 }, (_, i) => {
                      const month = i + 1
                      return (
                        <Button
                          key={month}
                          variant={month === currentDate.getMonth() + 1 ? "default" : "ghost"}
                          size="sm"
                          className="h-8"
                          onClick={(e) => {
                            e.stopPropagation()
                            const newDate = new Date(currentDate)
                            newDate.setMonth(i)
                            setCurrentDate(newDate)
                            setShowMonthPicker(false)
                          }}
                        >
                          {month}月
                        </Button>
                      )
                    })}
                  </div>
                )}
              </div>
            ) : (
              // 設定模式下的年份選擇器
              selectedYear && (
                <div className="flex items-center gap-1">
                  {(() => {
                    // 計算有資料的年份
                    const allCustomDays = loadAllCustomDays()
                    const yearlySettings: { [year: string]: CustomDayWithId[] } = {}
                    
                    allCustomDays.forEach(day => {
                      const year = day.date.substring(0, 4)
                      if (!yearlySettings[year]) {
                        yearlySettings[year] = []
                      }
                      yearlySettings[year].push(day)
                    })
                    
                    const availableYears = Object.keys(yearlySettings).sort((a, b) => a.localeCompare(b))
                    
                    // 找到前一個和後一個有資料的年份
                    const currentIndex = availableYears.indexOf(selectedYear)
                    const hasPrevYear = currentIndex > 0
                    const hasNextYear = currentIndex < availableYears.length - 1
                    const prevYear = hasPrevYear ? availableYears[currentIndex - 1] : null
                    const nextYear = hasNextYear ? availableYears[currentIndex + 1] : null
                    
                    return (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (prevYear) {
                              setSelectedYear(prevYear)
                            }
                          }}
                          disabled={!hasPrevYear}
                          title="上一年"
                          className="w-9 flex-shrink-0"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        
                        <div className="flex items-center gap-1">
                          {/* 左側：前一年或空白 */}
                          <div className="w-16 flex-shrink-0 flex items-center justify-center">
                            {prevYear && (
                              <span className="text-sm text-muted-foreground">
                                {prevYear}
                              </span>
                            )}
                          </div>
                          
                          {/* 中間：選中年份（永遠顯示） */}
                          <div className="w-16 flex-shrink-0 flex items-center justify-center">
                            <span className="text-base font-semibold text-foreground">
                              {selectedYear}
                            </span>
                          </div>
                          
                          {/* 右側：下一年或空白 */}
                          <div className="w-16 flex-shrink-0 flex items-center justify-center">
                            {nextYear && (
                              <span className="text-sm text-muted-foreground">
                                {nextYear}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (nextYear) {
                              setSelectedYear(nextYear)
                            }
                          }}
                          disabled={!hasNextYear}
                          title="下一年"
                          className="w-9 flex-shrink-0"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </>
                    )
                  })()}
                </div>
              )
            )}
          </div>

          {/* 右側設定按鈕 */}
          <div className="justify-self-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              title={showSettings ? "返回月曆" : "放假日清單"}
            >
              {showSettings ? (
                <CalendarIcon className="w-4 h-4" />
              ) : (
                <List className="w-4 h-4" />
              )}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col md:px-6 md:pb-6 px-4 pb-4">
        {showSettings ? (
          /* 工作日曆設定管理內容 */
          <div className="h-[450px] overflow-y-auto pr-2">
            <UnifiedCalendarSettings 
              personalCustomDays={loadCustomDaysFromStorage()}
              loading={false}
              selectedYear={selectedYear}
            />
          </div>
        ) : (
          /* 月曆內容 */
          <>
            <div className="grid grid-cols-7 gap-2 mb-4">
              {weekDays.map((day) => (
                <div key={day} className="text-center p-2 text-sm font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-2">
              {days.map((day, dayIndex) => {
                const dayStatus = getDayStatus(day, customDays)
                const isCurrentMonth = isSameMonth(day, currentDate)
                const isCurrentDay = isToday(day)
                const sequenceNumber = getDaySequenceNumber(day)
                
                // 檢查是否為開始或結束日期
                const dayString = format(day, 'yyyy-MM-dd')
                const isStartDate = calculationRange?.startDate === dayString
                const isEndDate = calculationRange?.endDate === dayString
                
                // 檢查是否為工時計算模式並獲取當日工時
                const isWorkHoursMode = calculationRange?.startTime && calculationRange?.endTime
                const dayWorkHours = isWorkHoursMode ? calculationDetails?.workingDaysDetails?.find(d => d.date === dayString) : null
                
                // 修改時間顯示邏輯：非工時模式下顯示時間，工時模式下顯示邊界時間
                const showTime = !isWorkHoursMode && ((isStartDate && calculationRange?.startTime) || (isEndDate && calculationRange?.endTime))
                const timeToShow = isStartDate ? calculationRange?.startTime : calculationRange?.endTime
                
                // 工時模式下的邊界時間顯示
                const showBoundaryTime = isWorkHoursMode && ((isStartDate && calculationRange?.startTime) || (isEndDate && calculationRange?.endTime))
                const boundaryTimeToShow = isStartDate ? calculationRange?.startTime : calculationRange?.endTime
                
                return (
                  <div
                    key={`${day.toString()}-${dayIndex}`}
                    className={`
                      relative p-2 text-center text-xs min-h-[65px] sm:min-h-[70px] flex flex-col justify-start rounded-md transition-colors cursor-default
                      ${!isCurrentMonth ? 'text-muted-foreground/40 before:absolute before:inset-0 before:bg-gray-500/20 before:rounded-md before:pointer-events-none dark:before:bg-gray-800/40' : ''}
                      ${isCurrentDay ? 'ring-2 ring-primary' : ''}
                      ${dayStatus.type === 'workday' 
                        ? (dayStatus.isCustom 
                            ? 'bg-sky-100/70 text-sky-700 hover:bg-sky-100 dark:bg-sky-400/15 dark:text-sky-200 dark:hover:bg-sky-400/25' 
                            : 'bg-green-100/70 text-green-700 hover:bg-green-100 dark:bg-green-400/15 dark:text-green-200 dark:hover:bg-green-400/25')
                        : (dayStatus.isCustom 
                            ? 'bg-orange-100/70 text-orange-700 hover:bg-orange-100 dark:bg-orange-400/15 dark:text-orange-200 dark:hover:bg-orange-400/25' 
                            : 'bg-red-100/70 text-red-700 hover:bg-red-100 dark:bg-red-400/15 dark:text-red-200 dark:hover:bg-red-400/25')
                      }
                      ${sequenceNumber ? `ring-2 ${
                        selectedCardType === 'totalDays' ? 'ring-slate-500' :
                        selectedCardType === 'workdays' ? 'ring-green-500' :
                        selectedCardType === 'weekends' ? 'ring-red-500' :
                        selectedCardType === 'customHolidays' ? 'ring-orange-500' :
                        selectedCardType === 'workHours' ? 'ring-blue-500' :
                        'ring-green-500'
                      }` : ''}
                    `}
                    title={dayStatus.name ? dayStatus.name : (dayStatus.type === 'workday' ? '工作日' : '例假日') + (sequenceNumber ? ` (第${sequenceNumber}個工作天)` : '')}
                  >
                    {/* 日期數字和序號/起訖時間區 */}
                    <div className="flex justify-between items-start w-full mb-1">
                      <span className="font-medium relative z-10">
                        {format(day, 'd')}
                      </span>
                      <div className="flex gap-1 items-center">
                        {/* 工時模式下顯示起訖時間（僅起訖日），其他模式顯示序號 */}
                        {isWorkHoursMode && dayWorkHours && (isStartDate || isEndDate) ? (
                          <div className="flex gap-0.5 items-center">
                            {dayWorkHours.startTime && (
                              <span className="text-[8px] text-rose-600 dark:text-rose-400 font-bold">
                                {dayWorkHours.startTime.substring(0, 5)}
                              </span>
                            )}
                            {dayWorkHours.startTime && dayWorkHours.endTime && (
                              <span className="text-[8px] text-rose-600 dark:text-rose-400 font-bold">-</span>
                            )}
                            {dayWorkHours.endTime && (
                              <span className="text-[8px] text-rose-600 dark:text-rose-400 font-bold">
                                {dayWorkHours.endTime.substring(0, 5)}
                              </span>
                            )}
                          </div>
                        ) : !isWorkHoursMode && sequenceNumber ? (
                          <span className={`text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full shadow-sm ${
                            selectedCardType === 'totalDays' ? 'bg-slate-600' :
                            selectedCardType === 'workdays' ? 'bg-green-600' :
                            selectedCardType === 'weekends' ? 'bg-red-600' :
                            selectedCardType === 'customHolidays' ? 'bg-orange-600' :
                            'bg-green-600'
                          }`}>
                            {sequenceNumber}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    
                    {/* 時間資訊（非工時模式） */}
                    {showTime && timeToShow && (
                      <div className="mb-1">
                        {(() => {
                          const isOutsideWorkHours = timeToShow < '08:30' || timeToShow > '17:30'
                          return (
                            <span className={`text-[9px] font-medium px-1 py-0.5 rounded ${
                              isOutsideWorkHours 
                                ? 'bg-red-100 text-red-600 dark:bg-red-600/30 dark:text-red-300'
                                : 'bg-purple-100 text-purple-600 dark:bg-purple-600/30 dark:text-purple-300'
                            }`}>
                              {timeToShow.substring(0, 5)}
                            </span>
                          )
                        })()}
                      </div>
                    )}
                    
                    {/* 工時模式下的完整顯示 */}
                    {isWorkHoursMode && dayWorkHours && (
                      <div className="w-full flex flex-col gap-1 flex-1">
                        {/* 電池進度條設計 */}
                        <div className="flex flex-col gap-1.5 flex-1 justify-center px-1">
                          {(() => {
                            // 定義上午和下午時段
                            const periods = [
                              {
                                label: '上午',
                                slots: [
                                  { start: '08:30', end: '09:30' },
                                  { start: '09:30', end: '10:30' },
                                  { start: '10:30', end: '11:30' },
                                  { start: '11:30', end: '12:30' }
                                ]
                              },
                              {
                                label: '下午',
                                slots: [
                                  { start: '13:30', end: '14:30' },
                                  { start: '14:30', end: '15:30' },
                                  { start: '15:30', end: '16:30' },
                                  { start: '16:30', end: '17:30' }
                                ]
                              }
                            ]
                            
                            // 計算每個小時時段的工作時間百分比
                            const calculateSlotPercentage = (slot: { start: string; end: string }) => {
                              if (!dayWorkHours.periods) return 0
                              
                              const timeToMinutes = (time: string) => {
                                const [h, m] = time.split(':').map(Number)
                                return h * 60 + m
                              }
                              
                              const slotStart = timeToMinutes(slot.start)
                              const slotEnd = timeToMinutes(slot.end)
                              const slotDuration = slotEnd - slotStart
                              
                              let totalWorkMinutes = 0
                              
                              dayWorkHours.periods.forEach(period => {
                                const periodStart = timeToMinutes(period.start)
                                const periodEnd = timeToMinutes(period.end)
                                
                                const overlapStart = Math.max(slotStart, periodStart)
                                const overlapEnd = Math.min(slotEnd, periodEnd)
                                
                                if (overlapStart < overlapEnd) {
                                  totalWorkMinutes += (overlapEnd - overlapStart)
                                }
                              })
                              
                              return (totalWorkMinutes / slotDuration) * 100
                            }
                            
                            return periods.map((period, periodIndex) => (
                              <div 
                                key={periodIndex} 
                                className="flex h-3 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-800 overflow-hidden"
                              >
                                {period.slots.map((slot, slotIndex) => {
                                  const percentage = calculateSlotPercentage(slot)
                                  return (
                                    <div
                                      key={slotIndex}
                                      className={`flex-1 relative ${ 
                                        slotIndex < period.slots.length - 1 
                                          ? 'border-r border-gray-300 dark:border-gray-600' 
                                          : ''
                                      }`}
                                    >
                                      {/* 進度填充 - 起始日從右側開始，結束日從左側開始 */}
                                      <div
                                        className="absolute top-0 h-full bg-blue-500 dark:bg-blue-400"
                                        style={{ 
                                          width: `${percentage}%`,
                                          ...(isStartDate ? { right: 0 } : { left: 0 })
                                        }}
                                      />
                                    </div>
                                  )
                                })}
                              </div>
                            ))
                          })()}
                        </div>
                        
                        {/* 總工時區 - 固定位置，簡約設計 */}
                        <div className="flex justify-center min-h-[16px]">
                          {(dayWorkHours.hours > 0 || dayWorkHours.minutes > 0) && (
                            <div className="text-center mt-0.5">
                              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                                {dayWorkHours.hours > 0 && `${dayWorkHours.hours}h`}
                                {dayWorkHours.minutes > 0 && `${dayWorkHours.minutes}m`}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* 節日名稱 */}
                    {dayStatus.name && (
                      <div className="flex-1 flex items-start justify-center">
                        <span className="text-[9px] sm:text-[10px] leading-tight text-center break-words max-w-full">
                          {dayStatus.name}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-4 text-xs min-h-[40px]">
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-100/70 border border-green-300/80 rounded dark:bg-green-400/15 dark:border-green-400/30"></div>
                    <span>工作日</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-sky-100/70 rounded dark:bg-sky-400/15"></div>
                    <span>自訂補班</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-100/70 border border-red-300/80 rounded dark:bg-red-400/15 dark:border-red-400/30"></div>
                    <span>例假日</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-orange-100/70 rounded dark:bg-orange-400/15"></div>
                    <span>自訂假日</span>
                  </div>
                </div>
                
                {/* 列印按鈕 */}
                {calculationRange && selectedCardType && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrint}
                    title="列印月曆"
                    className="flex items-center"
                  >
                    <Printer className="w-4 h-4" />
                  </Button>
                )}
              </div>

            </div>
            

          </>
        )}
      </CardContent>
    </Card>
  )
}