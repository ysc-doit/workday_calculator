import React, { useState, useMemo } from 'react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible'
import { ChevronDown, ChevronLeft, ChevronRight, Minus, Loader2, Calendar } from 'lucide-react'
import { CustomDayWithId } from '../types/workday'
import { loadAllCustomDays } from '../utils/workday-helpers'
import { format, parseISO } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { toast } from 'sonner@2.0.3'

interface UnifiedCalendarSettingsProps {
  personalCustomDays: CustomDayWithId[]
  loading: boolean
  selectedYear: string
}

export function UnifiedCalendarSettings({ personalCustomDays, loading, selectedYear }: UnifiedCalendarSettingsProps) {
  // 載入所有日曆設定
  const allCustomDays = useMemo(() => {
    const days = loadAllCustomDays()
    return days
  }, [personalCustomDays])
  
  // 按年份分組
  const yearlySettings = useMemo(() => {
    const grouped: { [year: string]: CustomDayWithId[] } = {}
    
    allCustomDays.forEach(day => {
      const year = day.date.substring(0, 4)
      if (!grouped[year]) {
        grouped[year] = []
      }
      grouped[year].push(day)
    })
    
    // 對每年內的定按日期排序
    Object.keys(grouped).forEach(year => {
      grouped[year].sort((a, b) => a.date.localeCompare(b.date))
    })
    
    return grouped
  }, [allCustomDays])
  
  const availableYears = Object.keys(yearlySettings).sort((a, b) => b.localeCompare(a)) // 降序排列，最新年份在前
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set([selectedYear]))
  
  const toggleYearExpansion = (year: string) => {
    const newExpanded = new Set(expandedYears)
    if (newExpanded.has(year)) {
      newExpanded.delete(year)
    } else {
      newExpanded.add(year)
    }
    setExpandedYears(newExpanded)
  }
  
  const formatDateDisplay = (dateStr: string) => {
    try {
      const date = parseISO(dateStr)
      return format(date, 'MM月dd日 (EEEEE)', { locale: zhTW })
    } catch {
      return dateStr
    }
  }
  
  const getSettingTypeStats = (settings: CustomDayWithId[]) => {
    const holidayCount = settings.filter(s => s.type === 'holiday').length
    const workdayCount = settings.filter(s => s.type === 'workday').length
    
    return { holidayCount, workdayCount }
  }

  // 移除刪除功能 - 根據重構要求不再提供手動刪除

  if (availableYears.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>尚未設定任何日曆設定</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* 當前年份設定顯示 */}
      <div className="space-y-3">
        {yearlySettings[selectedYear] && yearlySettings[selectedYear].length > 0 ? (
          <div className="border rounded-lg overflow-hidden">
            <div className="p-4 space-y-2">
              {yearlySettings[selectedYear].map(day => (
                <div
                  key={day.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    day.type === 'holiday'
                      ? 'bg-orange-50/50 border-orange-200/60 dark:bg-orange-400/10 dark:border-orange-400/20'
                      : 'bg-sky-50/50 border-sky-200/60 dark:bg-sky-400/10 dark:border-sky-400/20'
                  }`}
                >
                  <Badge 
                    variant={day.type === 'workday' ? 'default' : 'secondary'}
                    className={
                      day.type === 'holiday' 
                        ? 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200 dark:bg-orange-400/20 dark:text-orange-300 dark:border-orange-400/40'
                        : 'bg-sky-100 text-sky-700 border-sky-200 hover:bg-sky-200 dark:bg-sky-400/20 dark:text-sky-300 dark:border-sky-400/40'
                    }
                  >
                    {day.type === 'workday' ? '補班' : '假日'}
                  </Badge>
                  <div className="flex-1 flex items-center justify-between">
                    <span className="font-medium">{day.name}</span>
                    <span className="text-sm text-muted-foreground">{formatDateDisplay(day.date)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>📅 {selectedYear}年暫無設定</p>
          </div>
        )}
      </div>
      
      {/* 統計信息已移除 */}
    </div>
  )
}