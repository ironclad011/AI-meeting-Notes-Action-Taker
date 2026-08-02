'use client';

import Link from 'next/link';
import TypeBadge from './TypeBadge';
import { Calendar, Users, FileText, ArrowRight, Edit3, Trash2 } from 'lucide-react';

export default function MeetingCard({ meeting, onDelete }) {
  const formattedDate = meeting.date
    ? new Date(meeting.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'No Date';

  const transcriptExcerpt = meeting.transcript
    ? meeting.transcript.length > 140
      ? meeting.transcript.substring(0, 140) + '...'
      : meeting.transcript
    : 'No transcript provided.';

  return (
    <div className="group bg-slate-900/60 border border-slate-800/80 hover:border-brand-500/40 rounded-2xl p-5 shadow-lg hover:shadow-brand-500/5 transition-all flex flex-col justify-between backdrop-blur-xl">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <TypeBadge type={meeting.type} />
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            {formattedDate}
          </span>
        </div>

        <h3 className="text-base font-bold text-white group-hover:text-brand-300 transition-colors line-clamp-1 mb-2">
          {meeting.title}
        </h3>

        {meeting.participants && meeting.participants.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3 line-clamp-1">
            <Users className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>{meeting.participants.join(', ')}</span>
          </div>
        )}

        <div className="p-3 bg-slate-950/60 border border-slate-800/60 rounded-xl text-xs text-slate-400 leading-relaxed mb-4">
          <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <FileText className="w-3 h-3" />
            Transcript ({meeting.transcriptSource || 'pasted'})
          </div>
          <p className="line-clamp-2">{transcriptExcerpt}</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-800/60">
        <div className="flex items-center gap-1">
          <Link
            href={`/meetings/${meeting.id || meeting._id}/edit`}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Edit Meeting"
          >
            <Edit3 className="w-4 h-4" />
          </Link>
          <button
            onClick={() => onDelete(meeting)}
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
            title="Delete Meeting"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <Link
          href={`/meetings/${meeting.id || meeting._id}`}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-brand-400 hover:text-brand-300 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/20 rounded-lg transition-all"
        >
          View Details
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
