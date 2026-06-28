import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Feather, Lock, Mail } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('All fields are required.');
      return;
    }

    setSubmitting(true);
    try {
      await login(email, password);
      toast.success('Welcome back to Sanctuary!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-[#F9F9F8] px-6 py-12" id="login-page">
      <div className="w-full max-w-md" id="login-card">
        {/* Brand visual header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-1 font-serif font-black text-neutral-950 text-2xl mb-3 uppercase italic">
            <span>Sanctuary</span>
            <span className="w-1.5 h-1.5 bg-orange-600 rounded-full inline-block"></span>
          </Link>
          <h2 className="font-serif font-bold text-xl tracking-tight text-neutral-900 uppercase">
            Sign in to your account
          </h2>
          <p className="text-xs font-sans font-bold uppercase tracking-widest text-neutral-400 mt-2">
            Access your custom feeds and draft stories
          </p>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-5 bg-white p-8 rounded-sm border border-black/10 shadow-sm" id="login-credentials-form">
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
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-orange-600 font-sans">
                Password
              </label>
            </div>
            <div className="relative">
              <input
                type="password"
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-white border border-black/10 focus:border-orange-600 focus:ring-0 rounded-sm focus:outline-none text-xs font-sans transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={submitting}
              />
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-neutral-400" />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-black hover:bg-orange-600 text-white font-sans font-black text-xs uppercase tracking-widest rounded-sm cursor-pointer transition-all disabled:opacity-50"
            disabled={submitting}
            id="login-submit-btn"
          >
            {submitting ? 'AUTHENTICATING...' : 'SIGN IN'}
          </button>
        </form>

        <p className="text-center text-xs font-bold uppercase tracking-wider text-neutral-500 mt-6 font-sans">
          New to Sanctuary?{' '}
          <Link to="/register" className="font-bold text-orange-600 hover:underline">
            Create an account
          </Link>
        </p>


      </div>
    </div>
  );
};
