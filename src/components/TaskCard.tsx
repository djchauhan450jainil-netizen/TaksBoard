import React from 'react';
import { Calendar, Trash2, GripVertical, CheckCircle2, Circle } from 'lucide-react';
import { Task, Priority } from '../types';
import { useStore } from '../store';

interface TaskCardProps {
  key?: string;
  task: Task;
  index: number;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
  onDragEnd: () => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, index: number) => void | Promise<void>;
  isDragging: boolean;
}

export default function TaskCard({
  task,
  index,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  isDragging,
}: TaskCardProps) {
  const updateTask = useStore((state) => state.updateTask);
  const deleteTask = useStore((state) => state.deleteTask);

  const handleToggleStatus = () => {
    updateTask(task.id, {
      status: task.status === 'pending' ? 'done' : 'pending',
    });
  };

  // Check if task is due soon (within 48 hours)
  const isDueSoon = () => {
    if (!task.due_date) return false;
    const dueDate = new Date(task.due_date);
    const now = new Date();
    const differenceInMs = dueDate.getTime() - now.getTime();
    const differenceInHours = differenceInMs / (1000 * 60 * 60);
    return differenceInHours > 0 && differenceInHours <= 48;
  };

  const formatDueDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  // Priority color pairings
  const getPriorityStyles = (p: Priority) => {
    switch (p) {
      case Priority.HIGH:
        return {
          bg: 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50',
          dot: 'bg-rose-500',
          label: 'High Priority',
        };
      case Priority.MEDIUM:
        return {
          bg: 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50',
          dot: 'bg-amber-500',
          label: 'Medium',
        };
      case Priority.LOW:
      default:
        return {
          bg: 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700/50',
          dot: 'bg-zinc-400',
          label: 'Low',
        };
    }
  };

  const pStyles = getPriorityStyles(task.priority);
  const dueSoon = isDueSoon();

  const [isEditing, setIsEditing] = React.useState(false);
  const [editTitle, setEditTitle] = React.useState(task.title);
  const [editPriority, setEditPriority] = React.useState(task.priority);
  const [editDate, setEditDate] = React.useState(task.due_date ? task.due_date.split('T')[0] : '');

  const handleSave = () => {
    if (editTitle.trim()) {
      updateTask(task.id, {
        title: editTitle.trim(),
        priority: editPriority,
        due_date: editDate ? new Date(editDate).toISOString() : null,
      });
    } else {
      setEditTitle(task.title);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setEditTitle(task.title);
      setEditPriority(task.priority);
      setEditDate(task.due_date ? task.due_date.split('T')[0] : '');
      setIsEditing(false);
    }
  };

  // Dynamic container styling based on task status and priority
  const getContainerClassName = () => {
    const base = 'group flex items-center justify-between p-4 rounded-xl transition-all';
    
    if (isDragging) {
      return `${base} bg-zinc-50 dark:bg-zinc-900/50 border-2 border-dashed border-zinc-300 dark:border-zinc-700 opacity-50`;
    }

    if (task.status === 'done') {
      return `${base} bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/60 opacity-60`;
    }

    if (task.priority === Priority.HIGH) {
      return `${base} bg-white dark:bg-zinc-900 border-2 border-zinc-950 dark:border-zinc-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.9)] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[5px_5px_0px_0px_rgba(255,255,255,1)]`;
    }

    // Standard pending task
    return `${base} bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.05)]`;
  };

  return (
    <div
      id={`task-card-${task.id}`}
      draggable={!isEditing}
      onDragStart={(e) => !isEditing && onDragStart(e, index)}
      onDragOver={(e) => !isEditing && onDragOver(e, index)}
      onDragEnd={onDragEnd}
      onDrop={(e) => !isEditing && onDrop(e, index)}
      onDoubleClick={() => setIsEditing(true)}
      className={getContainerClassName()}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Drag Handle */}
        <div 
          id={`task-grip-${task.id}`}
          className="cursor-grab active:cursor-grabbing text-zinc-300 group-hover:text-zinc-600 dark:text-zinc-700 dark:hover:text-zinc-400 transition-colors p-1 shrink-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>
        </div>

        {/* Checkbox Status */}
        <button
          id={`task-check-${task.id}`}
          onClick={handleToggleStatus}
          className="w-6 h-6 border-2 border-zinc-200 dark:border-zinc-700 rounded-md flex-shrink-0 flex items-center justify-center hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors cursor-pointer"
        >
          {task.status === 'done' ? (
            <div className="w-full h-full bg-zinc-950 dark:bg-zinc-50 flex items-center justify-center rounded-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" className="text-white dark:text-zinc-950"><path d="M20 6 9 17l-5-5"/></svg>
            </div>
          ) : (
            <div className="w-3 h-3 bg-zinc-950 dark:bg-zinc-50 rounded-xs hidden group-hover:block opacity-25"></div>
          )}
        </button>

        {/* Title and Metadata */}
        <div className="flex-1 min-w-0 pr-2">
          {isEditing ? (
            <div className="flex flex-col gap-2">
              <input
                autoFocus
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-inner"
              />
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as Priority)}
                    className="appearance-none bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md pl-3 pr-8 py-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 cursor-pointer transition-colors shadow-sm"
                  >
                    <option value={Priority.LOW}>Low Priority</option>
                    <option value={Priority.MEDIUM}>Medium Priority</option>
                    <option value={Priority.HIGH}>High Priority</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-500">
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md pl-3 pr-2 py-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors shadow-sm min-w-[120px]"
                  />
                </div>
                <button
                  onClick={handleSave}
                  className="ml-auto bg-indigo-600 text-white rounded-md px-4 py-1.5 text-xs font-bold shadow-[2px_2px_0px_0px_rgba(79,70,229,0.2)] hover:translate-y-[1px] hover:shadow-none transition-all cursor-pointer"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <>
              <p
                className={`font-bold font-sans text-sm tracking-tight leading-relaxed ${
                  task.status === 'done'
                    ? 'line-through text-zinc-400 dark:text-zinc-500'
                    : 'text-zinc-900 dark:text-zinc-100'
                }`}
              >
                {task.title}
              </p>
              
              <div className="flex flex-wrap gap-2 items-center mt-1 text-xs font-mono text-zinc-500">
                {/* Priority Badge */}
                <span className={`inline-flex items-center text-[10px] font-black uppercase px-2 py-0.5 rounded ${pStyles.bg}`}>
                  {pStyles.label}
                </span>

                {/* Due date indicator */}
                {task.due_date && (
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-medium uppercase ${
                      dueSoon && task.status === 'pending'
                        ? 'text-rose-600 dark:text-rose-400 font-black'
                        : 'text-zinc-400 dark:text-zinc-500'
                    }`}
                  >
                    <Calendar className="w-3 h-3" />
                    {dueSoon && task.status === 'pending' ? 'Due Soon' : `Due ${formatDueDate(task.due_date)}`}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Action buttons on the right */}
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors cursor-pointer"
            title="Edit Task"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
          </button>
        )}
        <button
          id={`task-delete-${task.id}`}
          onClick={() => deleteTask(task.id)}
          className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors cursor-pointer"
          title="Delete Task"
        >
          <Trash2 className="w-4.5 h-4.5" />
        </button>
      </div>
    </div>
  );
}
