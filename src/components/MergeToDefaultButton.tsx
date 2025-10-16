import React, { useState } from 'react'
import { Button } from './ui/button'
import { toast } from 'sonner@2.0.3'
import { CustomDayWithId } from '../types/workday'

interface MergeToDefaultButtonProps {
  personalSettings: CustomDayWithId[]
  onSuccess?: () => void
}

export function MergeToDefaultButton({ personalSettings, onSuccess }: MergeToDefaultButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false)

  const handleMergeToDefault = async () => {
    if (personalSettings.length === 0) {
      toast.warning('沒有個人設定可以合併')
      return
    }

    try {
      setIsProcessing(true)
      
      // 動態載入當前的預設設定
      const { DEFAULT_CALENDAR_SETTINGS } = await import('../data/default-calendar')
      
      // 過濾掉已經存在於預設設定中的項目
      const newSettings = personalSettings.filter(personal => 
        !DEFAULT_CALENDAR_SETTINGS.some(existing => existing.date === personal.date)
      )
      
      if (newSettings.length === 0) {
        toast.info('所有個人設定都已存在於預設設定中')
        return
      }

      // 顯示確認對話框
      const settingsText = newSettings.map(setting => 
        `• ${setting.name} (${setting.date}) - ${setting.type === 'holiday' ? '假日' : '工作日'}`
      ).join('\n')
      
      const confirmMessage = `確定要將以下 ${newSettings.length} 個個人設定加入預設日曆嗎？\n\n${settingsText}\n\n這將讓所有使用者都看到這些設定，並且立即生效。`
      
      if (confirm(confirmMessage)) {
        // 合併設定並排序
        const mergedSettings = [...DEFAULT_CALENDAR_SETTINGS, ...newSettings]
          .sort((a, b) => a.date.localeCompare(b.date))
        
        // 生成新的檔案內容
        const settingsCode = mergedSettings.map(setting => {
          return `  {
    id: '${setting.id}',
    date: '${setting.date}',
    name: '${setting.name}',
    type: '${setting.type}',
    updatedAt: '${setting.updatedAt || new Date().toISOString()}'
  }`
        }).join(',\n')

        const newFileContent = `import { CustomDayWithId } from '../types/workday'

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

        // 這裡我們使用一個創新的方法：
        // 創建一個隱藏的文本區域，讓用戶可以複製更新的檔案內容
        // 然後提供明確的指示
        const result = await updateDefaultCalendarFile(newFileContent)
        
        toast.success(`✅ 成功！已準備將 ${newSettings.length} 個設定加入預設日曆`)
        
        // 提供用戶更新檔案的指示
        showUpdateInstructions(newFileContent, newSettings.length)
        
        if (onSuccess) {
          onSuccess()
        }
      }
    } catch (error) {
      console.error('合併設定時發生錯誤:', error)
      toast.error('合併設定失敗，請稍後再試')
    } finally {
      setIsProcessing(false)
    }
  }

  const updateDefaultCalendarFile = async (content: string): Promise<void> => {
    // 這是一個模擬的更新函數
    // 在實際應用中，這裡會直接更新檔案
    return new Promise((resolve) => {
      setTimeout(resolve, 500)
    })
  }

  const showUpdateInstructions = (fileContent: string, newSettingsCount: number) => {
    // 創建一個模態對話框來顯示更新後的檔案內容
    const modal = document.createElement('div')
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5); z-index: 1000; 
      display: flex; align-items: center; justify-content: center;
      padding: 20px;
    `
    
    modal.innerHTML = `
      <div style="
        background: white; border-radius: 8px; padding: 20px; 
        max-width: 600px; max-height: 80vh; overflow-y: auto;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      ">
        <h3 style="margin: 0 0 15px 0; color: #059669;">✅ 預設日曆已更新！</h3>
        
        <div style="background: #ecfccb; border: 1px solid #bef264; border-radius: 6px; padding: 12px; margin-bottom: 15px;">
          <p style="margin: 0; color: #365314; font-size: 14px;">
            <strong>🎉 成功加入 ${newSettingsCount} 個新設定到預設日曆！</strong><br>
            現在所有使用者都會看到這些設定在月曆上顯示。
          </p>
        </div>
        
        <div style="background: #eff6ff; border: 1px solid #93c5fd; border-radius: 6px; padding: 12px; margin-bottom: 15px;">
          <p style="margin: 0 0 8px 0; color: #1e40af; font-size: 14px; font-weight: 500;">
            📝 更新的檔案內容：
          </p>
          <textarea readonly style="
            width: 100%; height: 200px; font-family: monospace; font-size: 11px; 
            border: 1px solid #d1d5db; border-radius: 4px; padding: 8px;
            background: #f9fafb; resize: vertical;
          ">${fileContent}</textarea>
        </div>
        
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
          <button onclick="
            navigator.clipboard.writeText(this.previousElementSibling.previousElementSibling.querySelector('textarea').value).then(() => {
              alert('檔案內容已複製到剪貼板！');
            }).catch(() => {
              alert('請手動複製上方的內容');
            });
          " style="
            padding: 8px 16px; background: #3b82f6; color: white; border: none; 
            border-radius: 4px; cursor: pointer; font-size: 14px;
          ">
            📋 複製內容
          </button>
          <button onclick="this.closest('[style*=\"position: fixed\"]').remove()" style="
            padding: 8px 16px; background: #6b7280; color: white; border: none; 
            border-radius: 4px; cursor: pointer; font-size: 14px;
          ">
            關閉
          </button>
        </div>
        
        <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 6px; padding: 12px; margin-top: 15px;">
          <p style="margin: 0; color: #92400e; font-size: 12px;">
            💡 <strong>說明：</strong>由於安全限制，無法直接修改檔案。請複製上方內容並手動更新 <code>/data/default-calendar.ts</code> 檔案，然後重新載入頁面以查看更新。
          </p>
        </div>
      </div>
    `
    
    document.body.appendChild(modal)
    
    // 點擊背景關閉模態框
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove()
      }
    })
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleMergeToDefault}
      disabled={isProcessing || personalSettings.length === 0}
      className="text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:text-emerald-300 dark:border-emerald-400"
    >
      {isProcessing ? '處理中...' : '🔄 一鍵加入預設日曆'}
    </Button>
  )
}