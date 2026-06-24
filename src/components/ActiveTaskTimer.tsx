import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Check, Minimize2, Award, Maximize2, X, Edit2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Task } from '../types';
import { useStore } from '../store';

interface ActiveTaskTimerProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
}

export default function ActiveTaskTimer({ task, isOpen, onClose }: ActiveTaskTimerProps) {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // Default 25 minutes
  const [isActive, setIsActive] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [editMinutes, setEditMinutes] = useState('25');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const updateTask = useStore((state) => state.updateTask);

  useEffect(() => {
    if (isOpen) {
      setTimeLeft(25 * 60);
      setIsActive(false);
      setIsCompleted(false);
      setIsMinimized(false);
      setIsEditingTime(false);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isOpen, task.id]);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsActive(false);
            setIsCompleted(true);
            if (intervalRef.current) clearInterval(intervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (!isActive && intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, timeLeft]);

  if (!isOpen) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleTimer = () => {
    setIsActive(!isActive);
    setIsEditingTime(false);
  };

  const handleReset = () => {
    setIsActive(false);
    setTimeLeft(25 * 60);
    setIsCompleted(false);
    setIsEditingTime(false);
  };

  const handleCompleteTask = async () => {
    await updateTask(task.id, { status: 'done' });
    onClose();
  };

  const handleSaveTime = () => {
    const mins = parseInt(editMinutes, 10);
    if (!isNaN(mins) && mins > 0) {
      setTimeLeft(mins * 60);
    }
    setIsEditingTime(false);
  };

  const percentage = ((25 * 60 - timeLeft) / (25 * 60)) * 100;

  if (isMinimized) {
    return (
      <motion.div 
        drag
        dragMomentum={false}
        className="fixed bottom-6 right-6 z-50 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rounded-2xl shadow-2xl p-4 w-72 flex flex-col gap-3 font-sans border border-zinc-800 dark:border-zinc-200 cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-red-500 animate-pulse' : 'bg-zinc-500'}`}></span>
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold">
              {isActive ? 'Focusing' : 'Paused'}
            </span>
          </div>
          <div className="flex items-center gap-1 pointer-events-auto">
            <button 
              onClick={() => setIsMinimized(false)}
              className="p-1.5 hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-md transition-colors"
              title="Maximize"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-md transition-colors"
              title="Close Session"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pointer-events-none">
          <div className="min-w-0 pr-2">
            <h3 className="font-bold text-sm truncate">{task.title}</h3>
            <div className="text-2xl font-black font-display tracking-tight mt-0.5">
              {formatTime(timeLeft)}
            </div>
          </div>

          <div className="shrink-0 pointer-events-auto">
            <button
              onClick={handleToggleTimer}
              className={`p-3 rounded-full transition-transform active:scale-95 cursor-pointer ${
                isActive 
                  ? 'bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-950' 
                  : 'bg-white text-zinc-950 dark:bg-zinc-950 dark:text-white'
              }`}
            >
              {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
            </button>
          </div>
        </div>

        <div className="h-1 bg-zinc-800 dark:bg-zinc-200 w-full rounded-full overflow-hidden mt-1">
          <div 
            className="h-full bg-white dark:bg-zinc-950 transition-all duration-1000 ease-linear"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </motion.div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6 font-sans">
      <div className="max-w-xl w-full flex flex-col items-center justify-between h-full py-12">
        
        {/* Top bar with back option */}
        <div className="w-full flex justify-between items-center px-4">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-red-500 animate-pulse' : 'bg-zinc-400'}`}></span>
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-bold">
              {isActive ? 'Active Focus Session' : 'Ready to Focus'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMinimized(true)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer font-bold"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Minimize</span>
            </button>
            <button
              onClick={onClose}
              className="flex items-center gap-1 px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer font-bold"
            >
              <X className="w-4 h-4" />
              <span>Close</span>
            </button>
          </div>
        </div>

        {/* Central Display */}
        <div className="flex flex-col items-center justify-center space-y-8 flex-1 w-full">
          {/* Circular/Flat Progression bar in Swiss brutalist block style */}
          <div className="relative flex flex-col items-center justify-center">
            {/* Minimalist circular timer trace */}
            <div className="w-64 h-64 md:w-80 md:h-80 rounded-full border-[10px] border-zinc-200 dark:border-zinc-900 flex flex-col items-center justify-center relative overflow-hidden group">
              {/* Flat Fill Animation */}
              <div 
                className="absolute bottom-0 left-0 right-0 bg-zinc-100 dark:bg-zinc-900 transition-all duration-1000 ease-linear" 
                style={{ height: `${percentage}%`, zIndex: 0 }}
              />

              <div className="relative z-10 flex flex-col items-center text-center w-full px-4">
                {isEditingTime ? (
                  <div className="flex flex-col items-center gap-3">
                    <input
                      type="number"
                      autoFocus
                      min="1"
                      value={editMinutes}
                      onChange={(e) => setEditMinutes(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveTime()}
                      className="w-32 text-center text-5xl md:text-6xl font-black font-display tracking-tight text-zinc-950 dark:text-white bg-transparent border-b-4 border-indigo-500 focus:outline-none"
                    />
                    <button 
                      onClick={handleSaveTime}
                      className="px-4 py-1.5 bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-bold text-xs rounded-full cursor-pointer hover:scale-105 transition-transform"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <div 
                    className="flex flex-col items-center cursor-pointer group-hover:scale-105 transition-transform"
                    onClick={() => {
                      if (!isActive) {
                        setIsEditingTime(true);
                        setEditMinutes(Math.ceil(timeLeft / 60).toString());
                      }
                    }}
                    title={!isActive ? "Click to edit time" : ""}
                  >
                    <span className="text-6xl md:text-8xl font-black font-display tracking-tight text-zinc-950 dark:text-white flex items-center gap-2">
                      {formatTime(timeLeft)}
                    </span>
                    {!isActive && (
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <Edit2 className="w-3 h-3" /> Edit Minutes
                      </span>
                    )}
                  </div>
                )}
                
                {!isEditingTime && (
                  <span className="text-xs font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mt-2 font-bold">
                    {isActive ? 'Deep Work' : 'Paused'}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="text-center max-w-md px-4 space-y-2">
            <h1 className="text-lg md:text-xl font-bold font-display text-zinc-900 dark:text-zinc-50 leading-snug">
              {task.title}
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-sans max-w-xs mx-auto">
              Focus entirely on this action item. Eliminate secondary tabs, silences, and distracting elements.
            </p>
          </div>
        </div>

        {/* Footer controls */}
        <div className="w-full flex flex-col items-center gap-6">
          {isCompleted ? (
            <div className="flex flex-col items-center gap-3 animate-fade-in">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-full">
                <Award className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                Study session successfully completed!
              </p>
              <div className="flex gap-3 mt-1">
                <button
                  onClick={handleCompleteTask}
                  className="px-6 py-2 bg-emerald-600 text-white hover:bg-emerald-700 font-medium rounded-lg text-sm transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Mark Task as Done
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg text-sm transition-colors cursor-pointer"
                >
                  Keep Pending
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              {/* Reset */}
              <button
                onClick={handleReset}
                className="p-3 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-900 rounded-full transition-colors cursor-pointer"
                title="Reset Session"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              {/* Play / Pause Toggle */}
              <button
                onClick={handleToggleTimer}
                disabled={isEditingTime}
                className={`p-5 rounded-full text-white transition-transform active:scale-95 cursor-pointer ${
                  isEditingTime ? 'opacity-50 cursor-not-allowed bg-zinc-400 dark:bg-zinc-700' :
                  isActive 
                    ? 'bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100' 
                    : 'bg-zinc-950 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950'
                }`}
                title={isActive ? 'Pause Session' : 'Start Session'}
              >
                {isActive ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 fill-current" />}
              </button>

              {/* Complete Immediately */}
              <button
                onClick={handleCompleteTask}
                className="p-3 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-full transition-colors cursor-pointer"
                title="Mark Completed Immediately"
              >
                <Check className="w-5 h-5" />
              </button>
            </div>
          )}
          
          <div className="h-1 bg-zinc-200 dark:bg-zinc-800 w-32 rounded-full overflow-hidden">
            <div 
              className="h-full bg-zinc-950 dark:bg-white transition-all duration-1000 ease-linear"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
