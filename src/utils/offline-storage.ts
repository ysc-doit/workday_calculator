/**
 * 離線儲存管理工具
 * 當無法連接到 Supabase 時，提供本地儲存功能
 */

import { CustomDayWithId } from '../types/workday'

const STORAGE_KEYS = {
  CUSTOM_DAYS: 'workday-custom-days-v2',
  APP_SETTINGS: 'workday-app-settings',
  LAST_SYNC: 'workday-last-sync'
}

export interface AppSettings {
  preferredCalculationMode: 'range' | 'duration' | 'workhours'
  defaultWorkHours: {
    morning: { start: string, end: string }
    afternoon: { start: string, end: string }
  }
  lastUpdated: string
}

/**
 * 載入自訂工作日設定
 */
export const loadCustomDaysFromOfflineStorage = (): CustomDayWithId[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CUSTOM_DAYS)
    if (!stored) return []

    const data = JSON.parse(stored)
    if (!Array.isArray(data)) return []

    return data.map((item: any) => ({
      id: item.id || item.date,
      date: item.date,
      type: item.type,
      name: item.name,
      updatedAt: item.updatedAt || new Date().toISOString()
    }))
  } catch (error) {
    console.error('Error loading custom days from offline storage:', error)
    return []
  }
}

/**
 * 儲存自訂工作日設定
 */
export const saveCustomDaysToOfflineStorage = (customDays: CustomDayWithId[]): void => {
  try {
    const dataToStore = customDays.map(day => ({
      id: day.id,
      date: day.date,
      type: day.type,
      name: day.name,
      updatedAt: day.updatedAt
    }))
    
    localStorage.setItem(STORAGE_KEYS.CUSTOM_DAYS, JSON.stringify(dataToStore))
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString())
    
    console.log(`💾 已保存 ${customDays.length} 個自訂設定到本地存儲`)
  } catch (error) {
    console.error('Error saving custom days to offline storage:', error)
  }
}

/**
 * 載入應用設定
 */
export const loadAppSettings = (): AppSettings => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.APP_SETTINGS)
    if (!stored) {
      return getDefaultAppSettings()
    }

    const settings = JSON.parse(stored)
    return {
      ...getDefaultAppSettings(),
      ...settings
    }
  } catch (error) {
    console.error('Error loading app settings:', error)
    return getDefaultAppSettings()
  }
}

/**
 * 儲存應用設定
 */
export const saveAppSettings = (settings: Partial<AppSettings>): void => {
  try {
    const currentSettings = loadAppSettings()
    const newSettings = {
      ...currentSettings,
      ...settings,
      lastUpdated: new Date().toISOString()
    }
    
    localStorage.setItem(STORAGE_KEYS.APP_SETTINGS, JSON.stringify(newSettings))
  } catch (error) {
    console.error('Error saving app settings:', error)
  }
}

/**
 * 取得預設應用設定
 */
const getDefaultAppSettings = (): AppSettings => ({
  preferredCalculationMode: 'range',
  defaultWorkHours: {
    morning: { start: '08:30', end: '12:30' },
    afternoon: { start: '13:30', end: '17:30' }
  },
  lastUpdated: new Date().toISOString()
})

/**
 * 取得最後同步時間
 */
export const getLastSyncTime = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEYS.LAST_SYNC)
  } catch (error) {
    return null
  }
}

/**
 * 清除所有離線資料
 */
export const clearOfflineStorage = (): void => {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key)
    })
    console.log('🗑️ 已清除所有離線資料')
  } catch (error) {
    console.error('Error clearing offline storage:', error)
  }
}

/**
 * 取得儲存空間使用情況
 */
export const getStorageInfo = () => {
  try {
    const customDaysSize = (localStorage.getItem(STORAGE_KEYS.CUSTOM_DAYS) || '').length
    const settingsSize = (localStorage.getItem(STORAGE_KEYS.APP_SETTINGS) || '').length
    const lastSync = getLastSyncTime()
    
    return {
      customDaysCount: loadCustomDaysFromOfflineStorage().length,
      storageUsed: Math.round((customDaysSize + settingsSize) / 1024 * 100) / 100, // KB
      lastSync: lastSync ? new Date(lastSync).toLocaleString() : '從未同步'
    }
  } catch (error) {
    return {
      customDaysCount: 0,
      storageUsed: 0,
      lastSync: '無法取得'
    }
  }
}