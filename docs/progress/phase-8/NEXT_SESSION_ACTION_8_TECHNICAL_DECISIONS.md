# 🔑 Action 8: Moderator Review System - Key Technical Decisions

## 1. Optimistic Locking
**Problem:** Two moderators might try to moderate the same posting simultaneously.

**Solution:** Add `version` column to POSTINGS table:
```sql
UPDATE POSTINGS
SET
  moderation_status = 'APPROVED',
  moderated_by = ?,
  moderated_at = NOW(),
  version = version + 1
WHERE id = ? AND version = ?
```

If the version doesn't match, the update fails (another moderator already acted).

## 2. Atomic Transactions
**Problem:** Moderation involves multiple database operations (update posting, insert history, etc.)

**Solution:** Wrap all operations in a transaction:
```javascript
const connection = await db.getConnection();
await connection.beginTransaction();

try {
  // 1. Update posting with optimistic lock
  const result = await connection.query(
    'UPDATE POSTINGS SET ... WHERE id = ? AND version = ?',
    [postingId, currentVersion]
  );

  if (result.affectedRows === 0) {
    throw new Error('Posting already moderated');
  }

  // 2. Insert history record
  await connection.query(
    'INSERT INTO MODERATION_HISTORY ...',
    [...]
  );

  // 3. Commit transaction
  await connection.commit();

  // 4. Send notification (outside transaction)
  await notificationService.send(...);
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  connection.release();
}
```

## 3. Queue Performance
**Problem:** Queue queries could be slow with large datasets.

**Solution:**
- Use indexed columns in WHERE clause
- Create composite indexes: `(moderation_status, created_at)`
- Use materialized view if performance still poor
- Implement pagination to limit results

## 4. Notification Reliability
**Problem:** Notifications might fail to send.

**Solution:**
- Send notifications AFTER database commit
- Log notification errors but don't fail the action
- Implement retry queue for failed notifications
- Track notification status in database (optional)