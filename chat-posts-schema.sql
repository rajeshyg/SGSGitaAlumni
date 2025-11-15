-- ============================================================================
-- CHAT AND POSTS MODULE DATABASE DESIGN
-- ============================================================================
-- This schema implements the chat and posts modules for SGS Gita Alumni
-- Designed for integration with existing user authentication system
-- ============================================================================

-- ============================================================================
-- POSTS MODULE SCHEMA
-- ============================================================================

-- POSTS TABLE
CREATE TABLE POSTINGS (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    author_id BIGINT NOT NULL,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    status ENUM('draft', 'pending_review', 'approved', 'rejected', 'expired', 'active', 'archived') NOT NULL DEFAULT 'pending_review',
    post_type ENUM('text', 'image', 'video', 'link', 'event', 'announcement') NOT NULL DEFAULT 'text',
    visibility ENUM('public', 'alumni_only', 'family_only', 'private') NOT NULL DEFAULT 'alumni_only',
    category VARCHAR(100),
    tags JSON, -- Array of tag strings
    media_attachments JSON, -- Array of media objects with URLs, types, etc.
    event_details JSON, -- For event posts: date, time, location, etc.
    location VARCHAR(255),
    is_pinned BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    view_count INT DEFAULT 0,
    like_count INT DEFAULT 0,
    comment_count INT DEFAULT 0,
    share_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    published_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Keys
    FOREIGN KEY (author_id) REFERENCES app_users(id) ON DELETE CASCADE,

    -- Indexes for performance
    INDEX idx_posts_author (author_id),
    INDEX idx_posts_status (status),
    INDEX idx_posts_type (post_type),
    INDEX idx_posts_visibility (visibility),
    INDEX idx_posts_category (category),
    INDEX idx_posts_pinned (is_pinned),
    INDEX idx_posts_featured (is_featured),
    INDEX idx_posts_published (published_at DESC),
    INDEX idx_posts_expires (expires_at),
    INDEX idx_posts_activity (last_activity_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- POST_COMMENTS TABLE
CREATE TABLE POST_COMMENTS (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    post_id CHAR(36) NOT NULL,
    author_id BIGINT NOT NULL,
    parent_comment_id CHAR(36) NULL, -- For nested replies
    content TEXT NOT NULL,
    media_url VARCHAR(500) NULL,
    media_type VARCHAR(50) NULL,
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP NULL,
    like_count INT DEFAULT 0,
    reply_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Foreign Keys
    FOREIGN KEY (post_id) REFERENCES POSTINGS(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES app_users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_comment_id) REFERENCES POST_COMMENTS(id) ON DELETE CASCADE,

    -- Indexes for performance
    INDEX idx_comments_post (post_id),
    INDEX idx_comments_author (author_id),
    INDEX idx_comments_parent (parent_comment_id),
    INDEX idx_comments_created (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- POST_LIKES TABLE
CREATE TABLE POST_LIKES (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    post_id CHAR(36) NOT NULL,
    user_id BIGINT NOT NULL,
    reaction_type ENUM('like', 'love', 'laugh', 'angry', 'sad', 'wow') NOT NULL DEFAULT 'like',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Keys
    FOREIGN KEY (post_id) REFERENCES POSTINGS(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE,

    -- Unique constraint: one reaction per user per post
    UNIQUE KEY unique_post_user_reaction (post_id, user_id),

    -- Indexes for performance
    INDEX idx_likes_post (post_id),
    INDEX idx_likes_user (user_id),
    INDEX idx_likes_type (reaction_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- COMMENT_LIKES TABLE
CREATE TABLE COMMENT_LIKES (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    comment_id CHAR(36) NOT NULL,
    user_id BIGINT NOT NULL,
    reaction_type ENUM('like', 'love', 'laugh', 'angry', 'sad', 'wow') NOT NULL DEFAULT 'like',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Keys
    FOREIGN KEY (comment_id) REFERENCES POST_COMMENTS(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE,

    -- Unique constraint: one reaction per user per comment
    UNIQUE KEY unique_comment_user_reaction (comment_id, user_id),

    -- Indexes for performance
    INDEX idx_comment_likes_comment (comment_id),
    INDEX idx_comment_likes_user (user_id),
    INDEX idx_comment_likes_type (reaction_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- POST_SHARES TABLE
CREATE TABLE POST_SHARES (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    post_id CHAR(36) NOT NULL,
    user_id BIGINT NOT NULL,
    share_type ENUM('share', 'repost') NOT NULL DEFAULT 'share',
    caption TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Keys
    FOREIGN KEY (post_id) REFERENCES POSTINGS(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE,

    -- Indexes for performance
    INDEX idx_shares_post (post_id),
    INDEX idx_shares_user (user_id),
    INDEX idx_shares_created (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- POST_REPORTS TABLE
CREATE TABLE POST_REPORTS (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    post_id CHAR(36) NULL,
    comment_id CHAR(36) NULL,
    reporter_id BIGINT NOT NULL,
    report_type ENUM('spam', 'harassment', 'inappropriate', 'copyright', 'other') NOT NULL,
    description TEXT,
    status ENUM('pending', 'investigating', 'resolved', 'dismissed') NOT NULL DEFAULT 'pending',
    moderator_id BIGINT NULL,
    moderator_notes TEXT,
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Foreign Keys
    FOREIGN KEY (post_id) REFERENCES POSTINGS(id) ON DELETE CASCADE,
    FOREIGN KEY (comment_id) REFERENCES POST_COMMENTS(id) ON DELETE CASCADE,
    FOREIGN KEY (reporter_id) REFERENCES app_users(id) ON DELETE CASCADE,
    FOREIGN KEY (moderator_id) REFERENCES app_users(id) ON DELETE SET NULL,

    -- Check constraint: either post_id or comment_id must be set
    CHECK (post_id IS NOT NULL OR comment_id IS NOT NULL),

    -- Indexes for performance
    INDEX idx_reports_post (post_id),
    INDEX idx_reports_comment (comment_id),
    INDEX idx_reports_reporter (reporter_id),
    INDEX idx_reports_status (status),
    INDEX idx_reports_created (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- CHAT MODULE SCHEMA
-- ============================================================================

-- CONVERSATIONS TABLE (Updated based on redesign recommendations)
CREATE TABLE CONVERSATIONS (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    type ENUM('DIRECT', 'GROUP', 'POST_DIRECT', 'POST_GROUP') NOT NULL,
    name VARCHAR(200) NULL COMMENT 'Group name (null for direct chats)',
    posting_id CHAR(36) NULL COMMENT 'Linked posting for POST_DIRECT and POST_GROUP types',
    posting_title VARCHAR(500) NULL COMMENT 'Cached post title for display',
    created_by BIGINT NOT NULL COMMENT 'User who created the conversation',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_message_at TIMESTAMP NULL DEFAULT NULL,
    is_archived BOOLEAN DEFAULT FALSE,
    archived_at TIMESTAMP NULL DEFAULT NULL,
    participant_count INT DEFAULT 0 COMMENT 'Cached count for performance',

    -- Foreign Keys
    FOREIGN KEY (posting_id) REFERENCES POSTINGS(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES app_users(id) ON DELETE RESTRICT,

    -- Indexes for performance
    INDEX idx_conversations_type (type),
    INDEX idx_conversations_posting (posting_id),
    INDEX idx_conversations_created_by (created_by),
    INDEX idx_conversations_last_message (last_message_at DESC),
    INDEX idx_conversations_archived (is_archived)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CONVERSATION_PARTICIPANTS TABLE
CREATE TABLE CONVERSATION_PARTICIPANTS (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    conversation_id CHAR(36) NOT NULL,
    user_id BIGINT NOT NULL,
    role ENUM('ADMIN', 'MEMBER') DEFAULT 'MEMBER',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP NULL DEFAULT NULL,
    last_read_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Last time user read messages',
    is_muted BOOLEAN DEFAULT FALSE COMMENT 'User muted notifications',
    unread_count INT DEFAULT 0 COMMENT 'Cached unread message count',

    -- Foreign Keys
    FOREIGN KEY (conversation_id) REFERENCES CONVERSATIONS(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE,

    -- Unique constraint: user can only be in conversation once
    UNIQUE KEY unique_user_conversation (conversation_id, user_id),

    -- Indexes for performance
    INDEX idx_participants_user (user_id),
    INDEX idx_participants_conversation (conversation_id),
    INDEX idx_participants_active (conversation_id, user_id, left_at),
    INDEX idx_participants_read (last_read_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- MESSAGES TABLE
CREATE TABLE MESSAGES (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    conversation_id CHAR(36) NOT NULL,
    sender_id BIGINT NOT NULL,
    content TEXT NOT NULL COMMENT 'Message content (encrypted for privacy)',
    encryption_key_id VARCHAR(100) DEFAULT NULL COMMENT 'Encryption key version identifier',
    message_type ENUM('TEXT', 'IMAGE', 'FILE', 'LINK', 'SYSTEM') DEFAULT 'TEXT',
    media_url VARCHAR(500) DEFAULT NULL COMMENT 'URL for images/files',
    media_metadata JSON DEFAULT NULL COMMENT 'File size, name, type, etc.',
    reply_to_id CHAR(36) DEFAULT NULL COMMENT 'ID of message being replied to',
    thread_root_id CHAR(36) DEFAULT NULL COMMENT 'Root message for threaded conversations',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    edited_at TIMESTAMP NULL DEFAULT NULL,
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft delete timestamp',
    is_system_message BOOLEAN DEFAULT FALSE COMMENT 'System-generated message',

    -- Foreign Keys
    FOREIGN KEY (conversation_id) REFERENCES CONVERSATIONS(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES app_users(id) ON DELETE RESTRICT,
    FOREIGN KEY (reply_to_id) REFERENCES MESSAGES(id) ON DELETE SET NULL,
    FOREIGN KEY (thread_root_id) REFERENCES MESSAGES(id) ON DELETE SET NULL,

    -- Indexes for performance
    INDEX idx_messages_conversation_time (conversation_id, created_at DESC),
    INDEX idx_messages_sender (sender_id),
    INDEX idx_messages_type (message_type),
    INDEX idx_messages_deleted (deleted_at),
    INDEX idx_messages_thread (thread_root_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- MESSAGE_REACTIONS TABLE
CREATE TABLE MESSAGE_REACTIONS (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    message_id CHAR(36) NOT NULL,
    user_id BIGINT NOT NULL,
    emoji VARCHAR(10) NOT NULL COMMENT 'Emoji character(s)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Keys
    FOREIGN KEY (message_id) REFERENCES MESSAGES(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE,

    -- Unique constraint: user can only react once with same emoji to same message
    UNIQUE KEY unique_message_user_emoji (message_id, user_id, emoji),

    -- Indexes for performance
    INDEX idx_reactions_message (message_id),
    INDEX idx_reactions_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- MESSAGE_READ_RECEIPTS TABLE
CREATE TABLE MESSAGE_READ_RECEIPTS (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    message_id CHAR(36) NOT NULL,
    user_id BIGINT NOT NULL,
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Keys
    CONSTRAINT fk_receipt_message FOREIGN KEY (message_id)
        REFERENCES MESSAGES(id) ON DELETE CASCADE,
    CONSTRAINT fk_receipt_user FOREIGN KEY (user_id)
        REFERENCES app_users(id) ON DELETE CASCADE,

    -- Unique constraint: user can only mark message as read once
    UNIQUE KEY unique_message_user_read (message_id, user_id),

    -- Indexes for performance
    INDEX idx_receipts_message (message_id),
    INDEX idx_receipts_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SAMPLE DATA
-- ============================================================================

-- Insert sample users (assuming some exist, adjust IDs as needed)
-- Note: Replace with actual user IDs from your system

-- Sample Posts
INSERT INTO POSTINGS (id, author_id, title, content, status, post_type, visibility, category, tags, created_at, published_at) VALUES
(UUID(), 1, 'Welcome to SGS Gita Alumni Network', 'We are excited to launch our new alumni platform! This space will help us stay connected, share opportunities, and build our community.', 'approved', 'announcement', 'alumni_only', 'announcements', '["welcome", "community", "networking"]', NOW(), NOW()),
(UUID(), 2, 'Alumni Reunion 2025', 'Mark your calendars! The SGS Gita Alumni Reunion 2025 will be held on March 15th at the school auditorium. Let''s celebrate our achievements and reconnect with old friends.', 'approved', 'event', 'alumni_only', 'events', '["reunion", "2025", "celebration"]', NOW(), NOW()),
(UUID(), 3, 'Career Opportunity: Software Engineer at TechCorp', 'Great opportunity for recent graduates! TechCorp is hiring software engineers. Requirements: 2+ years experience, strong coding skills. DM me for more details.', 'approved', 'text', 'alumni_only', 'careers', '["job", "software", "engineering", "techcorp"]', NOW(), NOW()),
(UUID(), 4, 'School Infrastructure Updates', 'The school has completed major renovations to the science labs and library. New equipment and books have been added. Students are loving the improvements!', 'approved', 'text', 'public', 'school-updates', '["infrastructure", "labs", "library", "renovation"]', NOW(), NOW());

-- Sample Comments
INSERT INTO POST_COMMENTS (id, post_id, author_id, content, created_at) VALUES
(UUID(), (SELECT id FROM POSTINGS WHERE title LIKE '%Welcome%' LIMIT 1), 2, 'This is fantastic! Looking forward to connecting with everyone.', NOW()),
(UUID(), (SELECT id FROM POSTINGS WHERE title LIKE '%Reunion%' LIMIT 1), 3, 'I''ll definitely be there! Who''s organizing the event?', NOW()),
(UUID(), (SELECT id FROM POSTINGS WHERE title LIKE '%Career%' LIMIT 1), 4, 'This sounds perfect for my niece who just graduated. Can you share more details?', NOW());

-- Sample Likes
INSERT INTO POST_LIKES (id, post_id, user_id, reaction_type, created_at) VALUES
(UUID(), (SELECT id FROM POSTINGS WHERE title LIKE '%Welcome%' LIMIT 1), 2, 'like', NOW()),
(UUID(), (SELECT id FROM POSTINGS WHERE title LIKE '%Welcome%' LIMIT 1), 3, 'love', NOW()),
(UUID(), (SELECT id FROM POSTINGS WHERE title LIKE '%Reunion%' LIMIT 1), 4, 'like', NOW());

-- Sample Conversations
INSERT INTO CONVERSATIONS (id, type, name, created_by, created_at, last_message_at) VALUES
(UUID(), 'GROUP', 'Alumni Coordinators', 1, NOW(), NOW()),
(UUID(), 'DIRECT', NULL, 1, NOW(), NOW()),
(UUID(), 'POST_GROUP', 'Discussion: Alumni Reunion 2025', 2, NOW(), NOW());

-- Update conversation with posting reference
UPDATE CONVERSATIONS SET posting_id = (SELECT id FROM POSTINGS WHERE title LIKE '%Reunion%' LIMIT 1) WHERE type = 'POST_GROUP';

-- Sample Participants
INSERT INTO CONVERSATION_PARTICIPANTS (id, conversation_id, user_id, role, joined_at) VALUES
(UUID(), (SELECT id FROM CONVERSATIONS WHERE name = 'Alumni Coordinators' LIMIT 1), 1, 'ADMIN', NOW()),
(UUID(), (SELECT id FROM CONVERSATIONS WHERE name = 'Alumni Coordinators' LIMIT 1), 2, 'MEMBER', NOW()),
(UUID(), (SELECT id FROM CONVERSATIONS WHERE name = 'Alumni Coordinators' LIMIT 1), 3, 'MEMBER', NOW()),
(UUID(), (SELECT id FROM CONVERSATIONS WHERE type = 'DIRECT' LIMIT 1), 1, 'MEMBER', NOW()),
(UUID(), (SELECT id FROM CONVERSATIONS WHERE type = 'DIRECT' LIMIT 1), 4, 'MEMBER', NOW()),
(UUID(), (SELECT id FROM CONVERSATIONS WHERE type = 'POST_GROUP' LIMIT 1), 2, 'ADMIN', NOW()),
(UUID(), (SELECT id FROM CONVERSATIONS WHERE type = 'POST_GROUP' LIMIT 1), 3, 'MEMBER', NOW()),
(UUID(), (SELECT id FROM CONVERSATIONS WHERE type = 'POST_GROUP' LIMIT 1), 4, 'MEMBER', NOW());

-- Sample Messages
INSERT INTO MESSAGES (id, conversation_id, sender_id, content, message_type, created_at) VALUES
(UUID(), (SELECT id FROM CONVERSATIONS WHERE name = 'Alumni Coordinators' LIMIT 1), 1, 'Welcome to the alumni coordinators group! Let''s plan the reunion.', 'TEXT', NOW()),
(UUID(), (SELECT id FROM CONVERSATIONS WHERE name = 'Alumni Coordinators' LIMIT 1), 2, 'Great! I can help with the venue arrangements.', 'TEXT', NOW()),
(UUID(), (SELECT id FROM CONVERSATIONS WHERE type = 'DIRECT' LIMIT 1), 1, 'Thanks for sharing that job opportunity!', 'TEXT', NOW()),
(UUID(), (SELECT id FROM CONVERSATIONS WHERE type = 'DIRECT' LIMIT 1), 4, 'You''re welcome! Let me know if you need the full job description.', 'TEXT', NOW()),
(UUID(), (SELECT id FROM CONVERSATIONS WHERE type = 'POST_GROUP' LIMIT 1), 2, 'What time should we start the reunion event?', 'TEXT', NOW()),
(UUID(), (SELECT id FROM CONVERSATIONS WHERE type = 'POST_GROUP' LIMIT 1), 3, 'How about 6 PM? That gives people time to arrive after work.', 'TEXT', NOW());

-- Update conversation last_message_at
UPDATE CONVERSATIONS c
JOIN MESSAGES m ON c.id = m.conversation_id
SET c.last_message_at = (
    SELECT MAX(created_at) FROM MESSAGES WHERE conversation_id = c.id
);

-- Update participant counts
UPDATE CONVERSATIONS c
SET participant_count = (
    SELECT COUNT(*) FROM CONVERSATION_PARTICIPANTS
    WHERE conversation_id = c.id AND left_at IS NULL
);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check posts with engagement counts
SELECT
    p.title,
    u.first_name,
    u.last_name,
    p.status,
    p.like_count,
    p.comment_count,
    p.created_at
FROM POSTINGS p
JOIN app_users u ON p.author_id = u.id
ORDER BY p.created_at DESC;

-- Check conversations with participant counts
SELECT
    c.type,
    c.name,
    c.participant_count,
    COUNT(m.id) as message_count,
    c.last_message_at
FROM CONVERSATIONS c
LEFT JOIN MESSAGES m ON c.id = m.conversation_id
GROUP BY c.id, c.type, c.name, c.participant_count, c.last_message_at
ORDER BY c.created_at DESC;

-- Check recent messages
SELECT
    m.content,
    u.first_name,
    u.last_name,
    c.name as conversation_name,
    m.created_at
FROM MESSAGES m
JOIN app_users u ON m.sender_id = u.id
JOIN CONVERSATIONS c ON m.conversation_id = c.id
ORDER BY m.created_at DESC
LIMIT 10;

SELECT 'Chat and Posts modules schema and sample data created successfully!' as status;