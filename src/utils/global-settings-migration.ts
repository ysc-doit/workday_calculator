import { CustomDayWithId } from '../types/workday'
import { DEFAULT_CALENDAR_SETTINGS } from '../data/default-calendar'

// 將預設日曆設定移轉到全局設定
export const migrateToGlobalSettings = (): void => {
  // 檢查是否已經有全局設定
  const existingGlobalSettings = localStorage.getItem('workday-global-settings')
  
  if (!existingGlobalSettings) {
    // 如果沒有全局設定，則將預設設定作為初始全局設定
    console.log('🚀 執行全局設定初始化...')
    localStorage.setItem('workday-global-settings', JSON.stringify(DEFAULT_CALENDAR_SETTINGS))
    console.log(`✅ 已將 ${DEFAULT_CALENDAR_SETTINGS.length} 項預設設定移轉至全局設定`)
  } else {
    console.log('ℹ️ 全局設定已存在，跳過移轉')
  }

  // 清理舊的個人設定（如果需要的話）
  const oldPersonalSettings = localStorage.getItem('workday-custom-days')
  if (oldPersonalSettings) {
    try {
      const oldSettings: CustomDayWithId[] = JSON.parse(oldPersonalSettings)
      if (oldSettings.length > 0) {
        // 合併舊的個人設定到全局設定
        const currentGlobalSettings: CustomDayWithId[] = JSON.parse(
          localStorage.getItem('workday-global-settings') || '[]'
        )
        
        // 合併設定，避免重複
        const mergedSettings = [...currentGlobalSettings]
        oldSettings.forEach(oldSetting => {
          const existingIndex = mergedSettings.findIndex(s => s.date === oldSetting.date)
          if (existingIndex >= 0) {
            // 更新現有設定
            mergedSettings[existingIndex] = oldSetting
          } else {
            // 加入新設定
            mergedSettings.push(oldSetting)
          }
        })
        
        localStorage.setItem('workday-global-settings', JSON.stringify(mergedSettings))
        console.log(`✅ 已合併 ${oldSettings.length} 項舊個人設定到全局設定`)
        
        // 刪除舊的個人設定儲存
        localStorage.removeItem('workday-custom-days')
        console.log('🗑️ 已清理舊的個人設定儲存')
      }
    } catch (error) {
      console.error('❌ 移轉舊設定時發生錯誤:', error)
    }
  }
}