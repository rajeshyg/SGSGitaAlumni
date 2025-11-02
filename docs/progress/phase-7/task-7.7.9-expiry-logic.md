# Task 7.7.9: Posting Expiry Logic Fix

**Status:** 🟡 Planned
**Priority:** High
**Duration:** 2 days
**Parent Task:** [Task 7.7: Domain Taxonomy System](./task-7.7-domain-taxonomy-system.md)
**Related:** [Task 8.12: Violation Corrections](../phase-8/task-8.12-violation-corrections.md) - Action 10

## Overview
Fix the posting expiry date calculation logic to implement the correct business rule: **expiry_date = MAX(user_provided_date, submission_date + 30 days)**.

**Current Problem:** Postings use only the user-provided expiry date without enforcing the minimum 30-day requirement, allowing postings to expire too quickly or immediately.

**Correct Behavior:**
- If user provides expiry date **more than 30 days** from submission → use user's date
- If user provides expiry date **less than 30 days** from submission → enforce 30-day minimum
- If user **doesn't provide** expiry date → default to submission_date + 30 days

## Functional Requirements

### Expiry Date Calculation

#### Formula
```typescript
expiry_date = MAX(user_provided_date || (submission_date + 30 days), submission_date + 30 days)

// Simplified:
if (user_provided_date exists) {
  expiry_date = MAX(user_provided_date, submission_date + 30 days)
} else {
  expiry_date = submission_date + 30 days
}
```

#### Examples

**Example 1: User provides date 60 days out**
```
submission_date = 2025-11-01
user_provided_date = 2025-12-31 (60 days out)
minimum_date = 2025-12-01 (30 days from submission)
expiry_date = MAX(2025-12-31, 2025-12-01) = 2025-12-31 ✅
```

**Example 2: User provides date only 15 days out**
```
submission_date = 2025-11-01
user_provided_date = 2025-11-16 (15 days out)
minimum_date = 2025-12-01 (30 days from submission)
expiry_date = MAX(2025-11-16, 2025-12-01) = 2025-12-01 ✅
```

**Example 3: User doesn't provide date**
```
submission_date = 2025-11-01
user_provided_date = null
minimum_date = 2025-12-01 (30 days from submission)
expiry_date = 2025-12-01 ✅
```

**Example 4: User provides past date (invalid)**
```
submission_date = 2025-11-01
user_provided_date = 2025-10-15 (past date)
Result: Validation error - date must be in the future ❌
```

### User-Facing Behavior

#### In Posting Creation Form
- **Expiry Date Field:** Optional date picker
- **Default Value:** submission_date + 30 days (shown as placeholder)
- **Minimum Date:** submission_date + 30 days (cannot select earlier)
- **Maximum Date:** submission_date + 1 year (reasonable limit)
- **Help Text:** "Postings remain active for at least 30 days. You can set a longer duration."

#### After Submission
- **Confirmation Message:** "Your posting will remain active until [expiry_date]"
- **Edit Warning:** "Changing expiry date cannot make posting expire sooner than 30 days from original submission"

## Technical Requirements

### Database Schema Update

```sql
-- Ensure expiry_date is properly constrained
ALTER TABLE POSTINGS
  ADD CONSTRAINT check_expiry_minimum 
  CHECK (expiry_date >= created_at + INTERVAL '30 days');

-- Create function to calculate expiry date
CREATE OR REPLACE FUNCTION calculate_expiry_date(
  user_date TIMESTAMP,
  submission_date TIMESTAMP
) RETURNS TIMESTAMP AS $$
BEGIN
  -- If user date is provided, use MAX of user date and 30-day minimum
  IF user_date IS NOT NULL THEN
    RETURN GREATEST(user_date, submission_date + INTERVAL '30 days');
  ELSE
    -- Default to 30 days from submission
    RETURN submission_date + INTERVAL '30 days';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create trigger to automatically set expiry date
CREATE OR REPLACE FUNCTION set_posting_expiry()
RETURNS TRIGGER AS $$
BEGIN
  NEW.expiry_date := calculate_expiry_date(NEW.expiry_date, NEW.created_at);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER posting_expiry_trigger
  BEFORE INSERT OR UPDATE ON POSTINGS
  FOR EACH ROW
  EXECUTE FUNCTION set_posting_expiry();
```

### Backend Service Implementation

```typescript
// Location: src/services/PostingService.ts

export class PostingService {
  /**
   * Calculate expiry date based on business rules
   */
  private calculateExpiryDate(
    userProvidedDate: Date | null,
    submissionDate: Date = new Date()
  ): Date {
    const minimumDate = new Date(submissionDate);
    minimumDate.setDate(minimumDate.getDate() + 30);

    if (userProvidedDate) {
      // Return the later of user date or minimum date
      return userProvidedDate > minimumDate ? userProvidedDate : minimumDate;
    }

    // Default to minimum date (30 days)
    return minimumDate;
  }

  /**
   * Create new posting with correct expiry date
   */
  async createPosting(data: CreatePostingRequest): Promise<Posting> {
    const submissionDate = new Date();
    
    // Validate user-provided expiry date if present
    if (data.expiryDate) {
      const userDate = new Date(data.expiryDate);
      
      // Check if date is in the past
      if (userDate < submissionDate) {
        throw new ValidationError('Expiry date cannot be in the past');
      }

      // Check if date is too far in future (1 year max)
      const maxDate = new Date(submissionDate);
      maxDate.setFullYear(maxDate.getFullYear() + 1);
      
      if (userDate > maxDate) {
        throw new ValidationError('Expiry date cannot be more than 1 year in the future');
      }
    }

    // Calculate final expiry date
    const expiryDate = this.calculateExpiryDate(
      data.expiryDate ? new Date(data.expiryDate) : null,
      submissionDate
    );

    // Create posting with calculated expiry date
    const posting = await db.postings.create({
      ...data,
      created_at: submissionDate,
      expiry_date: expiryDate,
      status: 'PENDING'
    });

    return posting;
  }

  /**
   * Update posting with correct expiry date handling
   */
  async updatePosting(
    postingId: string,
    updates: UpdatePostingRequest
  ): Promise<Posting> {
    const posting = await db.postings.findById(postingId);
    
    if (!posting) {
      throw new ResourceError('Posting not found');
    }

    // If updating expiry date, recalculate based on ORIGINAL submission date
    if (updates.expiryDate) {
      updates.expiryDate = this.calculateExpiryDate(
        new Date(updates.expiryDate),
        posting.created_at // Use original submission date, not now
      );
    }

    return await db.postings.update(postingId, updates);
  }
}
```

### API Validation Schema Update

```typescript
// Location: src/schemas/validation/index.ts

export const PostingCreateSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(20).max(5000),
  domainId: UUIDSchema,
  categoryId: UUIDSchema,
  tags: z.array(z.string().max(50)).max(10),
  
  // Expiry date validation
  expiryDate: z.coerce.date()
    .min(new Date(), 'Expiry date must be in the future')
    .max(
      new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      'Expiry date cannot be more than 1 year in the future'
    )
    .optional(),
  
  isUrgent: z.boolean().default(false),
  contactMethod: z.enum(['EMAIL', 'PHONE', 'CHAT', 'ALL']).default('EMAIL')
});
```

### Frontend Form Update

```typescript
// Location: src/components/postings/CreatePostingForm.tsx

export function CreatePostingForm() {
  const minDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date;
  }, []);

  const maxDate = useMemo(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    return date;
  }, []);

  return (
    <form onSubmit={handleSubmit}>
      {/* Other fields */}
      
      <FormField
        name="expiryDate"
        label="Expiry Date (Optional)"
        description="Your posting will remain active for at least 30 days"
      >
        <DatePicker
          minDate={minDate}
          maxDate={maxDate}
          placeholder={`Default: ${minDate.toLocaleDateString()}`}
        />
      </FormField>

      <p className="text-sm text-muted-foreground">
        💡 <strong>Tip:</strong> Postings stay active for minimum 30 days. 
        Set a longer expiry if you need more time.
      </p>
    </form>
  );
}
```

## Implementation Plan

### Day 1: Backend Implementation
**Morning:**
- [ ] Create `calculate_expiry_date()` PostgreSQL function
- [ ] Add database constraint for 30-day minimum
- [ ] Create trigger for automatic expiry calculation
- [ ] Test database functions with various scenarios

**Afternoon:**
- [ ] Update `PostingService.createPosting()`
- [ ] Update `PostingService.updatePosting()`
- [ ] Add validation schema updates
- [ ] Write unit tests for expiry calculation

### Day 2: Frontend & Testing
**Morning:**
- [ ] Update posting creation form
- [ ] Add date picker with min/max constraints
- [ ] Update form validation
- [ ] Test frontend date selection

**Afternoon:**
- [ ] Integration tests for posting creation
- [ ] Test edge cases (past dates, far future dates)
- [ ] Test posting updates (preserves original submission date)
- [ ] Update documentation

## Success Criteria

### Functional
- [ ] All new postings have expiry >= 30 days from submission
- [ ] User-provided dates < 30 days are overridden
- [ ] User-provided dates > 30 days are respected
- [ ] Editing posting cannot reduce expiry below original 30-day minimum
- [ ] Database enforces constraint

### User Experience
- [ ] Date picker shows 30-day minimum clearly
- [ ] Default/placeholder shows calculated minimum date
- [ ] Help text explains 30-day minimum rule
- [ ] Validation errors are clear and helpful

### Technical
- [ ] Database trigger handles calculation automatically
- [ ] Backend service validates dates before saving
- [ ] Frontend prevents invalid date selection
- [ ] Tests cover all edge cases

## Testing Checklist

### Unit Tests
- [ ] `calculateExpiryDate(null, submissionDate)` → submission + 30 days
- [ ] `calculateExpiryDate(submission + 60 days)` → submission + 60 days
- [ ] `calculateExpiryDate(submission + 15 days)` → submission + 30 days
- [ ] Past date validation throws error
- [ ] Future date >1 year throws error

### Integration Tests
- [ ] POST /api/postings with no expiry → defaults to 30 days
- [ ] POST /api/postings with 60-day expiry → uses 60 days
- [ ] POST /api/postings with 15-day expiry → enforces 30 days
- [ ] PUT /api/postings/:id updating expiry → respects original submission
- [ ] Database constraint prevents manual INSERT with <30 days

### Manual Tests
- [ ] Create posting without expiry date → shows 30-day expiry
- [ ] Create posting with 45-day expiry → uses 45 days
- [ ] Create posting with 10-day expiry → enforces 30 days
- [ ] Try to edit posting to reduce expiry → prevented
- [ ] Date picker prevents selecting dates <30 days out

## Dependencies

### Required Before Starting
- [ ] POSTINGS table exists with expiry_date column
- [ ] Posting creation API endpoint functional

### Blocks These Tasks
- Posting expiry automation
- Posting lifecycle management
- Analytics on posting durations

## Related Documentation
- [Task 7.7: Domain Taxonomy System](./task-7.7-domain-taxonomy-system.md) - Parent task
- [Task 8.12: Violation Corrections](../phase-8/task-8.12-violation-corrections.md) - Master plan
- [Requirements Doc](../../functional-requirements/Gita%20Connect%20Application%20-%20Requirements%20document.md)

---

*This task fixes a critical business logic bug ensuring all postings remain active for the minimum required duration.*
