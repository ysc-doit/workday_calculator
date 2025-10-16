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
import { getDayStatus, WorkdayCalculationDetails } from '../utils/workday-helpers'

interface PrintableCalendarProps {
  calculationRange?: {
    startDate: string
    endDate: string
    startTime?: string
    endTime?: string
  }
  calculationDetails?: WorkdayCalculationDetails
  selectedCardType?: string
  customDays: CustomDayWithId[]
}

export const PrintableCalendar: React.FC<PrintableCalendarProps> = ({
  calculationRange,
  calculationDetails,
  selectedCardType,
  customDays
}) => {
  if (!calculationRange || !selectedCardType) {
    return null
  }

  const startDate = parseISO(calculationRange.startDate)
  const endDate = parseISO(calculationRange.endDate)
  
  // 獲取範圍內的所有月份
  const months = eachMonthOfInterval({ start: startDate, end: endDate })

  const generateCalendarDays = (monthDate: Date) => {
    const monthStart = startOfMonth(monthDate)
    const monthEnd = endOfMonth(monthDate)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

    const days = []
    let day = calendarStart

    while (day <= calendarEnd) {
      days.push(day)
      day = addDays(day, 1)
    }

    return days
  }

  const getDaySequenceNumber = (day: Date): number | null => {
    const { startDate: rangeStart, endDate: rangeEnd } = calculationRange
    
    try {
      const start = parseISO(rangeStart)
      const end = parseISO(rangeEnd)
      
      // 統一時間為當日開始時間進行比較
      const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate())
      const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate())
      const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate())
      
      // 檢查日期是否在範圍內
      if (dayStart < startDay || dayStart > endDay) {
        return null
      }
      
      const dayStatus = getDayStatus(day, customDays)
      
      // 根據選中卡片類型決定要顯示序號的日期類型
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
      
      // 計算序號
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

  const getCardTypeTitle = (): string => {
    switch (selectedCardType) {
      case 'totalDays':
        return '日曆天'
      case 'workdays':
        return '工作天'
      case 'weekends':
        return '假日'
      case 'customHolidays':
        return '自訂假日'
      case 'workHours':
        return '工作時數'
      default:
        return ''
    }
  }

  const weekDays = ['日', '一', '二', '三', '四', '五', '六']

  return (
    <div style={{ 
      backgroundColor: 'white', 
      color: 'black',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* 標題 */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 10px 0' }}>
          工作天計算機 - {getCardTypeTitle()}月曆
        </h1>
        <p style={{ fontSize: '16px', margin: '0' }}>
          計算期間：{format(startDate, 'yyyy年MM月dd日', { locale: zhTW })} 至 {format(endDate, 'yyyy年MM月dd日', { locale: zhTW })}
        </p>
        {calculationRange.startTime && calculationRange.endTime && (
          <p style={{ fontSize: '14px', margin: '5px 0 0 0', color: '#666' }}>
            時間範圍：{calculationRange.startTime} - {calculationRange.endTime}
          </p>
        )}
      </div>

      {/* 月曆 */}
      {months.map((month, monthIndex) => {
        const days = generateCalendarDays(month)
        
        return (
          <div 
            key={month.toString()} 
            style={{ 
              marginBottom: monthIndex < months.length - 1 ? '40px' : '20px',
              pageBreakInside: 'avoid'
            }}
          >
            {/* 月份標題 */}
            <h2 style={{ 
              fontSize: '20px', 
              fontWeight: 'bold', 
              textAlign: 'center', 
              margin: '0 0 20px 0' 
            }}>
              {format(month, 'yyyy年 MM月', { locale: zhTW })}
            </h2>

            {/* 星期標題 */}
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              border: '2px solid #000'
            }}>
              <thead>
                <tr>
                  {weekDays.map((day, index) => (
                    <th 
                      key={day} 
                      style={{
                        border: '1px solid #000',
                        padding: '8px',
                        textAlign: 'center',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        backgroundColor: index === 0 || index === 6 ? '#f5f5f5' : '#fff'
                      }}
                    >
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* 按週分組渲染日期 */}
                {Array.from({ length: Math.ceil(days.length / 7) }, (_, weekIndex) => (
                  <tr key={weekIndex}>
                    {days.slice(weekIndex * 7, (weekIndex + 1) * 7).map((day, dayIndex) => {
                      const dayStatus = getDayStatus(day, customDays)
                      const isCurrentMonth = isSameMonth(day, month)
                      const sequenceNumber = getDaySequenceNumber(day)
                      
                      // 檢查是否為開始或結束日期
                      const dayString = format(day, 'yyyy-MM-dd')
                      const isStartDate = calculationRange?.startDate === dayString
                      const isEndDate = calculationRange?.endDate === dayString
                      
                      // 檢查是否為工時計算模式並獲取當日工時
                      const isWorkHoursMode = calculationRange?.startTime && calculationRange?.endTime
                      const dayWorkHours = isWorkHoursMode ? calculationDetails?.workingDaysDetails?.find(d => d.date === dayString) : null
                      
                      // 邊界時間顯示
                      const showBoundaryTime = isWorkHoursMode && ((isStartDate && calculationRange?.startTime) || (isEndDate && calculationRange?.endTime))
                      const boundaryTimeToShow = isStartDate ? calculationRange?.startTime : calculationRange?.endTime
                      
                      let backgroundColor = '#fff'
                      if (dayStatus.type === 'workday') {
                        backgroundColor = dayStatus.isCustom ? '#e0f2fe' : '#e8f5e8'
                      } else {
                        backgroundColor = dayStatus.isCustom ? '#fff3e0' : '#ffebee'
                      }
                      
                      if (sequenceNumber) {
                        switch (selectedCardType) {
                          case 'totalDays':
                            backgroundColor = '#f5f5f5'
                            break
                          case 'workdays':
                            backgroundColor = '#e8f5e8'
                            break
                          case 'weekends':
                            backgroundColor = '#ffebee'
                            break
                          case 'customHolidays':
                            backgroundColor = '#fff3e0'
                            break
                          case 'workHours':
                            backgroundColor = '#f3e5f5'
                            break
                        }
                      }

                      return (
                        <td 
                          key={`${day.toString()}-${dayIndex}`}
                          style={{
                            border: '1px solid #000',
                            padding: '4px',
                            textAlign: 'center',
                            verticalAlign: 'top',
                            height: '100px',
                            minHeight: '100px',
                            maxHeight: '100px',
                            backgroundColor,
                            opacity: isCurrentMonth ? 1 : 0.3,
                            position: 'relative',
                            overflow: 'hidden'
                          }}
                        >
                          {/* 日期數字 */}
                          <div style={{ 
                            fontSize: '14px', 
                            fontWeight: 'bold',
                            marginBottom: '2px'
                          }}>
                            {format(day, 'd')}
                          </div>
                          
                          {/* 序號 */}
                          {sequenceNumber && (
                            <div style={{ 
                              fontSize: '10px',
                              backgroundColor: '#000',
                              color: '#fff',
                              borderRadius: '50%',
                              width: '16px',
                              height: '16px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              margin: '0 auto 2px auto',
                              fontWeight: 'bold'
                            }}>
                              {sequenceNumber}
                            </div>
                          )}
                          
                          {/* 邊界時間 */}
                          {showBoundaryTime && boundaryTimeToShow && (
                            <div style={{ 
                              fontSize: '10px',
                              backgroundColor: '#ff5722',
                              color: '#fff',
                              padding: '2px 4px',
                              borderRadius: '3px',
                              margin: '2px auto',
                              display: 'inline-block'
                            }}>
                              {boundaryTimeToShow.substring(0, 5)}
                            </div>
                          )}
                          
                          {/* 工時資訊 */}
                          {dayWorkHours && (dayWorkHours.hours > 0 || dayWorkHours.minutes > 0) && (
                            <div style={{ 
                              fontSize: '10px',
                              backgroundColor: '#9c27b0',
                              color: '#fff',
                              padding: '2px 4px',
                              borderRadius: '3px',
                              margin: '2px auto',
                              display: 'inline-block'
                            }}>
                              {dayWorkHours.hours > 0 && `${dayWorkHours.hours}時`}{dayWorkHours.minutes > 0 && `${dayWorkHours.minutes}分`}
                            </div>
                          )}
                          
                          {/* 節日名稱 */}
                          {dayStatus.name && (
                            <div style={{ 
                              fontSize: '10px',
                              lineHeight: '1.3',
                              marginTop: '3px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              wordBreak: 'break-all'
                            }}>
                              {dayStatus.name}
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      })}

      {/* 圖例 */}
      <div style={{ 
        marginTop: '30px', 
        fontSize: '12px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '15px',
        justifyContent: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ 
            width: '16px', 
            height: '16px', 
            backgroundColor: '#e8f5e8', 
            border: '1px solid #4caf50',
            borderRadius: '2px'
          }}></div>
          <span>工作日</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ 
            width: '16px', 
            height: '16px', 
            backgroundColor: '#e0f2fe', 
            border: '1px solid #2196f3',
            borderRadius: '2px'
          }}></div>
          <span>自訂補班</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ 
            width: '16px', 
            height: '16px', 
            backgroundColor: '#ffebee', 
            border: '1px solid #f44336',
            borderRadius: '2px'
          }}></div>
          <span>例假日</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ 
            width: '16px', 
            height: '16px', 
            backgroundColor: '#fff3e0', 
            border: '1px solid #ff9800',
            borderRadius: '2px'
          }}></div>
          <span>自訂假日</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ 
            width: '16px', 
            height: '16px', 
            backgroundColor: '#000', 
            borderRadius: '50%'
          }}></div>
          <span>{getCardTypeTitle()}序號</span>
        </div>
      </div>

      {/* 統計資訊 */}
      {calculationDetails && (
        <div style={{ 
          marginTop: '20px', 
          fontSize: '14px',
          textAlign: 'center',
          padding: '15px',
          border: '1px solid #000',
          backgroundColor: '#f9f9f9'
        }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>計算結果統計</h3>
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '20px' }}>
            <span>總日數：{calculationDetails.totalDays}天</span>
            <span>工作天：{calculationDetails.workdays}天</span>
            <span>假日：{calculationDetails.holidays}天</span>
            {calculationDetails.workHours !== undefined && (
              <span>工作時數：{calculationDetails.workHours}時{calculationDetails.workMinutes}分</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}