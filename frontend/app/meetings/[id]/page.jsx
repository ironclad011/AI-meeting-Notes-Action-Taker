'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import TypeBadge from '@/components/TypeBadge';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import {
  ChevronLeft,
  Calendar,
  Users,
  FileText,
  Edit3,
  Trash2,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  CheckSquare,
  RefreshCw,
  Clock,
  UserCheck,
} from 'lucide-react';

export default function MeetingDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [meeting, setMeeting] = useState(null);
  const [actionItems, setActionItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // AI Generation State
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState('');

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchMeeting = async () => {
    setLoading(true);
    setError('');
    const res = await apiFetch(`/meetings/${id}`);
    setLoading(false);

    if (res.success && res.data?.meeting) {
      setMeeting(res.data.meeting);
      setActionItems(res.data.actionItems || []);
    } else {
      setError(res.error?.message || 'Meeting not found or access denied.');
    }
  };

  useEffect(() => {
    if (id) {
      fetchMeeting();
    }
  }, [id]);

  const handleGenerateAi = async () => {
    setAiGenerating(true);
    setAiError('');

    const res = await apiFetch(`/meetings/${id}/generate-ai`, {
      method: 'POST',
    });

    setAiGenerating(false);

    if (res.success && res.data?.meeting) {
      setMeeting(res.data.meeting);
      setActionItems(res.data.actionItems || []);
    } else {
      setAiError(res.error?.message || 'Failed to generate AI insights. Please try again.');
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    const res = await apiFetch(`/meetings/${id}`, {
      method: 'DELETE',
    });
    setDeleting(false);
    setShowDeleteModal(false);

    if (res.success) {
      router.push('/meetings');
    } else {
      setError(res.error?.message || 'Failed to delete meeting.');
    }
  };

  if (loading) {
    return (
      <ProtectedRoute requireAuth={true}>
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
          <p className="text-xs font-medium">Loading meeting details...</p>
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
            <p className="text-xs text-slate-400">{error || 'The requested meeting does not exist or you do not have permission.'}</p>
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

  const formattedDate = meeting.date
    ? new Date(meeting.date).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'No Date';

  const aiStatus = meeting.ai?.status || 'not_started';
  const aiData = meeting.ai || {};

  const priorityColorMap = {
    High: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    Medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    Low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  };

  return (
    <ProtectedRoute requireAuth={true}>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Back link and Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            href="/meetings"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Meetings
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href={`/meetings/${meeting.id || meeting._id}/edit`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit
            </Link>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 rounded-xl transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        </div>

        {/* Meeting Header Info */}
        <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl glass space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <TypeBadge type={meeting.type} />
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-brand-400" />
              {formattedDate}
            </span>
            <span className="text-xs text-slate-500">
              Source: <strong className="text-slate-400 font-medium capitalize">{meeting.transcriptSource || 'pasted'}</strong>
            </span>
          </div>

          <h1 className="text-2xl font-bold text-white tracking-tight">{meeting.title}</h1>

          {meeting.participants && meeting.participants.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60 text-xs">
              <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-slate-400 font-medium">Participants:</span>
              <div className="flex flex-wrap gap-1.5">
                {meeting.participants.map((p, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[11px]">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}

          {meeting.notes && (
            <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-300 space-y-1">
              <strong className="text-slate-400 block text-[10px] uppercase tracking-wider font-semibold">Notes:</strong>
              <p className="whitespace-pre-wrap">{meeting.notes}</p>
            </div>
          )}
        </div>

        {/* AI INSIGHTS SECTION */}
        <div className="p-6 bg-gradient-to-r from-brand-950/40 via-slate-900/60 to-purple-950/40 border border-brand-500/30 rounded-2xl glass space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-lg shadow-brand-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  AI Meeting Insights
                  {aiStatus === 'completed' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" /> Generated
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-400">Automated summary, decisions, action items, risks, and open questions.</p>
              </div>
            </div>

            <button
              onClick={handleGenerateAi}
              disabled={aiGenerating}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-lg shadow-brand-600/20 transition-all hover:scale-[1.02]"
            >
              {aiGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Insights...
                </>
              ) : aiStatus === 'completed' ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  Re-generate Insights
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Generate AI Insights
                </>
              )}
            </button>
          </div>

          {/* AI Error Alert */}
          {(aiError || aiStatus === 'failed') && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{aiError || aiData.error || 'Failed to generate AI insights. Please try again.'}</span>
              </div>
              <button
                onClick={handleGenerateAi}
                className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-semibold rounded-lg transition-colors shrink-0"
              >
                Retry
              </button>
            </div>
          )}

          {/* AI Processing Loading State */}
          {aiGenerating ? (
            <div className="p-8 text-center space-y-3 bg-slate-950/40 rounded-xl border border-slate-800">
              <Loader2 className="w-8 h-8 animate-spin text-brand-400 mx-auto" />
              <h4 className="text-sm font-semibold text-white">Analyzing Transcript with AI...</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Extracting executive summary, key decisions, action items, risks, and questions.
              </p>
            </div>
          ) : aiStatus === 'completed' ? (
            /* COMPLETED AI DASHBOARD */
            <div className="space-y-6">
              {/* Executive Summary */}
              {aiData.summary && (
                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-brand-400" /> Executive Summary
                  </h4>
                  <p className="text-xs text-slate-200 leading-relaxed">{aiData.summary}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Key Discussion Points */}
                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" /> Key Discussion Points
                  </h4>
                  {aiData.keyDiscussionPoints && aiData.keyDiscussionPoints.length > 0 ? (
                    <ul className="space-y-1.5">
                      {aiData.keyDiscussionPoints.map((point, idx) => (
                        <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No key discussion points recorded.</p>
                  )}
                </div>

                {/* Key Decisions */}
                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-400" /> Key Decisions
                  </h4>
                  {aiData.keyDecisions && aiData.keyDecisions.length > 0 ? (
                    <ul className="space-y-1.5">
                      {aiData.keyDecisions.map((dec, idx) => (
                        <li key={idx} className="text-xs text-emerald-300/90 flex items-start gap-2 bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/10">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{dec}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-3 bg-slate-900/40 rounded-lg border border-slate-800 text-xs text-slate-500 italic">
                      No clear decisions were identified in this transcript.
                    </div>
                  )}
                </div>
              </div>

              {/* Extracted Action Items */}
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-brand-400" /> Extracted Action Items
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-brand-500/10 text-brand-400 border border-brand-500/20 font-semibold">
                      {actionItems.length}
                    </span>
                  </h4>
                </div>

                {actionItems.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {actionItems.map((item) => (
                      <div key={item.id || item._id} className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2 text-xs">
                        <p className="font-medium text-white line-clamp-2">{item.description}</p>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <UserCheck className="w-3 h-3 text-slate-500" />
                            {item.assignee || 'Unassigned'}
                          </span>

                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${priorityColorMap[item.priority] || priorityColorMap['Medium']}`}>
                            {item.priority || 'Medium'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No action items extracted from transcript.</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Risks & Concerns */}
                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Risks & Concerns
                  </h4>
                  {aiData.risksOrConcerns && aiData.risksOrConcerns.length > 0 ? (
                    <ul className="space-y-1.5">
                      {aiData.risksOrConcerns.map((risk, idx) => (
                        <li key={idx} className="text-xs text-amber-300/90 flex items-start gap-2 bg-amber-500/5 p-2 rounded-lg border border-amber-500/10">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <span>{risk}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No risks or concerns flagged.</p>
                  )}
                </div>

                {/* Unanswered Questions */}
                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-purple-400" /> Unanswered Questions
                  </h4>
                  {aiData.unansweredQuestions && aiData.unansweredQuestions.length > 0 ? (
                    <ul className="space-y-1.5">
                      {aiData.unansweredQuestions.map((q, idx) => (
                        <li key={idx} className="text-xs text-purple-300/90 flex items-start gap-2 bg-purple-500/5 p-2 rounded-lg border border-purple-500/10">
                          <HelpCircle className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                          <span>{q}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No unanswered questions recorded.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* UNSTARTED / NOT GENERATED STATE */
            <div className="p-6 bg-slate-950/40 border border-slate-800 rounded-xl text-center space-y-3 py-8">
              <div className="p-3 rounded-2xl bg-brand-500/10 text-brand-400 border border-brand-500/20 inline-flex">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white">Ready for AI Processing</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Click <strong className="text-white">"Generate AI Insights"</strong> above to summarize key decisions, extract action items, and identify risks from this meeting's transcript.
              </p>
            </div>
          )}
        </div>

        {/* Stored Transcript (Read View) */}
        <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl glass space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <FileText className="w-4 h-4 text-brand-400" />
              Meeting Transcript
            </div>
            <span className="text-xs text-slate-500 font-mono">
              {meeting.transcript ? meeting.transcript.length : 0} characters
            </span>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800/80 rounded-xl text-xs font-mono text-slate-200 leading-relaxed whitespace-pre-wrap max-h-[500px] overflow-y-auto selection:bg-brand-500 selection:text-white">
            {meeting.transcript || 'No transcript text available.'}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        <ConfirmDeleteModal
          isOpen={showDeleteModal}
          title={meeting.title}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setShowDeleteModal(false)}
          deleting={deleting}
        />
      </main>
    </ProtectedRoute>
  );
}
