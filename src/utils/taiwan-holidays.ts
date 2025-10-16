/**
 * 台灣國定假日資料
 * 包含固定日期的國定假日
 */

export interface TaiwanHoliday {
  date: string // YYYY-MM-DD 格式
  name: string
  type: 'national' // 國定假日類型
  description?: string
}

/**
 * 2024年台灣國定假日（固定日期）
 */
export const getFixedTaiwanHolidays = (year: number): TaiwanHoliday[] => {
  return [
    {
      date: `${year}-01-01`,
      name: '元旦',
      type: 'national',
      description: '中華民國開國紀念日'
    },
    {
      date: `${year}-02-28`,
      name: '228',
      type: 'national',
      description: '228和平紀念日'
    },
    {
      date: `${year}-04-04`,
      name: '兒童節',
      type: 'national',
      description: '兒童節'
    },
    {
      date: `${year}-04-05`,
      name: '清明節',
      type: 'national',
      description: '民族掃墓節'
    },
    {
      date: `${year}-10-10`,
      name: '國慶日',
      type: 'national',
      description: '中華民國國慶日'
    }
  ]
}



/**
 * 2025年特定的台灣國定假日
 */
export const getTaiwanHolidays2025 = (): TaiwanHoliday[] => {
  const fixedHolidays = getFixedTaiwanHolidays(2025)
  
  const lunarHolidays: TaiwanHoliday[] = [
    // 2025年春節假期
    {
      date: '2025-01-28',
      name: '除夕',
      type: 'national',
      description: '農曆除夕'
    },
    {
      date: '2025-01-29',
      name: '初一',
      type: 'national',
      description: '農曆正月初一'
    },
    {
      date: '2025-01-30',
      name: '初二',
      type: 'national',
      description: '農曆正月初二'
    },
    {
      date: '2025-01-31',
      name: '初三',
      type: 'national',
      description: '農曆正月初三'
    },
    {
      date: '2025-02-01',
      name: '初四',
      type: 'national',
      description: '農曆正月初四'
    },
    {
      date: '2025-02-02',
      name: '初五',
      type: 'national',
      description: '農曆正月初五'
    },
    // 2025年端午節
    {
      date: '2025-05-31',
      name: '端午節',
      type: 'national',
      description: '農曆五月初五'
    },
    // 2025年中秋節
    {
      date: '2025-10-06',
      name: '中秋節',
      type: 'national',
      description: '農曆八月十五'
    }
  ]
  
  return [...fixedHolidays, ...lunarHolidays]
}

/**
 * 獲取指定年份的台灣國定假日
 */
export const getTaiwanHolidaysByYear = (year: number): TaiwanHoliday[] => {
  switch (year) {
    case 2025:
      return getTaiwanHolidays2025()
    default:
      // 對於其他年份，只返回固定日期的國定假日
      return getFixedTaiwanHolidays(year)
  }
}

/**
 * 獲取當前可見月份範圍內的台灣國定假日
 */
export const getTaiwanHolidaysInRange = (startDate: Date, endDate: Date): TaiwanHoliday[] => {
  const startYear = startDate.getFullYear()
  const endYear = endDate.getFullYear()
  
  let allHolidays: TaiwanHoliday[] = []
  
  for (let year = startYear; year <= endYear; year++) {
    allHolidays = [...allHolidays, ...getTaiwanHolidaysByYear(year)]
  }
  
  const startDateStr = startDate.toISOString().split('T')[0]
  const endDateStr = endDate.toISOString().split('T')[0]
  
  return allHolidays.filter(holiday => 
    holiday.date >= startDateStr && holiday.date <= endDateStr
  )
}