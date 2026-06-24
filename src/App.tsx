import React, { useEffect, useState } from 'react';
import { Play, Settings, Check, Calendar, Plus, ListTodo, AlertTriangle, Sparkles, FolderClosed, Menu, Filter } from 'lucide-react';
import { useStore } from './store';
import { Priority, Task, TaskFilter } from './types';
import Sidebar from './components/Sidebar';
import TaskCard from './components/TaskCard';
import SettingsPanel from './components/SettingsPanel';
import ActiveTaskTimer from './components/ActiveTaskTimer';
import Dashboard from './components/Dashboard';

export default function App() {
  const {
    subjects,
    tasks,
    currentSubjectId,
    filter,
    setFilter,
    init,
    isLoading,
    addTask,
    reorderTasks,
  } = useStore();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeFocusTask, setActiveFocusTask] = useState<Task | null>(null);

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>(Priority.MEDIUM);
  const [newDueDate, setNewDueDate] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Drag and drop local state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Fetch initial data
  useEffect(() => {
    init();
  }, []);

  const activeSubject = subjects.find((s) => s.id === currentSubjectId);

  // Subject stats for the header
  const subjectTasksForStats = activeSubject ? tasks.filter((t) => t.subject_id === activeSubject.id) : [];
  const completedCount = subjectTasksForStats.filter((t) => t.status === 'done').length;
  const totalCount = subjectTasksForStats.length;
  const completionPercentage = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  // Filter and sort active subject tasks
  const getFilteredTasks = (): Task[] => {
    if (!currentSubjectId) return [];
    
    // Get tasks belonging to this subject
    let subjectTasks = tasks.filter((t) => t.subject_id === currentSubjectId);

    // Apply UI Filters
    if (filter === 'high') {
      subjectTasks = subjectTasks.filter((t) => t.priority === Priority.HIGH);
    } else if (filter === 'due_soon') {
      subjectTasks = subjectTasks.filter((t) => {
        if (!t.due_date || t.status === 'done') return false;
        const dueDate = new Date(t.due_date);
        const now = new Date();
        const diffHours = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        return diffHours > 0 && diffHours <= 48; // Due within 48 hours
      });
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      subjectTasks = subjectTasks.filter((t) => t.title.toLowerCase().includes(query));
    }

    // Default Sort: Pending first, then order_index.
    // This maintains drag-and-drop order but naturally drops completed items to the bottom
    return [...subjectTasks].sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === 'pending' ? -1 : 1;
      }
      return a.order_index - b.order_index;
    });
  };

  const activeTasks = getFilteredTasks();

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!newTitle.trim()) {
      setErrorMsg('Task title is required');
      return;
    }

    if (!currentSubjectId) {
      setErrorMsg('Please select or create a subject first');
      return;
    }

    try {
      await addTask(newTitle.trim(), newPriority, newDueDate || undefined);
      setNewTitle('');
      setNewDueDate('');
      setNewPriority(Priority.MEDIUM);
      setIsAddingTask(false);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to add task');
    }
  };

  // HTML5 Drag and Drop events
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    // Rearrange locally first
    const reorderedList = [...activeTasks];
    const [draggedItem] = reorderedList.splice(draggedIndex, 1);
    reorderedList.splice(dropIndex, 0, draggedItem);

    // Assign new sequential order_indexes
    const reindexedList = reorderedList.map((task, idx) => ({
      ...task,
      order_index: idx,
    }));

    // Update global state store with the rest of the tasks
    const otherTasks = tasks.filter((t) => t.subject_id !== currentSubjectId);
    await reorderTasks([...otherTasks, ...reindexedList]);
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleStartFocusSession = () => {
    // Start session with the first pending task
    const pendingTasks = activeTasks.filter((t) => t.status === 'pending');
    if (pendingTasks.length > 0) {
      // Prioritize High Priority tasks, otherwise take the first pending task
      const highPending = pendingTasks.find((t) => t.priority === Priority.HIGH);
      setActiveFocusTask(highPending || pendingTasks[0]);
    } else {
      alert('No pending tasks available for this subject. Create a task first!');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center font-sans">
        <div className="space-y-4 text-center">
          <div className="inline-block animate-spin w-8 h-8 border-4 border-zinc-900 border-t-transparent dark:border-white dark:border-t-transparent rounded-full" />
          <p className="text-xs font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
            Booting Board Console...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col h-screen overflow-hidden font-sans">
      
      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile Sidebar Backdrop */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden" 
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
        
        {/* LEFT SIDEBAR PANEL */}
        <div className={`${isSidebarOpen ? 'fixed inset-y-0 left-0 z-50 shadow-2xl transition-transform translate-x-0' : 'hidden'} md:block md:relative md:z-auto h-full bg-zinc-50 dark:bg-zinc-950`}>
          <Sidebar onOpenSettings={() => { setIsSettingsOpen(true); setIsSidebarOpen(false); }} onCloseMobile={() => setIsSidebarOpen(false)} />
        </div>

        {/* CENTRAL MAIN VIEW AREA */}
        <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-zinc-900 h-full overflow-hidden relative z-0">
        
        {/* TOP STATUS HEADER BAR */}
        <header className="px-4 sm:px-6 md:px-10 h-16 sm:h-20 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto overflow-hidden">
             {/* Hamburger Menu - Mobile only */}
             <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden p-1.5 -ml-1 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 shrink-0">
               <Menu className="w-5 h-5" />
             </button>
            {activeSubject ? (
              <div className="min-w-0 overflow-hidden">
                <h2 className="text-lg sm:text-xl md:text-2xl font-black text-zinc-950 dark:text-zinc-50 tracking-tighter truncate w-full">
                  {activeSubject.name}
                </h2>
                <p className="hidden sm:block text-xs text-zinc-550 dark:text-zinc-400 mt-0.5 font-medium truncate">
                  {completedCount} of {totalCount} tasks complete • {completionPercentage}% complete
                </p>
              </div>
            ) : (
              <div className="space-y-0.5 min-w-0 overflow-hidden">
                <p className="hidden sm:block text-[10px] font-mono text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-bold">
                  Board Overview
                </p>
                <h2 className="text-lg sm:text-xl md:text-2xl font-black text-zinc-950 dark:text-zinc-50 tracking-tighter truncate">
                  TaskBoard
                </h2>
              </div>
            )}
          </div>

          {/* Core Controls */}
          {activeSubject && (
            <div className="flex items-center shrink-0 ml-2">
              {/* Start Focus Timer Button */}
              <button
                id="start-task-focus-session"
                onClick={handleStartFocusSession}
                className="w-9 h-9 sm:w-auto sm:h-auto sm:px-5 sm:py-2.5 bg-indigo-600 text-white rounded-lg font-bold text-sm shadow-[4px_4px_0px_0px_rgba(79,70,229,0.2)] hover:translate-y-[1px] hover:shadow-none transition-all cursor-pointer flex items-center justify-center sm:gap-2"
                title="Start Focus Session"
              >
                <Play className="w-4 h-4 sm:w-3.5 sm:h-3.5 fill-current shrink-0 ml-0.5 sm:ml-0" />
                <span className="hidden sm:inline">Start Focus Session</span>
              </button>
            </div>
          )}
        </header>

        {/* CONTROLS & FILTERS DECK */}
        {activeSubject && (
          <div className="px-4 sm:px-6 md:px-10 py-3 sm:py-5 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-3 bg-zinc-50/50 dark:bg-zinc-950/10 shrink-0">
            
            {/* Quick search task bar */}
            <div className="relative flex-1 sm:w-64">
              <input
                id="task-search-input"
                type="text"
                placeholder="Quick search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-9 pr-4 py-2.5 sm:py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-200 dark:focus:ring-zinc-800 text-zinc-800 dark:text-zinc-150 transition-all placeholder-zinc-400 dark:placeholder-zinc-600"
              />
              <svg className="absolute left-3 top-3 sm:top-2.5 text-zinc-400" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>

            {/* Filter buttons - Dropdown on mobile, buttons on desktop */}
            <div className="shrink-0 flex items-center">
              <div className="sm:hidden relative w-10 h-10">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as TaskFilter)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                >
                  <option value="all">All Tasks</option>
                  <option value="high">High Priority</option>
                  <option value="due_soon">Due Soon</option>
                </select>
                <div className="w-10 h-10 flex items-center justify-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-400 pointer-events-none">
                  <Filter className="w-4 h-4" />
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-1.5 bg-white dark:bg-zinc-900 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
                {(['all', 'high', 'due_soon'] as TaskFilter[]).map((f) => (
                  <button
                    id={`filter-btn-${f}`}
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-1.5 text-xs rounded-md transition-all cursor-pointer ${
                      filter === f
                        ? 'font-bold bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-xs'
                        : 'font-semibold text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-100'
                    }`}
                  >
                    {f === 'all' && 'All'}
                    {f === 'high' && 'High Priority'}
                    {f === 'due_soon' && 'Due Soon'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* WORKSPACE AREA */}
        <div className="flex-1 overflow-y-auto px-6 md:px-10 py-8 space-y-8">
          
          {activeSubject ? (
            <div className="max-w-4xl mx-auto space-y-8">
              
              {/* Task Creation Deck */}
              {isAddingTask && (
                <div className="p-5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg space-y-4 animate-fade-in max-w-2xl">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-mono">
                      New Task Assembly
                    </h3>
                    <button
                      id="close-add-task-deck"
                      onClick={() => {
                        setIsAddingTask(false);
                        setErrorMsg('');
                      }}
                      className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 underline cursor-pointer"
                    >
                      Collapse
                    </button>
                  </div>

                  <form onSubmit={handleCreateTask} className="space-y-4">
                    {/* Title */}
                    <div className="space-y-1">
                      <input
                        id="new-task-title-input"
                        type="text"
                        value={newTitle}
                        onChange={(e) => {
                          setNewTitle(e.target.value);
                          if (errorMsg) setErrorMsg('');
                        }}
                        placeholder="Define the core study milestone..."
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600"
                        maxLength={80}
                        required
                      />
                    </div>

                    {/* Meta Selectors */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Priority */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
                          Task Severity
                        </label>
                        <div className="flex gap-2">
                          {([Priority.LOW, Priority.MEDIUM, Priority.HIGH]).map((p) => {
                            const isSel = newPriority === p;
                            return (
                              <button
                                id={`new-task-priority-${p}`}
                                key={p}
                                type="button"
                                onClick={() => setNewPriority(p)}
                                className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                                  isSel
                                    ? p === Priority.HIGH
                                      ? 'bg-rose-50 border-rose-300 text-rose-750 dark:bg-rose-950/20 dark:border-rose-900 dark:text-rose-400 font-bold'
                                      : p === Priority.MEDIUM
                                      ? 'bg-amber-50 border-amber-300 text-amber-750 dark:bg-amber-950/20 dark:border-amber-900 dark:text-amber-400 font-bold'
                                      : 'bg-zinc-100 border-zinc-400 text-zinc-800 dark:bg-zinc-800 dark:border-zinc-600 dark:text-zinc-200 font-bold'
                                    : 'bg-white border-zinc-200 text-zinc-500 dark:bg-zinc-900 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                                }`}
                              >
                                {p === Priority.LOW && 'Low'}
                                {p === Priority.MEDIUM && 'Medium'}
                                {p === Priority.HIGH && 'High'}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Due date */}
                      <div className="space-y-1.5">
                        <label htmlFor="due-date-picker" className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
                          Due Date (Optional)
                        </label>
                        <input
                          id="due-date-picker"
                          type="date"
                          value={newDueDate}
                          onChange={(e) => setNewDueDate(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                        />
                      </div>
                    </div>

                    {errorMsg && (
                      <p className="text-xs text-red-500 font-semibold">{errorMsg}</p>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        id="submit-new-task-btn"
                        type="submit"
                        className="px-4 py-2 bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                      >
                        Add Task to Subject
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Task Stack List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[10px] font-mono font-bold text-zinc-450 dark:text-zinc-500 px-1 tracking-widest uppercase">
                  <span>Drag tasks to reorder</span>
                  <span>{activeTasks.length} Milestones</span>
                </div>

                {activeTasks.length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl space-y-3">
                    <ListTodo className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mx-auto" />
                    <div>
                      <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                        {filter === 'all' ? 'All quiet here.' : 'No filtered results.'}
                      </p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 max-w-xs mx-auto">
                        {filter === 'all'
                          ? 'This subject folder contains no tasks. Enjoy the whitespace or create a task milestone.'
                          : 'Try toggling back to "All" or change search query to see the active backlog.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeTasks.map((task, idx) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        index={idx}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDragEnd={handleDragEnd}
                        onDrop={handleDrop}
                        isDragging={draggedIndex === idx}
                      />
                    ))}
                  </div>
                )}

                {/* Quick Add Area matching spec */}
                {!isAddingTask && (
                  <div className="pt-4">
                    <div 
                      id="bottom-quick-add-trigger"
                      onClick={() => setIsAddingTask(true)}
                      className="flex items-center gap-3 p-1 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-zinc-500 dark:hover:border-zinc-500 transition-all cursor-text group"
                    >
                      <div className="w-10 h-10 flex items-center justify-center text-zinc-300 dark:text-zinc-700 group-hover:text-zinc-600 dark:group-hover:text-zinc-400 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                      </div>
                      <span className="text-sm font-semibold text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-400 transition-colors">
                        Type to add a new task to {activeSubject.name}...
                      </span>
                    </div>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <Dashboard />
          )}

        </div>
      </main>
      </div>

      {/* DEV SETTINGS MODAL DIALOG */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* ACTIVE FOCUS POMODORO TIMING CANVAS */}
      {activeFocusTask && (
        <ActiveTaskTimer
          task={activeFocusTask}
          isOpen={Boolean(activeFocusTask)}
          onClose={() => setActiveFocusTask(null)}
        />
      )}

    </div>
  );
}
