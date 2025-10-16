import { CustomDayWithId } from '../types/workday'

// ============================================================
// 預設日曆設定 - 全域共用的工作日設定
// ============================================================
// 這裡的設定會對所有使用者生效，適合設定公司行事曆、國定假日等
// 發布後所有使用者都會看到相同的基礎日曆設定
// 使用者仍可在此基礎上新增個人自訂設定

export const DEFAULT_CALENDAR_SETTINGS: CustomDayWithId[] = [
  // ============================================================
  // 2025年台灣國定假日與調整補班日 (完整版)
  // ============================================================
  
  // 2025年元旦
  {
    id: 'holiday-2025-01-01',
    date: '2025-01-01',
    name: '元旦',
    type: 'holiday',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  
  // 2025年春節連假
  {
    id: 'holiday-2025-01-27',
    date: '2025-01-27',
    name: '春節調整放假',
    type: 'holiday',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'holiday-2025-01-28',
    date: '2025-01-28',
    name: '除夕',
    type: 'holiday',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'holiday-2025-01-29',
    date: '2025-01-29',
    name: '春節初一',
    type: 'holiday',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'holiday-2025-01-30',
    date: '2025-01-30',
    name: '春節初二',
    type: 'holiday',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'holiday-2025-01-31',
    date: '2025-01-31',
    name: '春節初三',
    type: 'holiday',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  
  // 2025年春節調整補班
  {
    id: 'workday-2025-02-08',
    date: '2025-02-08',
    name: '春節調整補班',
    type: 'workday',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  
  // 2025年和平紀念日
  {
    id: 'holiday-2025-02-28',
    date: '2025-02-28',
    name: '和平紀念日',
    type: 'holiday',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  
  // 2025年清明、兒童節
  {
    id: 'holiday-2025-04-03',
    date: '2025-04-03',
    name: '清明、兒童節補假',
    type: 'holiday',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'holiday-2025-04-04',
    date: '2025-04-04',
    name: '清明、兒童節',
    type: 'holiday',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  
  // 2025年端午節
  {
    id: 'holiday-2025-05-30',
    date: '2025-05-30',
    name: '端午節補假',
    type: 'holiday',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'holiday-2025-05-31',
    date: '2025-05-31',
    name: '端午節',
    type: 'holiday',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  
  // 2025年教師節
  {
    id: 'holiday-2025-09-28',
    date: '2025-09-28',
    name: '教師節',
    type: 'holiday',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'holiday-2025-09-29',
    date: '2025-09-29',
    name: '教師節補假',
    type: 'holiday',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  
  // 2025年中秋節
  {
    id: 'holiday-2025-10-06',
    date: '2025-10-06',
    name: '中秋節',
    type: 'holiday',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  
  // 2025年國慶日
  {
    id: 'holiday-2025-10-10',
    date: '2025-10-10',
    name: '國慶日',
    type: 'holiday',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  
  // 2025年光復節
  {
    id: 'holiday-2025-10-24',
    date: '2025-10-24',
    name: '光復節補假',
    type: 'holiday',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'holiday-2025-10-25',
    date: '2025-10-25',
    name: '光復節',
    type: 'holiday',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  
  // 2025年行憲紀念日
  {
    id: 'holiday-2025-12-25',
    date: '2025-12-25',
    name: '行憲紀念日',
    type: 'holiday',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },

  // ============================================================
  // 2026年台灣國定假日
  // ============================================================
  
  // 2026年元旦
  {
    id: 'holiday-2026-01-01',
    date: '2026-01-01',
    name: '元旦',
    type: 'holiday',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  
  // 2026年春節連假
  {
    id: 'holiday-2026-02-16',
    date: '2026-02-16',
    name: '除夕',
    type: 'holiday',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'holiday-2026-02-17',
    date: '2026-02-17',
    name: '春節初一',
    type: 'holiday',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'holiday-2026-02-18',
    date: '2026-02-18',
    name: '春節初二',
    type: 'holiday',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'holiday-2026-02-19',
    date: '2026-02-19',
    name: '春節初三',
    type: 'holiday',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'holiday-2026-02-20',
    date: '2026-02-20',
    name: '春節初四',
    type: 'holiday',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  
  // 2026年和平紀念日
  {
    id: 'holiday-2026-02-27',
    date: '2026-02-27',
    name: '和平紀念日補假',
    type: 'holiday',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'holiday-2026-02-28',
    date: '2026-02-28',
    name: '和平紀念日',
    type: 'holiday',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  
  // 2026年兒童節、清明節
  {
    id: 'holiday-2026-04-03',
    date: '2026-04-03',
    name: '兒童節補假',
    type: 'holiday',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'holiday-2026-04-04',
    date: '2026-04-04',
    name: '兒童節',
    type: 'holiday',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'holiday-2026-04-05',
    date: '2026-04-05',
    name: '清明節',
    type: 'holiday',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'holiday-2026-04-06',
    date: '2026-04-06',
    name: '清明節補假',
    type: 'holiday',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  
  // 2026年勞動節
  {
    id: 'holiday-2026-05-01',
    date: '2026-05-01',
    name: '勞動節',
    type: 'holiday',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  
  // 2026年端午節
  {
    id: 'holiday-2026-06-19',
    date: '2026-06-19',
    name: '端午節',
    type: 'holiday',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  
  // 2026年中秋節
  {
    id: 'holiday-2026-09-25',
    date: '2026-09-25',
    name: '中秋節',
    type: 'holiday',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  
  // 2026年教師節
  {
    id: 'holiday-2026-09-28',
    date: '2026-09-28',
    name: '教師節',
    type: 'holiday',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  
  // 2026年國慶日
  {
    id: 'holiday-2026-10-09',
    date: '2026-10-09',
    name: '國慶日補假',
    type: 'holiday',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'holiday-2026-10-10',
    date: '2026-10-10',
    name: '國慶日',
    type: 'holiday',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  
  // 2026年光復節
  {
    id: 'holiday-2026-10-25',
    date: '2026-10-25',
    name: '光復節',
    type: 'holiday',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'holiday-2026-10-26',
    date: '2026-10-26',
    name: '光復節補假',
    type: 'holiday',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  
  // 2026年行憲紀念日
  {
    id: 'holiday-2026-12-25',
    date: '2026-12-25',
    name: '行憲紀念日',
    type: 'holiday',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },

]

// 獲取預設設定的數量（用於 UI 顯示）
export const getDefaultCalendarSettingsCount = (): number => {
  return DEFAULT_CALENDAR_SETTINGS.length
}

// 檢查某個日期是否為預設設定
export const isDefaultCalendarSetting = (date: string): boolean => {
  return DEFAULT_CALENDAR_SETTINGS.some(day => day.date === date)
}

// 獲取預設假日列表
export const getDefaultHolidays = (): CustomDayWithId[] => {
  return DEFAULT_CALENDAR_SETTINGS.filter(day => day.type === 'holiday')
}

// 獲取預設補班日列表
export const getDefaultWorkdays = (): CustomDayWithId[] => {
  return DEFAULT_CALENDAR_SETTINGS.filter(day => day.type === 'workday')
}