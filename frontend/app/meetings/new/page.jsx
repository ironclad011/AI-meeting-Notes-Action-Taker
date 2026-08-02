'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import MeetingForm from '@/components/MeetingForm';
import { ChevronLeft, Sparkles } from 'lucide-react';

export default function NewMeetingPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (formData, setServerError) => {
    setSubmitting(true);
    const res = await apiFetch('/meetings', {
      method: 'POST',
      body: JSON.stringify(formData),
    });
    setSubmitting(false);

    if (res.success && res.data?.meeting) {
      router.push(`/meetings/${res.data.meeting.id || res.data.meeting._id}`);
    } else {
      setServerError(res.error?.message || 'Failed to create meeting.');
    }
  };

  return (
    <ProtectedRoute requireAuth={true}>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <Link
            href="/meetings"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Meetings
          </Link>

          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Create New Meeting</h1>
          </div>
          <p className="text-xs text-slate-400">
            Paste meeting transcript or upload a .txt file to start tracking AI insights and action items.
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl glass">
          <MeetingForm onSubmit={handleSubmit} submitting={submitting} />
        </div>
      </main>
    </ProtectedRoute>
  );
}
