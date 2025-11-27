'use client'

import React, { useRef, useEffect } from 'react'

interface TimePickerClockProps {
  selectedTime: string
  onTimeChange: (time: string) => void
  className?: string
}

export function TimePickerClock({ selectedTime, onTimeChange, className }: TimePickerClockProps) {
  const hourScrollRef = useRef<HTMLDivElement>(null)
  const minuteScrollRef = useRef<HTMLDivElement>(null)

  // 解析時間為小時和分鐘
  const parseTime = (time: string) => {
    if (!time) return { hour: '00', minute: '00' }
    const [hour, minute] = time.split(':')
    return { 
      hour: hour && hour !== '' ? hour : '00', 
      minute: minute && minute !== '' ? minute : '00' 
    }
  }

  const { hour, minute } = parseTime(selectedTime)

  // 生成小時選項 (00-23)
  const hourOptions = Array.from({ length: 24 }, (_, i) => {
    return i.toString().padStart(2, '0')
  })

  // 生成分鐘選項 (00-59)
  const minuteOptions = Array.from({ length: 60 }, (_, i) => {
    return i.toString().padStart(2, '0')
  })

  // 處理小時變更
  const handleHourChange = (newHour: string) => {
    const newTime = `${newHour}:${minute}`
    onTimeChange(newTime)
  }

  // 處理分鐘變更
  const handleMinuteChange = (newMinute: string) => {
    const newTime = `${hour}:${newMinute}`
    onTimeChange(newTime)
  }

  // 自動滾動到選中的項目
  useEffect(() => {
    if (hourScrollRef.current) {
      const selectedElement = hourScrollRef.current.querySelector('[data-selected="true"]')
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'center', behavior: 'auto' })
      }
    }
  }, [])

  useEffect(() => {
    if (minuteScrollRef.current) {
      const selectedElement = minuteScrollRef.current.querySelector('[data-selected="true"]')
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'center', behavior: 'auto' })
      }
    }
  }, [])

  return (
    <div className={className}>
      <div className="flex gap-2 h-[240px]">
        {/* 小時選擇 */}
        <div className="flex-1 flex flex-col">
          <div className="text-center text-sm text-muted-foreground mb-2">小時</div>
          <div 
            ref={hourScrollRef}
            className="flex-1 overflow-y-auto border border-border rounded-md bg-secondary/30"
          >
            {hourOptions.map((h) => {
              const isSelected = h === hour
              return (
                <button
                  key={h}
                  data-selected={isSelected}
                  onClick={() => handleHourChange(h)}
                  className={`w-full py-1.5 px-2 text-center transition-colors hover:bg-accent ${ 
                    isSelected 
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                      : 'text-foreground'
                  }`}
                >
                  {h}
                </button>
              )
            })}
          </div>
        </div>

        {/* 分鐘選擇 */}
        <div className="flex-1 flex flex-col">
          <div className="text-center text-sm text-muted-foreground mb-2">分鐘</div>
          <div 
            ref={minuteScrollRef}
            className="flex-1 overflow-y-auto border border-border rounded-md bg-secondary/30"
          >
            {minuteOptions.map((m) => {
              const isSelected = m === minute
              return (
                <button
                  key={m}
                  data-selected={isSelected}
                  onClick={() => handleMinuteChange(m)}
                  className={`w-full py-1.5 px-2 text-center transition-colors hover:bg-accent ${
                    isSelected 
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                      : 'text-foreground'
                  }`}
                >
                  {m}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}