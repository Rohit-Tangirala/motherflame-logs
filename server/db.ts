import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

// Define DB Types
export interface User {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: 'user' | 'admin';
  avatar_url?: string;
  created_at?: Date;
}

export interface Post {
  id: number;
  user_id: number;
  title: string;
  slug: string;
  content: string;
  cover_image?: string;
  category?: string;
  status: 'draft' | 'published';
  read_time: number;
  created_at: Date;
  author_name?: string;
  author_avatar?: string;
  tags?: string[];
  likes_count?: number;
  comments_count?: number;
  has_liked?: boolean;
  has_bookmarked?: boolean;
}

export interface Comment {
  id: number;
  post_id: number;
  user_id: number;
  parent_id: number | null;
  body: string;
  image_url?: string;
  created_at: Date;
  user_name?: string;
  user_avatar?: string;
  replies?: Comment[];
  likes_count?: number;
  has_liked?: boolean;
}

export interface Like {
  id: number;
  user_id: number;
  post_id: number;
  created_at: Date;
}

export interface CommentLike {
  id: number;
  user_id: number;
  comment_id: number;
  created_at: Date;
}

export interface Tag {
  id: number;
  name: string;
}

// Check if MySQL is configured
const isMySqlConfigured = !!(
  process.env.DB_HOST &&
  process.env.DB_USER &&
  process.env.DB_PASSWORD &&
  process.env.DB_NAME
);

let pool: mysql.Pool | null = null;
export { pool };

if (isMySqlConfigured) {
  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: {
        rejectUnauthorized: false,
      },
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
    console.log('MySQL connection pool initialized with Aiven SSL');
  } catch (error) {
    console.error('Failed to initialize MySQL pool:', error);
  }
} else {
  console.log('Using in-memory database fallback for AI Studio Preview.');
}

// In-Memory Fallback State (with persistence to server/db_fallback.json for seamless resets/restarts)
const FALLBACK_FILE = path.join(process.cwd(), 'server', 'db_fallback.json');

interface FallbackSchema {
  users: User[];
  posts: Post[];
  tags: Tag[];
  post_tags: { post_id: number; tag_id: number }[];
  comments: Comment[];
  likes: Like[];
  comment_likes: CommentLike[];
  subscribers: { id: number; email: string; subscribed_at: Date }[];
  bookmarks: { id: number; user_id: number; post_id: number; created_at: Date }[];
}

let fallbackData: FallbackSchema = {
  users: [],
  posts: [],
  tags: [],
  post_tags: [],
  comments: [],
  likes: [],
  comment_likes: [],
  subscribers: [],
  bookmarks: [],
};

// Ensure fallback folder exists
const fallbackDir = path.dirname(FALLBACK_FILE);
if (!fs.existsSync(fallbackDir)) {
  fs.mkdirSync(fallbackDir, { recursive: true });
}

function loadFallback() {
  if (fs.existsSync(FALLBACK_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(FALLBACK_FILE, 'utf-8'));
      fallbackData = data;
    } catch (e) {
      console.error('Error reading fallback file:', e);
    }
  }
}

function saveFallback() {
  try {
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(fallbackData, null, 2));
  } catch (e) {
    console.error('Error writing fallback file:', e);
  }
}

// Initial fallback load
loadFallback();

// Initialize tables in MySQL
export async function initDb() {
  if (pool) {
    const connection = await pool.getConnection();
    try {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role ENUM('user', 'admin') DEFAULT 'user',
          avatar_url VARCHAR(500),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      try {
        await connection.query('ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500) DEFAULT NULL');
      } catch (err) {
        // Column may already exist
      }

      try {
        await connection.query("ALTER TABLE users ADD COLUMN role ENUM('user', 'admin') DEFAULT 'user'");
      } catch (err) {
        // Column may already exist
      }

      await connection.query(`
        CREATE TABLE IF NOT EXISTS posts (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          title VARCHAR(255) NOT NULL,
          slug VARCHAR(255) UNIQUE NOT NULL,
          content LONGTEXT NOT NULL,
          cover_image VARCHAR(500),
          category VARCHAR(100),
          status ENUM('draft', 'published') DEFAULT 'draft',
          read_time INT DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      await connection.query(`
        CREATE TABLE IF NOT EXISTS tags (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) UNIQUE NOT NULL
        )
      `);

      await connection.query(`
        CREATE TABLE IF NOT EXISTS post_tags (
          post_id INT NOT NULL,
          tag_id INT NOT NULL,
          PRIMARY KEY (post_id, tag_id),
          FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
          FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
        )
      `);

      await connection.query(`
        CREATE TABLE IF NOT EXISTS comments (
          id INT AUTO_INCREMENT PRIMARY KEY,
          post_id INT NOT NULL,
          user_id INT NOT NULL,
          parent_id INT DEFAULT NULL,
          body TEXT NOT NULL,
          image_url VARCHAR(500) DEFAULT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
        )
      `);

      try {
        await connection.query('ALTER TABLE comments ADD COLUMN image_url VARCHAR(500) DEFAULT NULL');
      } catch (err) {
        // Column may already exist
      }

      await connection.query(`
        CREATE TABLE IF NOT EXISTS bookmarks (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          post_id INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY unique_user_post_bookmark (user_id, post_id),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
        )
      `);

      await connection.query(`
        CREATE TABLE IF NOT EXISTS likes (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          post_id INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY unique_user_post_like (user_id, post_id),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
        )
      `);

      await connection.query(`
        CREATE TABLE IF NOT EXISTS comment_likes (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          comment_id INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY unique_user_comment_like (user_id, comment_id),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE
        )
      `);

      await connection.query(`
        CREATE TABLE IF NOT EXISTS subscribers (
          id INT AUTO_INCREMENT PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      console.log('MySQL Tables verified/created successfully.');
    } catch (error) {
      console.error('Error creating MySQL tables:', error);
    } finally {
      connection.release();
    }
  } else {
    // If fallback is empty, let's load some initial sample data so the app looks fantastic immediately
    if (fallbackData.users.length === 0) {
      const bcrypt = await import('bcryptjs');
      const adminPasswordHash = await bcrypt.default.hash('admin123', 10);
      const userPasswordHash = await bcrypt.default.hash('user123', 10);

      const adminUser: User = {
        id: 1,
        name: 'Rohit',
        email: 'admin@rohit.com',
        password_hash: adminPasswordHash,
        role: 'admin',
        avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
        created_at: new Date(),
      };

      const regularUser: User = {
        id: 2,
        name: 'Sarah Chen',
        email: 'sarah@example.com',
        password_hash: userPasswordHash,
        role: 'user',
        avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80',
        created_at: new Date(),
      };

      fallbackData.users.push(adminUser, regularUser);

      // Add dummy tags
      fallbackData.tags.push(
        { id: 1, name: 'Design' },
        { id: 2, name: 'Web Dev' },
        { id: 3, name: 'Lifestyle' },
        { id: 4, name: 'AI' }
      );

      // Add dummy posts
      fallbackData.posts.push(
        {
          id: 1,
          user_id: 1,
          title: 'The Art of Distraction-Free Reading',
          slug: 'the-art-of-distraction-free-reading',
          content: '<p>Reading should be an immersive experience. In a world full of notifications, banners, and sidebar clutter, we need a space that honors the written word. We have designed this editorial platform with absolute focus: generous line height, gorgeous display typography, and zero unneeded noise.</p><p>We hope this becomes your sanctuary for thoughts, ideas, and stories that deserve to be read slowly.</p>',
          cover_image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1200&h=630&q=80',
          category: 'Design',
          status: 'published',
          read_time: 2,
          created_at: new Date(Date.now() - 3600000 * 24 * 3), // 3 days ago
        },
        {
          id: 2,
          user_id: 2,
          title: 'Building Minimalist Web Applications in 2026',
          slug: 'building-minimalist-web-applications-in-2026',
          content: '<p>The modern web is often bloated. Framework after framework is piled on top of complex build setups. But the core principles of good engineering never change: simplicity, speed, and elegance. In this post, we explore how to build fast, lightweight full-stack applications with beautiful minimalist design languages, responsive layout dynamics, and zero artificial clutter.</p>',
          cover_image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&h=630&q=80',
          category: 'Web Dev',
          status: 'published',
          read_time: 3,
          created_at: new Date(Date.now() - 3600000 * 24 * 1), // 1 day ago
        }
      );

      // Tag associations
      fallbackData.post_tags.push(
        { post_id: 1, tag_id: 1 },
        { post_id: 1, tag_id: 3 },
        { post_id: 2, tag_id: 2 }
      );

      // Add dummy comments
      fallbackData.comments.push(
        {
          id: 1,
          post_id: 1,
          user_id: 2,
          parent_id: null,
          body: 'This is exactly what the modern web needs. Beautiful, clean typography that lets the content shine.',
          created_at: new Date(Date.now() - 3600000 * 4), // 4 hours ago
        },
        {
          id: 2,
          post_id: 1,
          user_id: 1,
          parent_id: 1,
          body: 'Thank you Sarah! We spent a lot of time perfecting the layout and tracking.',
          created_at: new Date(Date.now() - 3600000 * 3), // 3 hours ago
        }
      );

      saveFallback();
    }
  }
}

// Global DB Operations
export const dbService = {
  // USER OPERATIONS
  async createUser(name: string, email: string, passwordHash: string, role: 'user' | 'admin' = 'user', avatarUrl?: string): Promise<User> {
    if (pool) {
      const [result] = await pool.query(
        'INSERT INTO users (name, email, password_hash, role, avatar_url) VALUES (?, ?, ?, ?, ?)',
        [name, email, passwordHash, role, avatarUrl || null]
      );
      const insertId = (result as any).insertId;
      return { id: insertId, name, email, password_hash: passwordHash, role, avatar_url: avatarUrl };
    } else {
      const newUser: User = {
        id: fallbackData.users.length + 1,
        name,
        email,
        password_hash: passwordHash,
        role,
        avatar_url: avatarUrl,
        created_at: new Date(),
      };
      fallbackData.users.push(newUser);
      saveFallback();
      return newUser;
    }
  },

  async getUserByEmail(email: string): Promise<User | null> {
    if (pool) {
      const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
      const users = rows as User[];
      return users.length > 0 ? users[0] : null;
    } else {
      const user = fallbackData.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      return user || null;
    }
  },

  async getUserById(id: number): Promise<User | null> {
    if (pool) {
      const [rows] = await pool.query('SELECT id, name, email, role, avatar_url, created_at FROM users WHERE id = ?', [id]);
      const users = rows as User[];
      return users.length > 0 ? users[0] : null;
    } else {
      const user = fallbackData.users.find(u => u.id === id);
      if (!user) return null;
      return { id: user.id, name: user.name, email: user.email, role: user.role, avatar_url: user.avatar_url, created_at: user.created_at } as any;
    }
  },

  // POST OPERATIONS
  async getPosts(filters: { category?: string; tag?: string; search?: string; status?: 'draft' | 'published'; userId?: number; currentUserId?: number }): Promise<Post[]> {
    if (pool) {
      const uid = filters.currentUserId ? Number(filters.currentUserId) : null;
      let queryStr = `
        SELECT p.*, u.name as author_name, u.avatar_url as author_avatar,
          (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as likes_count,
          (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comments_count
          ${uid ? `, (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id AND l.user_id = ${uid}) as has_liked_raw, (SELECT COUNT(*) FROM bookmarks b WHERE b.post_id = p.id AND b.user_id = ${uid}) as has_bookmarked_raw` : ''}
        FROM posts p
        JOIN users u ON p.user_id = u.id
      `;
      const params: any[] = [];
      const conditions: string[] = [];

      if (filters.status) {
        conditions.push('p.status = ?');
        params.push(filters.status);
      }

      if (filters.userId) {
        conditions.push('p.user_id = ?');
        params.push(filters.userId);
      }

      if (filters.category) {
        conditions.push('p.category = ?');
        params.push(filters.category);
      }

      if (filters.search) {
        conditions.push('(p.title LIKE ? OR p.content LIKE ?)');
        const match = `%${filters.search}%`;
        params.push(match, match);
      }

      if (filters.tag) {
        conditions.push(`
          p.id IN (
            SELECT pt.post_id 
            FROM post_tags pt 
            JOIN tags t ON pt.tag_id = t.id 
            WHERE t.name = ?
          )
        `);
        params.push(filters.tag);
      }

      if (conditions.length > 0) {
        queryStr += ' WHERE ' + conditions.join(' AND ');
      }

      queryStr += ' ORDER BY p.created_at DESC';

      const [rows] = await pool.query(queryStr, params);
      const posts = rows as any[];

      // Fetch tags for each post
      for (const post of posts) {
        if (uid) {
          post.has_liked = post.has_liked_raw > 0;
          post.has_bookmarked = post.has_bookmarked_raw > 0;
        }
        const [tagRows] = await pool.query(`
          SELECT t.name 
          FROM tags t
          JOIN post_tags pt ON t.id = pt.tag_id
          WHERE pt.post_id = ?
        `, [post.id]);
        post.tags = (tagRows as any[]).map(r => r.name);
      }

      return posts;
    } else {
      let filtered = [...fallbackData.posts];

      if (filters.status) {
        filtered = filtered.filter(p => p.status === filters.status);
      }
      if (filters.userId) {
        filtered = filtered.filter(p => p.user_id === filters.userId);
      }
      if (filters.category) {
        filtered = filtered.filter(p => p.category?.toLowerCase() === filters.category?.toLowerCase());
      }
      if (filters.search) {
        const s = filters.search.toLowerCase();
        filtered = filtered.filter(p => p.title.toLowerCase().includes(s) || p.content.toLowerCase().includes(s));
      }
      if (filters.tag) {
        const tagObj = fallbackData.tags.find(t => t.name.toLowerCase() === filters.tag?.toLowerCase());
        if (tagObj) {
          const matchingPostIds = fallbackData.post_tags
            .filter(pt => pt.tag_id === tagObj.id)
            .map(pt => pt.post_id);
          filtered = filtered.filter(p => matchingPostIds.includes(p.id));
        } else {
          filtered = [];
        }
      }

      // Map author and tags
      const results = filtered.map(p => {
        const author = fallbackData.users.find(u => u.id === p.user_id);
        const postTagsAssoc = fallbackData.post_tags.filter(pt => pt.post_id === p.id);
        const tags = postTagsAssoc.map(pt => {
          const t = fallbackData.tags.find(tag => tag.id === pt.tag_id);
          return t ? t.name : '';
        }).filter(Boolean);

        const likes_count = fallbackData.likes.filter(l => l.post_id === p.id).length;
        const comments_count = fallbackData.comments.filter(c => c.post_id === p.id).length;

        return {
          ...p,
          author_name: author ? author.name : 'Unknown',
          author_avatar: author?.avatar_url,
          tags,
          likes_count,
          comments_count,
        };
      });

      // Sort descending
      return results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  },

  async getPostBySlug(slug: string, currentUserId?: number): Promise<Post | null> {
    if (pool) {
      const [rows] = await pool.query(`
        SELECT p.*, u.name as author_name, u.avatar_url as author_avatar,
          (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as likes_count,
          (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comments_count
          ${currentUserId ? `, (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id AND l.user_id = ?) as has_liked_raw, (SELECT COUNT(*) FROM bookmarks b WHERE b.post_id = p.id AND b.user_id = ?) as has_bookmarked_raw` : ''}
        FROM posts p
        JOIN users u ON p.user_id = u.id
        WHERE p.slug = ?
      `, currentUserId ? [currentUserId, currentUserId, slug] : [slug]);
      const posts = rows as any[];
      if (posts.length === 0) return null;

      const post = posts[0] as Post;
      if (currentUserId) {
        post.has_liked = posts[0].has_liked_raw > 0;
        post.has_bookmarked = posts[0].has_bookmarked_raw > 0;
      } else {
        post.has_liked = false;
        post.has_bookmarked = false;
      }
      
      const [tagRows] = await pool.query(`
        SELECT t.name 
        FROM tags t
        JOIN post_tags pt ON t.id = pt.tag_id
        WHERE pt.post_id = ?
      `, [post.id]);
      post.tags = (tagRows as any[]).map(r => r.name);

      return post;
    } else {
      const post = fallbackData.posts.find(p => p.slug === slug);
      if (!post) return null;

      const author = fallbackData.users.find(u => u.id === post.user_id);
      const postTagsAssoc = fallbackData.post_tags.filter(pt => pt.post_id === post.id);
      const tags = postTagsAssoc.map(pt => {
        const t = fallbackData.tags.find(tag => tag.id === pt.tag_id);
        return t ? t.name : '';
      }).filter(Boolean);

      const likes_count = fallbackData.likes.filter(l => l.post_id === post.id).length;
      const comments_count = fallbackData.comments.filter(c => c.post_id === post.id).length;
      const has_liked = currentUserId ? fallbackData.likes.some(l => l.post_id === post.id && l.user_id === currentUserId) : false;

      return {
        ...post,
        author_name: author ? author.name : 'Unknown',
        author_avatar: author?.avatar_url,
        tags,
        likes_count,
        comments_count,
        has_liked
      };
    }
  },

  async createPost(userId: number, title: string, slug: string, content: string, coverImage?: string, category?: string, status: 'draft' | 'published' = 'draft', tags: string[] = []): Promise<Post> {
    const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length;
    const readTime = Math.max(1, Math.round(wordCount / 200));

    if (pool) {
      const [result] = await pool.query(`
        INSERT INTO posts (user_id, title, slug, content, cover_image, category, status, read_time)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [userId, title, slug, content, coverImage || null, category || null, status, readTime]);
      const insertId = (result as any).insertId;

      // Handle tags
      if (tags.length > 0) {
        for (const tagName of tags) {
          const trimmed = tagName.trim();
          if (!trimmed) continue;
          // Insert or get tag
          await pool.query('INSERT IGNORE INTO tags (name) VALUES (?)', [trimmed]);
          const [tagRows] = await pool.query('SELECT id FROM tags WHERE name = ?', [trimmed]);
          const tagId = (tagRows as any[])[0].id;
          await pool.query('INSERT IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)', [insertId, tagId]);
        }
      }

      return {
        id: insertId,
        user_id: userId,
        title,
        slug,
        content,
        cover_image: coverImage,
        category,
        status,
        read_time: readTime,
        created_at: new Date(),
      };
    } else {
      const newPostId = fallbackData.posts.length > 0 ? Math.max(...fallbackData.posts.map(p => p.id)) + 1 : 1;
      const newPost: Post = {
        id: newPostId,
        user_id: userId,
        title,
        slug,
        content,
        cover_image: coverImage,
        category,
        status,
        read_time: readTime,
        created_at: new Date(),
      };
      fallbackData.posts.push(newPost);

      // Handle tags in-memory
      for (const tagName of tags) {
        const trimmed = tagName.trim();
        if (!trimmed) continue;
        let tag = fallbackData.tags.find(t => t.name.toLowerCase() === trimmed.toLowerCase());
        if (!tag) {
          const newTagId = fallbackData.tags.length > 0 ? Math.max(...fallbackData.tags.map(t => t.id)) + 1 : 1;
          tag = { id: newTagId, name: trimmed };
          fallbackData.tags.push(tag);
        }
        fallbackData.post_tags.push({ post_id: newPostId, tag_id: tag.id });
      }

      saveFallback();
      return newPost;
    }
  },

  async updatePost(slug: string, userId: number, role: 'user' | 'admin', title: string, newSlug: string, content: string, coverImage?: string, category?: string, status?: 'draft' | 'published', tags: string[] = []): Promise<boolean> {
    const post = await this.getPostBySlug(slug);
    if (!post) return false;

    // Authorization
    if (post.user_id !== userId && role !== 'admin') {
      throw new Error('Unauthorized update attempt');
    }

    const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length;
    const readTime = Math.max(1, Math.round(wordCount / 200));

    if (pool) {
      await pool.query(`
        UPDATE posts 
        SET title = ?, slug = ?, content = ?, cover_image = ?, category = ?, status = ?, read_time = ?
        WHERE id = ?
      `, [title, newSlug, content, coverImage || post.cover_image, category || null, status || post.status, readTime, post.id]);

      // Delete existing tags for this post
      await pool.query('DELETE FROM post_tags WHERE post_id = ?', [post.id]);

      // Handle tags
      if (tags.length > 0) {
        for (const tagName of tags) {
          const trimmed = tagName.trim();
          if (!trimmed) continue;
          await pool.query('INSERT IGNORE INTO tags (name) VALUES (?)', [trimmed]);
          const [tagRows] = await pool.query('SELECT id FROM tags WHERE name = ?', [trimmed]);
          const tagId = (tagRows as any[])[0].id;
          await pool.query('INSERT IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)', [post.id, tagId]);
        }
      }

      return true;
    } else {
      const idx = fallbackData.posts.findIndex(p => p.id === post.id);
      if (idx === -1) return false;

      fallbackData.posts[idx] = {
        ...fallbackData.posts[idx],
        title,
        slug: newSlug,
        content,
        cover_image: coverImage || post.cover_image,
        category,
        status: status || post.status,
        read_time: readTime,
      };

      // Remove previous tag associations
      fallbackData.post_tags = fallbackData.post_tags.filter(pt => pt.post_id !== post.id);

      // Handle tags
      for (const tagName of tags) {
        const trimmed = tagName.trim();
        if (!trimmed) continue;
        let tag = fallbackData.tags.find(t => t.name.toLowerCase() === trimmed.toLowerCase());
        if (!tag) {
          const newTagId = fallbackData.tags.length > 0 ? Math.max(...fallbackData.tags.map(t => t.id)) + 1 : 1;
          tag = { id: newTagId, name: trimmed };
          fallbackData.tags.push(tag);
        }
        fallbackData.post_tags.push({ post_id: post.id, tag_id: tag.id });
      }

      saveFallback();
      return true;
    }
  },

  async deletePost(slug: string, userId: number, role: 'user' | 'admin'): Promise<boolean> {
    const post = await this.getPostBySlug(slug);
    if (!post) return false;

    // Authorization
    if (post.user_id !== userId && role !== 'admin') {
      throw new Error('Unauthorized delete attempt');
    }

    if (pool) {
      await pool.query('DELETE FROM posts WHERE id = ?', [post.id]);
      return true;
    } else {
      fallbackData.posts = fallbackData.posts.filter(p => p.id !== post.id);
      fallbackData.post_tags = fallbackData.post_tags.filter(pt => pt.post_id !== post.id);
      fallbackData.comments = fallbackData.comments.filter(c => c.post_id !== post.id);
      saveFallback();
      return true;
    }
  },

  // COMMENT OPERATIONS
  async getComments(postId: number, currentUserId?: number): Promise<Comment[]> {
    if (pool) {
      const [rows] = await pool.query(`
        SELECT c.*, u.name as user_name, u.avatar_url as user_avatar,
          (SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = c.id) as likes_count
          ${currentUserId ? `, (SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = c.id AND cl.user_id = ?) as has_liked_raw` : ''}
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.post_id = ?
        ORDER BY c.created_at ASC
      `, currentUserId ? [currentUserId, postId] : [postId]);

      const allComments = rows as any[];
      allComments.forEach(c => {
        if (currentUserId && c.has_liked_raw) {
          c.has_liked = c.has_liked_raw > 0;
        } else {
          c.has_liked = false;
        }
      });
      return this.nestComments(allComments as Comment[]);
    } else {
      const filtered = fallbackData.comments.filter(c => c.post_id === postId);
      const allComments = filtered.map(c => {
        const user = fallbackData.users.find(u => u.id === c.user_id);
        const likes_count = fallbackData.comment_likes.filter(cl => cl.comment_id === c.id).length;
        const has_liked = currentUserId ? fallbackData.comment_likes.some(cl => cl.comment_id === c.id && cl.user_id === currentUserId) : false;
        return {
          ...c,
          user_name: user ? user.name : 'Unknown User',
          user_avatar: user?.avatar_url,
          likes_count,
          has_liked,
        };
      });

      return this.nestComments(allComments);
    }
  },

  nestComments(comments: Comment[]): Comment[] {
    const commentMap: Record<number, Comment> = {};
    const roots: Comment[] = [];

    comments.forEach(c => {
      commentMap[c.id] = { ...c, replies: [] };
    });

    comments.forEach(c => {
      const mapped = commentMap[c.id];
      if (c.parent_id === null) {
        roots.push(mapped);
      } else {
        const parent = commentMap[c.parent_id];
        if (parent) {
          parent.replies = parent.replies || [];
          parent.replies.push(mapped);
        } else {
          // If parent is deleted or not found, treat as root
          roots.push(mapped);
        }
      }
    });

    return roots;
  },

  async createComment(postId: number, userId: number, body: string, parentId: number | null = null, imageUrl: string | null = null): Promise<Comment> {
    if (pool) {
      const [result] = await pool.query(
        'INSERT INTO comments (post_id, user_id, parent_id, body, image_url) VALUES (?, ?, ?, ?, ?)',
        [postId, userId, parentId, body, imageUrl]
      );
      const insertId = (result as any).insertId;
      const [userRows] = await pool.query('SELECT name, avatar_url FROM users WHERE id = ?', [userId]);
      const user = (userRows as any[])[0];

      return {
        id: insertId,
        post_id: postId,
        user_id: userId,
        parent_id: parentId,
        body,
        image_url: imageUrl || undefined,
        created_at: new Date(),
        user_name: user ? user.name : 'Unknown User',
        user_avatar: user ? user.avatar_url : undefined,
        replies: [],
      };
    } else {
      const newCommentId = fallbackData.comments.length > 0 ? Math.max(...fallbackData.comments.map(c => c.id)) + 1 : 1;
      const user = fallbackData.users.find(u => u.id === userId);

      const newComment: Comment = {
        id: newCommentId,
        post_id: postId,
        user_id: userId,
        parent_id: parentId,
        body,
        image_url: imageUrl || undefined,
        created_at: new Date(),
        user_name: user ? user.name : 'Unknown User',
        user_avatar: user?.avatar_url,
        replies: [],
      };

      fallbackData.comments.push(newComment);
      saveFallback();
      return newComment;
    }
  },

  async deleteComment(id: number, userId: number, role: 'user' | 'admin'): Promise<boolean> {
    if (pool) {
      // Check ownership
      const [rows] = await pool.query('SELECT * FROM comments WHERE id = ?', [id]);
      const comments = rows as Comment[];
      if (comments.length === 0) return false;

      const comment = comments[0];
      if (comment.user_id !== userId && role !== 'admin') {
        throw new Error('Unauthorized comment delete');
      }

      await pool.query('DELETE FROM comments WHERE id = ?', [id]);
      return true;
    } else {
      const comment = fallbackData.comments.find(c => c.id === id);
      if (!comment) return false;

      if (comment.user_id !== userId && role !== 'admin') {
        throw new Error('Unauthorized comment delete');
      }

      // Also recursively remove replies in fallback
      const removeIds = [id];
      const findReplies = (parentId: number) => {
        fallbackData.comments.forEach(c => {
          if (c.parent_id === parentId) {
            removeIds.push(c.id);
            findReplies(c.id);
          }
        });
      };
      findReplies(id);

      fallbackData.comments = fallbackData.comments.filter(c => !removeIds.includes(c.id));
      saveFallback();
      return true;
    }
  },

  // TAG DETAILS
  async getTags(): Promise<Tag[]> {
    if (pool) {
      const [rows] = await pool.query('SELECT * FROM tags ORDER BY name ASC');
      return rows as Tag[];
    } else {
      return [...fallbackData.tags].sort((a, b) => a.name.localeCompare(b.name));
    }
  },

  async togglePostLike(postId: number, userId: number): Promise<{ liked: boolean, likesCount: number }> {
    if (pool) {
      const [existing] = await pool.query('SELECT id FROM likes WHERE post_id = ? AND user_id = ?', [postId, userId]) as any[];
      let liked = false;
      if (existing.length > 0) {
        await pool.query('DELETE FROM likes WHERE id = ?', [existing[0].id]);
        liked = false;
      } else {
        await pool.query('INSERT INTO likes (post_id, user_id) VALUES (?, ?)', [postId, userId]);
        liked = true;
      }
      const [countResult] = await pool.query('SELECT COUNT(*) as count FROM likes WHERE post_id = ?', [postId]) as any[];
      return { liked, likesCount: countResult[0].count };
    } else {
      const existingIdx = fallbackData.likes.findIndex(l => l.post_id === postId && l.user_id === userId);
      let liked = false;
      if (existingIdx !== -1) {
        fallbackData.likes.splice(existingIdx, 1);
      } else {
        const newId = fallbackData.likes.length > 0 ? Math.max(...fallbackData.likes.map(l => l.id)) + 1 : 1;
        fallbackData.likes.push({ id: newId, post_id: postId, user_id: userId, created_at: new Date() });
        liked = true;
      }
      saveFallback();
      const likesCount = fallbackData.likes.filter(l => l.post_id === postId).length;
      return { liked, likesCount };
    }
  },

  async toggleCommentLike(commentId: number, userId: number): Promise<{ liked: boolean, likesCount: number }> {
    if (pool) {
      const [existing] = await pool.query('SELECT id FROM comment_likes WHERE comment_id = ? AND user_id = ?', [commentId, userId]) as any[];
      let liked = false;
      if (existing.length > 0) {
        await pool.query('DELETE FROM comment_likes WHERE id = ?', [existing[0].id]);
        liked = false;
      } else {
        await pool.query('INSERT INTO comment_likes (comment_id, user_id) VALUES (?, ?)', [commentId, userId]);
        liked = true;
      }
      const [countResult] = await pool.query('SELECT COUNT(*) as count FROM comment_likes WHERE comment_id = ?', [commentId]) as any[];
      return { liked, likesCount: countResult[0].count };
    } else {
      const existingIdx = fallbackData.comment_likes.findIndex(cl => cl.comment_id === commentId && cl.user_id === userId);
      let liked = false;
      if (existingIdx !== -1) {
        fallbackData.comment_likes.splice(existingIdx, 1);
      } else {
        const newId = fallbackData.comment_likes.length > 0 ? Math.max(...fallbackData.comment_likes.map(cl => cl.id)) + 1 : 1;
        fallbackData.comment_likes.push({ id: newId, comment_id: commentId, user_id: userId, created_at: new Date() });
        liked = true;
      }
      saveFallback();
      const likesCount = fallbackData.comment_likes.filter(cl => cl.comment_id === commentId).length;
      return { liked, likesCount };
    }
  },

  async toggleBookmark(userId: number, postId: number): Promise<{ bookmarked: boolean }> {
    if (pool) {
      const [existing] = await pool.query('SELECT id FROM bookmarks WHERE user_id = ? AND post_id = ?', [userId, postId]) as any[];
      if (existing.length > 0) {
        await pool.query('DELETE FROM bookmarks WHERE user_id = ? AND post_id = ?', [userId, postId]);
        return { bookmarked: false };
      } else {
        await pool.query('INSERT INTO bookmarks (user_id, post_id) VALUES (?, ?)', [userId, postId]);
        return { bookmarked: true };
      }
    } else {
      const existingIdx = fallbackData.bookmarks.findIndex(b => b.user_id === userId && b.post_id === postId);
      if (existingIdx !== -1) {
        fallbackData.bookmarks.splice(existingIdx, 1);
        saveFallback();
        return { bookmarked: false };
      } else {
        fallbackData.bookmarks.push({ id: fallbackData.bookmarks.length + 1, user_id: userId, post_id: postId, created_at: new Date() });
        saveFallback();
        return { bookmarked: true };
      }
    }
    return { bookmarked: false };
  },

  async getBookmarkedPosts(userId: number): Promise<Post[]> {
    if (pool) {
      let queryStr = `
        SELECT p.*, u.name as author_name, u.avatar_url as author_avatar,
          (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as likes_count,
          (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comments_count,
          1 as has_bookmarked_raw,
          (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id AND l.user_id = ?) as has_liked_raw
        FROM posts p
        JOIN users u ON p.user_id = u.id
        JOIN bookmarks b ON p.id = b.post_id
        WHERE b.user_id = ?
        ORDER BY b.created_at DESC
      `;
      const [rows] = await pool.query(queryStr, [userId, userId]);
      const posts = rows as any[];
      for (const post of posts) {
        post.has_liked = post.has_liked_raw > 0;
        post.has_bookmarked = true;
        const [tagRows] = await pool.query(`
          SELECT t.name 
          FROM tags t
          JOIN post_tags pt ON t.id = pt.tag_id
          WHERE pt.post_id = ?
        `, [post.id]);
        post.tags = (tagRows as any[]).map(r => r.name);
      }
      return posts;
    }
    return [];
  },

  // NEWSLETTER OPERATIONS
  async addSubscriber(email: string): Promise<boolean> {
    if (pool) {
      try {
        await pool.query('INSERT INTO subscribers (email) VALUES (?)', [email.toLowerCase()]);
        return true;
      } catch (err: any) {
        if (err.code === 'ER_DUP_ENTRY') return false;
        throw err;
      }
    } else {
      const existing = fallbackData.subscribers.find(s => s.email.toLowerCase() === email.toLowerCase());
      if (existing) return false;
      const newId = fallbackData.subscribers.length > 0 ? Math.max(...fallbackData.subscribers.map(s => s.id)) + 1 : 1;
      fallbackData.subscribers.push({ id: newId, email: email.toLowerCase(), subscribed_at: new Date() });
      saveFallback();
      return true;
    }
  },

  async getSubscriberCount(): Promise<number> {
    if (pool) {
      const [rows] = await pool.query('SELECT COUNT(*) as count FROM subscribers') as any[];
      return rows[0].count;
    } else {
      return fallbackData.subscribers.length;
    }
  },

  async getAllSubscribers(): Promise<string[]> {
    if (pool) {
      const [rows] = await pool.query('SELECT email FROM subscribers') as any[];
      return rows.map((r: any) => r.email);
    } else {
      return fallbackData.subscribers.map(s => s.email);
    }
  }
};
