import React from 'react';
import { useStore } from '../store';
import { Priority, Task } from '../types';
import { CheckCircle2, Clock, Flame, Folder, ArrowRight, LayoutDashboard, Calendar, Search } from 'lucide-react';
import TaskCard from './TaskCard';

export default function Dashboard() {
  const { tasks, subjects, setCurrentSubjectId } = useStore();

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const highPriorityTasks = pendingTasks.filter(t => t.priority === Priority.HIGH);
  
  // Tasks due soon (within 3 days)
  const getDueSoonTasks = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);

    return pendingTasks.filter(t => {
      if (!t.due_date) return false;
      const dueDate = new Date(t.due_date);
      return dueDate >= today && dueDate <= threeDaysFromNow;
    }).sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime());
  };

  const dueSoonTasks = getDueSoonTasks();
  const completionRate = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const getSubjectName = (subjectId: string) => {
    return subjects.find(s => s.id === subjectId)?.name || 'Unknown Subject';
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-white dark:bg-zinc-900">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl">
            <LayoutDashboard className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 font-display">
              TaskBoard Overview
            </h1>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-1">
              Your global command center. Track priorities and deadlines across all subjects.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-zinc-50 dark:bg-zinc-950/50 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Total</span>
              <Folder className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="text-3xl font-black text-zinc-900 dark:text-zinc-50">{subjects.length}</div>
            <div className="text-xs font-medium text-zinc-500 mt-1">Active Subjects</div>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-950/50 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Pending</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-3xl font-black text-zinc-900 dark:text-zinc-50">{pendingTasks.length}</div>
            <div className="text-xs font-medium text-zinc-500 mt-1">Tasks to complete</div>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-950/50 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Progress</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-3xl font-black text-zinc-900 dark:text-zinc-50">{completionRate}%</div>
            <div className="text-xs font-medium text-zinc-500 mt-1">Completion rate</div>
          </div>
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-800/30 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Critical</span>
              <Flame className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="text-3xl font-black text-indigo-700 dark:text-indigo-300">{highPriorityTasks.length}</div>
            <div className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mt-1">High priority tasks</div>
          </div>
        </div>

        {/* Actionable Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* High Priority List */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Flame className="w-5 h-5 text-rose-500" />
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">High Priority</h2>
            </div>
            
            {highPriorityTasks.length === 0 ? (
              <div className="bg-zinc-50 dark:bg-zinc-950/30 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl p-6 text-center">
                <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">No critical tasks</p>
                <p className="text-xs text-zinc-500 mt-1">You're all caught up on urgent items.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {highPriorityTasks.slice(0, 5).map(task => (
                  <div key={task.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">{task.title}</p>
                        <button 
                          onClick={() => setCurrentSubjectId(task.subject_id)}
                          className="flex items-center gap-1.5 mt-1.5 text-[10px] font-mono text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors uppercase tracking-wider"
                        >
                          <FolderClosed className="w-3 h-3" />
                          <span className="truncate max-w-[200px]">{getSubjectName(task.subject_id)}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="shrink-0 pt-0.5">
                        <span className="inline-flex items-center text-[10px] font-black uppercase px-2 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
                          High
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Due Soon List */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Calendar className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Upcoming Deadlines</h2>
            </div>
            
            {dueSoonTasks.length === 0 ? (
              <div className="bg-zinc-50 dark:bg-zinc-950/30 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl p-6 text-center">
                <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">No imminent deadlines</p>
                <p className="text-xs text-zinc-500 mt-1">Nothing due in the next 3 days.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dueSoonTasks.slice(0, 5).map(task => {
                  const isOverdue = task.due_date && new Date(task.due_date) < new Date(new Date().setHours(0,0,0,0));
                  
                  return (
                    <div key={task.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">{task.title}</p>
                          <button 
                            onClick={() => setCurrentSubjectId(task.subject_id)}
                            className="flex items-center gap-1.5 mt-1.5 text-[10px] font-mono text-zinc-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors uppercase tracking-wider"
                          >
                            <FolderClosed className="w-3 h-3" />
                            <span className="truncate max-w-[200px]">{getSubjectName(task.subject_id)}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="shrink-0 pt-0.5">
                          <span className={`inline-flex items-center text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                            isOverdue 
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          }`}>
                            {isOverdue ? 'Overdue' : new Date(task.due_date!).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
