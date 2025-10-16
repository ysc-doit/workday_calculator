export interface CustomDay {
  date: string
  type: 'holiday' | 'workday'
  name: string
}

export interface CustomDayWithId extends CustomDay {
  id: string
  updatedAt: string
}

export interface DayStatus {
  isCustom: boolean
  type: 'holiday' | 'workday'
  name: string
}

export interface WorkdayCheckResult {
  date: string
  isWorkday: boolean
  isCustom: boolean
  customInfo?: CustomDay
}