'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/authContext';
import { Sparkles, Plus, FileText, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Home() {
  const { user, loading } = useAuth();

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col items-center justify-center text-center">
      <div className="max-w-2xl w-full bg-slate-900/60 border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl glass space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold">
          <Sparkles className="w-4 h-4" /> AI Meeting Notes & Action Tracker
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
          Turn Raw Transcripts Into Actionable Team Intelligence
        </h1>

        <p className="text-slate-400 text-sm leading-relaxed max-w-lg mx-auto">
          Paste or upload meeting transcripts to automatically extract summaries, key decisions, and trackable action items with AI.
        </p>

        {loading ? (
          <div className="h-10 w-48 bg-slate-800 animate-pulse rounded-xl mx-auto" />
        ) : user ? (
          <div className="space-y-4 pt-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <ShieldCheck className="w-4 h-4" /> Logged in as <strong className="text-white">{user.name}</strong>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/meetings"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-brand-600/20 transition-all hover:scale-[1.02]"
              >
                <FileText className="w-4 h-4" />
                Go to Meetings
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/meetings/new"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
              >
                <Plus className="w-4 h-4 text-brand-400" />
                Create New Meeting
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-brand-600/20 transition-all hover:scale-[1.02]"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
            >
              Sign In
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
