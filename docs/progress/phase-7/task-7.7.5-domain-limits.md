# Task 7.7.5: Domain Selection Limits - 5-Domain UI Enforcement

**Status:** 🟡 Planned
**Priority:** Medium
**Duration:** 1 day
**Parent Task:** [Task 7.7: Domain Taxonomy System](./task-7.7-domain-taxonomy-system.md)
**Related:** [Task 8.12: Violation Corrections](../phase-8/task-8.12-violation-corrections.md) - Action 15

## Overview
Enforce the 5-domain limit in the preferences UI with clear visual feedback showing "3 of 5 selected" and disabling unselected domains once limit is reached.

**Requirement:** Users can select maximum 5 domains of interest in their preferences.

## Functional Requirements

### UI Behavior

#### Selection Counter
- **Display:** "X of 5 domains selected" above domain list
- **Color Coding:**
  - 0-3 domains: `text-muted-foreground`
  - 4 domains: `text-warning` (approaching limit)
  - 5 domains: `text-success` (at limit)

#### Domain Checkboxes
- **Enabled State:** Can be toggled on/off
- **Disabled State:** Cannot be checked (shows disabled styling)
- **Logic:** Once 5 domains selected, unselected domains become disabled

#### Visual Feedback
```tsx
// Selected domain (can uncheck)
<Checkbox checked enabled />

// Unselected but available (can check)
<Checkbox unchecked enabled />

// Unselected and limit reached (cannot check)
<Checkbox unchecked disabled />
```

### Error Prevention
- **Client-Side:** Prevent >5 selections in UI
- **Server-Side:** Reject API calls with >5 domains
- **Error Message:** "You can select a maximum of 5 domains"

## Technical Requirements

### Frontend Component Update

```typescript
// Location: src/components/preferences/DomainSelectionForm.tsx

export function DomainSelectionForm() {
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const MAX_DOMAINS = 5;

  const handleDomainToggle = (domainId: string) => {
    setSelectedDomains(prev => {
      if (prev.includes(domainId)) {
        // Uncheck - always allowed
        return prev.filter(id => id !== domainId);
      } else {
        // Check - only if under limit
        if (prev.length < MAX_DOMAINS) {
          return [...prev, domainId];
        }
        return prev; // Reject if at limit
      }
    });
  };

  const isSelectionDisabled = (domainId: string) => {
    return !selectedDomains.includes(domainId) && selectedDomains.length >= MAX_DOMAINS;
  };

  const getCounterColor = () => {
    if (selectedDomains.length === MAX_DOMAINS) return 'text-success';
    if (selectedDomains.length === MAX_DOMAINS - 1) return 'text-warning';
    return 'text-muted-foreground';
  };

  return (
    <div className="space-y-4">
      {/* Selection Counter */}
      <div className={`text-sm font-medium ${getCounterColor()}`}>
        {selectedDomains.length} of {MAX_DOMAINS} domains selected
        {selectedDomains.length === 0 && (
          <span className="text-muted-foreground ml-2">
            (Select at least 1)
          </span>
        )}
      </div>

      {/* Domain Checkboxes */}
      <div className="space-y-2">
        {domains.map(domain => (
          <div
            key={domain.id}
            className={`flex items-center space-x-2 p-3 rounded-lg border ${
              isSelectionDisabled(domain.id)
                ? 'bg-muted border-border opacity-60'
                : 'bg-background border-border hover:border-primary'
            }`}
          >
            <Checkbox
              id={domain.id}
              checked={selectedDomains.includes(domain.id)}
              disabled={isSelectionDisabled(domain.id)}
              onCheckedChange={() => handleDomainToggle(domain.id)}
            />
            <label
              htmlFor={domain.id}
              className={`flex-1 cursor-pointer ${
                isSelectionDisabled(domain.id) ? 'cursor-not-allowed' : ''
              }`}
            >
              <div className="font-medium text-foreground">
                {domain.domain_name}
              </div>
              <div className="text-sm text-muted-foreground">
                {domain.description}
              </div>
            </label>
          </div>
        ))}
      </div>

      {/* Help Text */}
      {selectedDomains.length === MAX_DOMAINS && (
        <p className="text-sm text-muted-foreground">
          💡 <strong>Tip:</strong> You've selected the maximum number of domains. 
          Uncheck one to select a different domain.
        </p>
      )}

      {/* Submit Button */}
      <Button
        disabled={selectedDomains.length === 0}
        onClick={handleSavePreferences}
      >
        Save Preferences
      </Button>
    </div>
  );
}
```

### Backend Validation

```typescript
// Location: src/schemas/validation/index.ts

export const PreferencesUpdateSchema = z.object({
  selectedDomains: z
    .array(UUIDSchema)
    .min(1, 'At least 1 domain must be selected')
    .max(5, 'Maximum 5 domains allowed'),
  // ... other fields
});
```

### API Endpoint Validation

```typescript
// Location: routes/preferences.js

router.put('/api/preferences',
  validateRequest({ body: PreferencesUpdateSchema }),
  async (req, res) => {
    // Validation middleware ensures selectedDomains has 1-5 items
    const { selectedDomains } = req.body;
    
    // Additional server-side check
    if (selectedDomains.length > 5) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Maximum 5 domains allowed',
          details: { maxAllowed: 5, provided: selectedDomains.length }
        }
      });
    }

    // Save preferences
    await preferencesService.updatePreferences(req.user.id, req.body);
    
    res.json({ success: true });
  }
);
```

## Implementation Plan

### Morning (4 hours)
- [ ] Update DomainSelectionForm component
- [ ] Add selection counter with color coding
- [ ] Implement checkbox disable logic
- [ ] Add help text for limit reached
- [ ] Test UI interactions

### Afternoon (4 hours)
- [ ] Update backend validation schema
- [ ] Add API endpoint validation
- [ ] Test server-side rejection
- [ ] Integration tests
- [ ] Documentation updates

## Success Criteria

### Functional
- [ ] UI displays "X of 5 domains selected"
- [ ] Checkboxes disabled when 5 domains selected
- [ ] Users can uncheck and reselect different domains
- [ ] Server rejects API calls with >5 domains
- [ ] Minimum 1 domain enforced

### User Experience
- [ ] Clear visual feedback on limit
- [ ] Disabled checkboxes visually distinct
- [ ] Color coding helps user understand status
- [ ] Help text appears when limit reached
- [ ] Smooth checkbox interactions

### Technical
- [ ] Client-side validation prevents >5 selections
- [ ] Server-side validation as safety net
- [ ] TypeScript types enforce limits
- [ ] Theme variables used (no hardcoded colors)

## Testing Checklist

### Manual Tests
- [ ] Select 5 domains → counter shows "5 of 5"
- [ ] Select 5 domains → unselected domains disabled
- [ ] Uncheck 1 domain → other domains become enabled
- [ ] Try to submit with 0 domains → validation error
- [ ] Try to submit with 6 domains (via API) → rejected

### Automated Tests
```typescript
describe('DomainSelectionForm', () => {
  it('allows selecting up to 5 domains', () => {
    render(<DomainSelectionForm />);
    
    // Select 5 domains
    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getAllByRole('checkbox')[i]);
    }
    
    expect(screen.getByText('5 of 5 domains selected')).toBeInTheDocument();
  });

  it('disables unselected domains after 5 selections', () => {
    render(<DomainSelectionForm />);
    
    // Select first 5
    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getAllByRole('checkbox')[i]);
    }
    
    // 6th checkbox should be disabled
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes[5]).toBeDisabled();
  });

  it('re-enables checkboxes when unchecking', () => {
    render(<DomainSelectionForm />);
    
    // Select 5, then uncheck 1
    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getAllByRole('checkbox')[i]);
    }
    fireEvent.click(screen.getAllByRole('checkbox')[0]); // Uncheck first
    
    // 6th checkbox should now be enabled
    expect(screen.getAllByRole('checkbox')[5]).not.toBeDisabled();
  });
});
```

## Dependencies

### Required Before Starting
- [Task 7.7: Domain Taxonomy System](./task-7.7-domain-taxonomy-system.md) - Domains exist
- Preferences UI page created

## Related Documentation
- [Task 7.7: Domain Taxonomy System](./task-7.7-domain-taxonomy-system.md)
- [Task 8.12: Violation Corrections](../phase-8/task-8.12-violation-corrections.md)
- [Phase 7 README](./README.md)

---

*This task implements clear UI constraints and validation for domain selection limits, improving user experience and data quality.*
