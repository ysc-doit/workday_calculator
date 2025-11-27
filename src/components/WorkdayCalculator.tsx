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
import { TimePickerClock } from './TimePickerClock'

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
  
  // 用於防止模式切換時自動計算的標誌
  const isModeSwitchingRef = useRef(false)
  
  // 日曆彈窗狀態
  const [startDatePickerOpen, setStartDatePickerOpen] = useState(false)
  const [endDatePickerOpen, setEndDatePickerOpen] = useState(false)
  
  // 時間選擇器彈窗狀態
  const [startTimePickerOpen, setStartTimePickerOpen] = useState(false)
  const [endTimePickerOpen, setEndTimePickerOpen] = useState(false)
  
  // 日期時間合併選擇器彈窗狀態（工時模式）
  const [startDateTimePickerOpen, setStartDateTimePickerOpen] = useState(false)
  const [endDateTimePickerOpen, setEndDateTimePickerOpen] = useState(false)
  
  // 輸入天數彈窗狀態
  const [durationInputPickerOpen, setDurationInputPickerOpen] = useState(false)
  
  // 日期輸入框狀態
  const [startDateInput, setStartDateInput] = useState('')
  const [endDateInput, setEndDateInput] = useState('')

  // 時間輸入框狀態
  const [startTimeInput, setStartTimeInput] = useState('')
  const [endTimeInput, setEndTimeInput] = useState('')

  // 日期時間合併輸入框狀態（工時模式）
  const [startDateTimeInput, setStartDateTimeInput] = useState('')
  const [endDateTimeInput, setEndDateTimeInput] = useState('')

  // 輸入框 ref
  const startDateInputRef = useRef<HTMLInputElement>(null)
  const endDateInputRef = useRef<HTMLInputElement>(null)
  const startTimeInputRef = useRef<HTMLInputElement>(null)
  const endTimeInputRef = useRef<HTMLInputElement>(null)
  const startDateTimeInputRef = useRef<HTMLInputElement>(null)
  const endDateTimeInputRef = useRef<HTMLInputElement>(null)

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

  // 模式切換時清除不相關的狀態和計算結果
  useEffect(() => {
    // 設置標誌，防止自動計算
    isModeSwitchingRef.current = true
    
    // 先清除計算結果
    setWorkdayCount(null)
    setCalculationDetails(null)
    onCalculationClear?.()

    // 根據模式清除不相關的狀態
    if (calculationMode === 'duration') {
      // 輸入天數模式：清除結束日期和時間
      setEndDate('')
      setEndDateInput('')
      setStartTime('')
      setEndTime('')
      setStartTimeInput('')
      setEndTimeInput('')
      setStartDateTimeInput('')
      setEndDateTimeInput('')
    } else if (calculationMode === 'range') {
      // 輸入期間模式：清除天數和時間
      setDurationDays('')
      setStartTime('')
      setEndTime('')
      setStartTimeInput('')
      setEndTimeInput('')
      setStartDateTimeInput('')
      setEndDateTimeInput('')
    } else if (calculationMode === 'workhours') {
      // 計算工時模式：清除天數
      setDurationDays('')
      setStartDateTimeInput('')
      setEndDateTimeInput('')
    }
    
    // 狀態清除完成後，重置標誌
    setTimeout(() => {
      isModeSwitchingRef.current = false
    }, 0)
  }, [calculationMode])

  // 自動聚焦到開始日期輸入框（僅桌面版）
  useEffect(() => {
    if (startDatePickerOpen && window.innerWidth >= 768) {
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

  // 自動聚焦到結束日期輸入框（僅桌面版）
  useEffect(() => {
    if (endDatePickerOpen && window.innerWidth >= 768) {
      // 使用 requestAnimationFrame 和較長的延遲確保 DOM 完全渲染
      const focusInput = () => {
        if (endDateInputRef.current) {
          try {
            endDateInputRef.current.focus()
            endDateInputRef.current.select()
            console.log('結束日期輸框已聚焦')
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

  // 自動聚焦到開始時間輸入框（僅桌面版）
  useEffect(() => {
    if (startTimePickerOpen && window.innerWidth >= 768) {
      const focusInput = () => {
        if (startTimeInputRef.current) {
          try {
            startTimeInputRef.current.focus()
            startTimeInputRef.current.select()
            console.log('開始時間輸入框已聚焦')
          } catch (error) {
            console.log('聚焦失敗:', error)
          }
        } else {
          console.log('開始時間輸入框 ref 不存在')
        }
      }
      
      requestAnimationFrame(() => {
        setTimeout(focusInput, 300)
      })
    }
  }, [startTimePickerOpen])

  // 自動聚焦到結束時間輸入框（僅桌面版）
  useEffect(() => {
    if (endTimePickerOpen && window.innerWidth >= 768) {
      const focusInput = () => {
        if (endTimeInputRef.current) {
          try {
            endTimeInputRef.current.focus()
            endTimeInputRef.current.select()
            console.log('結束時輸入聚焦')
          } catch (error) {
            console.log('聚焦失敗:', error)
          }
        } else {
          console.log('結束時間輸入框 ref 不存在')
        }
      }
      
      requestAnimationFrame(() => {
        setTimeout(focusInput, 300)
      })
    }
  }, [endTimePickerOpen])

  // 自動聚焦到開始日期時間輸入框（工時模式，僅桌面版）
  useEffect(() => {
    if (startDateTimePickerOpen && window.innerWidth >= 768) {
      const focusInput = () => {
        if (startDateTimeInputRef.current) {
          try {
            startDateTimeInputRef.current.focus()
            startDateTimeInputRef.current.select()
            console.log('開始日期時間輸入框已聚焦')
          } catch (error) {
            console.log('聚焦失敗:', error)
          }
        } else {
          console.log('開始日期時間輸入框 ref 不存在')
        }
      }
      
      requestAnimationFrame(() => {
        setTimeout(focusInput, 300)
      })
    }
  }, [startDateTimePickerOpen])

  // 自動聚焦到結束日期時間輸入框（工時模式，僅桌面版）
  useEffect(() => {
    if (endDateTimePickerOpen && window.innerWidth >= 768) {
      const focusInput = () => {
        if (endDateTimeInputRef.current) {
          try {
            endDateTimeInputRef.current.focus()
            endDateTimeInputRef.current.select()
            console.log('結束日期時間輸入框已聚焦')
          } catch (error) {
            console.log('聚焦失敗:', error)
          }
        } else {
          console.log('結束日期時間輸入框 ref 不存在')
        }
      }
      
      requestAnimationFrame(() => {
        setTimeout(focusInput, 300)
      })
    }
  }, [endDateTimePickerOpen])

  // 自動計算
  useEffect(() => {
    // 如果正在切換模式，不執行自動計算
    if (isModeSwitchingRef.current) {
      return
    }
    
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
  }, [startDate, endDate, durationDays, durationUnit, startDateInclusionMode, startTime, endTime, customDays])

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
    
    // 只有在一天時才需要比較時間
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

    // 只在輸入過程中嘗試解析，但不格式化顯示
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

  // 處理日期輸入完成（去焦點或按 Enter）
  const handleDateInputComplete = (isStartDate: boolean) => {
    const inputValue = isStartDate ? startDateInput : endDateInput
    const parsedDate = parseInputDate(inputValue)
    
    if (parsedDate) {
      // 格式化為完整格式
      const formatted = format(parseISO(parsedDate), 'yyyy/MM/dd')
      if (isStartDate) {
        setStartDateInput(formatted)
        setStartDate(parsedDate)
      } else {
        setEndDateInput(formatted)
        setEndDate(parsedDate)
      }
    }
  }

  // 處理時間輸入框的變更
  const handleTimeInputChange = (value: string, isStartTime: boolean) => {
    if (isStartTime) {
      setStartTimeInput(value)
    } else {
      setEndTimeInput(value)
    }

    // 只在輸入過程中嘗試解析
    const parsedTime = parseInputTime(value)
    if (parsedTime) {
      if (isStartTime) {
        setStartTime(parsedTime)
      } else {
        setEndTime(parsedTime)
      }
      clearCalculationResults()
    }
  }

  // 處理時間輸入完成（失去焦點或按 Enter）
  const handleTimeInputComplete = (isStartTime: boolean) => {
    const inputValue = isStartTime ? startTimeInput : endTimeInput
    const parsedTime = parseInputTime(inputValue)
    
    if (parsedTime) {
      // 格式化為完整格式 HH:MM
      if (isStartTime) {
        setStartTimeInput(parsedTime)
        setStartTime(parsedTime)
      } else {
        setEndTimeInput(parsedTime)
        setEndTime(parsedTime)
      }
    }
  }

  // 解各種時間格式
  const parseInputTime = (input: string): string | null => {
    if (!input) return null
    
    // 移除空格和特殊字符，只保��數字和冒號
    const cleaned = input.replace(/[^\d:]/g, '')
    
    // 支援的格式：HH:MM, HMM, HHMM, H:M
    const patterns = [
      /^(\d{1,2}):(\d{1,2})$/, // HH:MM or H:M
      /^(\d{1,2})(\d{2})$/, // HMM or HHMM (例如: 930 -> 09:30, 1430 -> 14:30)
      /^(\d{1,2})$/, // H or HH (只有小時，分鐘預設為00)
    ]

    for (const pattern of patterns) {
      const match = cleaned.match(pattern)
      if (match) {
        let hour, minute

        if (pattern === patterns[0]) {
          // HH:MM or H:M
          hour = parseInt(match[1])
          minute = parseInt(match[2])
        } else if (pattern === patterns[1]) {
          // HMM or HHMM
          const numStr = match[0]
          if (numStr.length === 3) {
            // HMM (例如: 930)
            hour = parseInt(numStr[0])
            minute = parseInt(numStr.substring(1))
          } else {
            // HHMM (例如: 1430)
            hour = parseInt(numStr.substring(0, 2))
            minute = parseInt(numStr.substring(2))
          }
        } else if (pattern === patterns[2]) {
          // H or HH
          hour = parseInt(match[1])
          minute = 0
        }

        // 驗證時間有效性
        if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
          return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        }
      }
    }

    return null
  }

  // 更新日期輸入框顯示（用於從日曆選擇日期時）
  const updateDateInput = (dateString: string, isStartDate: boolean) => {
    try {
      const formatted = format(parseISO(dateString), 'yyyy/MM/dd')
      if (isStartDate) {
        setStartDateInput(formatted)
      } else {
        setEndDateInput(formatted)
      }
    } catch (error) {
      console.error('格式化日期失敗:', error)
    }
  }

  // 更新時間輸入框顯示（用於從時鐘選擇時間時）
  const updateTimeInput = (timeString: string, isStartTime: boolean) => {
    if (isStartTime) {
      setStartTimeInput(timeString)
    } else {
      setEndTimeInput(timeString)
    }
  }

  // 處理日期時間合併輸入框的變更（工時模式）
  const handleDateTimeInputChange = (value: string, isStartDateTime: boolean) => {
    if (isStartDateTime) {
      setStartDateTimeInput(value)
    } else {
      setEndDateTimeInput(value)
    }

    // 嘗試解析日期時間組合格式
    const parsed = parseInputDateTime(value)
    if (parsed) {
      if (isStartDateTime) {
        setStartDate(parsed.date)
        setStartTime(parsed.time)
        updateDateInput(parsed.date, true)
        updateTimeInput(parsed.time, true)
      } else {
        setEndDate(parsed.date)
        setEndTime(parsed.time)
        updateDateInput(parsed.date, false)
        updateTimeInput(parsed.time, false)
      }
      clearCalculationResults()
    }
  }

  // 處理日期時間輸入完成（失去焦點或按 Enter）
  const handleDateTimeInputComplete = (isStartDateTime: boolean) => {
    const inputValue = isStartDateTime ? startDateTimeInput : endDateTimeInput
    const parsed = parseInputDateTime(inputValue)
    
    if (parsed) {
      // 格式化為完整格式
      const formattedDate = format(parseISO(parsed.date), 'yyyy/MM/dd')
      const formatted = `${formattedDate} ${parsed.time}`
      if (isStartDateTime) {
        setStartDateTimeInput(formatted)
        setStartDate(parsed.date)
        setStartTime(parsed.time)
        updateDateInput(parsed.date, true)
        updateTimeInput(parsed.time, true)
      } else {
        setEndDateTimeInput(formatted)
        setEndDate(parsed.date)
        setEndTime(parsed.time)
        updateDateInput(parsed.date, false)
        updateTimeInput(parsed.time, false)
      }
    }
  }

  // 更新日期時間合併輸入框顯示（用於從日曆或時鐘選擇時）
  const updateDateTimeInput = (dateString: string, timeString: string, isStartDateTime: boolean) => {
    try {
      const formattedDate = format(parseISO(dateString), 'yyyy/MM/dd')
      const formatted = `${formattedDate} ${timeString}`
      if (isStartDateTime) {
        setStartDateTimeInput(formatted)
      } else {
        setEndDateTimeInput(formatted)
      }
    } catch (error) {
      console.error('格式化日期時間失敗:', error)
    }
  }

  // 解析日期時間組合格式 "YYYY/MM/DD HH:MM"
  const parseInputDateTime = (input: string): { date: string; time: string } | null => {
    if (!input) return null
    
    // 移除多餘空格
    const cleaned = input.trim().replace(/\s+/g, ' ')
    
    // 支援的格式：YYYY/MM/DD HH:MM, YYYY-MM-DD HH:MM
    const pattern = /^(.+)\s+(.+)$/
    const match = cleaned.match(pattern)
    
    if (match) {
      const datePart = match[1]
      const timePart = match[2]
      
      const parsedDate = parseInputDate(datePart)
      const parsedTime = parseInputTime(timePart)
      
      if (parsedDate && parsedTime) {
        return { date: parsedDate, time: parsedTime }
      }
    }
    
    return null
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

  // 組合小時和鐘為時間字串
  const combineTime = (hour: string, minute: string) => {
    if (!hour && !minute) return ''
    // 只有在兩個都有值情況下才組合，否則保持空字符串
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
      <Card className="md:border md:rounded-lg md:shadow md:bg-card border-0 rounded-none shadow-none bg-transparent mt-[0px] mr-[0px] mb-[20px] ml-[0px] m-[0px]">
        <CardContent className="space-y-8 pt-[26px] pr-[21px] pb-[21px] pl-[21px] mx-[0px] my-[5px] md:pt-[26px] md:pr-[21px] md:pb-[21px] md:pl-[21px] pt-4 pr-4 pb-4 pl-4">
          {/* 區塊一：計算方式選擇 */}
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
              }}
            >
              <Clock className="w-4 h-4" />
              <span>計算工時</span>
            </button>
          </div>

          {/* 區塊二：日期時間輸入 */}
          {/* 開始日期時間 */}
          <div className="space-y-2">
            <Label className="text-sm">
              {calculationMode === 'range' ? '開始日期' : calculationMode === 'workhours' ? '開始日期&時間' : '輸入日期'}
            </Label>
            <div className="flex gap-2">
              {calculationMode === 'workhours' ? (
                /* 工時模式：合併的日期時間輸入 */
                <div className="flex-1">
                  <Popover open={startDateTimePickerOpen} onOpenChange={setStartDateTimePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full min-w-0 justify-start bg-input-background hover:bg-accent border-border px-3 py-2 h-10 overflow-hidden"
                        onClick={() => {
                          setStartDateTimePickerOpen(true)
                          // 同步輸入框
                          if (startDate && startTime && !startDateTimeInput) {
                            updateDateTimeInput(startDate, startTime, true)
                          }
                        }}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 opacity-50 flex-shrink-0" />
                        <Input
                          ref={startDateTimeInputRef}
                          value={startDateTimeInput}
                          onChange={(e) => handleDateTimeInputChange(e.target.value, true)}
                          className="border-0 !bg-transparent p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 font-mono text-foreground focus:!bg-transparent hover:!bg-transparent"
                          inputMode="text"
                          placeholder="YYYY/MM/DD HH:MM"
                          onFocus={(e) => {
                            // 移動設備上防止鍵盤彈出
                            if (window.innerWidth < 768) {
                              e.target.blur()
                            } else {
                              e.target.select()
                            }
                            setStartDateTimePickerOpen(true)
                          }}
                          onBlur={() => {
                            handleDateTimeInputComplete(true)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleDateTimeInputComplete(true)
                              setStartDateTimePickerOpen(false)
                            }
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            setStartDateTimePickerOpen(true)
                          }}
                        />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <div className="flex flex-col md:flex-row w-full overflow-hidden">
                        <div className="w-full md:w-auto overflow-hidden flex justify-center">
                          <CalendarComponent
                            mode="single"
                            selected={startDate ? parseISO(startDate) : undefined}
                            defaultMonth={startDate ? parseISO(startDate) : undefined}
                            onSelect={(date) => {
                              if (date) {
                                const formattedDate = format(date, 'yyyy-MM-dd')
                                setStartDate(formattedDate)
                                updateDateInput(formattedDate, true)
                                if (startTime) {
                                  updateDateTimeInput(formattedDate, startTime, true)
                                }
                                clearCalculationResults()
                              }
                            }}
                            formatters={{
                              formatCaption: formatMonthCaption,
                            }}
                            initialFocus
                          />
                        </div>
                        <div className="border-t md:border-t-0 md:border-l border-border p-2 md:p-4 md:w-80 w-full overflow-hidden flex justify-center">
                          <div className="w-full max-w-[280px]">
                            <TimePickerClock
                              selectedTime={startTime}
                              onTimeChange={(time) => {
                                setStartTime(time)
                                updateTimeInput(time, true)
                                if (startDate) {
                                  updateDateTimeInput(startDate, time, true)
                                }
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              ) : (
                /* 其他模式：只顯示日期 */
                <div className="flex-1 flex gap-2 items-center">
                  <Popover open={startDatePickerOpen} onOpenChange={setStartDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <div
                        className="flex-1 min-w-0 flex items-center justify-start bg-input-background hover:bg-accent border border-border rounded-md px-[10px] py-[0px] h-auto min-h-10 overflow-hidden relative cursor-pointer transition-colors"
                        onClick={() => {
                          setStartDatePickerOpen(true)
                          // 同步輸入框
                          if (startDate && !startDateInput) {
                            updateDateInput(startDate, true)
                          }
                        }}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 opacity-50 flex-shrink-0" />
                        <Input
                          ref={startDateInputRef}
                          value={startDateInput}
                          onChange={(e) => handleDateInputChange(e.target.value, true)}
                          className={`border-0 !bg-transparent p-0 pl-2.5 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 font-mono text-foreground focus:!bg-transparent hover:!bg-transparent ${
                            calculationMode === 'duration' ? 'pr-[90px] md:pr-0' : ''
                          }`}
                          inputMode="numeric"
                          pattern="[0-9/]*"
                          placeholder="YYYY/MM/DD"
                          onInput={(e) => {
                            const target = e.target as HTMLInputElement
                            const value = target.value
                            const filteredValue = value.replace(/[^0-9/]/g, '')
                            if (value !== filteredValue) {
                              target.value = filteredValue
                              handleDateInputChange(filteredValue, true)
                            }
                          }}
                          onFocus={(e) => {
                            // 移動設備上防止鍵盤彈出
                            if (window.innerWidth < 768) {
                              e.target.blur()
                            } else {
                              e.target.select()
                            }
                            setStartDatePickerOpen(true)
                          }}
                          onBlur={() => {
                            handleDateInputComplete(true)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleDateInputComplete(true)
                              setStartDatePickerOpen(false)
                            }
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            setStartDatePickerOpen(true)
                          }}
                        />
                        {/* Mobile: 當日起算/次日起算選項 - 移到 Input 右側內部 */}
                        {calculationMode === 'duration' && (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 md:hidden">
                            <Select 
                              value={startDateInclusionMode}
                              onValueChange={(value: 'current' | 'next') => {
                                setStartDateInclusionMode(value)
                                clearCalculationResults()
                                // 行動版：選擇完成後關閉日期選擇器（如果它被打開的話）
                                if (window.innerWidth < 768) {
                                  setStartDatePickerOpen(false)
                                }
                              }}
                            >
                              <SelectTrigger 
                                className="border-0 bg-transparent hover:bg-transparent h-6 w-auto gap-1 px-2 py-0 text-xs focus:ring-0 focus:ring-offset-0 [&>svg]:hidden"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent onClick={(e) => e.stopPropagation()}>
                                <SelectItem value="current">當日起算</SelectItem>
                                <SelectItem value="next">次日起算</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
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
              )}
              {calculationMode === 'duration' && (
                <>
                  {/* Desktop: Button group */}
                  <div className="hidden md:inline-flex rounded-md border border-border bg-input-background h-10 overflow-hidden w-[145px] print:!bg-white print:!border-gray-300">
                    <button
                      type="button"
                      className={`text-sm w-[72px] h-10 flex items-center justify-center transition-colors hover:bg-accent print:!hover:bg-gray-100 ${
                        startDateInclusionMode === 'current'
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90 print:!bg-gray-200 print:!text-black'
                          : 'bg-transparent text-foreground print:!bg-white print:!text-black'
                      }`}
                      onClick={() => {
                        setStartDateInclusionMode('current')
                        clearCalculationResults()
                      }}
                    >
                      當日起算
                    </button>
                    <div className="w-px bg-border print:!bg-gray-300" />
                    <button
                      type="button"
                      className={`text-sm w-[72px] h-10 flex items-center justify-center transition-colors hover:bg-accent print:!hover:bg-gray-100 ${
                        startDateInclusionMode === 'next'
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90 print:!bg-gray-200 print:!text-black'
                          : 'bg-transparent text-foreground print:!bg-white print:!text-black'
                      }`}
                      onClick={() => {
                        setStartDateInclusionMode('next')
                        clearCalculationResults()
                      }}
                    >
                      次日起算
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {calculationMode === 'range' || calculationMode === 'workhours' ? (
            /* 結束日期時間 */
            <div className="space-y-2">
              <Label className="text-sm">結束日期{calculationMode === 'workhours' && '&時間'}</Label>
              <div className="flex gap-2">
                {calculationMode === 'workhours' ? (
                  /* 工時模式：合併的日期時間輸入 */
                  <div className="flex-1">
                    <Popover open={endDateTimePickerOpen} onOpenChange={setEndDateTimePickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full min-w-0 justify-start bg-input-background hover:bg-accent border-border px-3 py-2 h-auto min-h-10 overflow-hidden"
                          onClick={() => {
                            setEndDateTimePickerOpen(true)
                            // 同步輸入框
                            if (endDate && endTime && !endDateTimeInput) {
                              updateDateTimeInput(endDate, endTime, false)
                            }
                          }}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 opacity-50 flex-shrink-0" />
                          <Input
                            ref={endDateTimeInputRef}
                            value={endDateTimeInput}
                            onChange={(e) => handleDateTimeInputChange(e.target.value, false)}
                            className="border-0 !bg-transparent p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 font-mono text-foreground focus:!bg-transparent hover:!bg-transparent"
                            inputMode="text"
                            placeholder="YYYY/MM/DD HH:MM"
                            onFocus={(e) => {
                              // 移動設備上防止鍵盤彈出
                              if (window.innerWidth < 768) {
                                e.target.blur()
                              } else {
                                e.target.select()
                              }
                              setEndDateTimePickerOpen(true)
                            }}
                            onBlur={() => {
                              handleDateTimeInputComplete(false)
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleDateTimeInputComplete(false)
                                setEndDateTimePickerOpen(false)
                              }
                            }}
                            onClick={(e) => {
                              e.stopPropagation()
                              setEndDateTimePickerOpen(true)
                            }}
                          />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <div className="flex flex-col md:flex-row w-full overflow-hidden">
                          <div className="w-full md:w-auto overflow-hidden flex justify-center">
                            <CalendarComponent
                              mode="single"
                              selected={endDate ? parseISO(endDate) : undefined}
                              defaultMonth={endDate ? parseISO(endDate) : undefined}
                              onSelect={(date) => {
                                if (date) {
                                  const formattedDate = format(date, 'yyyy-MM-dd')
                                  setEndDate(formattedDate)
                                  updateDateInput(formattedDate, false)
                                  if (endTime) {
                                    updateDateTimeInput(formattedDate, endTime, false)
                                  }
                                  clearCalculationResults()
                                }
                              }}
                              formatters={{
                                formatCaption: formatMonthCaption,
                              }}
                              initialFocus
                            />
                          </div>
                          <div className="border-t md:border-t-0 md:border-l border-border p-2 md:p-4 md:w-80 w-full overflow-hidden flex justify-center">
                            <div className="w-full max-w-[280px]">
                              <TimePickerClock
                                selectedTime={endTime}
                                onTimeChange={(time) => {
                                  setEndTime(time)
                                  updateTimeInput(time, false)
                                  if (endDate) {
                                    updateDateTimeInput(endDate, time, false)
                                  }
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                ) : (
                  /* 其他模式：只顯示日期 */
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
                          <Input
                            ref={endDateInputRef}
                            value={endDateInput}
                            onChange={(e) => handleDateInputChange(e.target.value, false)}
                            className="border-0 !bg-transparent p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 font-mono focus:!bg-transparent hover:!bg-transparent"
                            inputMode="numeric"
                            pattern="[0-9/]*"
                            placeholder="YYYY/MM/DD"
                            onInput={(e) => {
                              const target = e.target as HTMLInputElement
                              const value = target.value
                              const filteredValue = value.replace(/[^0-9/]/g, '')
                              if (value !== filteredValue) {
                                target.value = filteredValue
                                handleDateInputChange(filteredValue, false)
                              }
                            }}
                            onFocus={(e) => {
                              // 移動設備上防止鍵盤彈出
                              if (window.innerWidth < 768) {
                                e.target.blur()
                              } else {
                                e.target.select()
                              }
                              setEndDatePickerOpen(true)
                            }}
                            onBlur={() => {
                              handleDateInputComplete(false)
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleDateInputComplete(false)
                                setEndDatePickerOpen(false)
                              }
                            }}
                            onClick={(e) => {
                              e.stopPropagation()
                              setEndDatePickerOpen(true)
                            }}
                          />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
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
                )}
              </div>
            </div>
          ) : (
            /* 期間輸入 - 期間模式 */
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm">輸入天數</Label>
                <div className="flex gap-2">
                  <Popover open={durationInputPickerOpen} onOpenChange={setDurationInputPickerOpen}>
                    <PopoverTrigger asChild>
                      <div
                        className="flex-1 min-w-0 flex items-center justify-start bg-input-background hover:bg-accent border border-border rounded-md px-[10px] py-2 h-auto min-h-10 overflow-hidden relative cursor-pointer transition-colors"
                        onClick={(e) => {
                          setDurationInputPickerOpen(true)
                          // 僅桌面版：保存元素引用並延迟聚焦到 input
                          if (window.innerWidth >= 768) {
                            const container = e.currentTarget
                            setTimeout(() => {
                              const input = container.querySelector('#duration-days-input') as HTMLInputElement
                              if (input) {
                                input.focus()
                                if (input.value) {
                                  input.select()
                                }
                              }
                            }, 150)
                          }
                        }}
                      >
                        <Hash className="mr-2 h-4 w-4 opacity-50 flex-shrink-0" />
                        <Input
                          id="duration-days-input"
                          type="number"
                          min="1"
                          value={durationDays}
                          onChange={(e) => {
                            setDurationDays(e.target.value)
                            clearCalculationResults()
                          }}
                          onFocus={() => {
                            setDurationInputPickerOpen(true)
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            setDurationInputPickerOpen(true)
                            // 僅桌面版：延迟聚焦，确保在 Popover 打开后仍可输入
                            if (window.innerWidth >= 768) {
                              const input = e.currentTarget
                              setTimeout(() => {
                                input.focus()
                                if (input.value) {
                                  input.select()
                                }
                              }, 150)
                            }
                          }}
                          className="border-0 !bg-transparent p-0 pl-2.5 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 text-left focus:!bg-transparent hover:!bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none flex-1 min-w-0 pr-[185px] md:pr-[280px]"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 items-center">
                          {/* Desktop: 始終顯示 -/+ 按鈕 */}
                          <button
                            type="button"
                            className="w-7 h-7 hidden md:flex items-center justify-center text-sm rounded hover:bg-muted/50 transition-colors text-muted-foreground"
                            onClick={(e) => {
                              e.stopPropagation()
                              const current = parseInt(durationDays) || 1
                              if (current > 1) {
                                setDurationDays((current - 1).toString())
                                clearCalculationResults()
                              }
                            }}
                          >
                            -
                          </button>
                          <button
                            type="button"
                            className="w-7 h-7 hidden md:flex items-center justify-center text-sm rounded hover:bg-muted/50 transition-colors text-muted-foreground"
                            onClick={(e) => {
                              e.stopPropagation()
                              const current = parseInt(durationDays) || 0
                              setDurationDays((current + 1).toString())
                              clearCalculationResults()
                            }}
                          >
                            +
                          </button>
                          <div className="w-px h-5 bg-border mx-0.5 hidden md:block" />
                          {/* Desktop: 始終顯示快捷數字按鈕 */}
                          <>
                            {[5, 10, 15, 20].map((days) => (
                              <button
                                key={days}
                                type="button"
                                className="w-7 h-6 hidden md:flex items-center justify-center text-xs rounded hover:bg-muted/50 transition-colors text-muted-foreground"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setDurationDays(days.toString())
                                  clearCalculationResults()
                                }}
                              >
                                {days}
                              </button>
                            ))}
                          </>
                          {/* Mobile: 下拉選項和數字快捷鍵 */}
                          <div className="md:hidden flex gap-1 items-center">
                            <>
                              {[5, 10, 15, 20].map((days) => (
                                <button
                                  key={days}
                                  type="button"
                                  className="w-7 h-6 flex items-center justify-center text-xs rounded hover:bg-muted/50 transition-colors text-muted-foreground"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setDurationDays(days.toString())
                                    clearCalculationResults()
                                  }}
                                >
                                  {days}
                                </button>
                              ))}
                            </>
                            <div className="w-px h-5 bg-border mx-0.5" />
                            <Select 
                              value={durationUnit}
                              onValueChange={(value: 'workdays' | 'calendar') => {
                                setDurationUnit(value)
                                clearCalculationResults()
                              }}
                            >
                              <SelectTrigger 
                                className="border-0 bg-transparent hover:bg-transparent h-6 w-auto gap-1 px-2 py-0 text-xs focus:ring-0 focus:ring-offset-0 [&>svg]:hidden"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="workdays">工作天</SelectItem>
                                <SelectItem value="calendar">日曆天</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      {/* Mobile 的 Popover 内容已移除，单位选择已移至 Input 右侧 */}
                    </PopoverContent>
                  </Popover>

                  {/* Desktop: Button group */}
                  <div className="hidden md:inline-flex rounded-md border border-border bg-input-background h-10 overflow-hidden w-[145px] print:!bg-white print:!border-gray-300">
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
          
          {/* 區塊三：計算結果 */}
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

        </CardContent>
      </Card>

      {/* 工作日曆設定管理 */}

    </div>
  )
}