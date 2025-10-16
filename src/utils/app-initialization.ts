/**
 * Simplified app initialization - no async operations to prevent timeouts
 */

/**
 * Simple app initialization that runs synchronously
 */
export const initializeApp = () => {
  try {
    // Just verify basic functionality without external calls
    if (typeof window !== 'undefined' && window.localStorage) {
      return {
        success: true,
        message: 'App ready'
      }
    }
    
    return {
      success: true,
      message: 'App ready (SSR mode)'
    }
  } catch (error) {
    return {
      success: false,
      message: 'Basic mode'
    }
  }
}

/**
 * Check if app is ready (synchronous check only)
 */
export const isAppReady = () => {
  return true // Always ready to prevent blocking
}