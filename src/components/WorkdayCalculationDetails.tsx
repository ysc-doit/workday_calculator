'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'
import { BarChart3, Clock } from 'lucide-react'
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
    <Card>
      <CardContent className="space-y-6 px-[21px] py-[23px]">
        {/* 重點資訊卡片 - 第一行，佔滿寬度 */}
        <div className="w-full">
          <div 
            className={`p-3 bg-blue-50 rounded-lg border-2 border-blue-200 dark:bg-blue-600/10 dark:border-blue-600/30 shadow-sm flex items-center justify-center min-h-16 ${
              hasCalculation ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            <div className="flex flex-col items-center gap-1">
              <div className="text-base font-bold">
                {hasCalculation ? (
                  <>
                    {calculationMode === 'inputDays' && endDate && format(parseISO(endDate), 'yyyy/MM/dd (eeeee)', { locale: zhTW })}
                    {calculationMode === 'inputRange' && `${currentDetails.workdays}個工作天`}
                    {calculationMode === 'calculateHours' && formatWorkTime(details?.workHours || 0, details?.workMinutes || 0)}
                  </>
                ) : (
                  '—'
                )}
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400">計算結果</div>
            </div>
          </div>
        </div>

        {/* 工時詳細信息 - 僅在計算工時模式下顯示 */}
        {calculationMode === 'calculateHours' && hasCalculation && details?.workingDaysDetails && details.workingDaysDetails.length > 0 && (
          <div className="space-y-3">
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {details.workingDaysDetails.map((day, index) => {
                // 分析工作時間段
                const morningPeriod = day.periods.find(p => p.start >= '08:30' && p.end <= '12:30')
                const afternoonPeriod = day.periods.find(p => p.start >= '13:30' && p.end <= '17:30')
                
                // 檢查超出時間
                const morningOvertime = day.startTime && day.startTime < '08:30' ? day.startTime : 
                                      day.endTime && day.endTime > '12:30' && day.endTime <= '13:30' ? day.endTime : null
                const afternoonOvertime = day.startTime && day.startTime > '17:30' ? day.startTime :
                                         day.endTime && day.endTime < '08:30' ? day.endTime : null
                
                return (
                  <div 
                    key={`${day.date}-${index}`}
                    className="p-3 bg-purple-50 rounded-lg dark:bg-purple-400/25"
                  >
                    <div className="grid grid-cols-6 items-center gap-2 whitespace-nowrap">
                      {/* 日期 - 最左側 */}
                      <span className="text-sm font-medium">
                        {formatDate(day.date)}
                      </span>
                      
                      {/* 超出的上午工作時間 - 早於08:30的時間，或假日的開始時間 */}
                      <div className="text-xs font-mono text-red-600 dark:text-red-400 text-center">
                        {(() => {
                          // 假日邏輯：工時為0時，只顯示早於08:30的開始時間（晚於17:30的會顯示在右側）
                          if (day.hours === 0 && day.minutes === 0 && day.startTime && day.startTime < '08:30') {
                            return formatTime(day.startTime)
                          }
                          // 原有邏輯：超出上午工作時間
                          if ((day.startTime && day.startTime < '08:30') || (day.endTime && day.endTime <= '08:30')) {
                            return formatTime(day.startTime && day.startTime < '08:30' ? day.startTime : day.endTime)
                          }
                          return null
                        })()}
                      </div>
                      
                      {/* 上午工作時間 */}
                      <div className="text-xs font-mono text-center">
                        {day.hours === 0 && day.minutes === 0 ? (
                          <span className="text-muted-foreground">-</span>
                        ) : morningPeriod ? (
                          <>
                            <span className={
                              morningPeriod.start === day.startTime || morningPeriod.start === day.endTime
                                ? "text-red-600 dark:text-red-400"
                                : "text-purple-600 dark:text-purple-300"
                            }>
                              {formatTime(morningPeriod.start)}
                            </span>
                            <span className="text-purple-600 dark:text-purple-300">-</span>
                            <span className={
                              morningPeriod.end === day.startTime || morningPeriod.end === day.endTime
                                ? "text-red-600 dark:text-red-400"
                                : "text-purple-600 dark:text-purple-300"
                            }>
                              {formatTime(morningPeriod.end)}
                            </span>
                          </>
                        ) : null}
                      </div>
                      
                      {/* 下午工作時間 */}
                      <div className="text-xs font-mono text-center">
                        {day.hours === 0 && day.minutes === 0 ? (
                          <span className="text-muted-foreground">-</span>
                        ) : afternoonPeriod ? (
                          <>
                            <span className={
                              afternoonPeriod.start === day.startTime || afternoonPeriod.start === day.endTime
                                ? "text-red-600 dark:text-red-400"
                                : "text-purple-600 dark:text-purple-300"
                            }>
                              {formatTime(afternoonPeriod.start)}
                            </span>
                            <span className="text-purple-600 dark:text-purple-300">-</span>
                            <span className={
                              afternoonPeriod.end === day.startTime || afternoonPeriod.end === day.endTime
                                ? "text-red-600 dark:text-red-400"
                                : "text-purple-600 dark:text-purple-300"
                            }>
                              {formatTime(afternoonPeriod.end)}
                            </span>
                          </>
                        ) : null}
                      </div>
                      
                      {/* 超出的下午工作時間 - 晚於17:30的時間，或假日的結束時間 */}
                      <div className="text-xs font-mono text-red-600 dark:text-red-400 text-center">
                        {(() => {
                          // 假日邏輯：工時為0且有結束時間且沒有開始時間時，只顯示晚於08:30的結束時間（早於08:30的會顯示在左側）
                          if (day.hours === 0 && day.minutes === 0 && day.endTime && !day.startTime && day.endTime > '08:30') {
                            return formatTime(day.endTime)
                          }
                          // 原有邏輯：超出下午工作時間
                          if ((day.startTime && day.startTime >= '17:30') || (day.endTime && day.endTime > '17:30')) {
                            return formatTime(day.startTime && day.startTime >= '17:30' ? day.startTime : day.endTime)
                          }
                          return null
                        })()}
                      </div>
                      
                      {/* 總工時 - 最右側，固定格式為X時Y分 */}
                      <span className="text-sm text-purple-700 dark:text-purple-200 justify-self-end">
                        {day.hours}時{day.minutes}分
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 詳細統計卡片 - 第二行，三個統計卡片 */}
        <div className="space-y-3">
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
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  className={`p-3 bg-green-50 rounded-lg transition-colors dark:bg-green-400/25 min-h-16 flex flex-col justify-center ${
                    hasCalculation 
                      ? 'cursor-pointer hover:bg-green-100 dark:hover:bg-green-400/35' 
                      : 'cursor-not-allowed'
                  } ${selectedCardType === 'workdays' ? 'ring-2 ring-green-400' : ''}`}
                  onClick={() => hasCalculation && onCardClick?.('workdays')}
                >
                  <div className="text-base font-bold text-green-700 dark:text-green-200">
                    {hasCalculation ? currentDetails.workdays : '—'}
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-300">
                    工作天{hasCalculation && currentDetails.customWorkdays > 0 && <span className="text-blue-600 dark:text-blue-300">(含補班)</span>}
                  </div>
                </div>
              </TooltipTrigger>
              {hasCalculation && currentDetails.customWorkdays > 0 && (
                <TooltipContent side="top" className="max-w-xs bg-background/80 backdrop-blur-sm border border-border/50">
                  <div className="space-y-1">
                    <div className="text-xs font-medium mb-2">含補班：共{currentDetails.customWorkdays}日</div>
                    {currentDetails.customWorkdaysList.map((day, index) => (
                      <div key={`${day.date}-${index}`} className="text-xs bg-sky-50 text-sky-600 px-2 py-1 rounded dark:bg-sky-400/25 dark:text-sky-200">
                        {formatDate(day.date)} {day.name}
                      </div>
                    ))}
                  </div>
                </TooltipContent>
              )}
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  className={`p-3 bg-red-50 rounded-lg transition-colors dark:bg-red-400/25 min-h-16 flex flex-col justify-center ${
                    hasCalculation 
                      ? 'cursor-pointer hover:bg-red-100 dark:hover:bg-red-400/35' 
                      : 'cursor-not-allowed'
                  } ${(selectedCardType === 'weekends' || selectedCardType === 'customHolidays') ? 'ring-2 ring-red-400' : ''}`}
                  onClick={() => hasCalculation && onCardClick?.('weekends')}
                >
                  <div className="text-base font-bold text-red-700 dark:text-red-200">
                    {hasCalculation ? currentDetails.holidays : '—'}
                  </div>
                  <div className="text-xs text-red-600 dark:text-red-300">
                    假日{hasCalculation && currentDetails.customHolidays > 0 && <span className="text-orange-600 dark:text-orange-300">(含放假)</span>}
                  </div>
                </div>
              </TooltipTrigger>
              {hasCalculation && currentDetails.customHolidays > 0 && (
                <TooltipContent side="top" className="max-w-xs bg-background/80 backdrop-blur-sm border border-border/50">
                  <div className="space-y-1">
                    <div className="text-xs font-medium mb-2">含放假：共{currentDetails.customHolidays}日</div>
                    {currentDetails.customHolidaysList.map((day, index) => (
                      <div key={`${day.date}-${index}`} className="text-xs bg-orange-50 text-orange-600 px-2 py-1 rounded dark:bg-orange-400/25 dark:text-orange-200">
                        {formatDate(day.date)} {day.name}
                      </div>
                    ))}
                  </div>
                </TooltipContent>
              )}
            </Tooltip>
          </div>
        </div>

      </CardContent>
    </Card>
  )
}