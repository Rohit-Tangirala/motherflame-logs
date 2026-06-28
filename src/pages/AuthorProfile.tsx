import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { PostCard } from '../components/PostCard';
import { SkeletonCard } from '../components/SkeletonCard';
import { Calendar, BookOpen, User } from 'lucide-react';

interface Author {
  id: number;
  name: string;
  role: string;
  avatar_url?: string;
  created_at: string;
}

interface Post {
  id: number;
  user_id: number;
  title: string;
  slug: string;
  content: string;
  cover_image?: string;
  category?: string;
  read_time: number;
  created_at: string;
  author_name?: string;
  author_avatar?: string;
}

export const AuthorProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [author, setAuthor] = useState<Author | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfileAndPosts = async () => {
    setLoading(true);
    try {
      // Fetch Author Info
      const authorRes = await axios.get(`/api/auth/author/${id}`);
      setAuthor(authorRes.data.author);

      // Fetch Author's Published Posts
      const postsRes = await axios.get(`/api/posts/author/${id}`);
      setPosts(postsRes.data);
    } catch (err) {
      console.error('Error fetching author profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchProfileAndPosts();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-24 text-center text-sm text-neutral-400 font-mono" id="author-profile-loading">
        Loading creator profile...
      </div>
    );
  }

  if (!author) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-24 text-center font-sans text-neutral-600" id="author-profile-not-found">
        Creator profile not found.
        <div className="mt-4">
          <Link to="/" className="text-neutral-900 font-semibold underline">Return Home</Link>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(author.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="max-w-5xl mx-auto px-6 py-12" id={`author-profile-${author.id}`}>
      {/* Visual Header Profile Card */}
      <div className="bg-neutral-50 rounded-lg p-8 border border-neutral-100 flex flex-col md:flex-row items-center gap-6 mb-12 shadow-sm" id="author-card-panel">
        <img 
          src={author.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80'} 
          alt={author.name} 
          className="w-24 h-24 rounded-full border border-neutral-200 object-cover shadow-sm"
          referrerPolicy="no-referrer"
        />
        <div className="text-center md:text-left flex-1" id="author-info-text">
          <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
            <h1 className="font-sans font-medium text-neutral-900 text-2xl tracking-tight leading-none">
              {author.name}
            </h1>
            <span className="inline-block px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded bg-neutral-900 text-white md:self-center self-center max-w-max font-mono">
              {author.role}
            </span>
          </div>
          
          <p className="text-sm text-neutral-500 font-sans leading-relaxed max-w-xl mb-4">
            A passionate contributor to Sanctuary, crafting thoughtful commentary and long-form analytical writing designed to stimulate focus and critical thinking.
          </p>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-semibold text-neutral-400 font-sans uppercase tracking-wider" id="author-metrics">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Member Since {formattedDate}
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              {posts.length} published stories
            </span>
          </div>
        </div>
      </div>

      {/* Published articles feed */}
      <div>
        <h2 className="font-sans font-semibold text-neutral-900 text-xl tracking-tight mb-6 flex items-center gap-2">
          <span>Published Articles</span>
          <span className="h-[1px] bg-neutral-100 flex-grow"></span>
        </h2>

        {posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12" id="author-posts-grid">
            {posts.map((post) => (
              <PostCard 
                key={post.id} 
                post={{
                  ...post,
                  author_name: author.name,
                  author_avatar: author.avatar_url
                }} 
                onDelete={(slug) => setPosts(posts.filter(p => p.slug !== slug))}
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-neutral-400 py-12 text-sm italic font-mono">No articles published by this creator yet.</p>
        )}
      </div>
    </div>
  );
};
