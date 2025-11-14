# How to Use "My Postings" Feature

## Quick Access
Navigate to: **http://localhost:5173/postings/my**

---

## What You'll See

### Page Layout
```
┌─────────────────────────────────────────────────────────┐
│  My Postings                    [Create New Posting]    │
│  Manage all your postings in one place                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  📝 [Draft]         Title of Draft Post                 │
│     Category • Type • Created Date                       │
│     Description preview...                               │
│     [View] [Edit] [Delete]                              │
│                                                          │
│  ⏳ [Pending Review] Title of Pending Post              │
│     Category • Type • Created Date                       │
│     Description preview...                               │
│     [View] [Edit]                                       │
│                                                          │
│  ✅ [Active]        Title of Approved Post              │
│     Category • Type • Created Date                       │
│     Description preview...                               │
│     100 views • 5 interested                            │
│     [View]                                              │
│                                                          │
│  ❌ [Rejected]      Title of Rejected Post              │
│     Category • Type • Created Date                       │
│     This posting was rejected during moderation review   │
│     [View]                                              │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  Showing 4 postings • 1 active • 1 pending • 1 draft •  │
│  1 rejected                                              │
└─────────────────────────────────────────────────────────┘
```

---

## Features by Post Status

### 📝 Draft Posts
**What it means:** You saved this but haven't submitted for review yet

**What you can do:**
- ✅ **View** - See all details
- ✅ **Edit** - Make changes
- ✅ **Delete** - Remove completely
- ✅ **Submit** - Edit and change status to submit for review

**Badge Color:** Gray outline

---

### ⏳ Pending Review Posts
**What it means:** Waiting for moderator approval

**What you can do:**
- ✅ **View** - See all details
- ✅ **Edit** - Make changes before moderator reviews
- ❌ **Delete** - Can't delete once submitted (edit instead)

**Badge Color:** Yellow

**Note:** You can still edit while pending! Changes will be reviewed.

---

### ✅ Active Posts
**What it means:** Approved by moderator and live on the site

**What you can do:**
- ✅ **View** - See all details
- ✅ **See Stats** - View count and interest count
- ❌ **Edit** - Can't edit once approved
- ❌ **Delete** - Can't delete once approved

**Badge Color:** Green

**Tip:** Active posts will automatically expire based on expiry date you set

---

### ❌ Rejected Posts
**What it means:** Moderator reviewed and rejected your post

**What you can do:**
- ✅ **View** - See rejection reason
- ❌ **Edit** - Create new post instead
- ❌ **Delete** - Automatically archived

**Badge Color:** Red

**Next Steps:** Review moderator feedback and create a new, improved post

---

### ⏰ Expired Posts
**What it means:** Post was active but passed expiry date

**What you can do:**
- ✅ **View** - See historical data
- ❌ **Edit** - Create new post instead
- ❌ **Delete** - Automatically archived

**Badge Color:** Gray

**Next Steps:** Create a fresh post with updated information

---

## Button Guide

### [View] Button
- Available for: **All posts**
- Opens: Full post details page
- Shows: Title, description, domains, tags, contact info, stats

### [Edit] Button
- Available for: **Draft** or **Pending Review** only
- Opens: Edit form with current values
- Allows: Updating any field
- After save: Returns to status it had (draft or pending)

### [Delete] Button
- Available for: **Draft** only
- Action: Permanently removes post
- Warning: Shows confirmation dialog
- After delete: Post removed from database

### [Create New Posting] Button
- Location: Top right corner
- Opens: 4-step creation form
- Returns: To My Postings after submission

---

## Creating a New Post

### The 4 Steps:

#### Step 1: Basic Information
**Required Fields:**
- Type: Offering Support or Seeking Support
- Category: Choose from dropdown
- Title: 10-200 characters

**Tips:**
- Make title clear and specific
- Choose most relevant category
- Type determines who sees it

---

#### Step 2: Details & Domain
**Required Fields:**
- Description: 50-2000 characters
- Primary Domain: Main area (e.g., Professional Development)
- Secondary Domains: At least one (e.g., Career Guidance)

**Optional:**
- Areas of Interest: Specific sub-topics
- Tags: Additional keywords

**Tips:**
- Detailed descriptions get more responses
- Select all relevant domains
- Use tags to increase visibility

---

#### Step 3: Logistics & Timing
**Required Fields:**
- Location: City, "Remote", or "Hybrid"
- Duration: "1 week", "3 months", "Ongoing", etc.
- Expiry Date: When post should expire (1-90 days)
- Max Connections: How many people can respond (1-50)

**Tips:**
- Be specific about location requirements
- Set realistic expiry dates
- Limit connections if capacity is limited

---

#### Step 4: Contact Information
**Required Fields:**
- Contact Name: Your full name
- Contact Email: How people reach you

**Optional:**
- Contact Phone: Include if you prefer calls
- Preferred Method: Email, Phone, or Either

**Tips:**
- Use email you check regularly
- Phone number validated if provided
- Choose preferred contact method

---

## After Submission

### What Happens:
1. ✅ Post status: **Pending Review**
2. ✅ Moderation status: **PENDING**
3. ✅ Appears in your "My Postings" immediately
4. ✅ Appears in moderator queue immediately
5. ⏳ Waits for moderator approval

### Timeline:
- Usually reviewed within: **24-48 hours**
- Urgent posts reviewed: **Within 24 hours**
- You'll be notified: **When approved or rejected**

---

## Editing Pending Posts

### Why Edit Before Approval?
- Spotted a typo? Fix it!
- Need to update contact info? Update it!
- Want to add more details? Add them!

### How to Edit:
1. Go to "My Postings"
2. Find your pending post
3. Click **[Edit]**
4. Make changes
5. Click **Save** or **Submit**
6. Post returns to moderation queue

**Important:** Editing resets moderation review! Your post goes back to the queue.

---

## Post Statistics

### What You Can See:
- **View Count:** How many people viewed your post
- **Interest Count:** How many clicked "I'm Interested"
- **Created Date:** When you created it
- **Expiry Date:** When it will expire
- **Days Remaining:** Time until expiry

### Only Available For:
- ✅ Active posts
- ✅ Expired posts (historical data)

### Not Available For:
- ❌ Draft posts (not published)
- ❌ Pending posts (not yet approved)
- ❌ Rejected posts (never published)

---

## Domains and Tags

### Visual Display:
Domains appear as colored badges matching your preferences:
```
[🎓 Professional Development]  [💼 Career Guidance]  [📊 Data Science]
```

Tags appear as outline badges:
```
[mentorship]  [remote]  [urgent]
```

### How They Help:
- **Domains:** Match with users who selected same preferences
- **Tags:** Improve search and filtering
- **Colors:** Quick visual categorization

---

## Common Questions

### Q: Can I delete a pending post?
**A:** No, but you can edit it. Once submitted for review, you can't delete it, but you can modify it before moderator approval.

### Q: Why can't I edit my active post?
**A:** Once approved, posts are locked to maintain integrity. Create a new post with updated info instead.

### Q: How do I know if my post was approved?
**A:** Check "My Postings" - status badge will change from "Pending Review" to "Active". You'll also receive an email notification (if enabled).

### Q: What happens to rejected posts?
**A:** They stay in your "My Postings" with rejection reason. Learn from feedback and create a better post!

### Q: Can I resubmit a rejected post?
**A:** No direct resubmission, but you can use it as a template for a new, improved post.

### Q: How do I extend expiry date?
**A:** You can't extend active posts. Create a new post with updated expiry date instead.

### Q: Can I have multiple active posts?
**A:** Yes! No limit on active posts. Create as many as you need.

### Q: What if my post expires?
**A:** Expired posts move to "Expired" status. Create a new post to restart engagement.

---

## Best Practices

### For Maximum Visibility:
1. ✅ Use clear, descriptive titles
2. ✅ Provide detailed descriptions (aim for 200+ characters)
3. ✅ Select all relevant domains
4. ✅ Add specific tags
5. ✅ Include location details
6. ✅ Set realistic expiry dates (30 days is good)

### For Quick Approval:
1. ✅ Follow content guidelines
2. ✅ Provide complete contact information
3. ✅ Use professional language
4. ✅ Avoid spam/promotional content
5. ✅ Be specific about what you offer/seek

### For Better Responses:
1. ✅ Check email regularly
2. ✅ Respond promptly to interested parties
3. ✅ Set max connections appropriately
4. ✅ Update post if details change (before approval)
5. ✅ Mark as complete when goal achieved

---

## Troubleshooting

### "I don't see my posts"
**Solution:**
1. Make sure you're logged in
2. Navigate to `/postings/my` (not `/postings`)
3. Refresh the page
4. Check if backend server is running

### "Submit button doesn't work"
**Solution:**
1. Verify all required fields are filled
2. Check validation errors (shown in red)
3. Ensure backend server is running on port 3001
4. Check browser console for errors

### "My approved post doesn't show on /postings"
**Solution:**
1. Wait 1-2 minutes for cache to clear
2. Refresh /postings page
3. Check post expiry date hasn't passed
4. Verify status is 'active' (not 'approved')

### "Edit button is grayed out"
**Solution:**
- Draft posts: Should always be editable
- Pending posts: Should be editable
- Active posts: Can't edit (by design)
- Rejected/Expired: Can't edit (create new instead)

---

## Need Help?

### Contact Support:
- Email: support@sgsgitaalumni.org
- Check: Backend logs at `c:\React-Projects\SGSGitaAlumni\server.js`
- Review: Database directly if needed

### Check Server Status:
```powershell
# Backend (port 3001)
netstat -ano | findstr :3001

# Frontend (port 5173)  
netstat -ano | findstr :5173
```

### Restart Services:
```powershell
# Backend
cd c:\React-Projects\SGSGitaAlumni
node server.js

# Frontend  
npm run dev
```

---

**Happy posting! 🎉**
