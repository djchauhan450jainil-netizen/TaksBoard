import React, { useState } from 'react';
import { Plus, Folder, FolderClosed, Trash2, Sun, Moon, Database, HelpCircle, GraduationCap, X, LayoutDashboard } from 'lucide-react';
import { useStore } from '../store';
import SubjectForm from './SubjectForm';

interface SidebarProps {
  onOpenSettings: () => void;
  onCloseMobile?: () => void;
}

export default function Sidebar({ onOpenSettings, onCloseMobile }: SidebarProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState<string | null>(null);
  const {
    subjects,
    tasks,
    currentSubjectId,
    setCurrentSubjectId,
    deleteSubject,
    theme,
    setTheme,
    user,
  } = useStore();

  const handleToggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const getSubjectStats = (subjectId: string) => {
    const subjectTasks = tasks.filter((t) => t.subject_id === subjectId);
    const completed = subjectTasks.filter((t) => t.status === 'done').length;
    const total = subjectTasks.length;
    return { completed, total };
  };

  return (
    <aside className="w-[280px] shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex flex-col h-full font-sans select-none">
      
      {/* Brand Header */}
      <div className="p-6 border-b border-zinc-200 dark:border-zinc-900 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-white uppercase font-display">
            TaskBoard
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Inline creation toggle button */}
          {!isCreating && (
            <button
              id="toggle-create-subject-btn"
              onClick={() => setIsCreating(true)}
              className="w-8 h-8 rounded-lg bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950 flex items-center justify-center hover:bg-zinc-850 dark:hover:bg-zinc-200 transition-colors cursor-pointer"
              title="Add New Subject"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
          {onCloseMobile && (
            <button onClick={onCloseMobile} className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation & Folders List */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        
        {/* Subjects List Header */}
        <div className="space-y-4">
          <div className="space-y-1 mb-6">
            <button
              onClick={() => {
                setCurrentSubjectId(null);
                if (onCloseMobile) onCloseMobile();
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                currentSubjectId === null
                  ? 'bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950'
                  : 'text-zinc-650 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900/50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>
          </div>

          <div className="flex items-center justify-between px-2">
            <h2 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-mono">
              Subjects ({subjects.length})
            </h2>
          </div>

          {/* Inline Form Injection */}
          {isCreating && (
            <div className="px-2 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 space-y-1.5 shadow-xs animate-fade-in">
              <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase font-mono tracking-wider">New Subject Folder</p>
              <SubjectForm 
                onSuccess={() => setIsCreating(false)} 
                onCancel={() => setIsCreating(false)} 
              />
            </div>
          )}

          {/* Folders List */}
          <div className="space-y-1">
            {subjects.length === 0 ? (
              <div className="text-center py-6 px-4 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  No subjects created yet. Click "+" to start organizing.
                </p>
              </div>
            ) : (
              subjects.map((subject) => {
                const isActive = currentSubjectId === subject.id;
                const stats = getSubjectStats(subject.id);
                
                if (subjectToDelete === subject.id) {
                  return (
                    <div key={`delete-${subject.id}`} className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg p-3 text-xs flex flex-col gap-3 animate-fade-in mx-1">
                      <p className="text-red-800 dark:text-red-400 font-medium">Delete "{subject.name}"?</p>
                      <div className="flex gap-2">
                        <button onClick={() => setSubjectToDelete(null)} className="flex-1 px-2 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer">Cancel</button>
                        <button onClick={() => { deleteSubject(subject.id); setSubjectToDelete(null); }} className="flex-1 px-2 py-1.5 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 cursor-pointer">Delete</button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    id={`subject-item-${subject.id}`}
                    key={subject.id}
                    className={`group relative flex items-center justify-between rounded-lg transition-all px-1 ${
                      isActive
                        ? 'bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950'
                        : 'text-zinc-650 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900/50'
                    }`}
                  >
                    <button
                      id={`subject-select-${subject.id}`}
                      onClick={() => {
                        setCurrentSubjectId(subject.id);
                        if (onCloseMobile) onCloseMobile();
                      }}
                      className="flex items-center gap-2 px-2 py-2 text-sm font-medium flex-1 text-left truncate cursor-pointer rounded-lg"
                    >
                      <span className="truncate">{subject.name}</span>
                    </button>

                    {/* Meta stats & Delete Hover actions */}
                    <div className="flex items-center gap-1.5 pr-2 shrink-0">
                      {/* Metric info */}
                      {stats.total > 0 && (
                        <span 
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            isActive
                              ? 'bg-zinc-850 text-zinc-300 dark:bg-zinc-100 dark:text-zinc-700'
                              : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-500'
                          }`}
                        >
                          {stats.completed}/{stats.total}
                        </span>
                      )}

                      {/* Delete button */}
                      <button
                        id={`subject-delete-${subject.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSubjectToDelete(subject.id);
                        }}
                        className={`p-1 rounded transition-colors opacity-0 group-hover:opacity-100 cursor-pointer ${
                          isActive
                            ? 'text-zinc-400 hover:text-red-400 hover:bg-zinc-900 dark:text-zinc-500 dark:hover:text-red-500 dark:hover:bg-zinc-100'
                            : 'text-zinc-400 hover:text-red-600 hover:bg-zinc-200 dark:text-zinc-600 dark:hover:text-red-400 dark:hover:bg-zinc-800'
                        }`}
                        title="Delete Subject"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>
      </div>

      {/* Pro Student Indicator Box */}
      <div className="px-4 shrink-0">
        <div className="p-4 bg-zinc-100/70 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800 rounded-lg">
          <p className="text-xs font-semibold text-zinc-850 dark:text-zinc-200 mb-1">Pro Student</p>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-3 font-mono">Syncing across 3 devices</p>
          <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full w-3/4 bg-zinc-950 dark:bg-zinc-50"></div>
          </div>
        </div>
      </div>

      {/* Footer Settings & Toggles */}
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-900 space-y-2 shrink-0">
        {/* DB Connection Indicators */}
        <button
          id="sidebar-settings-indicator"
          onClick={onOpenSettings}
          className="w-full flex items-center justify-between p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-left hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
            <span className="text-[11px] font-medium text-zinc-650 dark:text-zinc-400">
              Database Console
            </span>
          </div>
          <span className="flex h-2 w-2 relative">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              useStore((s) => s.isSupabaseMode) ? 'bg-emerald-400' : 'bg-zinc-400'
            }`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${
              useStore((s) => s.isSupabaseMode) ? 'bg-emerald-500' : 'bg-zinc-400'
            }`}></span>
          </span>
        </button>

        {/* Theme switcher */}
        <div className="flex gap-2">
          <button
            id="theme-switcher-btn"
            onClick={handleToggleTheme}
            className="flex-1 flex items-center justify-center gap-2 py-2 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 text-xs font-medium cursor-pointer transition-colors"
          >
            {theme === 'light' ? (
              <>
                <Moon className="w-3.5 h-3.5" />
                <span>Dark Mode</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5" />
                <span>Light Mode</span>
              </>
            )}
          </button>
        </div>
      </div>

    </aside>
  );
}
