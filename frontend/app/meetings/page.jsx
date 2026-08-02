'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import MeetingCard from '@/components/MeetingCard';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import { Plus, Search, Filter, Calendar, FileText, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

const MEETING_TYPES = [
  'All Types',
  'Client Meeting',
  'Sales Meeting',
  'Project Meeting',
  'Internal Meeting',
  'Requirement Discussion',
  'Retrospective',
  'Other',
];

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('All Types');
  const [page, setPage] = useState(1);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchMeetings = async () => {
    setLoading(true);
    let url = `/meetings?page=${page}&limit=9`;
    if (search.trim()) {
      url += `&search=${encodeURIComponent(search.trim())}`;
    }
    if (selectedType && selectedType !== 'All Types') {
      url += `&type=${encodeURIComponent(selectedType)}`;
    }

    const res = await apiFetch(url);
    setLoading(false);

    if (res.success && res.data) {
      setMeetings(res.data.meetings || []);
      setPagination(res.data.pagination || { page: 1, pages: 1, total: 0 });
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMeetings();
    }, 250);

    return () => clearTimeout(timer);
  }, [search, selectedType, page]);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    const res = await apiFetch(`/meetings/${deleteTarget.id || deleteTarget._id}`, {
      method: 'DELETE',
    });

    setDeleting(false);
    setDeleteTarget(null);

    if (res.success) {
      fetchMeetings();
    }
  };

  return (
    <ProtectedRoute requireAuth={true}>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Meetings</h1>
            <p className="text-xs text-slate-400 mt-1">
              Upload, organize, and manage your meeting transcripts
            </p>
          </div>

          <Link
            href="/meetings/new"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-brand-600/20 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            New Meeting
          </Link>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded-2xl glass">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search meetings by title..."
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>

          {/* Type Filter Dropdown */}
          <div className="relative w-full sm:w-56">
            <Filter className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-500 pointer-events-none" />
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-8 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500 transition-colors appearance-none cursor-pointer"
            >
              {MEETING_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Meeting Cards Grid / States */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-56 bg-slate-900/40 border border-slate-800/60 rounded-2xl animate-pulse p-5 space-y-4">
                <div className="h-4 bg-slate-800 rounded w-1/3" />
                <div className="h-6 bg-slate-800 rounded w-3/4" />
                <div className="h-16 bg-slate-800/50 rounded-xl" />
              </div>
            ))}
          </div>
        ) : meetings.length === 0 ? (
          <div className="text-center py-16 px-4 bg-slate-900/30 border border-slate-800/60 rounded-2xl glass space-y-4">
            <div className="inline-flex p-4 rounded-2xl bg-slate-800/60 text-slate-400 mb-2">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">No meetings found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {search || selectedType !== 'All Types'
                ? 'No meetings match your search criteria. Try clearing filters.'
                : 'You have not added any meetings yet. Create your first meeting to get started!'}
            </p>
            <div className="pt-2">
              {search || selectedType !== 'All Types' ? (
                <button
                  onClick={() => {
                    setSearch('');
                    setSelectedType('All Types');
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-colors"
                >
                  Clear Filters
                </button>
              ) : (
                <Link
                  href="/meetings/new"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl shadow-lg transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Create First Meeting
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {meetings.map((m) => (
              <MeetingCard key={m.id || m._id} meeting={m} onDelete={(meeting) => setDeleteTarget(meeting)} />
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-800/60 text-xs text-slate-400">
            <span>
              Showing page <strong className="text-white">{pagination.page}</strong> of{' '}
              <strong className="text-white">{pagination.pages}</strong> ({pagination.total} total meetings)
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-2 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                className="p-2 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        <ConfirmDeleteModal
          isOpen={!!deleteTarget}
          title={deleteTarget?.title || ''}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      </main>
    </ProtectedRoute>
  );
}
