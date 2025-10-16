'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { WorkdayCalculator } from './components/WorkdayCalculator'
import { WorkdayCalendar } from './components/WorkdayCalendar'
import { Toaster } from './components/ui/sonner'
import { WorkdayCalculationDetails, loadAllCustomDays } from './utils/workday-helpers'
import { ThemeProvider } from './components/ThemeProvider'
import { ThemeToggle } from './components/ThemeToggle'
import { migrateToGlobalSettings } from './utils/global-settings-migration'

export default function App() {
  const [calculationRange, setCalculationRange] = useState<{
    startDate: string
    endDate: string
    startTime?: string
    endTime?: string
  } | undefined>(undefined)
  
  const [calculationDetails, setCalculationDetails] = useState<WorkdayCalculationDetails | undefined>(undefined)
  const [selectedCardType, setSelectedCardType] = useState<string | undefined>(undefined)
  const [calculationMode, setCalculationMode] = useState<'inputDays' | 'inputRange' | 'calculateHours' | undefined>(undefined)
  const [calculationType, setCalculationType] = useState<'workdays' | 'calendarDays' | undefined>(undefined)
  const [isInitialized, setIsInitialized] = useState(false)

  // 初始化應用
  useEffect(() => {
    try {
      // 執行全局設定移轉
      migrateToGlobalSettings()
      
      const allCustomDays = loadAllCustomDays()
      
      console.log(`✅ 應用已初始化`)
      console.log(`📋 載入全局日期設定: ${allCustomDays.length} 項`)
      console.log('📅 預設日曆設定已載入:', allCustomDays.filter(day => day.id.includes('holiday-') || day.id.includes('workday-')).length, '項')
      console.log('🔧 個人自訂設定:', allCustomDays.filter(day => !day.id.includes('holiday-') && !day.id.includes('workday-')).length, '項')
      
      setIsInitialized(true)
    } catch (error) {
      console.error('❌ 初始化錯誤:', error)
      setIsInitialized(true) // 即使出錯也繼續運行
    }
  }, [])

  const handleCalculationUpdate = useCallback((startDate: string, endDate: string, details: WorkdayCalculationDetails, startTime?: string, endTime?: string, mode?: 'inputDays' | 'inputRange' | 'calculateHours', type?: 'workdays' | 'calendarDays') => {
    setCalculationRange({ startDate, endDate, startTime, endTime })
    setCalculationDetails(details)
    setCalculationMode(mode)
    setCalculationType(type)
  }, [])

  const handleCalculationClear = useCallback(() => {
    setCalculationRange(undefined)
    setCalculationDetails(undefined)
    setSelectedCardType(undefined)
    setCalculationMode(undefined)
    setCalculationType(undefined)
  }, [])

  const handleCardClick = useCallback((cardType: string) => {
    setSelectedCardType(prev => prev === cardType ? undefined : cardType)
  }, [])

  return (
    <ThemeProvider storageKey="workday-ui-theme">
      <div className="min-h-screen bg-background transition-colors">
        <div className="container mx-auto py-8">
          <div className="text-center mb-8 relative">
            <div className="absolute top-0 right-0">
              <ThemeToggle />
            </div>
            <h1 className="text-3xl font-bold mb-2">工作天計算機</h1>
          </div>
          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 xl:items-start">
            <div className="flex flex-col space-y-6">
              <WorkdayCalculator 
                onCalculationUpdate={handleCalculationUpdate}
                onCalculationClear={handleCalculationClear}
                onCardClick={handleCardClick}
                selectedCardType={selectedCardType}
              />
              

            </div>
            <div className="flex flex-col space-y-6 xl:h-full">
              <WorkdayCalendar 
                calculationRange={calculationRange}
                calculationDetails={calculationDetails}
                selectedCardType={selectedCardType}
                calculationMode={calculationMode}
                calculationType={calculationType}
              />
            </div>
          </div>
        </div>
        
        <Toaster position="top-right" />
      </div>
    </ThemeProvider>
  )
}