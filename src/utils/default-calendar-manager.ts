import { CustomDayWithId } from '../types/workday'

/**
 * 將個人自訂設定合併到預設日曆檔案中
 * 這個函數會直接修改 /data/default-calendar.ts 檔案
 */
export const mergePersonalSettingsToDefault = async (personalSettings: CustomDayWithId[]): Promise<{ success: boolean; message: string; newDefaultsCount: number }> => {
  try {
    // 動態導入當前的預設設定
    const { DEFAULT_CALENDAR_SETTINGS } = await import('../data/default-calendar')
    
    // 過濾掉已經存在於預設設定中的項目
    const newSettings = personalSettings.filter(personal => 
      !DEFAULT_CALENDAR_SETTINGS.some(existing => existing.date === personal.date)
    )
    
    if (newSettings.length === 0) {
      return {
        success: false,
        message: '所有個人設定都已存在於預設設定中',
        newDefaultsCount: DEFAULT_CALENDAR_SETTINGS.length
      }
    }
    
    // 合併設定並排序
    const mergedSettings = [...DEFAULT_CALENDAR_SETTINGS, ...newSettings]
      .sort((a, b) => a.date.localeCompare(b.date))
    
    // 生成新的檔案內容
    const newFileContent = generateDefaultCalendarFileContent(mergedSettings)
    
    // 準備更新檔案的資訊
    return {
      success: true,
      message: `準備將 ${newSettings.length} 個新設定加入預設日曆`,
      newDefaultsCount: mergedSettings.length,
      fileContent: newFileContent,
      newSettings
    }
    
  } catch (error) {
    console.error('合併設定時發生錯誤:', error)
    return {
      success: false,
      message: '合併設定時發生錯誤',
      newDefaultsCount: 0
    }
  }
}

/**
 * 生成預設日曆檔案的完整內容
 */
const generateDefaultCalendarFileContent = (settings: CustomDayWithId[]): string => {
  const settingsCode = settings.map(setting => {
    return `  {
    id: '${setting.id}',
    date: '${setting.date}',
    name: '${setting.name}',
    type: '${setting.type}',
    updatedAt: '${setting.updatedAt || new Date().toISOString()}'
  }`
  }).join(',\n')

  return `import { CustomDayWithId } from '../types/workday'

// ============================================================
// 預設日曆設定 - 全域共用的工作日設定
// ============================================================
// 這裡的設定會對所有使用者生效，適合設定公司行事曆、國定假日等
// 發布後所有使用者都會看到相同的基礎日曆設定
// 使用者仍可在此基礎上新增個人自訂設定

export const DEFAULT_CALENDAR_SETTINGS: CustomDayWithId[] = [
${settingsCode}
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
}`
}

/**
 * 實際更新預設日曆檔案
 * 這個函數會被 UI 呼叫來執行檔案更新
 */
export const updateDefaultCalendarFile = async (newFileContent: string): Promise<{ success: boolean; message: string }> => {
  try {
    // 這裡我們返回檔案內容，讓主組件處理實際的檔案更新
    return {
      success: true,
      message: '檔案內容已準備就緒',
      fileContent: newFileContent
    }
  } catch (error) {
    return {
      success: false,
      message: '更新檔案失敗'
    }
  }
}

/**
 * 格式化設定項目為易讀的文字
 */
export const formatSettingsForDisplay = (settings: CustomDayWithId[]): string => {
  return settings.map(setting => 
    `• ${setting.name} (${setting.date}) - ${setting.type === 'holiday' ? '假日' : '工作日'}`
  ).join('\n')
}