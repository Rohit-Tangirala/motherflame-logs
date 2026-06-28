import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Feather, Search, Bell, Menu, X, Edit, ChevronDown, User, FileText, LogOut, LayoutDashboard, Bookmark } from 'lucide-react';
import axios from 'axios';

export const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<string[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get('/api/posts/meta');
        setCategories(res.data.categories || []);
      } catch (err) {
        console.error('Failed to fetch categories', err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const handleLogout = () => {
    logout();
    setIsProfileDropdownOpen(false);
    setIsMobileMenuOpen(false);
    navigate('/');
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setIsSearchOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-neutral-100" id="navbar-header">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between" id="main-nav">
        
        {/* Logo & Left Links */}
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-1.5 font-serif text-xl font-black tracking-tighter uppercase italic text-neutral-900" id="logo-link">
            <Feather className="w-5 h-5 text-neutral-900" />
            <span>Sanctuary</span>
            <span className="w-1.5 h-1.5 bg-orange-600 rounded-full inline-block"></span>
          </Link>
          
          <div className="hidden md:flex items-center gap-6" id="nav-navigation-links">
            <NavLink to="/" className={({ isActive }) => `text-[10px] font-bold uppercase tracking-widest transition-colors hover:text-orange-600 ${isActive ? 'text-orange-600' : 'text-neutral-500'}`}>
              Home
            </NavLink>
            
            {/* Categories Dropdown */}
            <div className="relative group py-4">
              <button className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-neutral-500 hover:text-orange-600 transition-colors">
                Categories <ChevronDown className="w-3 h-3 group-hover:rotate-180 transition-transform duration-200" />
              </button>
              <div className="absolute top-full left-0 mt-0 w-48 bg-white border border-neutral-100 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 rounded-sm z-50">
                <div className="py-2">
                  {categories.length > 0 ? (
                    categories.map(cat => (
                      <Link key={cat} to={`/?category=${encodeURIComponent(cat)}`} className="block px-4 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-50 hover:text-orange-600">
                        {cat}
                      </Link>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-xs text-neutral-400">Loading...</div>
                  )}
                </div>
              </div>
            </div>
            
            {isAdmin && (
              <NavLink to="/admin" className={({ isActive }) => `text-[10px] font-bold uppercase tracking-widest transition-colors hover:text-orange-600 ${isActive ? 'text-orange-600' : 'text-neutral-500'}`}>
                Dashboard
              </NavLink>
            )}
          </div>
        </div>

        {/* Right Actions */}
        <div className="hidden md:flex items-center gap-5">
          {/* Search */}
          <div className="flex items-center">
            {isSearchOpen ? (
              <form onSubmit={handleSearch} className="flex items-center border-b border-neutral-300 pb-1 mr-2 animate-in fade-in slide-in-from-right-4 duration-300">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm w-48 text-neutral-800 placeholder:text-neutral-400"
                />
                <button type="button" onClick={() => setIsSearchOpen(false)} className="text-neutral-400 hover:text-neutral-600">
                  <X className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <button onClick={() => setIsSearchOpen(true)} className="text-neutral-600 hover:text-orange-600 transition-colors">
                <Search className="w-4 h-4" />
              </button>
            )}
          </div>

          {isAuthenticated && user ? (
            <>
              {/* Write Button */}
              <Link to="/create-post" className="flex items-center gap-1.5 text-neutral-500 hover:text-orange-600 transition-colors">
                <Edit className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Write</span>
              </Link>

              {/* Notification Bell Placeholder */}
              <button className="text-neutral-500 hover:text-orange-600 transition-colors relative">
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-600 rounded-full border border-white"></span>
              </button>

              {/* User Dropdown */}
              <div className="relative ml-2">
                <button 
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  onBlur={() => setTimeout(() => setIsProfileDropdownOpen(false), 200)}
                  className="flex items-center gap-2 outline-none"
                >
                  <img 
                    src={user.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80'} 
                    alt={user.name} 
                    className="w-8 h-8 rounded-full object-cover border border-neutral-200"
                    referrerPolicy="no-referrer"
                  />
                  <ChevronDown className={`w-3 h-3 text-neutral-500 transition-transform ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-neutral-100 shadow-xl rounded-sm py-1 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-2 border-b border-neutral-100 mb-1">
                      <p className="text-sm font-bold text-neutral-900">{user.name}</p>
                      <p className="text-xs text-neutral-500 truncate">{user.email}</p>
                    </div>
                    <Link to={`/author/${user.id}`} className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-50 hover:text-orange-600">
                      <User className="w-4 h-4" /> Profile
                    </Link>
                    <Link to="/my-bookmarks" className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-50 hover:text-orange-600">
                      <Bookmark className="w-4 h-4" /> Reading List
                    </Link>
                    <Link to={`/author/${user.id}`} className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-50 hover:text-orange-600">
                      <FileText className="w-4 h-4" /> My Posts
                    </Link>
                    {isAdmin && (
                      <Link to="/admin" className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-50 hover:text-orange-600">
                        <LayoutDashboard className="w-4 h-4" /> Dashboard
                      </Link>
                    )}
                    <div className="border-t border-neutral-100 mt-1 pt-1">
                      <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 text-left">
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="text-xs font-bold uppercase tracking-widest text-neutral-600 hover:text-orange-600 transition-colors">Sign In</Link>
              <Link to="/register" className="bg-neutral-950 text-white px-4 py-2 rounded-sm text-[10px] font-bold uppercase tracking-widest hover:bg-orange-600 transition-colors">Register</Link>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden flex items-center gap-4">
          {isSearchOpen ? (
            <form onSubmit={handleSearch} className="flex items-center border-b border-neutral-300 pb-1 animate-in fade-in">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-sm w-32 text-neutral-800 placeholder:text-neutral-400"
              />
              <button type="button" onClick={() => setIsSearchOpen(false)} className="text-neutral-400">
                <X className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <button onClick={() => setIsSearchOpen(true)} className="text-neutral-600">
              <Search className="w-5 h-5" />
            </button>
          )}
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-neutral-900">
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-neutral-100 absolute w-full left-0 top-16 shadow-lg z-40 max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="px-4 py-4 space-y-4">
            <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="block text-sm font-bold uppercase tracking-widest text-neutral-800">Home</Link>
            
            <div className="space-y-2">
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Categories</p>
              <div className="pl-2 space-y-2 flex flex-col">
                {categories.map(cat => (
                  <Link key={cat} to={`/?category=${encodeURIComponent(cat)}`} onClick={() => setIsMobileMenuOpen(false)} className="text-sm text-neutral-600 font-medium">
                    {cat}
                  </Link>
                ))}
              </div>
            </div>

            {isAdmin && (
              <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="block text-sm font-bold uppercase tracking-widest text-neutral-800">Dashboard</Link>
            )}
            
            <div className="border-t border-neutral-100 pt-4 mt-4">
              {isAuthenticated && user ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src={user.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80'} 
                      alt={user.name} 
                      className="w-10 h-10 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <p className="text-sm font-bold text-neutral-900">{user.name}</p>
                      <p className="text-xs text-neutral-500">{user.email}</p>
                    </div>
                  </div>
                  
                  <Link to="/create-post" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                    <Edit className="w-4 h-4" /> Write an Article
                  </Link>
                  <Link to={`/author/${user.id}`} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                    <User className="w-4 h-4" /> My Profile
                  </Link>
                  <Link to="/my-bookmarks" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                    <Bookmark className="w-4 h-4" /> Reading List
                  </Link>
                  
                  <button onClick={handleLogout} className="flex items-center gap-2 text-sm font-medium text-red-600">
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="text-center bg-neutral-100 text-neutral-800 px-4 py-3 rounded-sm text-xs font-bold uppercase tracking-widest">Sign In</Link>
                  <Link to="/register" onClick={() => setIsMobileMenuOpen(false)} className="text-center bg-neutral-950 text-white px-4 py-3 rounded-sm text-xs font-bold uppercase tracking-widest">Register</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
