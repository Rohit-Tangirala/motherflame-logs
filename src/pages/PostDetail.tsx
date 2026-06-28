import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { CommentSection } from '../components/CommentSection';
import { Clock, Edit, Trash2, ArrowLeft, Tag as TagIcon, EyeOff, Heart, Share2, Copy, Twitter, Smartphone, Bookmark } from 'lucide-react';

interface Post {
  id: number;
  user_id: number;
  title: string;
  slug: string;
  content: string;
  cover_image?: string;
  category?: string;
  status: 'draft' | 'published';
  read_time: number;
  created_at: string;
  author_name?: string;
  author_avatar?: string;
  tags?: string[];
  likes_count?: number;
  has_liked?: boolean;
  has_bookmarked?: boolean;
}

export const PostDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [showShare, setShowShare] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  const fetchPost = async () => {
    try {
      const response = await axios.get(`/api/posts/${slug}`);
      setPost(response.data);
      setLiked(response.data.has_liked || false);
      setLikesCount(response.data.likes_count || 0);
      setBookmarked(response.data.has_bookmarked || false);
    } catch (err: any) {
      console.error('Error fetching post detail:', err);
      toast.error('Post not found.');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) {
      fetchPost();
    }
  }, [slug]);

  const handleDelete = async () => {
    if (!post) return;
    if (!window.confirm('Are you sure you want to delete this post? This action is permanent.')) {
      return;
    }

    try {
      await axios.delete(`/api/posts/${post.slug}`);
      toast.success('Post deleted successfully.');
      navigate('/');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error deleting post.';
      toast.error(msg);
    }
  };

  const handleLike = async () => {
    try {
      if (!user) {
        toast.error('Please log in to like posts.');
        return;
      }
      const res = await axios.post(`/api/posts/${post?.slug}/like`);
      setLiked(res.data.liked);
      setLikesCount(res.data.likesCount);
    } catch (err) {
      console.error(err);
      toast.error('Failed to toggle like.');
    }
  };

  const handleBookmark = async () => {
    try {
      if (!user) {
        toast.error('Please log in to save posts.');
        return;
      }
      const res = await axios.post(`/api/posts/${post?.slug}/bookmark`);
      setBookmarked(res.data.bookmarked);
      toast.success(res.data.bookmarked ? 'Saved to Reading List' : 'Removed from Reading List');
    } catch (err) {
      console.error(err);
      toast.error('Failed to toggle bookmark.');
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/post/${post?.slug}`);
    toast.success('Link copied!');
    setShowShare(false);
  };

  const postUrl = `${window.location.origin}/post/${post?.slug}`;

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-24 text-center text-sm text-neutral-400 font-mono" id="post-detail-loading">
        Loading article contents...
      </div>
    );
  }

  if (!post) return null;

  const formattedDate = new Date(post.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const isOwner = user?.id === post.user_id;
  const canEditOrDelete = isOwner || isAdmin;

  return (
    <article className="min-h-screen bg-[#F9F9F8]" id={`post-detail-wrapper-${post.slug}`}>
      {/* Editorial Utility Admin Toolbar (Roadbook inspired) */}
      {canEditOrDelete && (
        <div className="bg-white border-b border-black/10 py-3.5 px-6" id="post-admin-toolbar">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] font-black font-sans uppercase tracking-widest text-neutral-500">
              {post.status === 'draft' && (
                <span className="flex items-center gap-1.5 bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-sm">
                  <EyeOff className="w-3.5 h-3.5" />
                  Draft Mode
                </span>
              )}
              {post.status === 'published' && (
                <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-sm">
                  Published Live
                </span>
              )}
              <span>• EDITORIAL PERMISSIONS ACTIVE</span>
            </div>
            <div className="flex items-center gap-3">
              <Link 
                to={`/edit-post/${post.slug}`} 
                className="flex items-center gap-1.5 bg-white border border-black/10 text-neutral-700 px-3.5 py-1.5 rounded-sm text-[10px] font-bold font-sans uppercase tracking-widest hover:border-black transition-all"
                id="toolbar-edit-link"
              >
                <Edit className="w-3.5 h-3.5 text-orange-600" />
                Edit Post
              </Link>
              <button 
                onClick={handleDelete}
                className="flex items-center gap-1.5 bg-rose-50 text-rose-600 border border-rose-200 px-3.5 py-1.5 rounded-sm text-[10px] font-bold font-sans uppercase tracking-widest hover:bg-rose-100 transition-all cursor-pointer"
                id="toolbar-delete-btn"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-Bleed Roadbook-style Hero Header */}
      <div className="relative w-full h-[60vh] min-h-[420px] max-h-[600px] bg-neutral-950 flex items-center justify-center" id="post-hero-header">
        {post.cover_image && post.cover_image !== 'null' && post.cover_image !== 'undefined' && post.cover_image.trim() !== '' ? (
          <img 
            src={post.cover_image} 
            alt={post.title} 
            className="absolute inset-0 w-full h-full object-cover brightness-[0.55] contrast-[1.05]"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-900 border-b border-black/10">
            <span className="text-4xl md:text-7xl font-serif font-black text-white/5 uppercase italic tracking-widest">{post.category || 'ARTICLE'}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
        {/* Lined texture overlay */}
        <div className="absolute inset-0 bg-repeat bg-[repeating-linear-gradient(45deg,rgba(0,0,0,0.1)_0,rgba(0,0,0,0.1)_1px,transparent_0,transparent_50%)] bg-[size:10px_10px] pointer-events-none opacity-40"></div>
        
        <div className="absolute bottom-0 left-0 right-0 max-w-4xl mx-auto px-6 pb-12 text-white z-10">
          <Link to="/" className="inline-flex items-center gap-1.5 text-[10px] font-bold text-neutral-300 hover:text-orange-500 transition-all mb-6 font-sans uppercase tracking-widest">
            <ArrowLeft className="w-4 h-4" />
            Back to Sanctuary
          </Link>
          
          {post.category && (
            <span className="bg-orange-600 text-white text-[10px] font-black uppercase tracking-[0.25em] px-2.5 py-1 rounded-sm mb-4 inline-block font-sans">
              {post.category}
            </span>
          )}

          <h1 className="font-serif font-black tracking-tighter text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-none mb-6 max-w-3xl uppercase">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold font-sans uppercase tracking-widest text-neutral-300">
            <Link to={`/author/${post.user_id}`} className="flex items-center gap-2 hover:text-white transition-all">
              <img 
                src={post.author_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80'} 
                alt={post.author_name} 
                className="w-6 h-6 rounded-full border border-white/40 object-cover"
                referrerPolicy="no-referrer"
              />
              <span className="font-bold text-white">{post.author_name}</span>
            </Link>
            <span className="text-white/30">•</span>
            <span>{formattedDate}</span>
            <span className="text-white/30">•</span>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-orange-500" />
              <span>{post.read_time} min read</span>
            </div>
          </div>
        </div>
      </div>

      {/* Distraction-Free doc.cc-style Article Content */}
      <div className="max-w-3xl mx-auto px-6 py-16" id="post-content-container">
        {/* Post Text Panel with generous letter settings, typography size and readability tracking */}
        <div 
          className="prose prose-neutral max-w-none text-neutral-900 leading-relaxed font-serif text-lg sm:text-xl space-y-6"
          id="post-rendered-body"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Tags lists */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-12 pt-8 border-t border-black/10 flex items-center gap-2 flex-wrap" id="post-tags-pills">
            <span className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] font-sans flex items-center gap-1 mr-2">
              <TagIcon className="w-3.5 h-3.5 text-orange-600" />
              Filed Under:
            </span>
            {post.tags.map((tag) => (
              <span 
                key={tag} 
                className="text-[10px] bg-white hover:bg-neutral-50 border border-black/10 hover:border-black text-neutral-700 px-3 py-1.5 rounded-sm font-bold uppercase tracking-widest font-sans transition-all"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-8 flex items-center justify-between">
          <button 
            onClick={handleLike}
            className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-all ${liked ? 'text-orange-600 scale-105' : 'text-neutral-500 hover:text-neutral-900'}`}
          >
            <Heart className={`w-5 h-5 ${liked ? 'fill-orange-600' : ''}`} />
            <span>{likesCount} {likesCount === 1 ? 'Like' : 'Likes'}</span>
          </button>
          
          <div className="flex items-center gap-6">
            <button 
              onClick={handleBookmark}
              className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors ${bookmarked ? 'text-orange-600' : 'text-neutral-500 hover:text-neutral-900'}`}
            >
              <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-orange-600' : ''}`} />
              <span className="hidden sm:inline">{bookmarked ? 'Saved' : 'Save'}</span>
            </button>
            <div className="relative">
              <button onClick={() => setShowShare(!showShare)} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-500 hover:text-neutral-900 transition-colors">
                <Share2 className="w-4 h-4" /> <span className="hidden sm:inline">Share</span>
              </button>
              {showShare && (
                <div className="absolute right-0 bottom-full mb-2 bg-white border border-neutral-200 shadow-lg rounded-sm p-2 flex flex-col gap-2 w-32 z-10">
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

        {/* Nested Comments section orchestrating comments */}
        <CommentSection postId={post.id} />
      </div>
    </article>
  );
};
