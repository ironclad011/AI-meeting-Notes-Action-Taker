'use client';

const TYPE_STYLES = {
  'Client Meeting': 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  'Sales Meeting': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Project Meeting': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  'Internal Meeting': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Requirement Discussion': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Retrospective': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  'Other': 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

export default function TypeBadge({ type }) {
  const style = TYPE_STYLES[type] || TYPE_STYLES['Other'];

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style}`}>
      {type || 'Meeting'}
    </span>
  );
}
