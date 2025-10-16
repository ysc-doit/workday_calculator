// 這個測試組件只是為了快速找到 UnifiedCalendarSettings 調用的位置
import React from 'react'
import { UnifiedCalendarSettings } from './UnifiedCalendarSettings'
import { loadCustomDaysFromStorage } from '../utils/workday-helpers'

export function TestUnifiedCalendar() {
  const personalDays = loadCustomDaysFromStorage()
  
  return (
    <UnifiedCalendarSettings
      personalCustomDays={personalDays}
      onDelete={(date) => console.log('Delete:', date)}
      onReload={() => console.log('Reload')}
      loading={false}
    />
  )
}