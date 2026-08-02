'use client';

import { AlertTriangle, Loader2 } from 'lucide-react';

export default function ConfirmDeleteModal({ isOpen, title, onConfirm, onCancel, deleting }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Delete Meeting?</h3>
            <p className="text-xs text-slate-400">This action cannot be undone.</p>
          </div>
        </div>

        <p className="text-sm text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
          Are you sure you want to delete <span className="font-semibold text-white">"{title}"</span>?
        </p>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 rounded-xl shadow-lg shadow-rose-600/20 transition-colors flex items-center gap-1.5"
          >
            {deleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Deleting...
              </>
            ) : (
              'Confirm Delete'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
