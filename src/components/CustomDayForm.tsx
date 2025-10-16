'use client'

import React from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Plus, Loader2 } from 'lucide-react'

interface CustomDayFormProps {
  newCustomDate: string
  setNewCustomDate: (date: string) => void
  newCustomName: string
  setNewCustomName: (name: string) => void
  newCustomType: 'holiday' | 'workday'
  setNewCustomType: (type: 'holiday' | 'workday') => void
  onSubmit: () => void
  loading: boolean
}

export function CustomDayForm({
  newCustomDate,
  setNewCustomDate,
  newCustomName,
  setNewCustomName,
  newCustomType,
  setNewCustomType,
  onSubmit,
  loading
}: CustomDayFormProps) {
  return (
    <div className="space-y-3">
      <h4 className="font-medium">新增自訂日期</h4>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <Label htmlFor="custom-date">日期</Label>
          <Input
            id="custom-date"
            type="date"
            value={newCustomDate}
            onChange={(e) => setNewCustomDate(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="custom-name">名稱</Label>
          <Input
            id="custom-name"
            placeholder="例：國慶日"
            value={newCustomName}
            onChange={(e) => setNewCustomName(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="custom-type">類型</Label>
          <select
            id="custom-type"
            className="w-full px-3 py-2 border border-input bg-input-background rounded-md"
            value={newCustomType}
            onChange={(e) => setNewCustomType(e.target.value as 'holiday' | 'workday')}
          >
            <option value="holiday">放假</option>
            <option value="workday">補班</option>
          </select>
        </div>
        <div className="flex items-end">
          <Button 
            onClick={onSubmit} 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1" />
            ) : (
              <Plus className="w-4 h-4 mr-1" />
            )}
            新增
          </Button>
        </div>
      </div>
    </div>
  )
}