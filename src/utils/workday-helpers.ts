import { format, parseISO, addDays, isWeekend, differenceInMinutes, isAfter, isBefore, startOfDay, addMinutes } from 'date-fns'
import { CustomDayWithId, DayStatus } from '../types/workday'
import { DEFAULT_CALENDAR_SETTINGS } from '../data/default-calendar'

// 載入自訂日期設定
export const loadCustomDaysFromStorage = (): CustomDayWithId[] => {
  const saved = localStorage.getItem('workday-custom-settings')
  if (saved) {
    try {
      const localData = JSON.parse(saved)
      return localData.map((day: any) => ({
        ...day,
        id: day.id || day.date,
        updatedAt: day.updatedAt || new Date().toISOString()
      }))
    } catch (error) {
      console.error('Error loading from localStorage:', error)
    }
  }
  
  // 如果沒有現有設定，返回空的初始設定
  const defaultSettings: CustomDayWithId[] = []
  
  // 儲存空的初始設定
  saveCustomDaysToStorage(defaultSettings)
  return defaultSettings
}

export const saveCustomDaysToStorage = (customDays: CustomDayWithId[]): void => {
  localStorage.setItem('workday-custom-settings', JSON.stringify(customDays))
}

// 載入所有自訂日期設定（包含預設設定和個人設定的合併）
export const loadAllCustomDays = (): CustomDayWithId[] => {
  const personalSettings = loadCustomDaysFromStorage()
  
  // 合併預設設定和個人設定
  // 個人設定會覆蓋同日期的預設設定
  const mergedSettings = [...DEFAULT_CALENDAR_SETTINGS]
  
  // 添加不在預設設定中的個人設定，或覆蓋已存在的設定
  personalSettings.forEach(personalSetting => {
    const existingIndex = mergedSettings.findIndex(setting => setting.date === personalSetting.date)
    if (existingIndex >= 0) {
      // 個人設定覆蓋預設設定
      mergedSettings[existingIndex] = personalSetting
    } else {
      // 添加新的個人設定
      mergedSettings.push(personalSetting)
    }
  })
  
  // 按日期排序
  return mergedSettings.sort((a, b) => a.date.localeCompare(b.date))
}

export const isWorkdayDate = (date: Date, customDays: CustomDayWithId[]): boolean => {
  const dateStr = format(date, 'yyyy-MM-dd')
  const customDay = customDays.find(d => d.date === dateStr)
  
  // 如果有自訂設定，以自訂設定為準
  if (customDay) {
    return customDay.type === 'workday'
  }
  
  // 預設：週末不是工作日，平日是工作日
  return !isWeekend(date)
}

export const getDayStatus = (date: Date, customDays: CustomDayWithId[]): DayStatus => {
  const dateStr = format(date, 'yyyy-MM-dd')
  const customDay = customDays.find(d => d.date === dateStr)
  
  // 如果有自訂設定，以自訂設定為準
  if (customDay) {
    return {
      isCustom: true,
      type: customDay.type,
      name: customDay.name
    }
  }
  
  // 預設規則
  return {
    isCustom: false,
    type: isWeekend(date) ? 'holiday' : 'workday',
    name: ''
  }
}

export interface WorkdayCalculationDetails {
  totalDays: number
  workdays: number
  holidays: number
  weekendDays: number
  customWorkdays: number
  customHolidays: number
  customWorkdaysList: CustomDayWithId[]
  customHolidaysList: CustomDayWithId[]
  workHours?: number
  workMinutes?: number
  totalMinutes?: number
  workingDaysDetails?: WorkingDayDetail[]
}

export interface WorkingDayDetail {
  date: string
  hours: number
  minutes: number
  startTime?: string
  endTime?: string
  periods: WorkPeriod[]
}

export interface WorkPeriod {
  start: string
  end: string
  hours: number
  minutes: number
}

// 工作時間段定義
export const WORK_PERIODS = [
  { start: '08:30', end: '12:30' }, // 上午
  { start: '13:30', end: '17:30' }  // 下午
]

export const calculateWorkdaysInRange = (
  startDate: string, 
  endDate: string, 
  customDays: CustomDayWithId[]
): number => {
  const start = parseISO(startDate)
  const end = parseISO(endDate)
  
  let count = 0
  let currentDate = start

  while (currentDate <= end) {
    if (isWorkdayDate(currentDate, customDays)) {
      count++
    }
    currentDate = addDays(currentDate, 1)
  }

  return count
}

export const calculateWorkdaysWithDetails = (
  startDate: string, 
  endDate: string, 
  customDays: CustomDayWithId[]
): WorkdayCalculationDetails => {
  const start = parseISO(startDate)
  const end = parseISO(endDate)
  
  let totalDays = 0
  let workdays = 0
  let holidays = 0
  let weekendDays = 0
  let customWorkdays = 0
  let customHolidays = 0
  
  const customWorkdaysList: CustomDayWithId[] = []
  const customHolidaysList: CustomDayWithId[] = []
  
  let currentDate = start

  while (currentDate <= end) {
    totalDays++
    const dateStr = format(currentDate, 'yyyy-MM-dd')
    const customDay = customDays.find(d => d.date === dateStr)
    
    // 檢查自訂設定
    if (customDay) {
      if (customDay.type === 'workday') {
        workdays++
        customWorkdays++
        customWorkdaysList.push(customDay)
      } else {
        holidays++
        customHolidays++
        customHolidaysList.push(customDay)
      }
    } else {
      if (isWeekend(currentDate)) {
        holidays++
        weekendDays++
      } else {
        workdays++
      }
    }
    
    currentDate = addDays(currentDate, 1)
  }

  return {
    totalDays,
    workdays,
    holidays,
    weekendDays,
    customWorkdays,
    customHolidays,
    customWorkdaysList,
    customHolidaysList
  }
}

// 計算時間字串之間的分鐘差
const calculateMinutesBetween = (startTime: string, endTime: string): number => {
  const [startHour, startMinute] = startTime.split(':').map(Number)
  const [endHour, endMinute] = endTime.split(':').map(Number)
  
  const startMinutes = startHour * 60 + startMinute
  const endMinutes = endHour * 60 + endMinute
  
  return endMinutes - startMinutes
}

// 檢查時間是否在工作時段內
const isTimeInWorkPeriod = (time: string, period: { start: string; end: string }): boolean => {
  const [hour, minute] = time.split(':').map(Number)
  const timeMinutes = hour * 60 + minute
  
  const [startHour, startMinute] = period.start.split(':').map(Number)
  const [endHour, endMinute] = period.end.split(':').map(Number)
  
  const startMinutes = startHour * 60 + startMinute
  const endMinutes = endHour * 60 + endMinute
  
  return timeMinutes >= startMinutes && timeMinutes <= endMinutes
}

// 計算單天的工作時數
export const calculateDayWorkHours = (
  date: string,
  startTime?: string,
  endTime?: string,
  customDays: CustomDayWithId[] = []
): WorkingDayDetail => {
  const dateObj = parseISO(date)
  const isWorkday = isWorkdayDate(dateObj, customDays)
  
  if (!isWorkday) {
    return {
      date,
      hours: 0,
      minutes: 0,
      periods: []
    }
  }

  let totalMinutes = 0
  const periods: WorkPeriod[] = []

  // 處理開始時間和結束時間
  const effectiveStartTime = startTime || '08:30'
  const effectiveEndTime = endTime || '17:30'

  if (!startTime && !endTime) {
    // 如果沒有指定時間，計算整天的工作時間 (8小時)
    for (const period of WORK_PERIODS) {
      const periodMinutes = calculateMinutesBetween(period.start, period.end)
      totalMinutes += periodMinutes
      periods.push({
        start: period.start,
        end: period.end,
        hours: Math.floor(periodMinutes / 60),
        minutes: periodMinutes % 60
      })
    }
  } else {
    // 計算指定時間範圍內的工作時數
    for (const period of WORK_PERIODS) {
      const periodStart = period.start
      const periodEnd = period.end
      
      // 計算時間範圍與工作時段的交集
      const overlapStart = effectiveStartTime > periodStart ? effectiveStartTime : periodStart
      const overlapEnd = effectiveEndTime < periodEnd ? effectiveEndTime : periodEnd
      
      // 檢查是否有有效的交集
      if (overlapStart < overlapEnd) {
        const periodMinutes = calculateMinutesBetween(overlapStart, overlapEnd)
        if (periodMinutes > 0) {
          totalMinutes += periodMinutes
          periods.push({
            start: overlapStart,
            end: overlapEnd,
            hours: Math.floor(periodMinutes / 60),
            minutes: periodMinutes % 60
          })
        }
      }
    }
  }

  return {
    date,
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
    startTime: startTime || undefined,
    endTime: endTime || undefined,
    periods
  }
}

// 計算時間範圍內的工作時數
export const calculateWorkHoursInRange = (
  startDate: string,
  endDate: string,
  startTime?: string,
  endTime?: string,
  customDays: CustomDayWithId[] = []
): WorkdayCalculationDetails => {
  const basicDetails = calculateWorkdaysWithDetails(startDate, endDate, customDays)
  
  let totalMinutes = 0
  const workingDaysDetails: WorkingDayDetail[] = []
  
  const start = parseISO(startDate)
  const end = parseISO(endDate)
  let currentDate = start

  while (currentDate <= end) {
    const dateStr = format(currentDate, 'yyyy-MM-dd')
    let dayStartTime: string | undefined
    let dayEndTime: string | undefined
    
    // 判斷當前日期的有效工作時間範圍
    if (format(currentDate, 'yyyy-MM-dd') === startDate && format(currentDate, 'yyyy-MM-dd') === endDate) {
      // 同一天開始和結束
      dayStartTime = startTime
      dayEndTime = endTime
    } else if (format(currentDate, 'yyyy-MM-dd') === startDate) {
      // 開始日期 - 保留原始開始時間，但結束時間設為當天工作結束時間
      dayStartTime = startTime
      dayEndTime = undefined // 讓函數使用完整工作日的結束時間
    } else if (format(currentDate, 'yyyy-MM-dd') === endDate) {
      // 結束日期 - 開始時間設為當天工作開始時間，保留原始結束時間
      dayStartTime = undefined // 讓函數使用完整工作日的開始時間
      dayEndTime = endTime
    } else {
      // 中間的完整工作日
      dayStartTime = undefined
      dayEndTime = undefined
    }
    
    const dayDetail = calculateDayWorkHours(dateStr, dayStartTime, dayEndTime, customDays)
    
    // 對於邊界日期（開始日期和結束日期），即使沒有工作時數也要加入詳細記錄
    // 對於中間日期，只有在有工作時數的情況下才加入詳細記錄
    const isStartDate = format(currentDate, 'yyyy-MM-dd') === startDate
    const isEndDate = format(currentDate, 'yyyy-MM-dd') === endDate
    const isBoundaryDate = isStartDate || isEndDate
    const hasWorkTime = dayDetail.hours > 0 || dayDetail.minutes > 0
    
    if (hasWorkTime || isBoundaryDate) {
      // 對於邊界日期，需要保留原始的開始和結束時間信息
      if (isBoundaryDate) {
        if (isStartDate) {
          dayDetail.startTime = startTime
        }
        if (isEndDate) {
          dayDetail.endTime = endTime
        }
      }
      
      workingDaysDetails.push(dayDetail)
      totalMinutes += (dayDetail.hours * 60 + dayDetail.minutes)
    }
    
    currentDate = addDays(currentDate, 1)
  }

  return {
    ...basicDetails,
    workHours: Math.floor(totalMinutes / 60),
    workMinutes: totalMinutes % 60,
    totalMinutes,
    workingDaysDetails
  }
}

// 格式化時間顯示（小時分鐘格式）
export const formatWorkTime = (hours: number, minutes: number): string => {
  if (hours === 0 && minutes === 0) return '0分'
  
  const parts: string[] = []
  if (hours > 0) parts.push(`${hours}時`)
  if (minutes > 0) parts.push(`${minutes}分`)
  
  return parts.join('')
}

// 從總分鐘數格式化時間
export const formatWorkTimeFromMinutes = (totalMinutes: number): string => {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return formatWorkTime(hours, minutes)
}

// 從開始日期和天數計算結束日期
export const calculateEndDateFromDays = (
  startDate: string,
  days: number,
  isWorkdays: boolean,
  customDays: CustomDayWithId[],
  includeStartDate: boolean = true
): string => {
  const start = parseISO(startDate)
  let currentDate = includeStartDate ? start : addDays(start, 1)
  let count = 0
  
  if (isWorkdays) {
    // 計算工作日
    while (count < days) {
      if (isWorkdayDate(currentDate, customDays)) {
        count++
        if (count < days) {
          currentDate = addDays(currentDate, 1)
        }
      } else {
        currentDate = addDays(currentDate, 1)
      }
    }
  } else {
    // 計算日曆日
    currentDate = addDays(currentDate, days - 1)
  }
  
  return format(currentDate, 'yyyy-MM-dd')
}