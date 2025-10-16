import { projectId, publicAnonKey } from './supabase/info'

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server`

interface CustomDay {
  date: string
  type: 'holiday' | 'workday'
  name: string
}

interface CustomDayWithId extends CustomDay {
  id: string
  updatedAt: string
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

class WorkdayAPI {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      // 設定5秒超時以避免長時間等待
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
          ...options.headers,
        },
      })

      clearTimeout(timeoutId)

      // 如果是 403 或 500+ 錯誤，直接切換到離線模式
      if (response.status === 403 || response.status >= 500) {
        throw new Error('服務暫時無法使用')
      }

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      return result
    } catch (error) {
      // 靜默處理錯誤以避免控制台混亂
      if (error.name === 'AbortError') {
        throw new Error('連線超時')
      }
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('無法連線')
      }
      
      throw new Error('服務暫時無法使用')
    }
  }

  async getCustomDays(): Promise<CustomDayWithId[]> {
    try {
      const result = await this.request<CustomDayWithId[]>('/custom-days')
      return result.data || []
    } catch (error) {
      // 靜默失敗，不顯示錯誤訊息
      throw error
    }
  }

  async saveCustomDay(customDay: CustomDay): Promise<CustomDayWithId> {
    try {
      const result = await this.request<CustomDayWithId>('/custom-days', {
        method: 'POST',
        body: JSON.stringify(customDay),
      })
      
      if (!result.success || !result.data) {
        throw new Error(result.error || '儲存失敗')
      }
      
      return result.data
    } catch (error) {
      // 靜默失敗，讓上層組件處理
      throw error
    }
  }

  async deleteCustomDay(date: string): Promise<void> {
    try {
      const result = await this.request(`/custom-days/${encodeURIComponent(date)}`, {
        method: 'DELETE',
      })
      
      if (!result.success) {
        throw new Error(result.error || '刪除失敗')
      }
    } catch (error) {
      // 靜默失敗，讓上層組件處理
      throw error
    }
  }

  async checkWorkdays(dates: string[]): Promise<Array<{
    date: string
    isWorkday: boolean
    isCustom: boolean
    customInfo?: CustomDay
  }>> {
    try {
      const result = await this.request<Array<{
        date: string
        isWorkday: boolean
        isCustom: boolean
        customInfo?: CustomDay
      }>>('/check-workdays', {
        method: 'POST',
        body: JSON.stringify({ dates }),
      })
      
      return result.data || []
    } catch (error) {
      console.error('Failed to check workdays:', error)
      throw new Error(`無法檢查工作日狀態: ${error.message}`)
    }
  }

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      // 使用更短的超時時間進行健康檢查
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)
      
      const response = await fetch(`${API_BASE_URL}/health`, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      })

      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const result = await response.json()
      return result.data || { status: 'ok', timestamp: new Date().toISOString() }
    } catch (error) {
      // 靜默處理健康檢查失敗
      throw new Error('服務暫時無法使用')
    }
  }

  async initTestData(): Promise<void> {
    try {
      const result = await this.request('/init-test-data', {
        method: 'POST',
      })
      
      if (!result.success) {
        throw new Error(result.error || '初始化測試資料失敗')
      }
    } catch (error) {
      console.error('Failed to init test data:', error)
      throw new Error(`無法初始化測試資料: ${error.message}`)
    }
  }
}

export const workdayAPI = new WorkdayAPI()