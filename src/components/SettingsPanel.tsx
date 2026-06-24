import React from 'react';
import { X, Copy, Check, Database, Key, ShieldCheck, HelpCircle } from 'lucide-react';
import { SQL_SCHEMA, isSupabaseConfigured } from '../lib/supabase';
import { useStore } from '../store';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const [copied, setCopied] = React.useState(false);
  const [installPrompt, setInstallPrompt] = React.useState<any>(null);
  const user = useStore((state) => state.user);
  const signOut = useStore((state) => state.signOut);

  React.useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInstallClick = async () => {
    if (!installPrompt) {
      alert('To install the app on your mobile device, tap the Share/Menu icon in your browser and select "Add to Home Screen".');
      return;
    }
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-xs transition-opacity animate-fade-in">
      {/* Backdrop click */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Slide-over Content Panel */}
      <div className="relative w-full max-w-xl h-full bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 p-6 md:p-8 flex flex-col overflow-y-auto shadow-2xl animate-slide-left font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-zinc-100 dark:border-zinc-900">
          <div>
            <h2 className="text-xl font-bold font-display text-zinc-900 dark:text-zinc-50 tracking-tight">
              Dashboard Settings
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Configure persistence engine and schema.
            </p>
          </div>
          <button
            id="close-settings-btn"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-6 space-y-4">
          {/* App Installation */}
          <div className="pb-6 border-b border-zinc-100 dark:border-zinc-900">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 tracking-wider uppercase font-mono mb-3">
              App Installation
            </h3>
            <button
              onClick={handleInstallClick}
              className="w-full py-2.5 px-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 rounded-lg font-bold text-sm transition-colors cursor-pointer"
            >
              Install Mobile App
            </button>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
              Install TaskBoard to your device for quick access and a native app experience.
            </p>
          </div>

          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 tracking-wider uppercase font-mono">
            Database Sync Engine
          </h3>

          {isSupabaseConfigured ? (
            <div className="p-4 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 flex items-start gap-3">
              <Database className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-emerald-950 dark:text-emerald-400">
                  Supabase Cloud Active
                </p>
                <p className="text-xs text-emerald-700 dark:text-emerald-500">
                  Your tasks, subjects, and order indices are syncing directly to the remote PostgreSQL database.
                </p>
                {user ? (
                  <div className="pt-2 flex items-center gap-2">
                    <span className="text-xs font-mono text-emerald-800 dark:text-emerald-400">
                      Active: {user.email}
                    </span>
                    <button
                      id="supabase-sign-out"
                      onClick={signOut}
                      className="px-2 py-0.5 text-[10px] font-mono border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/30 cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 mt-1 italic">
                    Unauthenticated session (using local credentials fallback)
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-start gap-3">
              <HelpCircle className="w-5 h-5 text-zinc-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Local Sandbox Mode Active
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  No database credentials detected. Data is fully persisted in your web browser's secure <strong>localStorage</strong>.
                </p>
              </div>
            </div>
          )}

          {/* Connection Instructions */}
          {!isSupabaseConfigured && (
            <div className="space-y-3 pt-2">
              <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                To connect your real Supabase Database:
              </p>
              <ol className="list-decimal list-inside text-xs text-zinc-500 dark:text-zinc-400 space-y-2 pl-1 leading-relaxed">
                <li>Create a free project at <a href="https://supabase.com" target="_blank" rel="noreferrer" className="underline hover:text-zinc-900 dark:hover:text-white">supabase.com</a>.</li>
                <li>Go to the <strong className="text-zinc-700 dark:text-zinc-300">Secrets</strong> panel in the Google AI Studio sidebar interface.</li>
                <li>Add the following environment variables:
                  <div className="mt-1.5 space-y-1 pl-4 font-mono text-[11px] text-zinc-800 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900 p-2 rounded border border-zinc-200 dark:border-zinc-800">
                    <div>VITE_SUPABASE_URL="your-supabase-url"</div>
                    <div>VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"</div>
                  </div>
                </li>
                <li>Recompile/Refresh the app, and it will immediately transition to real-time PostgreSQL synchronization.</li>
              </ol>
            </div>
          )}
        </div>

        {/* SQL Schema Codebox */}
        <div className="flex-1 flex flex-col min-h-[250px] pt-4 border-t border-zinc-100 dark:border-zinc-900">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-50 tracking-wider uppercase font-mono flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-zinc-500" />
              Required SQL Schema
            </h3>
            <button
              id="copy-sql-btn"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-md transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-500">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy SQL</span>
                </>
              )}
            </button>
          </div>
          
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-2">
            Paste this code inside the Supabase <strong className="text-zinc-600 dark:text-zinc-400">SQL Editor</strong> panel to automatically construct tables and deploy strict Row Level Security (RLS) policies.
          </p>

          <pre className="flex-1 w-full p-4 bg-zinc-950 text-zinc-200 dark:bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-auto font-mono text-[11px] leading-relaxed select-all">
            {SQL_SCHEMA}
          </pre>
        </div>
      </div>
    </div>
  );
}
