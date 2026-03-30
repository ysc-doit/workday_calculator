'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'
import { BarChart3, Clock, Info } from 'lucide-react'
import { WorkdayCalculationDetails, formatWorkTime } from '../utils/workday-helpers'
import { format, parseISO } from 'date-fns'
import { zhTW } from 'date-fns/locale'

interface WorkdayCalculationDetailsProps {
  details?: WorkdayCalculationDetails
  startDate?: string
  endDate?: string
  startTime?: string
  endTime?: string
  onCardClick?: (cardType: string) => void
  selectedCardType?: string
  calculationMode?: 'inputDays' | 'inputRange' | 'calculateHours'
  calculationType?: 'workdays' | 'calendarDays'
}

export function WorkdayCalculationDetailsComponent({ 
  details, 
  startDate, 
  endDate,
  startTime,
  endTime,
  onCardClick,
  selectedCardType,
  calculationMode,
  calculationType
}: WorkdayCalculationDetailsProps) {
  const [workdaysPopoverOpen, setWorkdaysPopoverOpen] = useState(false)
  const [holidaysPopoverOpen, setHolidaysPopoverOpen] = useState(false)

  const formatDate = (dateStr: string) => {
    try {
      const date = parseISO(dateStr)
      return format(date, 'yyyy/MM/dd (eeeee)', { locale: zhTW })
    } catch {
      return dateStr
    }
  }

  const formatTime = (time: string) => {
    return time.substring(0, 5) // 取前5個字元 HH:MM
  }

  // 預設空值
  const defaultDetails = {
    totalDays: 0,
    workdays: 0,
    holidays: 0,
    customWorkdays: 0,
    weekendDays: 0,
    customHolidays: 0,
    customWorkdaysList: [],
    customHolidaysList: []
  }

  const currentDetails = details || defaultDetails
  const hasTimeCalculation = details?.workHours !== undefined && details?.workMinutes !== undefined && details?.workingDaysDetails
  const hasCalculation = !!details

  return (
    <>
      {/* 重點資訊卡片 - 第一行，佔滿寬度 */}
      <div 
        className={`mt-10 p-3 bg-blue-50 rounded-lg border-2 border-blue-200 dark:bg-blue-600/10 dark:border-blue-600/30 shadow-sm flex items-center justify-center gap-1 min-h-16 relative ${
          hasCalculation ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
        }`}
      >
        <div className="flex flex-col items-center gap-1">
          <span className="text-base font-bold">
            {hasCalculation ? (
              <>
                {calculationMode === 'inputDays' && endDate && format(parseISO(endDate), 'yyyy/MM/dd (eeeee)', { locale: zhTW })}
                {calculationMode === 'inputRange' && `${currentDetails.workdays}個工作天`}
                {calculationMode === 'calculateHours' && formatWorkTime(details?.workHours || 0, details?.workMinutes || 0)}
              </>
            ) : (
              '—'
            )}
          </span>
          <span className="text-xs text-blue-600 dark:text-blue-400">計算結果</span>
        </div>
        
        {calculationMode === 'calculateHours' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col items-end text-[10px] text-blue-500 dark:text-blue-400 leading-tight">
            <div className="font-medium mb-0.5">計算區間：</div>
            <div>08:30 - 12:30</div>
            <div>13:30 - 17:30</div>
          </div>
        )}
      </div>



      {/* 詳細統計卡片 - 第二行，三個統計卡片 */}
      <div className="grid gap-3 text-center grid-cols-3">
        <div 
          className={`p-3 bg-slate-50 rounded-lg transition-colors dark:bg-slate-600/20 min-h-16 flex flex-col justify-center ${
            hasCalculation 
              ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600/30' 
              : 'cursor-not-allowed'
          } ${selectedCardType === 'totalDays' ? 'ring-2 ring-slate-400' : ''}`}
          onClick={() => hasCalculation && onCardClick?.('totalDays')}
        >
          <div className="text-base font-bold text-slate-700 dark:text-slate-200">
            {hasCalculation ? currentDetails.totalDays : '—'}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-300">日曆天</div>
        </div>
        
        {/* 工作天卡片 */}
        <Popover open={workdaysPopoverOpen} onOpenChange={setWorkdaysPopoverOpen}>
          <PopoverTrigger asChild>
            <div 
              className={`p-3 bg-green-50 rounded-lg transition-colors dark:bg-green-400/25 min-h-16 flex flex-col justify-center ${
                  hasCalculation 
                    ? 'cursor-pointer hover:bg-green-100 dark:hover:bg-green-400/35' 
                    : 'cursor-not-allowed'
                } ${selectedCardType === 'workdays' ? 'ring-2 ring-green-400' : ''}`}
                onClick={() => {
                  if (hasCalculation) {
                    onCardClick?.('workdays')
                  }
                }}
              >
                <div className="text-base font-bold text-green-700 dark:text-green-200">
                  {hasCalculation ? currentDetails.workdays : '—'}
                </div>
                <div className="text-xs text-green-600 dark:text-green-300">
                  工作天{hasCalculation && currentDetails.customWorkdays > 0 && <span className="text-blue-600 dark:text-blue-300">(含補班)</span>}
                </div>
              </div>
            </PopoverTrigger>
            {hasCalculation && currentDetails.customWorkdays > 0 && (
              <PopoverContent side="top" className="max-w-xs bg-background/95 backdrop-blur-sm border border-border/50">
                <div className="space-y-1">
                  <div className="text-xs font-medium mb-2">含補班：共{currentDetails.customWorkdays}日</div>
                  {currentDetails.customWorkdaysList.map((day, index) => (
                    <div key={`${day.date}-${index}`} className="text-xs bg-sky-50 text-sky-600 px-2 py-1 rounded dark:bg-sky-400/25 dark:text-sky-200">
                      {formatDate(day.date)} {day.name}
                    </div>
                  ))}
                </div>
              </PopoverContent>
            )}
          </Popover>

        {/* 假日卡片 */}
        <Popover open={holidaysPopoverOpen} onOpenChange={setHolidaysPopoverOpen}>
          <PopoverTrigger asChild>
            <div 
              className={`p-3 bg-red-50 rounded-lg transition-colors dark:bg-red-400/25 min-h-16 flex flex-col justify-center ${
                  hasCalculation 
                    ? 'cursor-pointer hover:bg-red-100 dark:hover:bg-red-400/35' 
                    : 'cursor-not-allowed'
                } ${(selectedCardType === 'weekends' || selectedCardType === 'customHolidays') ? 'ring-2 ring-red-400' : ''}`}
                onClick={() => {
                  if (hasCalculation) {
                    onCardClick?.('weekends')
                  }
                }}
              >
                <div className="text-base font-bold text-red-700 dark:text-red-200">
                  {hasCalculation ? currentDetails.holidays : '—'}
                </div>
                <div className="text-xs text-red-600 dark:text-red-300">
                  假日{hasCalculation && currentDetails.customHolidays > 0 && <span className="text-orange-600 dark:text-orange-300">(含放假)</span>}
                </div>
              </div>
            </PopoverTrigger>
            {hasCalculation && currentDetails.customHolidays > 0 && (
              <PopoverContent side="top" className="max-w-xs bg-background/95 backdrop-blur-sm border border-border/50">
                <div className="space-y-1">
                  <div className="text-xs font-medium mb-2">含放假：共{currentDetails.customHolidays}日</div>
                  {currentDetails.customHolidaysList.map((day, index) => (
                    <div key={`${day.date}-${index}`} className="text-xs bg-orange-50 text-orange-600 px-2 py-1 rounded dark:bg-orange-400/25 dark:text-orange-200">
                      {formatDate(day.date)} {day.name}
                    </div>
                  ))}
                </div>
              </PopoverContent>
            )}
          </Popover>
      </div>
    </>
  )
}