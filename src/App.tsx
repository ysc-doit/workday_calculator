'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { WorkdayCalculator } from './components/WorkdayCalculator'
import { WorkdayCalendar } from './components/WorkdayCalendar'
import { Toaster } from './components/ui/sonner'
import { WorkdayCalculationDetails, loadAllCustomDays } from './utils/workday-helpers'
import { ThemeProvider } from './components/ThemeProvider'
import { ThemeToggle } from './components/ThemeToggle'
import { Popover, PopoverContent, PopoverTrigger } from './components/ui/popover'
import { Button } from './components/ui/button'
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react'

// 版本歷史定義
interface VersionInfo {
  version: string
  date: string
  features: {
    title: string
    items: string[]
  }[]
}

const VERSION_HISTORY: VersionInfo[] = [
  {
    version: 'ver.2025/11/10',
    date: '2025/11/10',
    features: [
      {
        title: '計算功能優化',
        items: [
          '重新設計計算模式選擇介面',
          '新增起算日選項（當日起算/次日起算）',
          '輸入天數快速選擇（5、10、15、20天）',
          '優化工作天/日曆天切換方式',
          '移除「開始計算」按鈕，改為自動即時計算'
        ]
      },
      {
        title: '列印功能優化',
        items: [
          '優化列印版面配置',
          '以簡潔文字呈現計算輸入與結果'
        ]
      },
      {
        title: '版本管理系統',
        items: [
          '新增版本資訊按鈕（點擊查看更新內容）',
          '支援切換查看歷史版本資訊',
          '版本號格式統一（ver.YYYY/MM/DD）'
        ]
      }
    ]
  },
  {
    version: 'ver.2025/09/24',
    date: '2025/09/24',
    features: [
      {
        title: '核心計算功能',
        items: [
          '工作天數計算（輸入天數）',
          '工作天數計算（輸入期間）',
          '工時計算功能'
        ]
      },
      {
        title: '介面與操作',
        items: [
          '三區塊佈局（輸入、計算、月曆）',
          '主題切換（淺色、深色模式）',
          '月曆列印功能'
        ]
      },
      {
        title: '計算詳情',
        items: [
          '卡片式結果顯示（日曆天/工作天/假日）'
        ]
      },
      {
        title: '日曆視覺化',
        items: [
          '月曆呈現計算結果',
          '狀態顯示（工作日/週末/非工作日/補班日）',
          '新增2025、2026年辦公日曆'
        ]
      }
    ]
  }
]

const CURRENT_VERSION = VERSION_HISTORY[0]

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
  const [inclusionMode, setInclusionMode] = useState<'current' | 'next' | undefined>(undefined)
  const [isInitialized, setIsInitialized] = useState(false)
  const [selectedVersionIndex, setSelectedVersionIndex] = useState(0)
  const [isVersionPopoverOpen, setIsVersionPopoverOpen] = useState(false)

  // 初始化應用
  useEffect(() => {
    try {
      const allCustomDays = loadAllCustomDays()
      
      console.log(`✅ 應用已初始化`)
      console.log(`📋 載入日期設定: ${allCustomDays.length} 項`)
      console.log('📅 預設日曆設定已載入:', allCustomDays.filter(day => day.id.includes('holiday-') || day.id.includes('workday-')).length, '項')
      console.log('🔧 個人自訂設定:', allCustomDays.filter(day => !day.id.includes('holiday-') && !day.id.includes('workday-')).length, '項')
      
      setIsInitialized(true)
    } catch (error) {
      console.error('❌ 初始化錯誤:', error)
      setIsInitialized(true) // 即使出錯也繼續運行
    }
  }, [])

  const handleCalculationUpdate = useCallback((startDate: string, endDate: string, details: WorkdayCalculationDetails, startTime?: string, endTime?: string, mode?: 'inputDays' | 'inputRange' | 'calculateHours', type?: 'workdays' | 'calendarDays', cardType?: string, inclusionMode?: 'current' | 'next') => {
    setCalculationRange({ startDate, endDate, startTime, endTime })
    setCalculationDetails(details)
    setCalculationMode(mode)
    setCalculationType(type)
    setInclusionMode(inclusionMode)
    // 自動計算時直接設置卡片類型，不使用切換邏輯
    if (cardType) {
      setSelectedCardType(cardType)
    }
  }, [])

  const handleCalculationClear = useCallback(() => {
    setCalculationRange(undefined)
    setCalculationDetails(undefined)
    setSelectedCardType(undefined)
    setCalculationMode(undefined)
    setCalculationType(undefined)
    setInclusionMode(undefined)
  }, [])

  const handleCardClick = useCallback((cardType: string) => {
    setSelectedCardType(prev => prev === cardType ? undefined : cardType)
  }, [])

  const handlePreviousVersion = () => {
    if (selectedVersionIndex < VERSION_HISTORY.length - 1) {
      setSelectedVersionIndex(selectedVersionIndex + 1)
    }
  }

  const handleNextVersion = () => {
    if (selectedVersionIndex > 0) {
      setSelectedVersionIndex(selectedVersionIndex - 1)
    }
  }

  const currentDisplayVersion = VERSION_HISTORY[selectedVersionIndex]

  return (
    <ThemeProvider storageKey="workday-ui-theme">
      <div className="min-h-screen bg-background transition-colors">
        <div className="container mx-auto py-8">
          <div className="text-center mb-8 relative">
            <div className="absolute top-0 right-0 flex items-center gap-2">
              <Popover open={isVersionPopoverOpen} onOpenChange={setIsVersionPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-9 w-9"
                  >
                    <FileText className="h-4 w-4" />
                    <span className="sr-only">版本資訊</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-96">
                  <div className="space-y-3">
                    {/* 版本切換控制 */}
                    <div className="flex items-center justify-between pb-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handlePreviousVersion}
                        disabled={selectedVersionIndex >= VERSION_HISTORY.length - 1}
                        className="h-7 px-2"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="text-center">
                        <p className="text-sm">
                          <span className="font-medium">版本資訊：{currentDisplayVersion.version.replace('ver.', '')}</span>
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleNextVersion}
                        disabled={selectedVersionIndex <= 0}
                        className="h-7 px-2"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* 版本功能列表 */}
                    {currentDisplayVersion.features.map((section, index) => (
                      <div key={index} className="text-base space-y-1 pt-2 border-t">
                        <p className="font-medium">{section.title}</p>
                        <ul className="list-disc list-inside space-y-0.5 text-muted-foreground ml-2">
                          {section.items.map((item, itemIndex) => (
                            <li key={itemIndex} className="text-sm">{item}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              <ThemeToggle />
            </div>
            <h1 className="text-3xl font-bold">工作天計算機</h1>
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
                inclusionMode={inclusionMode}
              />
            </div>
          </div>


        </div>
        
        <Toaster position="top-right" />
      </div>
    </ThemeProvider>
  )
}