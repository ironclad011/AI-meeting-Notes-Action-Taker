'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/authContext';
import { Sparkles, LogOut, LogIn, UserPlus, User } from 'lucide-react';

export default function Navbar() {
  const { user, loading, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg tracking-tight text-white group-hover:text-brand-400 transition-colors">
            ActionTaker<span className="text-brand-400">.ai</span>
          </span>
        </Link>

        <nav className="flex items-center gap-3">
          {loading ? (
            <div className="h-8 w-24 bg-slate-800 animate-pulse rounded-lg" />
          ) : user ? (
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 text-sm text-slate-300 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
                <User className="w-4 h-4 text-brand-400" />
                <span className="font-medium">{user.name}</span>
              </div>
              <button
                onClick={logout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Log out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                Log in
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-lg shadow-md shadow-brand-600/20 transition-all hover:scale-[1.02]"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Register
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
