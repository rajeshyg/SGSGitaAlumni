/**
 * Activity Feed Routes
 * Task 7.4.1 - Dashboard Feed Integration
 * 
 * Provides API endpoints for activity feed and engagement
 */

import { v4 as uuidv4 } from 'uuid';

let pool;

export const setFeedPool = (dbPool) => {
  pool = dbPool;
};

// ============================================================================
// FEED ENDPOINTS
// ============================================================================

/**
 * GET /api/feed
 * Get activity feed with pagination and filtering
 */
export const getFeed = async (req, res) => {
  try {
    const { type = 'all', page = 1, limit = 20 } = req.query;
    const userId = req.user.id;
    const offset = (page - 1) * limit;
    
    let typeFilter = '';
    if (type !== 'all') {
      if (type === 'postings') {
        typeFilter = "AND af.item_type = 'posting'";
      } else if (type === 'events') {
        typeFilter = "AND af.item_type = 'event'";
      }
    }
    
    // Get feed items with engagement counts
    const [feedItems] = await pool.query(`
      SELECT 
        af.*,
        COALESCE(fec.like_count, 0) as likes,
        COALESCE(fec.comment_count, 0) as comments,
        COALESCE(fec.share_count, 0) as shares,
        EXISTS(
          SELECT 1 FROM FEED_ENGAGEMENT 
          WHERE feed_item_id = af.id 
          AND user_id = ? 
          AND engagement_type = 'like'
        ) as user_liked
      FROM ACTIVITY_FEED af
      LEFT JOIN FEED_ENGAGEMENT_COUNTS fec ON af.id = fec.feed_item_id
      WHERE af.user_id = ? ${typeFilter}
      ORDER BY af.created_at DESC
      LIMIT ? OFFSET ?
    `, [userId, userId, parseInt(limit), parseInt(offset)]);
    
    // Format feed items
    const formattedItems = feedItems.map(item => ({
      id: item.id,
      type: item.item_type,
      timestamp: item.created_at,
      author: {
        id: item.author_id,
        name: item.author_name,
        avatar: item.author_avatar
      },
      title: item.title,
      content: item.content,
      engagement: {
        likes: item.likes,
        comments: item.comments,
        shares: item.shares,
        user_liked: Boolean(item.user_liked)
      }
    }));
    
    res.json({
      success: true,
      items: formattedItems,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: feedItems.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching feed:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch feed' 
    });
  }
};

/**
 * POST /api/feed/items/:id/like
 * Toggle like on feed item
 */
export const toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if user already liked this item
    const [existing] = await pool.query(`
      SELECT id FROM FEED_ENGAGEMENT 
      WHERE feed_item_id = ? AND user_id = ? AND engagement_type = 'like'
    `, [id, userId]);
    
    if (existing.length > 0) {
      // Unlike - remove the like
      await pool.query(`
        DELETE FROM FEED_ENGAGEMENT 
        WHERE feed_item_id = ? AND user_id = ? AND engagement_type = 'like'
      `, [id, userId]);
    } else {
      // Like - add the like
      const engagementId = uuidv4();
      await pool.query(`
        INSERT INTO FEED_ENGAGEMENT (id, feed_item_id, user_id, engagement_type)
        VALUES (?, ?, ?, 'like')
      `, [engagementId, id, userId]);
    }
    
    // Get updated like count
    const [counts] = await pool.query(`
      SELECT COUNT(*) as like_count
      FROM FEED_ENGAGEMENT
      WHERE feed_item_id = ? AND engagement_type = 'like'
    `, [id]);
    
    res.json({
      success: true,
      liked: existing.length === 0,
      likeCount: counts[0].like_count
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to toggle like' 
    });
  }
};

/**
 * POST /api/feed/items/:id/comment
 * Add comment to feed item
 */
export const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const userId = req.user.id;
    
    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Comment text is required'
      });
    }
    
    const commentId = uuidv4();
    await pool.query(`
      INSERT INTO FEED_ENGAGEMENT (id, feed_item_id, user_id, engagement_type, comment_text)
      VALUES (?, ?, ?, 'comment', ?)
    `, [commentId, id, userId, comment]);
    
    // Get updated comment count
    const [counts] = await pool.query(`
      SELECT COUNT(*) as comment_count
      FROM FEED_ENGAGEMENT
      WHERE feed_item_id = ? AND engagement_type = 'comment'
    `, [id]);
    
    res.json({
      success: true,
      comment: {
        id: commentId,
        text: comment,
        userId,
        createdAt: new Date()
      },
      commentCount: counts[0].comment_count
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to add comment' 
    });
  }
};

/**
 * POST /api/feed/items/:id/share
 * Share feed item
 */
export const shareFeedItem = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const shareId = uuidv4();
    await pool.query(`
      INSERT INTO FEED_ENGAGEMENT (id, feed_item_id, user_id, engagement_type)
      VALUES (?, ?, ?, 'share')
      ON DUPLICATE KEY UPDATE created_at = CURRENT_TIMESTAMP
    `, [shareId, id, userId]);
    
    // Get updated share count
    const [counts] = await pool.query(`
      SELECT COUNT(*) as share_count
      FROM FEED_ENGAGEMENT
      WHERE feed_item_id = ? AND engagement_type = 'share'
    `, [id]);
    
    res.json({
      success: true,
      shareCount: counts[0].share_count
    });
  } catch (error) {
    console.error('Error sharing feed item:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to share feed item' 
    });
  }
};

/**
 * GET /api/feed/items/:id/comments
 * Get comments for a feed item
 */
export const getComments = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [comments] = await pool.query(`
      SELECT 
        fe.id,
        fe.comment_text,
        fe.created_at,
        fe.user_id,
        u.first_name,
        u.last_name,
        u.profile_picture_url
      FROM FEED_ENGAGEMENT fe
      JOIN app_users u ON fe.user_id = u.id
      WHERE fe.feed_item_id = ? AND fe.engagement_type = 'comment'
      ORDER BY fe.created_at DESC
    `, [id]);
    
    const formattedComments = comments.map(c => ({
      id: c.id,
      text: c.comment_text,
      createdAt: c.created_at,
      author: {
        id: c.user_id,
        name: `${c.first_name} ${c.last_name}`,
        avatar: c.profile_picture_url
      }
    }));
    
    res.json({
      success: true,
      comments: formattedComments
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch comments' 
    });
  }
};

/**
 * Helper function to create feed item
 * Called by other parts of the application when creating postings, events, etc.
 */
export async function createFeedItem(itemData) {
  const { userId, itemType, itemId, title, content, authorId, authorName, authorAvatar } = itemData;
  
  const feedId = uuidv4();
  await pool.query(`
    INSERT INTO ACTIVITY_FEED (
      id, user_id, item_type, item_id, title, content,
      author_id, author_name, author_avatar
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [feedId, userId, itemType, itemId, title, content, authorId, authorName, authorAvatar]);
  
  return feedId;
}

