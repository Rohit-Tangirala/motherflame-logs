import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { BarChart3, Users, BookOpen, MessageSquare, ShieldAlert, PlusCircle, FileText, ArrowRight, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

interface Post {
  id: number;
  title: string;
  category?: string;
  status: 'draft' | 'published';
  created_at: string;
  author_name?: string;
}

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, user, token, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  
  // Newsletter States
  const [activeTab, setActiveTab] = useState<'overview' | 'newsletter'>('overview');
  const [subscriberCount, setSubscriberCount] = useState<number>(0);
  const [newsletterSubject, setNewsletterSubject] = useState('');
  const [newsletterBody, setNewsletterBody] = useState('');
  const [sendingNewsletter, setSendingNewsletter] = useState(false);

  const fetchAdminStats = async () => {
    setLoading(true);
    try {
      const postsRes = await axios.get('/api/posts');
      const metaRes = await axios.get('/api/posts/meta');
      const subsRes = await axios.get('/api/newsletter/subscribers');
      
      setAllPosts(postsRes.data || []);
      setCategories(metaRes.data.categories || []);
      setSubscriberCount(subsRes.data.count || 0);
    } catch (err) {
      console.error('Error loading admin statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!isAdmin) {
      toast.error('Access Denied. Admins privilege required.');
      navigate('/');
      return;
    }
    fetchAdminStats();
  }, [isAuthenticated, isAdmin, token, authLoading]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-24 text-center text-sm text-neutral-400 font-mono" id="admin-dashboard-loading">
        Calculating platform analytics...
      </div>
    );
  }

  // Calculate high-fidelity stats from posts list
  const totalPosts = allPosts.length;
  const publishedCount = allPosts.filter(p => p.status === 'published').length;
  const draftCount = allPosts.filter(p => p.status === 'draft').length;
  const categoriesCount = categories.length;

  const handleSendNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterSubject.trim() || !newsletterBody.trim()) {
      toast.error('Subject and body are required.');
      return;
    }
    
    if (!window.confirm(`Are you sure you want to send this newsletter to ${subscriberCount} subscribers?`)) {
      return;
    }
    
    setSendingNewsletter(true);
    try {
      const res = await axios.post('/api/newsletter/send', {
        subject: newsletterSubject,
        body: newsletterBody
      });
      
      toast.success(res.data.message || 'Newsletter sent successfully.');
      setNewsletterSubject('');
      setNewsletterBody('');
    } catch (err) {
      console.error(err);
      toast.error('Failed to send newsletter.');
    } finally {
      setSendingNewsletter(false);
    }
  };


  return (
    <div className="max-w-6xl mx-auto px-6 py-12" id="admin-dashboard-container">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-6 border-b border-neutral-100" id="dashboard-header-block">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 uppercase tracking-widest font-sans mb-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            Admin Operations Console
          </div>
          <h1 className="font-sans font-medium text-neutral-900 text-3xl">
            System Dashboard
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          <Link 
            to="/create-post" 
            className="flex items-center gap-1.5 bg-neutral-950 text-white px-4 py-2 rounded text-xs font-bold font-sans hover:bg-neutral-800 transition-all shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Create Post
          </Link>
          <Link 
            to="/admin/manage-posts" 
            className="flex items-center gap-1.5 bg-white border border-neutral-200 text-neutral-700 px-4 py-2 rounded text-xs font-bold font-sans hover:border-neutral-950 transition-all shadow-sm"
          >
            <FileText className="w-4 h-4" />
            Manage Posts
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded transition-all ${
            activeTab === 'overview' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('newsletter')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest rounded transition-all ${
            activeTab === 'newsletter' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          Newsletter
        </button>
      </div>

      {activeTab === 'overview' ? (
        <>
          {/* KPI Stats Cards Block */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12" id="dashboard-kpi-grid">
        {/* KPI 1 */}
        <div className="bg-neutral-50 p-6 rounded-lg border border-neutral-100 shadow-xs flex flex-col justify-between">
          <div>
            <BookOpen className="w-5 h-5 text-neutral-400 mb-4" />
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 font-sans">Total Articles</span>
          </div>
          <span className="text-3xl font-sans font-bold text-neutral-900 mt-2">{totalPosts}</span>
        </div>

        {/* KPI 2 */}
        <div className="bg-neutral-50 p-6 rounded-lg border border-neutral-100 shadow-xs flex flex-col justify-between">
          <div>
            <Users className="w-5 h-5 text-neutral-400 mb-4" />
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 font-sans">Published</span>
          </div>
          <span className="text-3xl font-sans font-bold text-green-600 mt-2">{publishedCount}</span>
        </div>

        {/* KPI 3 */}
        <div className="bg-neutral-50 p-6 rounded-lg border border-neutral-100 shadow-xs flex flex-col justify-between">
          <div>
            <BarChart3 className="w-5 h-5 text-neutral-400 mb-4" />
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 font-sans">Categories</span>
          </div>
          <span className="text-3xl font-sans font-bold text-neutral-900 mt-2">{categoriesCount}</span>
        </div>

        {/* KPI 4 */}
        <div className="bg-neutral-50 p-6 rounded-lg border border-neutral-100 shadow-xs flex flex-col justify-between">
          <div>
            <MessageSquare className="w-5 h-5 text-neutral-400 mb-4" />
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 font-sans">Drafts</span>
          </div>
          <span className="text-3xl font-sans font-bold text-yellow-600 mt-2">{draftCount}</span>
        </div>
      </div>

      {/* Lists of latest posts inside the dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="dashboard-lists-layout">
        {/* Post Quick Overview List */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-neutral-100 p-6 shadow-xs" id="quick-posts-panel">
          <div className="flex items-center justify-between mb-6 pb-2 border-b border-neutral-50">
            <h3 className="font-sans font-semibold text-neutral-900 text-lg">System Article Backlog</h3>
            <Link to="/admin/manage-posts" className="text-xs font-bold font-sans text-rose-600 hover:text-rose-700 flex items-center gap-1">
              View All Management Options
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {allPosts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm" id="quick-posts-table">
                <thead>
                  <tr className="border-b border-neutral-100 text-neutral-400 text-xs font-bold uppercase tracking-wider">
                    <th className="pb-3 font-sans">Title</th>
                    <th className="pb-3 font-sans">Category</th>
                    <th className="pb-3 font-sans">Status</th>
                    <th className="pb-3 font-sans">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50 text-neutral-700">
                  {allPosts.slice(0, 5).map((post) => (
                    <tr key={post.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="py-3.5 pr-4 font-sans font-semibold text-neutral-900 truncate max-w-[240px]">
                        {post.title}
                      </td>
                      <td className="py-3.5 font-sans">{post.category || 'Unassigned'}</td>
                      <td className="py-3.5">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          post.status === 'published' 
                            ? 'bg-green-50 text-green-700 border border-green-100' 
                            : 'bg-yellow-50 text-yellow-700 border border-yellow-100'
                        }`}>
                          {post.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-xs text-neutral-400 font-mono">
                        {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-neutral-400 italic text-sm py-6 text-center font-mono">No articles found in platform backlog.</p>
          )}
        </div>

        {/* Categories sidebar overview */}
        <div className="bg-neutral-50 rounded-lg border border-neutral-100 p-6 shadow-xs flex flex-col" id="categories-count-panel">
          <h3 className="font-sans font-semibold text-neutral-900 text-lg mb-6 pb-2 border-b border-neutral-100">Active Editorial Desks</h3>
          
          <div className="flex-1 flex flex-col gap-4">
            {categories.map((cat) => {
              const count = allPosts.filter(p => p.category === cat).length;
              return (
                <div key={cat} className="flex items-center justify-between border-b border-neutral-100/60 pb-3" id={`desk-cat-${cat.toLowerCase()}`}>
                  <span className="font-sans font-semibold text-neutral-800">{cat}</span>
                  <span className="bg-neutral-900 text-white font-mono text-xs font-bold px-2 py-0.5 rounded">
                    {count} articles
                  </span>
                </div>
              );
            })}

            {categories.length === 0 && (
              <p className="text-neutral-400 text-xs italic font-mono py-4 text-center">No desks created yet.</p>
            )}
          </div>

          <div className="mt-8 bg-neutral-100 p-4 rounded text-xs text-neutral-500 font-sans leading-relaxed" id="dashboard-creds-info">
            <p className="font-bold text-neutral-700 mb-1">🛠️ Super Administrator Mode Active</p>
            You can delete comments, modify other writer's drafts, set category metadata, and manage platform live posts.
          </div>
        </div>
      </div>
        </>
      ) : (
        <div className="bg-white rounded-lg border border-neutral-100 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-neutral-100">
            <div>
              <h2 className="text-xl font-bold text-neutral-900 font-sans">Newsletter Broadcast</h2>
              <p className="text-sm text-neutral-500 mt-1">Send an email to all your subscribers.</p>
            </div>
            <div className="bg-neutral-50 px-4 py-2 rounded border border-neutral-100 text-center">
              <span className="block text-2xl font-bold text-neutral-900 font-sans">{subscriberCount}</span>
              <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold">Subscribers</span>
            </div>
          </div>
          
          <form onSubmit={handleSendNewsletter} className="max-w-3xl">
            <div className="mb-6">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">Subject Line</label>
              <input 
                type="text" 
                value={newsletterSubject}
                onChange={(e) => setNewsletterSubject(e.target.value)}
                className="w-full border border-neutral-200 rounded px-4 py-3 text-sm focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all font-sans"
                placeholder="What's the topic?"
                required
              />
            </div>
            
            <div className="mb-8">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">Email Body</label>
              <div className="border border-neutral-200 rounded overflow-hidden">
                <textarea 
                  value={newsletterBody}
                  onChange={(e) => setNewsletterBody(e.target.value)}
                  placeholder="Write your newsletter content here..."
                  className="w-full h-80 p-4 focus:outline-none"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={sendingNewsletter || subscriberCount === 0}
                className="bg-neutral-900 text-white px-6 py-3 rounded text-xs font-bold uppercase tracking-widest hover:bg-neutral-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingNewsletter ? 'Sending Broadcast...' : 'Send to all subscribers'}
              </button>
              {subscriberCount === 0 && (
                <span className="text-xs text-rose-500 font-medium">You need at least 1 subscriber to send.</span>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
