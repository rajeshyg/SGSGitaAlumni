// Simple test to verify mock data layer functionality
import { MockAPIService, LocalStorageService } from '../lib/mockData'

describe('Mock Data Layer', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    LocalStorageService.clearData()
  })

  test('should return mock file imports', async () => {
    const result = await MockAPIService.getFileImports({
      page: 0,
      pageSize: 10
    })

    expect(result.data).toBeDefined()
    expect(Array.isArray(result.data)).toBe(true)
    expect(result.data.length).toBeGreaterThan(0)
    expect(result.total).toBeGreaterThan(0)
  })

  test('should filter by search term', async () => {
    const result = await MockAPIService.getFileImports({
      page: 0,
      pageSize: 10,
      search: 'alumni'
    })

    expect(result.data.length).toBeGreaterThan(0)
    result.data.forEach(item => {
      expect(
        item.filename.toLowerCase().includes('alumni') ||
        item.file_type.toLowerCase().includes('alumni') ||
        item.uploaded_by.toLowerCase().includes('alumni')
      ).toBe(true)
    })
  })

  test('should persist data to localStorage', async () => {
    // Load initial data
    const initialData = LocalStorageService.loadData()
    expect(initialData.length).toBeGreaterThan(0)

    // Update an item
    const testItem = initialData[0]
    const updatedItem = await MockAPIService.updateFileImport(testItem.id, {
      status: 'completed'
    })

    expect(updatedItem.status).toBe('completed')

    // Verify persistence
    const storedData = LocalStorageService.loadData()
    const storedItem = storedData.find(item => item.id === testItem.id)
    expect(storedItem?.status).toBe('completed')
  })

  test('should export data in different formats', async () => {
    // Test CSV export
    const csvData = await MockAPIService.exportData('csv')
    expect(typeof csvData).toBe('string')
    expect(csvData.includes('ID,Filename')).toBe(true)

    // Test JSON export
    const jsonData = await MockAPIService.exportData('json')
    expect(Array.isArray(jsonData)).toBe(true)
    expect(jsonData.length).toBeGreaterThan(0)
  })
})

export {} // Make this a module