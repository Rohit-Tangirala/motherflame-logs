import { Router, Request, Response } from 'express';
import { dbService } from '../db.js';
import { verifyToken, verifyOptionalToken } from '../middleware/verifyToken.js';
import { sendCommentNotificationEmail } from '../utils/sendEmail.js';

const router = Router();

// GET /api/comments/:post_id - Get nested comments for a post
router.get('/:post_id', verifyOptionalToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const postId = parseInt(req.params.post_id, 10);
    if (isNaN(postId)) {
      res.status(400).json({ message: 'Invalid post ID.' });
      return;
    }
    const comments = await dbService.getComments(postId, user?.id);
    res.status(200).json(comments);
  } catch (error: any) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Error fetching comments.' });
  }
});

// POST /api/comments/:id/like - Toggle comment like
router.post('/:id/like', verifyToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const commentId = parseInt(req.params.id, 10);
    if (isNaN(commentId)) {
      res.status(400).json({ message: 'Invalid comment ID.' });
      return;
    }
    const result = await dbService.toggleCommentLike(commentId, user.id);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ message: 'Error toggling comment like.' });
  }
});

// POST /api/comments - Create comment (Protected)
router.post('/', verifyToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { post_id, body, parent_id, image_url } = req.body;

    if (!post_id || !body) {
      res.status(400).json({ message: 'Post ID and body are required.' });
      return;
    }

    const comment = await dbService.createComment(
      parseInt(post_id, 10),
      user.id,
      body,
      parent_id ? parseInt(parent_id, 10) : null,
      image_url || null
    );

    // Trigger asynchronous email notification to the post author
    // Don't block the API response for email sending
    (async () => {
      try {
        // Find post and its author
        const posts = await dbService.getPosts({ status: 'published' });
        // Wait, what if the post is in drafts? Let's check both draft and published posts or get post directly by slug/id.
        // Let's search inside the posts DB.
        // Actually, dbService has getPostBySlug or we can search in dbService.getPosts without status filter!
        const allPostsOfAuthor = await dbService.getPosts({ userId: undefined });
        const post = allPostsOfAuthor.find(p => p.id === parseInt(post_id, 10));

        if (post) {
          const author = await dbService.getUserById(post.user_id);
          if (author && author.email && author.id !== user.id) { // Don't notify if commenting on your own post
            const commentPreview = body.length > 100 ? body.substring(0, 97) + '...' : body;
            await sendCommentNotificationEmail({
              authorEmail: author.email,
              authorName: author.name,
              commenterName: user.name,
              commentPreview,
              postTitle: post.title,
              postSlug: post.slug,
            });
          }
        }
      } catch (err) {
        console.error('Failed to send comment notification email:', err);
      }
    })();

    res.status(201).json(comment);
  } catch (error: any) {
    console.error('Error creating comment:', error);
    res.status(500).json({ message: 'Error posting comment.' });
  }
});

// DELETE /api/comments/:id - Delete comment (Protected: owner or admin)
router.delete('/:id', verifyToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const commentId = parseInt(req.params.id, 10);

    if (isNaN(commentId)) {
      res.status(400).json({ message: 'Invalid comment ID.' });
      return;
    }

    const success = await dbService.deleteComment(commentId, user.id, user.role);
    if (!success) {
      res.status(404).json({ message: 'Comment not found or unauthorized to delete.' });
      return;
    }

    res.status(200).json({ message: 'Comment deleted successfully.', id: commentId });
  } catch (error: any) {
    console.error('Error deleting comment:', error);
    if (error.message === 'Unauthorized comment delete') {
      res.status(403).json({ message: 'Forbidden. You cannot delete this comment.' });
    } else {
      res.status(500).json({ message: 'Error deleting comment.' });
    }
  }
});

export default router;
