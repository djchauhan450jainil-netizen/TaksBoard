import React, { useState, useRef, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { useStore } from '../store';

interface SubjectFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function SubjectForm({ onSuccess, onCancel }: SubjectFormProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const addSubject = useStore((state) => state.addSubject);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Subject name cannot be empty');
      return;
    }

    try {
      await addSubject(trimmedName);
      setName('');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err?.message || 'Failed to create subject');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="space-y-2">
        <div className="relative flex items-center">
          <input
            id="subject-name-input"
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError('');
            }}
            placeholder="e.g. Organic Chemistry"
            className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 font-sans"
            maxLength={40}
          />
          {onCancel && (
            <button
              id="cancel-subject-btn"
              type="button"
              onClick={onCancel}
              className="absolute right-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {error && (
          <p className="text-xs text-red-500 font-medium font-sans px-1">
            {error}
          </p>
        )}

        <div className="flex gap-2 justify-end">
          {onCancel && (
            <button
              id="cancel-form-btn"
              type="button"
              onClick={onCancel}
              className="px-2.5 py-1 text-xs text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-md transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            id="submit-subject-btn"
            type="submit"
            className="flex items-center gap-1 px-3 py-1 text-xs bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-md transition-colors font-medium cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            Create
          </button>
        </div>
      </div>
    </form>
  );
}
