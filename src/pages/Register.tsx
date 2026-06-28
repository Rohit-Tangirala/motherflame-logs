import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Feather, Mail, Lock, User, Image } from 'lucide-react';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error('Name, email, and password are required.');
      return;
    }

    setSubmitting(true);
    try {
      await register(name, email, password, avatarUrl || undefined);
      toast.success('Registration successful! Welcome to Sanctuary.');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center bg-[#F9F9F8] px-6 py-12" id="register-page">
      <div className="w-full max-w-md" id="register-card">
        {/* Brand visual header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-1 font-serif font-black text-neutral-950 text-2xl mb-3 uppercase italic">
            <span>Sanctuary</span>
            <span className="w-1.5 h-1.5 bg-orange-600 rounded-full inline-block"></span>
          </Link>
          <h2 className="font-serif font-bold text-xl tracking-tight text-neutral-900 uppercase">
            Create your account
          </h2>
          <p className="text-xs font-sans font-bold uppercase tracking-widest text-neutral-400 mt-2">
            Join our community of thoughtful writers and deep thinkers
          </p>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-8 rounded-sm border border-black/10 shadow-sm" id="register-form">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-orange-600 mb-1.5 font-sans">
              Display Name
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Rohit Sharma"
                className="w-full pl-10 pr-4 py-3 bg-white border border-black/10 focus:border-orange-600 focus:ring-0 rounded-sm focus:outline-none text-xs font-sans transition-all"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={submitting}
              />
              <User className="absolute left-3.5 top-3.5 w-4 h-4 text-neutral-400" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-orange-600 mb-1.5 font-sans">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-3 bg-white border border-black/10 focus:border-orange-600 focus:ring-0 rounded-sm focus:outline-none text-xs font-sans transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={submitting}
              />
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-neutral-400" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-orange-600 mb-1.5 font-sans">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                placeholder="Minimum 6 characters"
                className="w-full pl-10 pr-4 py-3 bg-white border border-black/10 focus:border-orange-600 focus:ring-0 rounded-sm focus:outline-none text-xs font-sans transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={submitting}
              />
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-neutral-400" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-orange-600 mb-1.5 font-sans flex items-center justify-between">
              <span>Avatar Image URL</span>
              <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider">Optional</span>
            </label>
            <div className="relative">
              <input
                type="url"
                placeholder="https://images.unsplash.com/..."
                className="w-full pl-10 pr-4 py-3 bg-white border border-black/10 focus:border-orange-600 focus:ring-0 rounded-sm focus:outline-none text-xs font-sans transition-all"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                disabled={submitting}
              />
              <Image className="absolute left-3.5 top-3.5 w-4 h-4 text-neutral-400" />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-black hover:bg-orange-600 text-white font-sans font-black text-xs uppercase tracking-widest rounded-sm cursor-pointer transition-all disabled:opacity-50 mt-2"
            disabled={submitting}
            id="register-submit-btn"
          >
            {submitting ? 'CREATING PROFILE...' : 'SIGN UP'}
          </button>
        </form>

        <p className="text-center text-xs font-bold uppercase tracking-wider text-neutral-500 mt-6 font-sans">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-orange-600 hover:underline">
            Sign In instead
          </Link>
        </p>
      </div>
    </div>
  );
};
