// API data service
export const APIDataService = {
  getData: async () => {
    // Mock implementation
    return { data: [] }
  }
}

export const checkAPIConfiguration = () => {
  return !!import.meta.env.VITE_API_URL
}

export const getAPIConfigStatus = () => ({
  hasUrl: !!import.meta.env.VITE_API_URL,
  configured: !!import.meta.env.VITE_API_URL
})