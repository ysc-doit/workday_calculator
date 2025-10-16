// Simplified KV store - minimal functionality to prevent timeout issues

// Mock functions for development - these will not connect to external services
export const set = async (key: string, value: any): Promise<void> => {
  // Mock implementation - store in memory only
  console.log(`Mock KV set: ${key}`, value)
  return Promise.resolve()
};

export const get = async (key: string): Promise<any> => {
  // Mock implementation - return null for all keys
  console.log(`Mock KV get: ${key}`)
  return Promise.resolve(null)
};

export const del = async (key: string): Promise<void> => {
  // Mock implementation
  console.log(`Mock KV delete: ${key}`)
  return Promise.resolve()
};

export const mset = async (keys: string[], values: any[]): Promise<void> => {
  // Mock implementation
  console.log(`Mock KV mset:`, keys, values)
  return Promise.resolve()
};

export const mget = async (keys: string[]): Promise<any[]> => {
  // Mock implementation
  console.log(`Mock KV mget:`, keys)
  return Promise.resolve([])
};

export const mdel = async (keys: string[]): Promise<void> => {
  // Mock implementation
  console.log(`Mock KV mdel:`, keys)
  return Promise.resolve()
};

export const getByPrefix = async (prefix: string): Promise<any[]> => {
  // Mock implementation
  console.log(`Mock KV getByPrefix: ${prefix}`)
  return Promise.resolve([])
};