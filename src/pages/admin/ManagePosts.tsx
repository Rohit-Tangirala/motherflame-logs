import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Trash2, Edit, ArrowLeft, ShieldCheck, Eye, EyeOff, Search } from 'lucide-react';
import toast from 'react-hot-toast';

interface Post {
  id: number;
  user_id: number;
  title: string;
  slug: string;
  content: string;
  category?: string;
  status: 'draft' | 'published';
  created_at: string;
  author_name?: string;
}

export const ManagePosts: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [search, setSearch] = useState('');

  const fetchAllPosts = async () => {
    setLoading(true);
    try {
      // In development / fallback mode, this retrieves the fallback array
      // In real SQL mode, this retrieves public posts.
      // We can also retrieve the entire platform catalog.
      const response = await axios.get('/api/posts');
      setPosts(response.data || []);
    } catch (err: any) {
      console.error('Error loading catalog posts:', err);
      toast.error('Could not load article backlog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!isAdmin) {
      toast.error('Access Denied. Admins privilege required.');
      navigate('/');
      return;
    }
    fetchAllPosts();
  }, [isAuthenticated, isAdmin]);

  const handleDelete = async (slug: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this article? All comment threads will be purged.')) {
      return;
    }

    try {
      await axios.delete(`/api/posts/${slug}`);
      toast.success('Article removed successfully from systems.');
      // Refresh list
      fetchAllPosts();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error deleting article.';
      toast.error(msg);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-24 text-center text-sm text-neutral-400 font-mono" id="admin-manage-loading">
        Syncing system repository catalogue...
      </div>
    );
  }

  const filteredPosts = posts.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) || 
    (p.category && p.category.toLowerCase().includes(search.toLowerCase())) ||
    (p.author_name && p.author_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-12" id="admin-manage-posts-page">
      {/* Header controls bar */}
      <div className="mb-10" id="manage-posts-header-block">
        <Link to="/admin" className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-400 hover:text-neutral-900 transition-all font-sans uppercase tracking-wider mb-4">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Dashboard
        </Link>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 uppercase tracking-wider font-sans mb-1">
              <ShieldCheck className="w-4 h-4" />
              Catalogue Control Matrix
            </div>
            <h1 className="font-sans font-medium text-neutral-900 text-3xl">
              Manage Platform Articles
            </h1>
          </div>

          {/* Quick Search bar */}
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Filter by title, author, category..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-neutral-50 hover:bg-neutral-100/60 focus:bg-white border border-neutral-100 rounded focus:outline-none focus:border-neutral-950 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
          </div>
        </div>
      </div>

      {/* Main post catalog grid / list */}
      <div className="bg-white rounded-lg border border-neutral-100 shadow-xs overflow-hidden" id="manage-posts-table-panel">
        {filteredPosts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm" id="catalog-posts-table">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50 text-neutral-400 text-xs font-bold uppercase tracking-wider">
                  <th className="py-4 px-6 font-sans">Article Title</th>
                  <th className="py-4 px-6 font-sans">Desk Category</th>
                  <th className="py-4 px-6 font-sans">Creator Author</th>
                  <th className="py-4 px-6 font-sans">Status</th>
                  <th className="py-4 px-6 font-sans text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-700">
                {filteredPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-neutral-50/50 transition-all" id={`catalog-row-${post.id}`}>
                    {/* Title */}
                    <td className="py-4 px-6 font-sans font-semibold text-neutral-950">
                      <Link to={`/post/${post.slug}`} className="hover:underline hover:text-rose-600 transition-colors">
                        {post.title}
                      </Link>
                    </td>

                    {/* Category */}
                    <td className="py-4 px-6 font-sans">
                      {post.category || <span className="text-neutral-300 italic text-xs">Unassigned</span>}
                    </td>

                    {/* Author */}
                    <td className="py-4 px-6 font-sans font-medium text-neutral-600">
                      {post.author_name || 'Unknown Writer'}
                    </td>

                    {/* Status badge */}
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        post.status === 'published' 
                          ? 'bg-green-50 text-green-700 border border-green-100' 
                          : 'bg-yellow-50 text-yellow-700 border border-yellow-100'
                      }`}>
                        {post.status === 'published' ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        {post.status}
                      </span>
                    </td>

                    {/* Row operations buttons */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link 
                          to={`/edit-post/${post.slug}`} 
                          className="p-1 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-all"
                          title="Edit article specs"
                          id={`catalog-edit-link-${post.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button 
                          onClick={() => handleDelete(post.slug)}
                          className="p-1 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all cursor-pointer"
                          title="Purge article from server"
                          id={`catalog-delete-btn-${post.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 text-neutral-400 italic text-sm" id="empty-catalog-alert">
            No system articles match your filter settings.
          </div>
        )}
      </div>
    </div>
  );
};
