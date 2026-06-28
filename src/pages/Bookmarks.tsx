import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { PostCard } from '../components/PostCard';
import { Bookmark, Inbox } from 'lucide-react';
import { SkeletonCard } from '../components/SkeletonCard';
import { useAuth } from '../context/AuthContext';

export const Bookmarks: React.FC = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const response = await axios.get('/api/posts/bookmarks/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPosts(response.data);
      } catch (err) {
        console.error('Error fetching bookmarks:', err);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchBookmarks();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  if (!isAuthenticated && !loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-24 text-center">
        <Bookmark className="w-16 h-16 text-neutral-200 mx-auto mb-4" />
        <h1 className="font-serif text-3xl mb-2">Reading List</h1>
        <p className="text-neutral-500 font-mono text-sm">Please sign in to view your saved articles.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header section */}
      <div className="bg-neutral-50 border-b border-black/10 py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 text-orange-600 mb-4">
            <Bookmark className="w-6 h-6 fill-current" />
            <span className="font-sans font-black uppercase tracking-[0.2em] text-xs">Private Collection</span>
          </div>
          <h1 className="font-serif font-black tracking-tighter text-4xl sm:text-5xl uppercase text-neutral-900">
            Reading List
          </h1>
          <p className="mt-4 text-neutral-500 font-sans max-w-xl text-sm sm:text-base leading-relaxed">
            Your personal archive of saved articles and stories.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post: any) => (
              <PostCard key={post.id} post={post} onDelete={(slug) => setPosts(posts.filter(p => p.slug !== slug))} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 border-2 border-dashed border-neutral-100 rounded-lg">
            <Inbox className="w-12 h-12 text-neutral-200 mx-auto mb-4" />
            <h3 className="font-serif text-xl font-bold text-neutral-800 mb-2">Your list is empty</h3>
            <p className="text-neutral-500 font-mono text-sm">When you discover an article you want to read later, click the bookmark icon to save it here.</p>
          </div>
        )}
      </div>
    </div>
  );
};
