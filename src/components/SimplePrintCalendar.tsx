'use client'

import React from 'react'
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  addDays, 
  isSameMonth,
  parseISO,
  eachMonthOfInterval
} from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { CustomDayWithId } from '../types/workday'
import { getDayStatus, WorkdayCalculationDetails, formatWorkTime } from '../utils/workday-helpers'

interface SimplePrintCalendarProps {
  calculationRange: {
    startDate: string
    endDate: string
    startTime?: string
    endTime?: string
  }
  calculationDetails?: WorkdayCalculationDetails
  selectedCardType: string
  customDays: CustomDayWithId[]
  calculationMode?: 'inputDays' | 'inputRange' | 'calculateHours'
  calculationType?: 'workdays' | 'calendarDays'
  inclusionMode?: 'current' | 'next'
}

export const generatePrintableHTML = ({
  calculationRange,
  calculationDetails,
  selectedCardType,
  customDays,
  calculationMode,
  calculationType,
  inclusionMode
}: SimplePrintCalendarProps): string => {
  const startDate = parseISO(calculationRange.startDate)
  const endDate = parseISO(calculationRange.endDate)
  const months = eachMonthOfInterval({ start: startDate, end: endDate })

  const getCardTypeTitle = (): string => {
    switch (selectedCardType) {
      case 'totalDays': return '日曆天'
      case 'workdays': return '工作天'
      case 'weekends': return '假日'
      case 'customHolidays': return '自訂假日'
      case 'workHours': return '工作時數'
      default: return ''
    }
  }

  const calculateSequenceNumber = (day: Date): number | null => {
    try {
      const start = parseISO(calculationRange.startDate)
      const end = parseISO(calculationRange.endDate)
      
      const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate())
      const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate())
      const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate())
      
      if (dayStart < startDay || dayStart > endDay) {
        return null
      }
      
      const dayStatus = getDayStatus(day, customDays)
      
      let shouldShowSequence = false
      switch (selectedCardType) {
        case 'totalDays':
          shouldShowSequence = true
          break
        case 'workdays':
          shouldShowSequence = dayStatus.type === 'workday'
          break
        case 'weekends':
          shouldShowSequence = dayStatus.type === 'holiday'
          break
        case 'customHolidays':
          shouldShowSequence = dayStatus.type === 'holiday' && dayStatus.isCustom
          break
        case 'workHours':
          shouldShowSequence = dayStatus.type === 'workday'
          break
        default:
          return null
      }
      
      if (!shouldShowSequence) {
        return null
      }
      
      let count = 0
      let currentDay = new Date(startDay)
      
      while (currentDay <= dayStart) {
        const currentDayStatus = getDayStatus(currentDay, customDays)
        let shouldCount = false
        
        switch (selectedCardType) {
          case 'totalDays':
            shouldCount = true
            break
          case 'workdays':
            shouldCount = currentDayStatus.type === 'workday'
            break
          case 'weekends':
            shouldCount = currentDayStatus.type === 'holiday'
            break
          case 'customHolidays':
            shouldCount = currentDayStatus.type === 'holiday' && currentDayStatus.isCustom
            break
          case 'workHours':
            shouldCount = currentDayStatus.type === 'workday'
            break
        }
        
        if (shouldCount) {
          count++
        }
        
        if (currentDay.getTime() === dayStart.getTime()) {
          return count
        }
        
        currentDay = addDays(currentDay, 1)
      }
      
    } catch (error) {
      console.error('Error calculating sequence number:', error)
    }
    
    return null
  }

  const formatDate = (dateStr: string) => {
    try {
      const date = parseISO(dateStr)
      return format(date, 'yyyy/MM/dd (E)', { locale: zhTW })
    } catch {
      return dateStr
    }
  }

  const formatTime = (time: string) => {
    return time.substring(0, 5)
  }

  // 生成輸入區塊HTML（簡潔版）
  const generateInputSectionHTML = (): string => {
    // 當選擇「次日起算」時，startDate 已經是調整後的日期（次日），需要回推一天顯示原始輸入日期
    const displayStartDate = (calculationMode === 'inputDays' && inclusionMode === 'next') 
      ? addDays(startDate, -1) 
      : startDate
    
    return `
      <div style="margin-bottom: 20px;">
        ${calculationMode === 'inputDays' ? `
          <div style="font-size: 16px; color: #1f2937; margin-bottom: 8px;">
            輸入日期：${format(displayStartDate, 'yyyy/MM/dd')} ${inclusionMode === 'next' ? '次日起算' : '當日起算'}
          </div>
          <div style="font-size: 16px; color: #1f2937; margin-bottom: 8px;">
            輸入天數：${calculationType === 'workdays' ? calculationDetails?.workdays || '—' : calculationDetails?.totalDays || '—'} ${calculationType === 'workdays' ? '工作天' : '日曆天'}
          </div>
        ` : calculationMode === 'inputRange' ? `
          <div style="font-size: 16px; color: #1f2937; margin-bottom: 8px;">
            開始日期：${format(startDate, 'yyyy/MM/dd')}
          </div>
          <div style="font-size: 16px; color: #1f2937; margin-bottom: 8px;">
            結束日期：${format(endDate, 'yyyy/MM/dd')}
          </div>
        ` : calculationMode === 'calculateHours' ? `
          <div style="font-size: 16px; color: #1f2937; margin-bottom: 8px;">
            開始日期時間：${format(startDate, 'yyyy/MM/dd')}${calculationRange.startTime ? ` ${formatTime(calculationRange.startTime)}` : ''}
          </div>
          <div style="font-size: 16px; color: #1f2937; margin-bottom: 8px;">
            結束日期時間：${format(endDate, 'yyyy/MM/dd')}${calculationRange.endTime ? ` ${formatTime(calculationRange.endTime)}` : ''}
          </div>
        ` : ''}
      </div>
    `
  }

  // 生成結果區塊HTML（簡潔版）
  const generateResultSectionHTML = (): string => {
    if (!calculationDetails) return ''

    return `
      <div style="margin-bottom: 20px;">
        <div style="font-size: 16px; color: #1f2937; margin-bottom: 8px;">
          計算結果：${calculationMode === 'inputDays' && calculationRange.endDate ? formatDate(calculationRange.endDate) :
            calculationMode === 'inputRange' ? `${calculationDetails.workdays} 個工作天` :
            calculationMode === 'calculateHours' ? formatWorkTime(calculationDetails.workHours || 0, calculationDetails.workMinutes || 0) :
            '—'}
        </div>
      </div>
    `
  }

  // 生成詳細資訊區塊HTML（保留於日曆下方）
  const generateDetailsHTML = (): string => {
    if (!calculationDetails) return ''

    return `
      <div style="margin-bottom: 32px;">
        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
          <!-- 日曆天 -->
          <div style="
            padding: 8px 16px; 
            background-color: #f8fafc; 
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            display: inline-flex;
            align-items: center;
            gap: 6px;
          ">
            <span style="font-size: 16px; font-weight: bold; color: #475569;">
              ${calculationDetails.totalDays}
            </span>
            <span style="font-size: 13px; color: #64748b;">
              日曆天
            </span>
          </div>

          <!-- 工作天 -->
          <div style="
            padding: 8px 16px; 
            background-color: #f0fdf4; 
            border: 1px solid #bbf7d0;
            border-radius: 6px;
            display: inline-flex;
            align-items: center;
            gap: 6px;
          ">
            <span style="font-size: 16px; font-weight: bold; color: #15803d;">
              ${calculationDetails.workdays}
            </span>
            <span style="font-size: 13px; color: #16a34a;">
              工作天${calculationDetails.customWorkdays > 0 ? '<span style="font-size: 11px;">(含補班)</span>' : ''}
            </span>
          </div>

          <!-- 假日 -->
          <div style="
            padding: 8px 16px; 
            background-color: #fef2f2; 
            border: 1px solid #fecaca;
            border-radius: 6px;
            display: inline-flex;
            align-items: center;
            gap: 6px;
          ">
            <span style="font-size: 16px; font-weight: bold; color: #dc2626;">
              ${calculationDetails.holidays}
            </span>
            <span style="font-size: 13px; color: #ef4444;">
              假日${calculationDetails.customHolidays > 0 ? '<span style="font-size: 11px;">(含放假)</span>' : ''}
            </span>
          </div>
        </div>
      </div>
    `
  }

  // 生成圖例HTML（僅第一頁使用）
  const generateLegendHTML = (): string => {
    return `
      <div style="margin-top: 16px;">
        <div style="display: flex; flex-wrap: wrap; gap: 16px; font-size: 11px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <div style="
              width: 16px; 
              height: 16px; 
              background-color: #f0fdf4; 
              border: 1px solid #bbf7d0;
              border-radius: 3px;
            "></div>
            <span style="color: #374151;">工作日</span>
          </div>
          
          <div style="display: flex; align-items: center; gap: 6px;">
            <div style="
              width: 16px; 
              height: 16px; 
              background-color: #e0f2fe; 
              border-radius: 3px;
            "></div>
            <span style="color: #374151;">自訂補班</span>
          </div>
          
          <div style="display: flex; align-items: center; gap: 6px;">
            <div style="
              width: 16px; 
              height: 16px; 
              background-color: #fef2f2; 
              border: 1px solid #fecaca;
              border-radius: 3px;
            "></div>
            <span style="color: #374151;">例假日</span>
          </div>
          
          <div style="display: flex; align-items: center; gap: 6px;">
            <div style="
              width: 16px; 
              height: 16px; 
              background-color: #fff7ed; 
              border-radius: 3px;
            "></div>
            <span style="color: #374151;">自訂假日</span>
          </div>
        </div>
      </div>
    `
  }

  // 生成月曆HTML（緊湊版）
  const generateCalendarHTML = (month: Date, isFullPage: boolean = false): string => {
    const monthStart = startOfMonth(month)
    const monthEnd = endOfMonth(month)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

    const days = []
    let day = calendarStart
    while (day <= calendarEnd) {
      days.push(day)
      day = addDays(day, 1)
    }

    const weekDayNames = ['日', '一', '二', '三', '四', '五', '六']
    
    // 調整格子高度以充分利用A4空間
    const cellHeight = isFullPage ? '65px' : '50px'  // 增加高度讓內容完整顯示
    const titleSize = isFullPage ? '16px' : '14px'    // 調整標題大小
    const dayFontSize = isFullPage ? '12px' : '11px'  // 調整日期字體
    const sequenceFontSize = isFullPage ? '9px' : '8px'  // 調整序號字體
    const sequenceSize = isFullPage ? '18px' : '16px'    // 調整序號圓圈大小
    const marginBottom = isFullPage ? '20px' : '16px'    // 調整月曆間距
    const titleMargin = isFullPage ? '10px' : '8px'       // 調整標題間距

    let calendarHTML = `
      <div style="margin-bottom: ${marginBottom}; page-break-inside: avoid;">
        <h3 style="text-align: center; margin: 0 0 ${titleMargin} 0; font-size: ${titleSize}; font-weight: bold;">
          ${format(month, 'yyyy年 MM月', { locale: zhTW })}
        </h3>

        <div style="
          display: grid; 
          grid-template-columns: repeat(7, 1fr); 
          gap: 1px; 
          border: 1px solid #d1d5db; 
          border-radius: 6px; 
          overflow: hidden;
          background-color: #f9fafb;
          padding: 1px;
        ">
          ${weekDayNames.map((dayName, index) => `
            <div style="
              background-color: ${index === 0 || index === 6 ? '#f3f4f6' : '#ffffff'}; 
              padding: ${isFullPage ? '6px' : '4px'}; 
              text-align: center; 
              font-size: ${isFullPage ? '11px' : '11px'}; 
              font-weight: 500;
              color: ${index === 0 || index === 6 ? '#6b7280' : '#374151'};
              border-radius: 2px;
              margin: 0.5px;
            ">
              ${dayName}
            </div>
          `).join('')}
          
          ${days.map((day) => {
            const dayStatus = getDayStatus(day, customDays)
            const isCurrentMonth = isSameMonth(day, month)
            const sequenceNumber = calculateSequenceNumber(day)
            
            const dayString = format(day, 'yyyy-MM-dd')
            const isStartDate = calculationRange.startDate === dayString
            const isEndDate = calculationRange.endDate === dayString
            
            const isWorkHoursMode = calculationRange.startTime && calculationRange.endTime
            const dayWorkHours = isWorkHoursMode ? calculationDetails?.workingDaysDetails?.find(d => d.date === dayString) : null
            
            const showBoundaryTime = isWorkHoursMode && ((isStartDate && calculationRange.startTime) || (isEndDate && calculationRange.endTime))
            const boundaryTimeToShow = isStartDate ? calculationRange.startTime : calculationRange.endTime
            
            let backgroundColor = '#ffffff'
            let borderColor = 'transparent'
            
            if (isCurrentMonth) {
              if (dayStatus.type === 'workday') {
                backgroundColor = dayStatus.isCustom ? '#e0f2fe' : '#f0fdf4'
              } else {
                backgroundColor = dayStatus.isCustom ? '#fff7ed' : '#fef2f2'
              }
            } else {
              backgroundColor = '#f3f4f6'
            }
            
            if (sequenceNumber) {
              borderColor = selectedCardType === 'totalDays' ? '#64748b' :
                          selectedCardType === 'workdays' ? '#22c55e' :
                          selectedCardType === 'weekends' ? '#ef4444' :
                          selectedCardType === 'customHolidays' ? '#f97316' :
                          selectedCardType === 'workHours' ? '#a855f7' :
                          '#22c55e'
            }

            const displayName = dayStatus.name ? 
              (dayStatus.name.length > 4 ? dayStatus.name.substring(0, 4) + '..' : dayStatus.name) : ''

            return `
              <div style="
                background-color: ${backgroundColor}; 
                padding: ${isFullPage ? '4px 2px' : '3px 2px'}; 
                text-align: center; 
                height: ${cellHeight}; 
                min-height: ${cellHeight}; 
                max-height: ${cellHeight}; 
                display: flex; 
                flex-direction: column; 
                justify-content: flex-start;
                opacity: ${isCurrentMonth ? 1 : 0.6};
                position: relative;
                border-radius: 2px;
                margin: 0.5px;
                overflow: hidden;
                ${sequenceNumber ? `border: 1.5px solid ${borderColor};` : ''}
              ">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: ${isFullPage ? '2px' : '2px'};">
                  <span style="
                    font-size: ${dayFontSize}; 
                    font-weight: ${isCurrentMonth ? '500' : '400'}; 
                    color: ${isCurrentMonth ? '#1f2937' : '#6b7280'};
                  ">
                    ${format(day, 'd')}
                  </span>
                  ${sequenceNumber ? `
                    <span style="
                      font-size: ${sequenceFontSize}; 
                      background-color: ${
                        selectedCardType === 'totalDays' ? '#64748b' :
                        selectedCardType === 'workdays' ? '#22c55e' :
                        selectedCardType === 'weekends' ? '#ef4444' :
                        selectedCardType === 'customHolidays' ? '#f97316' :
                        selectedCardType === 'workHours' ? '#a855f7' :
                        '#22c55e'
                      }; 
                      color: white; 
                      border-radius: 50%; 
                      width: ${sequenceSize}; 
                      height: ${sequenceSize}; 
                      display: flex; 
                      align-items: center; 
                      justify-content: center; 
                      font-weight: 600;
                    ">
                      ${sequenceNumber}
                    </span>
                  ` : ''}
                </div>
                
                ${showBoundaryTime && boundaryTimeToShow ? `
                  <div style="margin-bottom: ${isFullPage ? '3px' : '2px'};">
                    <span style="
                      font-size: ${isFullPage ? '10px' : '8px'}; 
                      background-color: #ef4444; 
                      color: white; 
                      padding: ${isFullPage ? '3px 5px' : '2px 3px'}; 
                      border-radius: 3px;
                      font-weight: 500;
                    ">
                      ${boundaryTimeToShow.substring(0, 5)}
                    </span>
                  </div>
                ` : ''}
                
                ${dayWorkHours && (dayWorkHours.hours > 0 || dayWorkHours.minutes > 0) ? `
                  <div style="margin-bottom: ${isFullPage ? '3px' : '2px'};">
                    <span style="
                      font-size: ${isFullPage ? '10px' : '8px'}; 
                      background-color: #a855f7; 
                      color: white; 
                      padding: ${isFullPage ? '3px 5px' : '2px 3px'}; 
                      border-radius: 3px;
                      font-weight: 500;
                    ">
                      ${dayWorkHours.hours > 0 ? `${dayWorkHours.hours}h` : ''}${dayWorkHours.minutes > 0 ? `${dayWorkHours.minutes}m` : ''}
                    </span>
                  </div>
                ` : ''}
                
                ${displayName ? `
                  <div style="flex: 1; display: flex; align-items: flex-start; justify-content: center; margin-top: ${isFullPage ? '3px' : '2px'};">
                    <span style="
                      font-size: ${isFullPage ? '11px' : '9px'}; 
                      line-height: 1.3; 
                      text-align: center; 
                      word-break: break-all;
                      color: ${isCurrentMonth ? '#4b5563' : '#6b7280'};
                      font-weight: 400;
                    ">
                      ${displayName}
                    </span>
                  </div>
                ` : ''}
              </div>
            `
          }).join('')}
        </div>
      </div>
    `
    return calendarHTML
  }

  // 生成完整HTML
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>工作天計算機</title>
        <meta charset="utf-8">
        <style>
          @media print {
            body { margin: 0; }
            @page { 
              size: A4 portrait;
              margin: 1.5cm; 
            }
            .page-break {
              page-break-before: always;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
          body { 
            font-family: Arial, 'Microsoft JhengHei', sans-serif; 
            line-height: 1.6;
            background-color: white;
            color: #333;
            padding: 40px;
            font-size: 14px;
            max-width: 800px;
            margin: 0 auto;
          }
          * {
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
            print-color-adjust: exact;
          }
        </style>
      </head>
      <body>
        <div>
          <!-- 標題 -->
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="font-size: 24px; font-weight: bold; margin: 0; color: #1f2937;">
              工作天計算機
            </h1>
          </div>

          <!-- 輸入資訊 -->
          ${generateInputSectionHTML()}

          <!-- 計算結果 -->
          ${generateResultSectionHTML()}

          <!-- 詳細統計 -->
          ${generateDetailsHTML()}

          <!-- 第一個月曆 -->
          ${months.length > 0 ? generateCalendarHTML(months[0], true) : ''}
          
          <!-- 圖例 -->
          ${generateLegendHTML()}
        </div>

        <!-- 其他月份的日曆 -->
        ${months.length > 1 ? 
          Array.from({ length: Math.ceil((months.length - 1) / 2) }, (_, pageIndex) => {
            const monthsInPage = months.slice(1 + pageIndex * 2, 1 + (pageIndex + 1) * 2)
            return `
              <div class="page-break">
                ${monthsInPage.map(month => generateCalendarHTML(month, true)).join('')}
              </div>
            `
          }).join('') 
          : ''
        }
      </body>
    </html>
  `
}