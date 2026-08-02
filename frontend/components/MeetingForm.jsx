'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Upload, FileText, Loader2, Save, X, AlertCircle } from 'lucide-react';

const MEETING_TYPES = [
  'Client Meeting',
  'Sales Meeting',
  'Project Meeting',
  'Internal Meeting',
  'Requirement Discussion',
  'Retrospective',
  'Other',
];

export default function MeetingForm({ initialData = {}, onSubmit, submitting, isEdit = false }) {
  const [serverError, setServerError] = useState('');
  const [fileLoading, setFileLoading] = useState(false);

  const defaultDate = initialData.date
    ? new Date(initialData.date).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  const defaultParticipants = Array.isArray(initialData.participants)
    ? initialData.participants.join(', ')
    : initialData.participants || '';

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: initialData.title || '',
      date: defaultDate,
      type: initialData.type || 'Project Meeting',
      participants: defaultParticipants,
      transcript: initialData.transcript || '',
      transcriptSource: initialData.transcriptSource || 'pasted',
      notes: initialData.notes || '',
    },
  });

  const transcriptValue = watch('transcript');

  // Handle client-side .txt file selection
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.txt')) {
      setServerError('Only plain text (.txt) files are allowed.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setServerError('File size exceeds 2MB limit.');
      return;
    }

    setServerError('');
    setFileLoading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      setValue('transcript', text, { shouldValidate: true });
      setValue('transcriptSource', 'uploaded');
      setFileLoading(false);
    };
    reader.onerror = () => {
      setServerError('Failed to read text file.');
      setFileLoading(false);
    };
    reader.readAsText(file);
  };

  const handleFormSubmit = (data) => {
    setServerError('');
    const participantsArray = data.participants
      ? data.participants
          .split(',')
          .map((p) => p.trim())
          .filter((p) => p.length > 0)
      : [];

    const formattedPayload = {
      ...data,
      participants: participantsArray,
    };

    onSubmit(formattedPayload, setServerError);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {serverError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{serverError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Title */}
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Meeting Title <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Q3 Roadmap Review & Requirements"
            {...register('title', { required: 'Meeting title is required' })}
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
          />
          {errors.title && (
            <p className="text-xs text-rose-400 mt-1">{errors.title.message}</p>
          )}
        </div>

        {/* Date */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Meeting Date <span className="text-rose-400">*</span>
          </label>
          <input
            type="date"
            {...register('date', { required: 'Meeting date is required' })}
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
          />
          {errors.date && (
            <p className="text-xs text-rose-400 mt-1">{errors.date.message}</p>
          )}
        </div>

        {/* Meeting Type */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Meeting Type <span className="text-rose-400">*</span>
          </label>
          <select
            {...register('type', { required: 'Meeting type is required' })}
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
          >
            {MEETING_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          {errors.type && (
            <p className="text-xs text-rose-400 mt-1">{errors.type.message}</p>
          )}
        </div>

        {/* Participants */}
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Participants <span className="text-slate-500 font-normal">(Comma-separated)</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Alice Johnson, Bob Smith, Carol Williams"
            {...register('participants')}
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
          />
        </div>
      </div>

      {/* Transcript Input Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-slate-300">
            Meeting Transcript <span className="text-rose-400">*</span>
          </label>

          {/* Upload .txt File Button */}
          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-300 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/20 rounded-lg cursor-pointer transition-colors">
            {fileLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            Upload .txt File
            <input
              type="file"
              accept=".txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Dual Input: Textarea */}
        <div className="relative">
          <textarea
            rows={8}
            placeholder="Paste your meeting transcript here, or click 'Upload .txt File' above..."
            {...register('transcript', { required: 'Transcript is required' })}
            className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 font-mono leading-relaxed transition-colors"
          />
          {transcriptValue && (
            <div className="absolute right-3 bottom-3 text-[10px] text-slate-500 bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
              {transcriptValue.length} chars
            </div>
          )}
        </div>
        {errors.transcript && (
          <p className="text-xs text-rose-400">{errors.transcript.message}</p>
        )}
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
          Additional Notes <span className="text-slate-500 font-normal">(Optional)</span>
        </label>
        <textarea
          rows={3}
          placeholder="Any manual context or follow-up notes..."
          {...register('notes')}
          className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-lg shadow-brand-600/20 transition-all flex items-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {isEdit ? 'Updating Meeting...' : 'Saving Meeting...'}
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {isEdit ? 'Update Meeting' : 'Save Meeting'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
