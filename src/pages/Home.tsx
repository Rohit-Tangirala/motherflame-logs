import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, SlidersHorizontal, Tag as TagIcon, X } from 'lucide-react';
import { HeroPost } from '../components/HeroPost';
import { PostCard } from '../components/PostCard';
import { SkeletonCard, SkeletonHero } from '../components/SkeletonCard';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';

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
}

interface Tag {
  id: number;
  name: string;
}

export const Home: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  // Filters
  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || null;
  const initialTag = searchParams.get('tag') || null;

  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory);
  const [selectedTag, setSelectedTag] = useState<string | null>(initialTag);

  // Debounced/Triggered search query
  const [searchQuery, setSearchQuery] = useState(initialSearch);

  // Sync state to URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedTag) params.set('tag', selectedTag);
    setSearchParams(params, { replace: true });
  }, [searchQuery, selectedCategory, selectedTag, setSearchParams]);

  // Sync URL params to state (for when nav links are clicked from other pages/navbar)
  useEffect(() => {
    const s = searchParams.get('search') || '';
    const c = searchParams.get('category') || null;
    const t = searchParams.get('tag') || null;
    if (s !== searchQuery) {
      setSearch(s);
      setSearchQuery(s);
    }
    if (c !== selectedCategory) setSelectedCategory(c);
    if (t !== selectedTag) setSelectedTag(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Fetch posts with active filters
  const fetchPosts = async () => {
    setLoading(true);
    try {
      let url = '/api/posts';
      const params: string[] = [];
      if (selectedCategory) params.push(`category=${encodeURIComponent(selectedCategory)}`);
      if (selectedTag) params.push(`tag=${encodeURIComponent(selectedTag)}`);
      if (searchQuery) params.push(`search=${encodeURIComponent(searchQuery)}`);

      if (params.length > 0) {
        url += '?' + params.join('&');
      }

      const response = await axios.get(url);
      setPosts(response.data);
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories & tags meta
  const fetchMeta = async () => {
    try {
      const response = await axios.get('/api/posts/meta');
      setCategories(response.data.categories || []);
      setTags(response.data.tags || []);
    } catch (err) {
      console.error('Error fetching meta:', err);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [selectedCategory, selectedTag, searchQuery]);

  useEffect(() => {
    fetchMeta();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(search);
  };

  const clearFilters = () => {
    setSearch('');
    setSearchQuery('');
    setSelectedCategory(null);
    setSelectedTag(null);
  };

  // Determine if a featured HeroPost should be highlighted (only when no filters are active)
  const showHero = !selectedCategory && !selectedTag && !searchQuery && posts.length > 0;
  const featuredPost = showHero ? posts[0] : null;
  const gridPosts = showHero ? posts.slice(1) : posts;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12" id="home-page-container">
      {/* Intro Header */}
      <header className="mb-16 text-center max-w-3xl mx-auto" id="home-header">
        <h1 className="font-serif font-black tracking-tighter text-neutral-950 text-5xl sm:text-7xl mb-4 leading-none uppercase italic">
          Sanctuary.
        </h1>
        <p className="text-neutral-600 font-serif font-normal text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto">
          A distraction-free editorial blog space crafted for writers and readers who appreciate pure visual focus and thoughtful commentary.
        </p>
      </header>

      {/* Categories & Filter Panel */}
      <div className="border-b border-black/10 pb-6 mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" id="filtering-panel">
        <div className="flex flex-wrap items-center gap-2" id="category-tabs">
          <button
            onClick={() => { setSelectedCategory(null); setSelectedTag(null); }}
            className={`px-3.5 py-2 text-[10px] font-sans font-black uppercase tracking-widest rounded-sm border transition-all ${
              !selectedCategory && !selectedTag
                ? 'bg-black border-black text-white'
                : 'bg-white border-black/10 text-neutral-700 hover:text-orange-600 hover:border-orange-600'
            }`}
            id="cat-tab-all"
          >
            All Articles
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => { setSelectedCategory(cat); setSelectedTag(null); }}
              className={`px-3.5 py-2 text-[10px] font-sans font-black uppercase tracking-widest rounded-sm border transition-all ${
                selectedCategory === cat
                  ? 'bg-black border-black text-white'
                  : 'bg-white border-black/10 text-neutral-700 hover:text-orange-600 hover:border-orange-600'
              }`}
              id={`cat-tab-${cat.toLowerCase()}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72" id="search-form">
          <input
            type="text"
            placeholder="SEARCH DISPATCHES..."
            className="w-full pl-9 pr-4 py-2.5 text-[10px] bg-white border border-black/10 hover:border-black/20 focus:bg-white rounded-sm focus:outline-none focus:border-orange-600 focus:ring-0 transition-all font-sans font-bold uppercase tracking-wider placeholder-neutral-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search className="absolute left-3 top-3 w-4 h-4 text-neutral-400" />
        </form>
      </div>

      {/* Active filters breadcrumb bar */}
      {(selectedCategory || selectedTag || searchQuery) && (
        <div className="flex flex-wrap items-center gap-2 mb-8 bg-neutral-50 p-3 rounded-md border border-neutral-100" id="active-filters-bar">
          <span className="text-xs font-semibold text-neutral-500 font-sans uppercase tracking-wider flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Active Filters:
          </span>
          {selectedCategory && (
            <span className="flex items-center gap-1 bg-white text-xs border border-neutral-200 text-neutral-700 px-2.5 py-1 rounded-full font-medium">
              Category: {selectedCategory}
              <button onClick={() => setSelectedCategory(null)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
            </span>
          )}
          {selectedTag && (
            <span className="flex items-center gap-1 bg-white text-xs border border-neutral-200 text-neutral-700 px-2.5 py-1 rounded-full font-medium">
              Tag: #{selectedTag}
              <button onClick={() => setSelectedTag(null)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
            </span>
          )}
          {searchQuery && (
            <span className="flex items-center gap-1 bg-white text-xs border border-neutral-200 text-neutral-700 px-2.5 py-1 rounded-full font-medium">
              Search: "{searchQuery}"
              <button onClick={() => { setSearch(''); setSearchQuery(''); }} className="hover:text-red-500"><X className="w-3 h-3" /></button>
            </span>
          )}
          <button onClick={clearFilters} className="text-xs font-bold text-rose-500 hover:text-rose-600 underline ml-auto py-1 px-2 font-sans">
            Clear All
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div id="home-loading-skeletons">
          {showHero && <SkeletonHero />}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 gap-y-12">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      ) : (
        <>
          {/* Hero Highlight (Roadbook inspired) */}
          {showHero && featuredPost && (
            <HeroPost post={featuredPost} />
          )}

          {/* Magazine-style 2-Column Grid (HiConsumption inspired) */}
          {gridPosts.length > 0 ? (
            <div id="posts-magazine-grid">
              <h2 className="font-serif font-black uppercase text-neutral-900 text-2xl tracking-tighter mb-8 flex items-center gap-3">
                <span>{showHero ? 'Latest Stories' : `Found ${posts.length} articles`}</span>
                <span className="h-[2px] bg-black/10 flex-grow"></span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-x-10 gap-y-14">
                {gridPosts.map((post) => (
                  <PostCard key={post.id} post={post} onDelete={(slug) => setPosts(posts.filter(p => p.slug !== slug))} />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-20 border border-dashed border-black/15 rounded-sm max-w-xl mx-auto" id="no-posts-alert">
              <p className="text-neutral-500 text-sm font-serif mb-4">No published articles match your filters.</p>
              <button onClick={clearFilters} className="bg-black hover:bg-orange-600 text-white px-5 py-2.5 rounded-sm text-[10px] font-bold font-sans uppercase tracking-widest transition-all">
                Reset Filters
              </button>
            </div>
          )}
        </>
      )}

      {/* Newsletter Signup Bar */}
      {!loading && (
        <div className="mt-20 py-12 px-8 bg-neutral-950 text-white rounded-sm text-center relative overflow-hidden" id="newsletter-signup">
          <div className="absolute inset-0 bg-repeat bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.03)_0,rgba(255,255,255,0.03)_1px,transparent_0,transparent_50%)] bg-[size:10px_10px] pointer-events-none opacity-50"></div>
          <div className="relative z-10 max-w-2xl mx-auto">
            <h3 className="font-serif font-black text-3xl sm:text-4xl mb-3 tracking-tight italic uppercase">Join the Inner Circle</h3>
            <p className="text-neutral-400 font-serif text-sm sm:text-base mb-8">Subscribe to receive curated essays, deep dives, and early access to new thoughts directly in your inbox.</p>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const emailInput = form.elements.namedItem('email') as HTMLInputElement;
              const btn = form.elements.namedItem('submitBtn') as HTMLButtonElement;
              try {
                btn.disabled = true;
                btn.textContent = 'Subscribing...';
                await axios.post('/api/newsletter/subscribe', { email: emailInput.value });
                toast.success('Successfully subscribed!');
                emailInput.value = '';
              } catch (err: any) {
                if (err.response?.data?.message === 'already subscribed') {
                  toast.success('You are already subscribed!');
                } else {
                  toast.error('Failed to subscribe. Please try again.');
                }
              } finally {
                btn.disabled = false;
                btn.textContent = 'Subscribe';
              }
            }} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input 
                type="email" 
                name="email"
                required 
                placeholder="Enter your email address" 
                className="flex-grow bg-white/10 border border-white/20 text-white px-4 py-3 rounded-sm text-sm focus:outline-none focus:border-white focus:bg-white/20 transition-all placeholder:text-neutral-500 font-mono"
              />
              <button 
                type="submit"
                name="submitBtn"
                className="bg-white text-black hover:bg-orange-600 hover:text-white px-6 py-3 rounded-sm text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tags Clouds Sidebar Block at footer for beautiful structure (HiConsumption inspired) */}
      {!loading && tags.length > 0 && (
        <div className="mt-20 pt-10 border-t border-black/10" id="tags-cloud-panel">
          <h4 className="font-sans font-black text-[10px] uppercase tracking-[0.25em] text-orange-600 mb-6 flex items-center gap-1.5">
            <TagIcon className="w-3.5 h-3.5" />
            Explore Topics
          </h4>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => { setSelectedTag(tag.name); setSelectedCategory(null); }}
                className={`text-[10px] px-3.5 py-2 border rounded-sm transition-all font-sans font-bold uppercase tracking-widest ${
                  selectedTag === tag.name
                    ? 'bg-orange-600 border-orange-600 text-white'
                    : 'bg-white border-black/10 hover:border-orange-600 hover:text-orange-600 text-neutral-600'
                }`}
                id={`tag-cloud-${tag.name.toLowerCase()}`}
              >
                #{tag.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
