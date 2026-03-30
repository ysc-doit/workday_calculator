// Disabled - using local storage only

export const set = async (key: string, value: any): Promise<void> => {
  return Promise.resolve()
};

export const get = async (key: string): Promise<any> => {
  return Promise.resolve(null)
};

export const del = async (key: string): Promise<void> => {
  return Promise.resolve()
};

export const mset = async (keys: string[], values: any[]): Promise<void> => {
  return Promise.resolve()
};

export const mget = async (keys: string[]): Promise<any[]> => {
  return Promise.resolve([])
};

export const mdel = async (keys: string[]): Promise<void> => {
  return Promise.resolve()
};

export const getByPrefix = async (prefix: string): Promise<any[]> => {
  return Promise.resolve([])
};
