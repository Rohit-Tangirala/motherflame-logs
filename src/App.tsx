import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { PostDetail } from './pages/PostDetail';
import { CreatePost } from './pages/CreatePost';
import { EditPost } from './pages/EditPost';
import { AuthorProfile } from './pages/AuthorProfile';
import { Bookmarks } from './pages/Bookmarks';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/admin/Dashboard';
import { ManagePosts } from './pages/admin/ManagePosts';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-white text-neutral-800 flex flex-col font-sans" id="app-root-layout">
          {/* Top cohesive navigation header bar */}
          <Navbar />

          {/* Dynamic route contents container panel */}
          <main className="flex-1 pb-16">
            <Routes>
              {/* Public Feed / Browse Pages */}
              <Route path="/" element={<Home />} />
              <Route path="/post/:slug" element={<PostDetail />} />
              <Route path="/author/:id" element={<AuthorProfile />} />

              {/* Authentication Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Writing / Compose Protected Pages */}
              <Route path="/create-post" element={<CreatePost />} />
              <Route path="/edit-post/:slug" element={<EditPost />} />
              <Route path="/my-bookmarks" element={<Bookmarks />} />

              {/* Administrative Protected Dashboards */}
              <Route path="/admin" element={<Dashboard />} />
              <Route path="/admin/manage-posts" element={<ManagePosts />} />

              {/* Catch-all unknown routes redirect safely back home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          {/* Consistent humble branding footer bar (anti-AI-slop layout borders) */}
          <footer className="border-t border-neutral-100 py-8 bg-neutral-50/50 text-center" id="app-footer">
            <div className="max-w-7xl mx-auto px-6 text-xs text-neutral-400 font-sans tracking-wide">
              <p className="mb-1 font-semibold text-neutral-600">Sanctuary Editorial Platform</p>
              <p>© {new Date().getFullYear()} Sanctuary. Designed for distraction-free written journalism.</p>
            </div>
          </footer>
        </div>

        {/* Global react-hot-toast notifications manager */}
        <Toaster 
          position="bottom-right" 
          toastOptions={{
            duration: 3500,
            style: {
              background: '#111111',
              color: '#ffffff',
              fontSize: '0.85rem',
              fontWeight: 500,
              borderRadius: '4px',
              fontFamily: 'system-ui, sans-serif',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#ffffff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#ffffff',
              },
            },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
