import React from 'react';
import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import styles from './HeroPost.module.css';

interface HeroPostProps {
  post: {
    title: string;
    slug: string;
    cover_image?: string;
    category?: string;
    read_time: number;
    created_at: string | Date;
    author_name?: string;
    author_avatar?: string;
  };
}

export const HeroPost: React.FC<HeroPostProps> = ({ post }) => {
  const formattedDate = new Date(post.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <Link to={`/post/${post.slug}`} className={styles.heroContainer} id={`hero-post-${post.slug}`}>
      {post.cover_image && post.cover_image !== 'null' && post.cover_image !== 'undefined' && post.cover_image.trim() !== '' ? (
        <img 
          src={post.cover_image} 
          alt={post.title} 
          className={styles.coverImage}
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="absolute inset-0 bg-neutral-900 flex items-center justify-center">
          <span className="text-2xl font-bold text-neutral-600 uppercase tracking-widest">{post.category || 'Featured'}</span>
        </div>
      )}
      <div className={styles.overlay}>
        <div className={styles.contentBlock}>
          {post.category && (
            <span className={styles.categoryBadge}>{post.category}</span>
          )}
          <h1 className={styles.title}>{post.title}</h1>
          <div className={styles.meta}>
            <div className={styles.authorBlock}>
              <img 
                src={post.author_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80'} 
                alt={post.author_name} 
                className={styles.avatar}
                referrerPolicy="no-referrer"
              />
              <span className={styles.authorName}>{post.author_name}</span>
            </div>
            <span className={styles.dot}></span>
            <span>{formattedDate}</span>
            <span className={styles.dot}></span>
            <div className={styles.readTime}>
              <Clock className="w-4 h-4 text-neutral-300" />
              <span>{post.read_time} min read</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};
