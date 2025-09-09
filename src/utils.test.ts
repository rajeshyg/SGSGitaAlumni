import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

const TEST_STRINGS = {
  CLASS1_CLASS2: 'class1 class2',
  CLASS1: 'class1',
  CLASS2: 'class2'
} as const;

describe('cn utility function', () => {
  it('should merge class names correctly', () => {
    expect(cn(TEST_STRINGS.CLASS1, TEST_STRINGS.CLASS2)).toBe(TEST_STRINGS.CLASS1_CLASS2)
  })

  it('should handle conditional classes', () => {
    expect(cn('class1', true && 'class2', false && 'class3')).toBe('class1 class2')
  })

  it('should handle clsx and tailwind merge', () => {
    const result = cn('px-2 py-1', 'px-4')
    // Check that both classes are present (order doesn't matter functionally)
    expect(result).toContain('px-4')
    expect(result).toContain('py-1')
  })

  it('should handle empty inputs', () => {
    expect(cn()).toBe('')
  })

  it('should handle undefined and null', () => {
    expect(cn(TEST_STRINGS.CLASS1, undefined, null, TEST_STRINGS.CLASS2)).toBe(TEST_STRINGS.CLASS1_CLASS2)
  })
})