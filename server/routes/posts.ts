import { Router, Request, Response } from 'express';
import { dbService } from '../db.js';
import { verifyToken, verifyOptionalToken } from '../middleware/verifyToken.js';
import { slugify } from '../utils/slugify.js';

const router = Router();

// GET /api/posts - Returns all published posts (with filters)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, tag, search } = req.query;
    const posts = await dbService.getPosts({
      category: category as string,
      tag: tag as string,
      search: search as string,
      status: 'published'
    });
    res.status(200).json(posts);
  } catch (error: any) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Error fetching posts.' });
  }
});

// GET /api/posts/categories - Get distinct list of categories & all tags
router.get('/meta', async (req: Request, res: Response) => {
  try {
    const posts = await dbService.getPosts({ status: 'published' });
    const categories = Array.from(new Set(posts.map(p => p.category).filter(Boolean)));
    const tags = await dbService.getTags();
    res.status(200).json({ categories, tags });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching metadata.' });
  }
});

// GET /api/posts/my - Returns logged-in user's own posts (drafts + published) (Protected)
router.get('/my', verifyToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const posts = await dbService.getPosts({
      userId: user.id
    });
    res.status(200).json(posts);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching your posts.' });
  }
});

// GET /api/posts/bookmarks/me - Get current user's bookmarked posts
router.get('/bookmarks/me', verifyToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const posts = await dbService.getBookmarkedPosts(user.id);
    res.status(200).json(posts);
  } catch (error: any) {
    console.error('Error fetching bookmarks:', error);
    res.status(500).json({ message: 'Error fetching bookmarks.' });
  }
});

// GET /api/posts/author/:userId - Returns published posts for specific author
router.get('/author/:userId', async (req: Request, res: Response) => {
  try {
    const authorId = parseInt(req.params.userId, 10);
    const posts = await dbService.getPosts({
      userId: authorId,
      status: 'published'
    });
    res.status(200).json(posts);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching author posts.' });
  }
});

// GET /api/posts/:slug - Returns single post with author and tags
router.get('/:slug', verifyOptionalToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const post = await dbService.getPostBySlug(req.params.slug, user?.id);
    if (!post) {
      res.status(404).json({ message: 'Post not found.' });
      return;
    }
    res.status(200).json(post);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching post details.' });
  }
});

// POST /api/posts/:slug/like - Toggle post like
router.post('/:slug/like', verifyToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const post = await dbService.getPostBySlug(req.params.slug);
    if (!post) {
      res.status(404).json({ message: 'Post not found.' });
      return;
    }
    const result = await dbService.togglePostLike(post.id, user.id);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ message: 'Error toggling like.' });
  }
});

// POST /api/posts/:slug/bookmark - Toggle post bookmark
router.post('/:slug/bookmark', verifyToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const post = await dbService.getPostBySlug(req.params.slug);
    if (!post) {
      res.status(404).json({ message: 'Post not found.' });
      return;
    }
    const result = await dbService.toggleBookmark(user.id, post.id);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ message: 'Error toggling bookmark.' });
  }
});

// POST /api/posts - Create post (Protected)
router.post('/', verifyToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { title, content, cover_image, category, status, tags } = req.body;

    if (!title || !content) {
      res.status(400).json({ message: 'Title and content are required.' });
      return;
    }

    // Generate unique slug
    let baseSlug = slugify(title);
    if (!baseSlug) baseSlug = 'untitled-post';
    
    let slug = baseSlug;
    let suffix = 1;
    let existingPost = await dbService.getPostBySlug(slug);
    while (existingPost) {
      slug = `${baseSlug}-${suffix}`;
      suffix++;
      existingPost = await dbService.getPostBySlug(slug);
    }

    const postTags = Array.isArray(tags) ? tags : [];

    const post = await dbService.createPost(
      user.id,
      title,
      slug,
      content,
      cover_image,
      category,
      status || 'draft',
      postTags
    );

    res.status(201).json(post);
  } catch (error: any) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Error creating post.' });
  }
});

// PUT /api/posts/:slug - Edit post (Protected)
router.put('/:slug', verifyToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { title, content, cover_image, category, status, tags } = req.body;

    if (!title || !content) {
      res.status(400).json({ message: 'Title and content are required.' });
      return;
    }

    const post = await dbService.getPostBySlug(req.params.slug);
    if (!post) {
      res.status(404).json({ message: 'Post not found.' });
      return;
    }

    if (post.user_id !== user.id && user.role !== 'admin') {
      res.status(403).json({ message: 'Forbidden. You do not own this post.' });
      return;
    }

    // Handle slug change if title changed
    let newSlug = post.slug;
    if (title !== post.title) {
      let baseSlug = slugify(title);
      if (!baseSlug) baseSlug = 'untitled-post';
      newSlug = baseSlug;
      let suffix = 1;
      let existingPost = await dbService.getPostBySlug(newSlug);
      while (existingPost && existingPost.id !== post.id) {
        newSlug = `${baseSlug}-${suffix}`;
        suffix++;
        existingPost = await dbService.getPostBySlug(newSlug);
      }
    }

    const postTags = Array.isArray(tags) ? tags : [];

    await dbService.updatePost(
      post.slug,
      user.id,
      user.role,
      title,
      newSlug,
      content,
      cover_image,
      category,
      status,
      postTags
    );

    const updatedPost = await dbService.getPostBySlug(newSlug);
    res.status(200).json(updatedPost);
  } catch (error: any) {
    console.error('Error updating post:', error);
    res.status(500).json({ message: 'Error updating post.' });
  }
});

// DELETE /api/posts/:slug - Delete post (Protected)
router.delete('/:slug', verifyToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const post = await dbService.getPostBySlug(req.params.slug);
    if (!post) {
      res.status(404).json({ message: 'Post not found.' });
      return;
    }

    if (post.user_id !== user.id && user.role !== 'admin') {
      res.status(403).json({ message: 'Forbidden. You do not own this post.' });
      return;
    }

    await dbService.deletePost(post.slug, user.id, user.role);
    res.status(200).json({ message: 'Post successfully deleted.', slug: post.slug });
  } catch (error: any) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Error deleting post.' });
  }
});

export default router;
