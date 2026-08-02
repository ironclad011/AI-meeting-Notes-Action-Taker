'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import MeetingForm from '@/components/MeetingForm';
import { ChevronLeft, Edit3, Loader2, AlertCircle } from 'lucide-react';

export default function EditMeetingPage() {
  const { id } = useParams();
  const router = useRouter();

  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchMeeting = async () => {
      setLoading(true);
      setError('');
      const res = await apiFetch(`/meetings/${id}`);
      setLoading(false);

      if (res.success && res.data?.meeting) {
        setMeeting(res.data.meeting);
      } else {
        setError(res.error?.message || 'Meeting not found.');
      }
    };

    if (id) {
      fetchMeeting();
    }
  }, [id]);

  const handleSubmit = async (formData, setServerError) => {
    setSubmitting(true);
    const res = await apiFetch(`/meetings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(formData),
    });
    setSubmitting(false);

    if (res.success && res.data?.meeting) {
      router.push(`/meetings/${id}`);
    } else {
      setServerError(res.error?.message || 'Failed to update meeting.');
    }
  };

  if (loading) {
    return (
      <ProtectedRoute requireAuth={true}>
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
          <p className="text-xs font-medium">Loading meeting for edit...</p>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !meeting) {
    return (
      <ProtectedRoute requireAuth={true}>
        <main className="max-w-3xl mx-auto px-4 py-12 text-center">
          <div className="p-8 bg-slate-900/60 border border-slate-800 rounded-2xl glass space-y-4">
            <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
            <h2 className="text-xl font-bold text-white">Meeting Not Found</h2>
            <p className="text-xs text-slate-400">{error}</p>
            <Link
              href="/meetings"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Meetings
            </Link>
          </div>
        </main>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireAuth={true}>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <Link
            href={`/meetings/${id}`}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Meeting Details
          </Link>

          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <Edit3 className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Edit Meeting</h1>
          </div>
          <p className="text-xs text-slate-400">
            Update details, participants, or transcript text.
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl glass">
          <MeetingForm
            initialData={meeting}
            onSubmit={handleSubmit}
            submitting={submitting}
            isEdit={true}
          />
        </div>
      </main>
    </ProtectedRoute>
  );
}
