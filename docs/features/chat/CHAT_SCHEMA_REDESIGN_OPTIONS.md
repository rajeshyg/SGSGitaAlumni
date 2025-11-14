# Chat Schema Redesign - Simple Options

**Issue:** We have 3 fields doing the same job: `type`, `is_group`, and `postingId`

---

## Current Problem

```sql
type = 'POST_LINKED'  -- Is it 1-on-1 or group? Don't know!
is_group = false      -- Now we know it's 1-on-1
postingId = 'abc123'  -- Already tells us it's post-linked
```

**The bug:** 1-on-1 chats show post title instead of participant name.

---

## Option 1: Count Participants (Simplest)

**Change:**
```sql
-- Remove is_group column
ALTER TABLE CONVERSATIONS DROP COLUMN is_group;

-- Keep type: 'DIRECT', 'GROUP', 'POST_LINKED'
-- Keep posting_id
```

**How it works:** Count participants to know if group (>2 people = group)

**Pros:** Minimal changes, clean schema  
**Cons:** Must count participants every time  
**Time:** 30 minutes

---

## Option 2: Make is_group Auto-Calculate

**Change:**
```sql
-- Remove old is_group
ALTER TABLE CONVERSATIONS DROP COLUMN is_group;

-- Add auto-calculated is_group
ALTER TABLE CONVERSATIONS ADD COLUMN is_group BOOLEAN 
  GENERATED ALWAYS AS (
    (SELECT COUNT(*) FROM CONVERSATION_PARTICIPANTS 
     WHERE conversation_id = id) > 2
  ) STORED;
```

**How it works:** Database automatically maintains `is_group` field

**Pros:** Fast queries, auto-updates  
**Cons:** Uses MySQL computed columns feature  
**Time:** 45 minutes

---

## Option 3: Use 4 Clear Types (RECOMMENDED)

**Change:**
```sql
-- Remove is_group column
ALTER TABLE CONVERSATIONS DROP COLUMN is_group;

-- Change type to 4 values
ALTER TABLE CONVERSATIONS 
  MODIFY COLUMN type ENUM('DIRECT', 'GROUP', 'POST_DIRECT', 'POST_GROUP');

-- Update existing POST_LINKED conversations
UPDATE CONVERSATIONS SET type = 'POST_DIRECT' 
WHERE type = 'POST_LINKED' 
  AND (SELECT COUNT(*) FROM CONVERSATION_PARTICIPANTS WHERE conversation_id = id) = 2;

UPDATE CONVERSATIONS SET type = 'POST_GROUP' 
WHERE type = 'POST_LINKED' 
  AND (SELECT COUNT(*) FROM CONVERSATION_PARTICIPANTS WHERE conversation_id = id) > 2;
```

**How it works:**
- `DIRECT` = Regular 1-on-1 chat (no post)
- `GROUP` = Regular group chat (no post)
- `POST_DIRECT` = 1-on-1 chat about a post → Show participant name
- `POST_GROUP` = Group discussion about a post → Show post title

**Display logic becomes super simple:**
```typescript
if (type === 'POST_DIRECT') → show participant name
if (type === 'POST_GROUP') → show post title
```

**Pros:** Clear, no redundancy, fast queries, self-documenting  
**Cons:** More migration work  
**Time:** 60 minutes

---

## My Recommendation: Option 3

**Why?** Type value tells you everything - no guessing, no counting, no confusion.

---

## Quick Comparison

| | Option 1 | Option 2 | Option 3 |
|---|---|---|---|
| **Redundancy** | None | Some | None |
| **Speed** | Slow (count) | Fast | Fastest |
| **Clarity** | OK | OK | Excellent |
| **Migration** | Easy | Medium | Medium |
| **Time** | 30 min | 45 min | 60 min |

---

**Which option do you prefer?** Just tell me 1, 2, or 3 and I'll implement it.
