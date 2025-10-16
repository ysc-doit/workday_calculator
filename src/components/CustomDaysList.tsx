'use client'

import React from 'react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Minus, Loader2 } from 'lucide-react'
import { CustomDayWithId } from '../types/workday'

interface CustomDaysListProps {
  customDays: CustomDayWithId[]
  onDelete: (date: string) => void
  loading: boolean
}

export function CustomDaysList({ customDays, onDelete, loading }: CustomDaysListProps) {
  if (customDays.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      <h4 className="font-medium">自訂日期列表</h4>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {customDays
          .sort((a, b) => a.date.localeCompare(b.date))
          .map((day) => (
            <div
              key={day.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                <Badge variant={day.type === 'workday' ? 'default' : 'secondary'}>
                  {day.type === 'workday' ? '補班' : '放假'}
                </Badge>
                <span className="font-medium">{day.date}</span>
                <span className="text-muted-foreground">{day.name}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={loading}
                onClick={() => onDelete(day.date)}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Minus className="w-4 h-4" />
                )}
              </Button>
            </div>
          ))}
      </div>
    </div>
  )
}