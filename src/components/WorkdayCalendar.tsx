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

  // 調試日誌
  useEffect(() => {
    console.log('WorkdayCalendar props 更新:', {
      calculationRange,
      hasCalculationDetails: !!calculationDetails,
      selectedCardType,
      calculationMode,
      calculationType
    })
  }, [calculationRange, calculationDetails, selectedCardType, calculationMode, calculationType])

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
        console.warn('無法解析開始日期:', error)
      }
    }
  }, [calculationRange?.startDate])

  const loadCustomDays = () => {
    try {
      const days = loadAllCustomDays()
      setCustomDays(days)
    } catch (error) {
      console.warn('Error loading custom days from storage:', error)
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
      console.log('getDaySequenceNumber 返回 null:', { 
        hasCalculationRange: !!calculationRange, 
        hasCalculationDetails: !!calculationDetails, 
        selectedCardType 
      })
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
      console.error('Error calculating sequence number:', error)
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
          console.error('列印過程發生錯誤:', error)
        }
      }, 500) // 等待0.5秒確保內容完全載入
      
    } catch (error) {
      console.error('生成列印內容時發生錯誤:', error)
      alert('生成列印內容失敗，請稍後再試')
      printWindow.close()
    }
  }



  const days = generateCalendarDays()
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {/* 左側回到今天按鈕 */}
          <div>
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
          {!showSettings ? (
            <div className="flex items-center gap-3">
              {/* 年份控制 */}
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleYearChange('prev')}
                  title="上一年"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="min-w-16 text-center">
                  {format(currentDate, 'yyyy年', { locale: zhTW })}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleYearChange('next')}
                  title="下一年"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              {/* 月份控制 */}
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleMonthChange('prev')}
                  title="上個月"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="min-w-12 text-center">
                  {format(currentDate, 'MM月', { locale: zhTW })}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleMonthChange('next')}
                  title="下個月"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            // 設定模式下的年份選擇器
            selectedYear && (
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
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
                    const currentIndex = availableYears.indexOf(selectedYear)
                    if (currentIndex < availableYears.length - 1) {
                      setSelectedYear(availableYears[currentIndex + 1])
                    }
                  }}
                  title="上一年"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                <span className="min-w-16 text-center font-medium">
                  {selectedYear}年
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
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
                    const currentIndex = availableYears.indexOf(selectedYear)
                    if (currentIndex > 0) {
                      setSelectedYear(availableYears[currentIndex - 1])
                    }
                  }}
                  title="下一年"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )
          )}

          {/* 右側設定按鈕 */}
          <div>
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
      <CardContent className="flex-1 flex flex-col">
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
                        selectedCardType === 'workHours' ? 'ring-purple-500' :
                        'ring-green-500'
                      }` : ''}
                    `}
                    title={dayStatus.name ? dayStatus.name : (dayStatus.type === 'workday' ? '工作日' : '例假日') + (sequenceNumber ? ` (第${sequenceNumber}個工作天)` : '')}
                  >
                    {/* 日期數字和序號 */}
                    <div className="flex justify-between items-start w-full mb-1">
                      <span className="font-medium relative z-10">
                        {format(day, 'd')}
                      </span>
                      <div className="flex gap-1 items-center">
                        {sequenceNumber && (
                          <span className={`text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full shadow-sm ${
                            selectedCardType === 'totalDays' ? 'bg-slate-600' :
                            selectedCardType === 'workdays' ? 'bg-green-600' :
                            selectedCardType === 'weekends' ? 'bg-red-600' :
                            selectedCardType === 'customHolidays' ? 'bg-orange-600' :
                            selectedCardType === 'workHours' ? 'bg-purple-600' :
                            'bg-green-600'
                          }`}>
                            {sequenceNumber}
                          </span>
                        )}

                      </div>
                    </div>
                    
                    {/* 時間資訊或工時資訊 */}
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
                    
                    {/* 工時模式下的邊界時間顯示 */}
                    {showBoundaryTime && boundaryTimeToShow && (
                      <div className="mb-1">
                        <span className="text-[9px] font-medium bg-red-100 text-red-600 px-1 py-0.5 rounded dark:bg-red-600/30 dark:text-red-300">
                          {boundaryTimeToShow.substring(0, 5)}
                        </span>
                      </div>
                    )}
                    
                    {dayWorkHours && (dayWorkHours.hours > 0 || dayWorkHours.minutes > 0) && (
                      <div className="mb-1">
                        <span className="text-[9px] font-medium bg-purple-100 text-purple-600 px-1 py-0.5 rounded dark:bg-purple-600/30 dark:text-purple-300">
                          {dayWorkHours.hours > 0 && `${dayWorkHours.hours}時`}{dayWorkHours.minutes > 0 && `${dayWorkHours.minutes}分`}
                        </span>
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