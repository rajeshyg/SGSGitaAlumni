import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TanStackAdvancedTable } from '../components/ui'
import type { ColumnDef } from '@tanstack/react-table'

// Mock data type
type TestData = {
  id: number
  name: string
  value: string
}

// Sample columns
const columns: ColumnDef<TestData, any>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
  },
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'value',
    header: 'Value',
  },
]

// Sample data
const sampleData: TestData[] = [
  { id: 1, name: 'Item 1', value: 'Value 1' },
  { id: 2, name: 'Item 2', value: 'Value 2' },
  { id: 3, name: 'Item 3', value: 'Value 3' },
]

describe('TanStackAdvancedTable', () => {
  it('renders table with data', () => {
    render(<TanStackAdvancedTable columns={columns} data={sampleData} />)

    // Check if headers are rendered
    expect(screen.getByText('ID')).toBeInTheDocument()
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Value')).toBeInTheDocument()

    // Check if data is rendered
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('Item 1')).toBeInTheDocument()
    expect(screen.getByText('Value 1')).toBeInTheDocument()
  })

  it('renders "No data available" when data is empty', () => {
    render(<TanStackAdvancedTable columns={columns} data={[]} />)

    expect(screen.getByText('No data available')).toBeInTheDocument()
  })

  it('renders pagination buttons', () => {
    render(<TanStackAdvancedTable columns={columns} data={sampleData} />)

    expect(screen.getByText('Previous')).toBeInTheDocument()
    expect(screen.getByText('Next')).toBeInTheDocument()
  })

  it('disables Previous button on first page', () => {
    render(<TanStackAdvancedTable columns={columns} data={sampleData} />)

    const previousButton = screen.getByText('Previous')
    expect(previousButton).toBeDisabled()
  })

  it('shows correct number of rows', () => {
    render(<TanStackAdvancedTable columns={columns} data={sampleData} />)

    // Should show all 3 rows
    const rows = screen.getAllByRole('row')
    // Header row + 3 data rows
    expect(rows).toHaveLength(4)
  })

  it('handles single column table', () => {
    const singleColumn: ColumnDef<TestData, any>[] = [
      {
        accessorKey: 'name',
        header: 'Name',
      },
    ]

    render(<TanStackAdvancedTable columns={singleColumn} data={sampleData} />)

    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Item 1')).toBeInTheDocument()
    expect(screen.getByText('Item 2')).toBeInTheDocument()
    expect(screen.getByText('Item 3')).toBeInTheDocument()
  })

  it('applies correct CSS classes', () => {
    const { container } = render(<TanStackAdvancedTable columns={columns} data={sampleData} />)

    // Check for table wrapper classes
    const tableWrapper = container.querySelector('.rounded-md.border')
    expect(tableWrapper).toBeInTheDocument()
  })
})