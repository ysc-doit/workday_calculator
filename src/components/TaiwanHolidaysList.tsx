'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { CalendarDays, ChevronDown, ChevronUp } from 'lucide-react'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { getTaiwanHolidaysByYear, TaiwanHoliday } from '../utils/taiwan-holidays'

export function TaiwanHolidaysList() {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [holidays, setHolidays] = useState<TaiwanHoliday[]>([])
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    loadHolidays()
  }, [currentYear])

  const loadHolidays = () => {
    const yearHolidays = getTaiwanHolidaysByYear(currentYear)
    // 按日期排序
    const sortedHolidays = yearHolidays.sort((a, b) => a.date.localeCompare(b.date))
    setHolidays(sortedHolidays)
  }

  const handleYearChange = (direction: 'prev' | 'next') => {
    const newYear = direction === 'prev' ? currentYear - 1 : currentYear + 1
    setCurrentYear(newYear)
  }

  const formatHolidayDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr + 'T00:00:00') // 確保解析為本地時間
      return format(date, 'MM/dd (eeee)', { locale: zhTW })
    } catch {
      return dateStr
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5" />
            <span>台灣國定假日</span>
            <span className="text-sm text-muted-foreground">
              ({holidays.length} 個假日)
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-1" />
                收起
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-1" />
                展開
              </>
            )}
          </Button>
        </div>
        
        {isExpanded && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleYearChange('prev')}
            >
              ←
            </Button>
            <span className="min-w-16 text-center font-medium">
              {currentYear}年
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleYearChange('next')}
            >
              →
            </Button>
          </div>
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent>
          {holidays.length > 0 ? (
            <div className="grid grid-cols-1 gap-2">
              {holidays.map((holiday, index) => (
                <div
                  key={`${holiday.date}-${index}`}
                  className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="font-medium text-orange-800">
                      {holiday.name}
                    </span>
                    {holiday.description && (
                      <span className="text-xs text-orange-600/80">
                        ({holiday.description})
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-orange-600">
                    {formatHolidayDate(holiday.date)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-4">
              {currentYear}年的國定假日資料尚未建立
            </div>
          )}
          
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>說明：</strong>國定假日會自動標記為非工作日，且名稱會顯示在日曆上。
              您可以透過自訂設定覆蓋這些日期（例如補班日）。
              農曆節日的確切日期每年都不同，目前已包含2025年的資料。
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  )
}