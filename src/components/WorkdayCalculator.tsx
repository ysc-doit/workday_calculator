'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Switch } from './ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Calendar as CalendarComponent } from './ui/calendar'
import { Calendar, Hash, Clock, CalendarIcon } from 'lucide-react'
import { parseISO, format, addDays } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { toast } from 'sonner@2.0.3'
import { CustomDayWithId, CustomDay } from '../types/workday'
import { 
  calculateWorkdaysInRange, 
  calculateWorkdaysWithDetails,
  calculateWorkHoursInRange,
  calculateEndDateFromDays,
  loadCustomDaysFromStorage, 
  loadAllCustomDays,
  saveCustomDaysToStorage,
  formatWorkTime,
  WorkdayCalculationDetails
} from '../utils/workday-helpers'
import { DirectMergeButton } from './DirectMergeButton'

import { CustomDayForm } from './CustomDayForm'
import { WorkdayCalculationDetailsComponent } from './WorkdayCalculationDetails'

interface WorkdayCalculatorProps {
  onCalculationUpdate?: (startDate: string, endDate: string, details: WorkdayCalculationDetails, startTime?: string, endTime?: string, mode?: 'inputDays' | 'inputRange' | 'calculateHours', type?: 'workdays' | 'calendarDays', cardType?: string, inclusionMode?: 'current' | 'next') => void
  onCalculationClear?: () => void
  onCardClick?: (cardType: string) => void
  selectedCardType?: string
}

export function WorkdayCalculator({ onCalculationUpdate, onCalculationClear, onCardClick, selectedCardType }: WorkdayCalculatorProps) {
  const [calculationMode, setCalculationMode] = useState<'range' | 'duration' | 'workhours'>('duration')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [durationDays, setDurationDays] = useState('')
  const [durationUnit, setDurationUnit] = useState<'workdays' | 'calendar'>('workdays')
  const [startDateInclusionMode, setStartDateInclusionMode] = useState<'current' | 'next'>('current')
  const [customDays, setCustomDays] = useState<CustomDayWithId[]>([])
  const [newCustomDate, setNewCustomDate] = useState('')
  const [newCustomName, setNewCustomName] = useState('')
  const [newCustomType, setNewCustomType] = useState<'holiday' | 'workday'>('holiday')
  const [workdayCount, setWorkdayCount] = useState<number | null>(null)
  const [calculationDetails, setCalculationDetails] = useState<WorkdayCalculationDetails | null>(null)

  const [loading, setLoading] = useState(false)
  
  // 日曆彈窗狀態
  const [startDatePickerOpen, setStartDatePickerOpen] = useState(false)
  const [endDatePickerOpen, setEndDatePickerOpen] = useState(false)
  
  // 時間選擇器彈窗狀態
  const [startTimePickerOpen, setStartTimePickerOpen] = useState(false)
  const [endTimePickerOpen, setEndTimePickerOpen] = useState(false)
  
  // 日期輸入框狀態
  const [startDateInput, setStartDateInput] = useState('')
  const [endDateInput, setEndDateInput] = useState('')

  // 輸入框 ref
  const startDateInputRef = useRef<HTMLInputElement>(null)
  const endDateInputRef = useRef<HTMLInputElement>(null)

  // 清除計算結果的輔助函數
  const clearCalculationResults = () => {
    if (workdayCount !== null || calculationDetails !== null) {
      setWorkdayCount(null)
      setCalculationDetails(null)
      onCalculationClear?.()
    }
  }

  const loadCustomDays = useCallback(() => {
    // 載入全局自訂日期設定
    try {
      const allDays = loadAllCustomDays()
      
      setCustomDays(allDays)
      
      if (allDays.length > 0) {
        console.log(`📅 已載入 ${allDays.length} 個日期設定`)
      }
    } catch (error) {
      console.error('載入自訂設定失敗:', error)
      setCustomDays([])
    }
  }, [])

  useEffect(() => {
    // 應用啟動時載入本地資料
    loadCustomDays()
  }, [])

  // 自動聚焦到開始日期輸入框
  useEffect(() => {
    if (startDatePickerOpen) {
      // 使用 requestAnimationFrame 和較長的延遲確保 DOM 完全渲染
      const focusInput = () => {
        if (startDateInputRef.current) {
          try {
            startDateInputRef.current.focus()
            startDateInputRef.current.select()
            console.log('開始日期輸入框已聚焦')
          } catch (error) {
            console.log('聚焦失敗:', error)
          }
        } else {
          console.log('開始日期輸入框 ref 不存在')
        }
      }
      
      requestAnimationFrame(() => {
        setTimeout(focusInput, 300)
      })
    }
  }, [startDatePickerOpen])

  // 自動聚焦到結束日期輸入框
  useEffect(() => {
    if (endDatePickerOpen) {
      // 使用 requestAnimationFrame 和較長的延遲確保 DOM 完全渲染
      const focusInput = () => {
        if (endDateInputRef.current) {
          try {
            endDateInputRef.current.focus()
            endDateInputRef.current.select()
            console.log('結束日期輸入框已聚焦')
          } catch (error) {
            console.log('聚焦失敗:', error)
          }
        } else {
          console.log('結束日期輸入框 ref 不存在')
        }
      }
      
      requestAnimationFrame(() => {
        setTimeout(focusInput, 300)
      })
    }
  }, [endDatePickerOpen])

  // 自動計算
  useEffect(() => {
    if (calculationMode === 'range') {
      // 輸入期間模式：當開始和結束日期都有值時自動計算
      if (startDate && endDate) {
        calculateWorkdays(true)
      }
    } else if (calculationMode === 'duration') {
      // 輸入天數模式：當開始日期和天數都有值時自動計算
      if (startDate && durationDays && parseInt(durationDays) > 0) {
        calculateWorkdays(true)
      }
    } else if (calculationMode === 'workhours') {
      // 計算工時模式：當日期和時間都有值時自動計算
      if (startDate && endDate && startTime && endTime) {
        calculateWorkdays(true)
      }
    }
  }, [calculationMode, startDate, endDate, durationDays, durationUnit, startDateInclusionMode, startTime, endTime, customDays])

  const validateTimeInput = (): boolean => {
    if (calculationMode !== 'workhours') return true
    
    // 檢查是否完整選擇了時間（必須包含小時和分鐘）
    const startTimeParts = parseTime(startTime)
    const endTimeParts = parseTime(endTime)
    
    if (!startTimeParts.hour || !startTimeParts.minute || !endTimeParts.hour || !endTimeParts.minute) {
      toast.error('請完整選擇開始和結束時間（小時和分鐘）')
      return false
    }
    
    // 當日期不同時，不需要比較時間
    if (startDate !== endDate) {
      return true
    }
    
    // 只有在同一天時才需要比較時間
    const completeStartTime = `${startTimeParts.hour}:${startTimeParts.minute}`
    const completeEndTime = `${endTimeParts.hour}:${endTimeParts.minute}`
    
    if (completeStartTime >= completeEndTime) {
      toast.error('同一天內，開始時間不能晚於或等於結束時間')
      return false
    }
    
    return true
  }

  const calculateWorkdays = (silent: boolean = false) => {
    if (calculationMode === 'range') {
      // 計日期範圍
      if (!startDate || !endDate) {
        if (!silent) toast.error('請選擇開始和結束日期')
        return
      }

      const start = parseISO(startDate)
      const end = parseISO(endDate)
      
      if (start > end) {
        if (!silent) toast.error('開始日期不能晚於結束日期')
        return
      }

      const details = calculateWorkdaysWithDetails(startDate, endDate, customDays)
      if (!silent) toast.success(`計算完成：${details.workdays} 個工作天`)
      
      setWorkdayCount(details.workdays)
      setCalculationDetails(details)
      
      // 通知 App 組件計算結果，並傳遞預設卡片類型
      onCalculationUpdate?.(startDate, endDate, details, undefined, undefined, 'inputRange', undefined, 'workdays')
    } else if (calculationMode === 'duration') {
      // 天數計算結束日期
      if (!startDate) {
        if (!silent) toast.error('請選擇開始日期')
        return
      }

      if (!durationDays || parseInt(durationDays) <= 0) {
        if (!silent) toast.error('請輸入有效的天數')
        return
      }

      const days = parseInt(durationDays)
      const calculatedEndDate = calculateEndDateFromDays(
        startDate,
        days,
        durationUnit === 'workdays',
        customDays,
        startDateInclusionMode === 'current'
      )
      
      setEndDate(calculatedEndDate)
      
      // 如果是次日起算，詳細資訊應從次日開始計算
      const detailsStartDate = startDateInclusionMode === 'next' 
        ? format(addDays(parseISO(startDate), 1), 'yyyy-MM-dd')
        : startDate
      
      const details = calculateWorkdaysWithDetails(detailsStartDate, calculatedEndDate, customDays)
      if (!silent) toast.success(`計算完成：結束日期為 ${calculatedEndDate}，${details.workdays} 個工作天`)
      
      setWorkdayCount(details.workdays)
      setCalculationDetails(details)
      
      // 通知 App 組件計算結果，並傳遞預設卡片類型和起算方式
      const cardType = durationUnit === 'workdays' ? 'workdays' : 'totalDays'
      onCalculationUpdate?.(detailsStartDate, calculatedEndDate, details, undefined, undefined, 'inputDays', durationUnit === 'workdays' ? 'workdays' : 'calendarDays', cardType, startDateInclusionMode)
    } else {
      // 計算工作時數
      if (!startDate || !endDate) {
        if (!silent) toast.error('請選擇開始和結束日期時間')
        return
      }

      const start = parseISO(startDate)
      const end = parseISO(endDate)
      
      if (start > end) {
        if (!silent) toast.error('開始日期不能晚於結束日期')
        return
      }

      // 靜默模式下，如果時間未完整輸入則返回
      if (silent) {
        const startTimeParts = parseTime(startTime)
        const endTimeParts = parseTime(endTime)
        if (!startTimeParts.hour || !startTimeParts.minute || !endTimeParts.hour || !endTimeParts.minute) {
          return
        }
        // 同一天時檢查時間是否合理
        if (startDate === endDate) {
          const completeStartTime = `${startTimeParts.hour}:${startTimeParts.minute}`
          const completeEndTime = `${endTimeParts.hour}:${endTimeParts.minute}`
          if (completeStartTime >= completeEndTime) {
            return
          }
        }
      } else {
        if (!validateTimeInput()) {
          return
        }
      }

      const details = calculateWorkHoursInRange(
        startDate, 
        endDate, 
        startTime, 
        endTime, 
        customDays
      )
      const timeText = formatWorkTime(details.workHours || 0, details.workMinutes || 0)
      if (!silent) toast.success(`計算完成：${details.workdays} 個工作天，${timeText}`)
      
      setWorkdayCount(details.workdays)
      setCalculationDetails(details)
      
      // 通知 App 組件計算結果，並傳遞預設卡片類型
      onCalculationUpdate?.(startDate, endDate, details, startTime, endTime, 'calculateHours', undefined, 'workHours')
    }
  }

  const addCustomDay = () => {
    if (!newCustomDate || !newCustomName) {
      toast.error('請填寫完整資訊')
      return
    }

    setLoading(true)
    try {
      const newDay: CustomDay = {
        date: newCustomDate,
        type: newCustomType,
        name: newCustomName
      }

      const dayWithId: CustomDayWithId = {
        ...newDay,
        id: newCustomDate,
        updatedAt: new Date().toISOString()
      }
      
      // 載入當前設定
      const currentDays = loadCustomDaysFromStorage()
      const existingIndex = currentDays.findIndex(d => d.date === newCustomDate)
      const updatedDays = existingIndex >= 0
        ? currentDays.map((d, i) => i === existingIndex ? dayWithId : d)
        : [...currentDays, dayWithId]
      
      // 儲存設定
      saveCustomDaysToStorage(updatedDays)
      
      // 重新載入設定
      loadCustomDays()
      clearCalculationResults()
      
      setNewCustomDate('')
      setNewCustomName('')
      toast.success('✅ 已儲存自訂日期')
    } catch (error) {
      console.error('儲存自訂設定失敗:', error)
      toast.error('儲存失敗，請重試')
    } finally {
      setLoading(false)
    }
  }

  const removeCustomDay = (date: string) => {
    setLoading(true)
    try {
      // 載入當前設定並刪除指定日期
      const currentDays = loadCustomDaysFromStorage()
      const updatedDays = currentDays.filter(d => d.date !== date)
      
      // 儲存更新後的設定
      saveCustomDaysToStorage(updatedDays)
      
      // 重新載入設定
      loadCustomDays()
      clearCalculationResults()
      
      toast.success('✅ 已刪除自訂日期')
    } catch (error) {
      console.error('刪除自訂設定失敗:', error)
      toast.error('刪除失敗，請重試')
    } finally {
      setLoading(false)
    }
  }



  const formatTime = (time: string) => {
    return time.substring(0, 5) // 取前5個字元 HH:MM
  }

  // 處理日期輸入框的變更
  const handleDateInputChange = (value: string, isStartDate: boolean) => {
    if (isStartDate) {
      setStartDateInput(value)
    } else {
      setEndDateInput(value)
    }

    // 嘗試解析輸入的日期
    const parsedDate = parseInputDate(value)
    if (parsedDate) {
      if (isStartDate) {
        setStartDate(parsedDate)
      } else {
        setEndDate(parsedDate)
      }
      clearCalculationResults()
    }
  }

  // 格式化月份為中文顯示
  const formatMonthCaption = (date: Date) => {
    return format(date, 'yyyy年M月', { locale: zhTW })
  }

  // 解析各種日期格式
  const parseInputDate = (input: string): string | null => {
    if (!input) return null
    
    // 移除空格和特殊字符，只保留數字和分隔符
    const cleaned = input.replace(/[^\d\/\.\-]/g, '')
    
    // 支援的格式：YYYY/MM/DD, YYYY-MM-DD, MM/DD, DD/MM
    const patterns = [
      /^(\d{4})[\/\.\-](\d{1,2})[\/\.\-](\d{1,2})$/, // YYYY/MM/DD
      /^(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{4})$/, // MM/DD/YYYY
      /^(\d{1,2})[\/\.\-](\d{1,2})$/, // MM/DD (當年)
    ]

    for (const pattern of patterns) {
      const match = cleaned.match(pattern)
      if (match) {
        let year, month, day

        if (pattern === patterns[0]) {
          // YYYY/MM/DD
          year = parseInt(match[1])
          month = parseInt(match[2])
          day = parseInt(match[3])
        } else if (pattern === patterns[1]) {
          // MM/DD/YYYY
          month = parseInt(match[1])
          day = parseInt(match[2])
          year = parseInt(match[3])
        } else if (pattern === patterns[2]) {
          // MM/DD (當年)
          month = parseInt(match[1])
          day = parseInt(match[2])
          year = new Date().getFullYear()
        }

        // 驗證日期有效性
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 1900 && year <= 2100) {
          const date = new Date(year, month - 1, day)
          if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
            return format(date, 'yyyy-MM-dd')
          }
        }
      }
    }

    return null
  }

  // 同步日���選擇到輸入框
  const updateDateInput = (date: string, isStartDate: boolean) => {
    if (date) {
      const formatted = format(parseISO(date), 'yyyy/MM/dd')
      if (isStartDate) {
        setStartDateInput(formatted)
      } else {
        setEndDateInput(formatted)
      }
    }
  }

  // 生成小時選項 (00-23)
  const generateHourOptions = () => {
    const options = []
    for (let hour = 0; hour <= 23; hour++) {
      options.push(hour.toString().padStart(2, '0'))
    }
    return options
  }

  // 生成分鐘選項 (00-59)
  const generateMinuteOptions = () => {
    const options = []
    for (let minute = 0; minute <= 59; minute++) {
      options.push(minute.toString().padStart(2, '0'))
    }
    return options
  }

  // 格式化時間顯示
  const formatTimeDisplay = (time: string) => {
    if (!time) return '選擇時間'
    const { hour, minute } = parseTime(time)
    if (hour && minute) return time
    if (hour && !minute) return `${hour}:__`
    if (!hour && minute) return `__:${minute}`
    return '選擇時間'
  }

  // 解析時間為小時和分鐘
  const parseTime = (time: string) => {
    if (!time) return { hour: '', minute: '' }
    const [hour, minute] = time.split(':')
    return { 
      hour: hour && hour !== '' ? hour : '', 
      minute: minute && minute !== '' ? minute : '' 
    }
  }

  // 組合小時和分鐘為時間字串
  const combineTime = (hour: string, minute: string) => {
    if (!hour && !minute) return ''
    // 只有在兩個都有值的情況下才組合，否則保持空字符串
    if (!hour || !minute) return ''
    return `${hour}:${minute}`
  }

  // 處理時間選擇
  const handleTimeComponentSelect = (component: 'hour' | 'minute', value: string, isStartTime: boolean) => {
    const currentTime = isStartTime ? startTime : endTime
    const { hour, minute } = parseTime(currentTime)
    
    let newHour = hour
    let newMinute = minute
    
    if (component === 'hour') {
      newHour = value
    } else {
      newMinute = value
    }
    
    // 儲存部分選擇的狀態，即使只有小時或分鐘
    const partialTime = `${newHour || ''}:${newMinute || ''}`
    const completeTime = combineTime(newHour, newMinute)
    
    if (isStartTime) {
      setStartTime(completeTime || partialTime)
    } else {
      setEndTime(completeTime || partialTime)
    }
    
    clearCalculationResults()
    
    // 檢查是否已選擇完整時間（小時和分鐘），如果是則自動關閉選擇器
    if (newHour && newMinute) {
      if (isStartTime) {
        setStartTimePickerOpen(false)
      } else {
        setEndTimePickerOpen(false)
      }
    }
    
    console.log(`時間選擇: ${component} = ${value}, 結果: ${completeTime || partialTime}`) // 調試用
  }

  return (
    <div className="space-y-8">
      {/* 工作天計算機主要功能 */}
      <Card>
        <CardContent className="space-y-8 pt-[26px] pr-[21px] pb-[21px] pl-[21px] mx-[0px] my-[5px]">
          {/* 區塊一：計算方式選擇 */}
          <div>
            <div className="inline-flex rounded-md border border-border bg-input-background overflow-hidden w-full">
              <button
                type="button"
                className={`text-sm flex-1 py-3 px-4 flex flex-col items-center justify-center gap-1 transition-colors hover:bg-accent ${
                  calculationMode === 'duration'
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-transparent text-foreground'
                }`}
                onClick={() => {
                  setCalculationMode('duration')
                  clearCalculationResults()
                }}
              >
                <Hash className="w-4 h-4" />
                <span>輸入天數</span>
              </button>
              <div className="w-px bg-border" />
              <button
                type="button"
                className={`text-sm flex-1 py-3 px-4 flex flex-col items-center justify-center gap-1 transition-colors hover:bg-accent ${
                  calculationMode === 'range'
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-transparent text-foreground'
                }`}
                onClick={() => {
                  setCalculationMode('range')
                  clearCalculationResults()
                }}
              >
                <Calendar className="w-4 h-4" />
                <span>輸入期間</span>
              </button>
              <div className="w-px bg-border" />
              <button
                type="button"
                className={`text-sm flex-1 py-3 px-4 flex flex-col items-center justify-center gap-1 transition-colors hover:bg-accent ${
                  calculationMode === 'workhours'
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-transparent text-foreground'
                }`}
                onClick={() => {
                  setCalculationMode('workhours')
                  clearCalculationResults()
                }}
              >
                <Clock className="w-4 h-4" />
                <span>計算工時</span>
              </button>
            </div>
          </div>

          {/* 區塊二：日期時間輸 */}
          <div className="p-4 bg-muted/30 rounded-lg space-y-4">
            {/* 開始日期時間 */}
            <div className="space-y-2">
              <Label className="text-sm">
                {calculationMode === 'range' ? '開始日期' : '輸入日期'}
                {calculationMode === 'workhours' && '時間'}
              </Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Popover open={startDatePickerOpen} onOpenChange={setStartDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start bg-input-background hover:bg-accent border-border px-3 py-2 h-auto min-h-10"
                        onClick={() => {
                          setStartDatePickerOpen(true)
                          // 同步輸入框
                          if (startDate && !startDateInput) {
                            updateDateInput(startDate, true)
                          }
                        }}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                        {startDate ? (
                          <span className={calculationMode === 'duration' ? 'flex-1 text-center pr-[170px]' : ''}>{format(parseISO(startDate), 'yyyy/MM/dd')}</span>
                        ) : (
                          <span className="text-muted-foreground">
                            {calculationMode === 'range' ? '選擇開始日期' : '輸入日期'}
                          </span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <div className="p-3 border-b">
                        <Input
                          ref={startDateInputRef}
                          value={startDateInput}
                          onChange={(e) => handleDateInputChange(e.target.value, true)}
                          placeholder="例：2025/09/12 或 09/12"
                          className="text-center font-mono border-2 border-border/50 focus:border-primary/50 bg-input-background"
                          inputMode="numeric"
                          pattern="[0-9/]*"
                          onInput={(e) => {
                            const target = e.target as HTMLInputElement
                            const value = target.value
                            // 只允許數字和斜線
                            const filteredValue = value.replace(/[^0-9/]/g, '')
                            if (value !== filteredValue) {
                              target.value = filteredValue
                              handleDateInputChange(filteredValue, true)
                            }
                          }}
                          onFocus={(e) => e.target.select()}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              setStartDatePickerOpen(false)
                            }
                          }}
                        />
                      </div>
                      <CalendarComponent
                        mode="single"
                        selected={startDate ? parseISO(startDate) : undefined}
                        defaultMonth={startDate ? parseISO(startDate) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            const formattedDate = format(date, 'yyyy-MM-dd')
                            setStartDate(formattedDate)
                            updateDateInput(formattedDate, true)
                            clearCalculationResults()
                          }
                          setStartDatePickerOpen(false)
                        }}
                        formatters={{
                          formatCaption: formatMonthCaption,
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                {calculationMode === 'workhours' && (
                  <div className="w-32">
                    <Popover open={startTimePickerOpen} onOpenChange={setStartTimePickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start bg-input-background hover:bg-accent border-border px-3 py-2 h-auto min-h-10"
                          onClick={() => setStartTimePickerOpen(true)}
                        >
                          <Clock className="mr-2 h-4 w-4 opacity-50" />
                          <span className={startTime ? "" : "text-muted-foreground"}>
                            {formatTimeDisplay(startTime)}
                          </span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-4" align="start">
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-sm mb-2 block">小時</Label>
                              <div className="border rounded-md max-h-48 overflow-y-auto bg-background">
                                {generateHourOptions().map((hour) => {
                                  const { hour: currentHour } = parseTime(startTime)
                                  return (
                                    <Button
                                      key={hour}
                                      variant={currentHour === hour ? "default" : "ghost"}
                                      className="w-full justify-center h-8 rounded-none border-0"
                                      onClick={() => handleTimeComponentSelect('hour', hour, true)}
                                    >
                                      {hour}
                                    </Button>
                                  )
                                })}
                              </div>
                            </div>
                            <div>
                              <Label className="text-sm mb-2 block">分鐘</Label>
                              <div className="border rounded-md max-h-48 overflow-y-auto bg-background">
                                {generateMinuteOptions().map((minute) => {
                                  const { minute: currentMinute } = parseTime(startTime)
                                  return (
                                    <Button
                                      key={minute}
                                      variant={currentMinute === minute ? "default" : "ghost"}
                                      className="w-full justify-center h-8 rounded-none border-0"
                                      onClick={() => handleTimeComponentSelect('minute', minute, true)}
                                    >
                                      {minute}
                                    </Button>
                                  )
                                })}
                              </div>
                            </div>
                          </div>

                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
                {calculationMode === 'duration' && (
                  <div className="inline-flex rounded-md border border-border bg-input-background h-10 overflow-hidden w-[145px]">
                    <button
                      type="button"
                      className={`text-sm w-[72px] h-10 flex items-center justify-center transition-colors hover:bg-accent ${
                        startDateInclusionMode === 'current'
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                          : 'bg-transparent text-foreground'
                      }`}
                      onClick={() => {
                        setStartDateInclusionMode('current')
                        clearCalculationResults()
                      }}
                    >
                      當日起算
                    </button>
                    <div className="w-px bg-border" />
                    <button
                      type="button"
                      className={`text-sm w-[72px] h-10 flex items-center justify-center transition-colors hover:bg-accent ${
                        startDateInclusionMode === 'next'
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                          : 'bg-transparent text-foreground'
                      }`}
                      onClick={() => {
                        setStartDateInclusionMode('next')
                        clearCalculationResults()
                      }}
                    >
                      次日起算
                    </button>
                  </div>
                )}
              </div>
            </div>

            {calculationMode === 'range' || calculationMode === 'workhours' ? (
              /* 結束日期時間 */
              <div className="space-y-2">
                <Label className="text-sm">結束日期{calculationMode === 'workhours' && '時間'}</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Popover open={endDatePickerOpen} onOpenChange={setEndDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start bg-input-background hover:bg-accent border-border px-3 py-2 h-auto min-h-10"
                          onClick={() => {
                            setEndDatePickerOpen(true)
                            // 同步輸入框
                            if (endDate && !endDateInput) {
                              updateDateInput(endDate, false)
                            }
                          }}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                          {endDate ? (
                            <span>{format(parseISO(endDate), 'yyyy/MM/dd')}</span>
                          ) : (
                            <span className="text-muted-foreground">選擇結束日期</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <div className="p-3 border-b">
                          <Input
                            ref={endDateInputRef}
                            value={endDateInput}
                            onChange={(e) => handleDateInputChange(e.target.value, false)}
                            placeholder="例：2025/09/12 或 09/12"
                            className="text-center font-mono border-2 border-border/50 focus:border-primary/50 bg-input-background"
                            autoFocus
                            onFocus={(e) => e.target.select()}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                setEndDatePickerOpen(false)
                              }
                            }}
                          />
                        </div>
                        <CalendarComponent
                          mode="single"
                          selected={endDate ? parseISO(endDate) : undefined}
                          defaultMonth={endDate ? parseISO(endDate) : undefined}
                          onSelect={(date) => {
                            if (date) {
                              const formattedDate = format(date, 'yyyy-MM-dd')
                              setEndDate(formattedDate)
                              updateDateInput(formattedDate, false)
                              clearCalculationResults()
                            }
                            setEndDatePickerOpen(false)
                          }}
                          formatters={{
                            formatCaption: formatMonthCaption,
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  {calculationMode === 'workhours' && (
                    <div className="w-32">
                      <Popover open={endTimePickerOpen} onOpenChange={setEndTimePickerOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start bg-input-background hover:bg-accent border-border px-3 py-2 h-auto min-h-10"
                            onClick={() => setEndTimePickerOpen(true)}
                          >
                            <Clock className="mr-2 h-4 w-4 opacity-50" />
                            <span className={endTime ? "" : "text-muted-foreground"}>
                              {formatTimeDisplay(endTime)}
                            </span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-4" align="start">
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="text-sm mb-2 block">小時</Label>
                                <div className="border rounded-md max-h-48 overflow-y-auto bg-background">
                                  {generateHourOptions().map((hour) => {
                                    const { hour: currentHour } = parseTime(endTime)
                                    return (
                                      <Button
                                        key={hour}
                                        variant={currentHour === hour ? "default" : "ghost"}
                                        className="w-full justify-center h-8 rounded-none border-0"
                                        onClick={() => handleTimeComponentSelect('hour', hour, false)}
                                      >
                                        {hour}
                                      </Button>
                                    )
                                  })}
                                </div>
                              </div>
                              <div>
                                <Label className="text-sm mb-2 block">分鐘</Label>
                                <div className="border rounded-md max-h-48 overflow-y-auto bg-background">
                                  {generateMinuteOptions().map((minute) => {
                                    const { minute: currentMinute } = parseTime(endTime)
                                    return (
                                      <Button
                                        key={minute}
                                        variant={currentMinute === minute ? "default" : "ghost"}
                                        className="w-full justify-center h-8 rounded-none border-0"
                                        onClick={() => handleTimeComponentSelect('minute', minute, false)}
                                      >
                                        {minute}
                                      </Button>
                                    )
                                  })}
                                </div>
                              </div>
                            </div>

                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* 期間輸入 - 期間模式 */
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm">輸入天數</Label>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Input
                        type="number"
                        min="1"
                        value={durationDays}
                        onChange={(e) => {
                          setDurationDays(e.target.value)
                          clearCalculationResults()
                        }}
                        className={`w-full bg-input-background border-border min-h-10 py-2 pr-[170px] text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                          durationDays ? 'pl-12' : 'pl-3'
                        }`}
                      />
                      {durationDays && (
                        <div className="absolute left-2 top-1/2 -translate-y-1/2">
                          <button
                            type="button"
                            className="w-7 h-7 flex items-center justify-center text-sm rounded hover:bg-muted/50 transition-colors text-muted-foreground"
                            onClick={() => {
                              const current = parseInt(durationDays) || 1
                              if (current > 1) {
                                setDurationDays((current - 1).toString())
                                clearCalculationResults()
                              }
                            }}
                          >
                            -
                          </button>
                        </div>
                      )}
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 items-center">
                        {durationDays && (
                          <button
                            type="button"
                            className="w-7 h-7 flex items-center justify-center text-sm rounded hover:bg-muted/50 transition-colors text-muted-foreground"
                            onClick={() => {
                              const current = parseInt(durationDays) || 0
                              setDurationDays((current + 1).toString())
                              clearCalculationResults()
                            }}
                          >
                            +
                          </button>
                        )}
                        <div className="w-px h-5 bg-border mx-0.5" />
                        {[5, 10, 15, 20].map((days) => (
                          <button
                            key={days}
                            type="button"
                            className="w-7 h-6 flex items-center justify-center text-xs rounded hover:bg-muted/50 transition-colors text-muted-foreground"
                            onClick={() => {
                              setDurationDays(days.toString())
                              clearCalculationResults()
                            }}
                          >
                            {days}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="inline-flex rounded-md border border-border bg-input-background h-10 overflow-hidden w-[145px] print:!bg-white print:!border-gray-300">
                      <button
                        type="button"
                        className={`text-sm w-[72px] h-10 flex items-center justify-center transition-colors hover:bg-accent print:!hover:bg-gray-100 ${
                          durationUnit === 'workdays'
                            ? 'bg-primary text-primary-foreground hover:bg-primary/90 print:!bg-gray-200 print:!text-black'
                            : 'bg-transparent text-foreground print:!bg-white print:!text-black'
                        }`}
                        onClick={() => {
                          setDurationUnit('workdays')
                          clearCalculationResults()
                        }}
                      >
                        工作天
                      </button>
                      <div className="w-px bg-border print:!bg-gray-300" />
                      <button
                        type="button"
                        className={`text-sm w-[72px] h-10 flex items-center justify-center transition-colors hover:bg-accent print:!hover:bg-gray-100 ${
                          durationUnit === 'calendar'
                            ? 'bg-primary text-primary-foreground hover:bg-primary/90 print:!bg-gray-200 print:!text-black'
                            : 'bg-transparent text-foreground print:!bg-white print:!text-black'
                        }`}
                        onClick={() => {
                          setDurationUnit('calendar')
                          clearCalculationResults()
                        }}
                      >
                        日曆天
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

        </CardContent>
      </Card>

      {/* 計算詳情 - 始終顯示 */}
      <WorkdayCalculationDetailsComponent 
        details={calculationDetails}
        startDate={startDate}
        endDate={endDate}
        startTime={calculationMode === 'workhours' ? startTime : undefined}
        endTime={calculationMode === 'workhours' ? endTime : undefined}
        onCardClick={onCardClick}
        selectedCardType={selectedCardType}
        calculationMode={
          calculationMode === 'duration' ? 'inputDays' :
          calculationMode === 'range' ? 'inputRange' :
          'calculateHours'
        }
        calculationType={durationUnit}
      />

      {/* 工作日曆設定管理 */}

    </div>
  )
}