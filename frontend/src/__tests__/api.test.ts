import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import { getData, type RawCsvUpload } from '../lib/api'

// Mock axios
vi.mock('axios')
const mockedAxios = vi.mocked(axios)
const mockGet = vi.fn()
mockedAxios.get = mockGet

describe('API client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getData', () => {
    it('should call axios.get with correct parameters', async () => {
      const mockResponse = {
        data: [
          {
            ID: 1,
            File_name: 'test.csv',
            Description: 'Test file',
            ROW_DATA: { key: 'value' },
            Source: 'test',
            Category: 'test',
            Format: 'csv'
          }
        ]
      }
      mockGet.mockResolvedValue(mockResponse)

      const result = await getData()

      expect(mockGet).toHaveBeenCalledWith('/data', {
        params: { skip: 0, limit: 100, search: undefined }
      })
      expect(result).toEqual(mockResponse.data)
    })

    it('should handle custom parameters', async () => {
      const mockResponse = { data: [] }
      mockGet.mockResolvedValue(mockResponse)

      await getData(10, 50, 'search term')

      expect(mockGet).toHaveBeenCalledWith('/data', {
        params: { skip: 10, limit: 50, search: 'search term' }
      })
    })

    it('should handle API errors', async () => {
      const errorMessage = 'Network Error'
      mockGet.mockRejectedValue(new Error(errorMessage))

      await expect(getData()).rejects.toThrow(errorMessage)
    })

    it('should return correct data structure', async () => {
      const mockData: RawCsvUpload[] = [
        {
          ID: 1,
          File_name: 'file1.csv',
          Description: 'Description 1',
          ROW_DATA: { col1: 'val1' },
          Source: 'source1',
          Category: 'category1',
          Format: 'csv'
        }
      ]
      mockGet.mockResolvedValue({ data: mockData })

      const result = await getData()

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        ID: 1,
        File_name: 'file1.csv',
        Description: 'Description 1',
        ROW_DATA: { col1: 'val1' },
        Source: 'source1',
        Category: 'category1',
        Format: 'csv'
      })
    })
  })
})