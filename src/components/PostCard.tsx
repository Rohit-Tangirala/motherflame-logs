import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Heart, MessageCircle, Share2, Copy, Twitter, Smartphone, Bookmark, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './PostCard.module.css';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

interface PostCardProps {
  post: {
    id: number;
    user_id: number;
    title: string;
    slug: string;
    content: string;
    cover_image?: string;
    category?: string;
    read_time: number;
    created_at: string | Date;
    author_name?: string;
    author_avatar?: string;
    likes_count?: number;
    comments_count?: number;
    has_liked?: boolean;
    has_bookmarked?: boolean;
  };
  onDelete?: (slug: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onDelete }) => {
  const { user } = useAuth();
  const [showShare, setShowShare] = useState(false);
  const [liked, setLiked] = useState(post.has_liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [bookmarked, setBookmarked] = useState(post.has_bookmarked || false);

  const formattedDate = new Date(post.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  // Extract pure text for snippet/excerpt
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = post.content;
  const excerptText = tempDiv.textContent || tempDiv.innerText || '';

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in to save posts.');
        return;
      }
      const res = await axios.post(`/api/posts/${post.slug}/bookmark`);
      setBookmarked(res.data.bookmarked);
      toast.success(res.data.bookmarked ? 'Saved to Reading List' : 'Removed from Reading List');
    } catch (err) {
      console.error(err);
      toast.error('Failed to toggle bookmark.');
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault(); // prevent navigation
    e.stopPropagation();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in to like posts.');
        return;
      }
      const res = await axios.post(`/api/posts/${post.slug}/like`);
      setLiked(res.data.liked);
      setLikesCount(res.data.likesCount);
    } catch (err) {
      console.error(err);
      toast.error('Failed to toggle like.');
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await axios.delete(`/api/posts/${post.slug}`);
      toast.success('Post deleted successfully!');
      if (onDelete) onDelete(post.slug);
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete post.');
    }
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowShare(!showShare);
  };

  const copyLink = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/post/${post.slug}`);
    toast.success('Link copied!');
    setShowShare(false);
  };

  const postUrl = `${window.location.origin}/post/${post.slug}`;

  return (
    <Link to={`/post/${post.slug}`} className={styles.cardContainer} id={`post-card-${post.slug}`}>
      <div className={styles.imageWrapper}>
        {post.cover_image && post.cover_image !== 'null' && post.cover_image !== 'undefined' && post.cover_image.trim() !== '' ? (
          <img 
            src={post.cover_image} 
            alt={post.title} 
            className={styles.coverImage}
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full bg-neutral-900 flex items-center justify-center">
            <span className="text-xs font-bold text-neutral-600 uppercase tracking-widest">{post.category || 'Article'}</span>
          </div>
        )}
      </div>
      <div className={styles.contentBlock}>
        {post.category && (
          <span className={styles.category}>{post.category}</span>
        )}
        <h3 className={styles.title}>{post.title}</h3>
        <p className={styles.excerpt}>{excerptText}</p>
        <div className={styles.meta}>
          <img 
            src={post.author_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80'} 
            alt={post.author_name} 
            className={styles.avatar}
            referrerPolicy="no-referrer"
          />
          <span className={styles.authorName}>{post.author_name}</span>
          <span className={styles.dot}></span>
          <span>{formattedDate}</span>
          <span className={styles.dot}></span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-neutral-400" />
            <span>{post.read_time} min read</span>
          </span>
        </div>
        <div className="mt-4 pt-4 border-t border-neutral-100 flex items-center justify-between" onClick={(e) => e.preventDefault()}>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleLike}
              className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest transition-all ${liked ? 'text-orange-600 scale-105' : 'text-neutral-400 hover:text-neutral-600'}`}
            >
              <Heart className={`w-4 h-4 ${liked ? 'fill-orange-600' : ''}`} />
              <span>{likesCount}</span>
            </button>
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-neutral-400">
              <MessageCircle className="w-4 h-4" />
              <span>{post.comments_count || 0}</span>
            </span>
          </div>
          <div className="relative flex items-center gap-3">
            {user && user.id === post.user_id && (
              <button 
                onClick={handleDelete}
                className="text-neutral-400 hover:text-red-600 transition-colors"
                title="Delete Post"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button 
              onClick={handleBookmark} 
              className={`transition-colors ${bookmarked ? 'text-orange-600' : 'text-neutral-400 hover:text-neutral-600'}`}
              title={bookmarked ? "Remove from Reading List" : "Save to Reading List"}
            >
              <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-orange-600' : ''}`} />
            </button>
            <button onClick={handleShareClick} className="text-neutral-400 hover:text-neutral-600 transition-colors">
              <Share2 className="w-4 h-4" />
            </button>
            {showShare && (
              <div className="absolute right-0 bottom-full mb-2 bg-white border border-neutral-200 shadow-lg rounded-sm p-2 flex flex-col gap-2 z-10 w-32">
                <button onClick={copyLink} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-600 hover:text-orange-600 text-left p-1">
                  <Copy className="w-3.5 h-3.5" /> Copy
                </button>
                <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(post.title)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-600 hover:text-orange-600 p-1" onClick={(e) => e.stopPropagation()}>
                  <Twitter className="w-3.5 h-3.5" /> Twitter
                </a>
                <a href={`https://wa.me/?text=${encodeURIComponent(post.title + ' ' + postUrl)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-600 hover:text-orange-600 p-1" onClick={(e) => e.stopPropagation()}>
                  <Smartphone className="w-3.5 h-3.5" /> WhatsApp
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};
