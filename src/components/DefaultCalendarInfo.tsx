import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible'
import { ChevronDown, Calendar, Info } from 'lucide-react'
import { getDefaultHolidays, getDefaultWorkdays, getDefaultCalendarSettingsCount } from '../data/default-calendar'
import { format, parseISO } from 'date-fns'
import { zhTW } from 'date-fns/locale'

export function DefaultCalendarInfo() {
  const [isOpen, setIsOpen] = useState(false)
  
  const defaultHolidays = getDefaultHolidays()
  const defaultWorkdays = getDefaultWorkdays()
  const totalCount = getDefaultCalendarSettingsCount()

  const formatDateDisplay = (dateStr: string) => {
    try {
      const date = parseISO(dateStr)
      return format(date, 'yyyy年MM月dd日 (E)', { locale: zhTW })
    } catch {
      return dateStr
    }
  }

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span>預設日曆設定</span>
                <Badge variant="secondary">{totalCount} 項</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-muted-foreground" />
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </div>
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>💡 說明：</strong>以下是所有使用者共用的預設日曆設定，包含國定假日和補班日。發布後所有人都會看到相同的基礎設定，您仍可在此基礎上新增個人自訂設定。
              </p>
            </div>

            <div className="space-y-6">
              {/* 假日列表 */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-100 border border-orange-200 rounded dark:bg-orange-400/20 dark:border-orange-400/40"></div>
                  預設假日 ({defaultHolidays.length} 項)
                </h4>
                <div className="grid gap-2 sm:grid-cols-2">
                  {defaultHolidays.map((holiday) => (
                    <div key={holiday.id} className="p-3 bg-orange-50/50 dark:bg-orange-400/10 rounded-lg border border-orange-200/60 dark:border-orange-400/20">
                      <div className="font-medium text-orange-700 dark:text-orange-300">
                        {holiday.name}
                      </div>
                      <div className="text-xs text-orange-600/80 dark:text-orange-400/80 mt-1">
                        {formatDateDisplay(holiday.date)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 補班日列表 */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <div className="w-3 h-3 bg-sky-100 border border-sky-200 rounded dark:bg-sky-400/20 dark:border-sky-400/40"></div>
                  預設補班日 ({defaultWorkdays.length} 項)
                </h4>
                <div className="grid gap-2 sm:grid-cols-2">
                  {defaultWorkdays.map((workday) => (
                    <div key={workday.id} className="p-3 bg-sky-50/50 dark:bg-sky-400/10 rounded-lg border border-sky-200/60 dark:border-sky-400/20">
                      <div className="font-medium text-sky-700 dark:text-sky-300">
                        {workday.name}
                      </div>
                      <div className="text-xs text-sky-600/80 dark:text-sky-400/80 mt-1">
                        {formatDateDisplay(workday.date)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-800 dark:text-green-200">
                <strong>✅ 發布效果：</strong>當您發布此應用後，所有使用者都會自動看到這 {totalCount} 項預設設定，無需額外配置。使用者可以在此基礎上新增自己的個人設定。
              </p>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}