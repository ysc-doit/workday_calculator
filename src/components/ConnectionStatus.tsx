'use client'

import React from 'react'
import { Cloud, CloudOff, Loader2, AlertCircle } from 'lucide-react'
import { Button } from './ui/button'

interface ConnectionStatusProps {
  apiConnected: boolean
  syncLoading: boolean
  onReconnect?: () => void
  retryCount?: number
}

export function ConnectionStatus({ 
  apiConnected, 
  syncLoading, 
  onReconnect,
  retryCount = 0
}: ConnectionStatusProps) {
  return (
    <div className="flex items-center gap-2">
      {syncLoading && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
      
      {apiConnected ? (
        <div className="flex items-center gap-1 text-green-600 text-sm">
          <Cloud className="w-4 h-4" />
          <span>已連線</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-orange-600 text-sm">
            <CloudOff className="w-4 h-4" />
            <span>離線模式</span>
            {retryCount > 0 && (
              <span className="text-xs text-muted-foreground">
                (重試 {retryCount}/3)
              </span>
            )}
          </div>
          {onReconnect && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onReconnect}
              disabled={syncLoading}
            >
              {syncLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                '重新連線'
              )}
            </Button>
          )}
        </div>
      )}
      
      {!apiConnected && !syncLoading && (
        <div className="flex items-center gap-1 text-amber-600">
          <AlertCircle className="w-3 h-3" />
        </div>
      )}
    </div>
  )
}