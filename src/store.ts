import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { Subject, Task, Priority, TaskFilter, Theme } from './types';

interface AppState {
  subjects: Subject[];
  tasks: Task[];
  currentSubjectId: string | null;
  theme: Theme;
  filter: TaskFilter;
  isLoading: boolean;
  isSupabaseMode: boolean;
  user: any | null;
  
  // Actions
  init: () => Promise<void>;
  setTheme: (theme: Theme) => void;
  setFilter: (filter: TaskFilter) => void;
  setCurrentSubjectId: (id: string | null) => void;
  
  // Auth Actions
  setUser: (user: any) => void;
  signOut: () => Promise<void>;
  
  // Subject Actions
  addSubject: (name: string) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;
  
  // Task Actions
  addTask: (title: string, priority: Priority, dueDate?: string) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  reorderTasks: (newTasks: Task[]) => Promise<void>;
}

// Pre-populated demo subjects & tasks for rich high-whitespace preview
const DEMO_SUBJECTS: Subject[] = [
  { id: 'sub-math', user_id: 'demo-user', name: 'Mathematics (MATH 301)', created_at: new Date().toISOString() },
  { id: 'sub-cs', user_id: 'demo-user', name: 'Computer Science (CS 404)', created_at: new Date().toISOString() },
  { id: 'sub-design', user_id: 'demo-user', name: 'Digital Typography', created_at: new Date().toISOString() },
];

const getFutureDate = (daysAhead: number) => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
};

const DEMO_TASKS: Task[] = [
  // Math tasks
  { id: 't-math-1', subject_id: 'sub-math', title: 'Solve Fourier transform worksheet', priority: Priority.HIGH, status: 'pending', order_index: 0, created_at: new Date().toISOString(), due_date: getFutureDate(1) },
  { id: 't-math-2', subject_id: 'sub-math', title: 'Complete calculus proof #4', priority: Priority.MEDIUM, status: 'pending', order_index: 1, created_at: new Date().toISOString(), due_date: getFutureDate(3) },
  { id: 't-math-3', subject_id: 'sub-math', title: 'Read vector spaces summary', priority: Priority.LOW, status: 'done', order_index: 2, created_at: new Date().toISOString(), due_date: getFutureDate(6) },
  
  // CS tasks
  { id: 't-cs-1', subject_id: 'sub-cs', title: 'Implement Red-Black Tree insertion algorithm', priority: Priority.HIGH, status: 'pending', order_index: 0, created_at: new Date().toISOString(), due_date: getFutureDate(2) },
  { id: 't-cs-2', subject_id: 'sub-cs', title: 'Fix tokenization memory leak in compiler parser', priority: Priority.MEDIUM, status: 'pending', order_index: 1, created_at: new Date().toISOString(), due_date: getFutureDate(4) },
  { id: 't-cs-3', subject_id: 'sub-cs', title: 'Review Raft Consensus paper section 3', priority: Priority.LOW, status: 'pending', order_index: 2, created_at: new Date().toISOString(), due_date: getFutureDate(7) },

  // Design tasks
  { id: 't-des-1', subject_id: 'sub-design', title: 'Design typographic poster inspired by Swiss brutalism', priority: Priority.HIGH, status: 'pending', order_index: 0, created_at: new Date().toISOString(), due_date: getFutureDate(1) },
  { id: 't-des-2', subject_id: 'sub-design', title: 'Draft layouts using Grid-systems in Figma', priority: Priority.MEDIUM, status: 'done', order_index: 1, created_at: new Date().toISOString(), due_date: getFutureDate(5) },
];

export const useStore = create<AppState>((set, get) => ({
  subjects: [],
  tasks: [],
  currentSubjectId: null,
  theme: (localStorage.getItem('theme') as Theme) || 'light',
  filter: 'all',
  isLoading: true,
  isSupabaseMode: isSupabaseConfigured,
  user: null,

  init: async () => {
    set({ isLoading: true });
    
    // Set theme in HTML element
    const currentTheme = get().theme;
    if (currentTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    if (isSupabaseModeActive()) {
      try {
        const { data: { user } } = await supabase!.auth.getUser();
        set({ user });
        
        // Listen to auth state changes
        supabase!.auth.onAuthStateChange((event, session) => {
          set({ user: session?.user || null });
          get().init(); // Reload state on auth changes
        });

        if (user) {
          // Fetch Subjects
          const { data: subjects, error: subError } = await supabase!
            .from('subjects')
            .select('*')
            .order('created_at', { ascending: true });

          if (subError) throw subError;

          // Fetch Tasks
          const { data: tasks, error: taskError } = await supabase!
            .from('tasks')
            .select('*')
            .order('order_index', { ascending: true });

          if (taskError) throw taskError;

          const activeSubId = subjects && subjects.length > 0 
            ? (get().currentSubjectId && subjects.some(s => s.id === get().currentSubjectId) ? get().currentSubjectId : subjects[0].id)
            : null;

          set({
            subjects: subjects || [],
            tasks: tasks || [],
            currentSubjectId: activeSubId,
            isLoading: false,
          });
          return;
        }
      } catch (error) {
        console.error('Supabase load error, falling back to local database:', error);
      }
    }

    // --- LOCAL STORAGE OR DEMO FALLBACK ENGINE ---
    const storedSubs = localStorage.getItem('student_subjects');
    const storedTasks = localStorage.getItem('student_tasks');
    
    let subjects: Subject[] = [];
    let tasks: Task[] = [];

    if (storedSubs) {
      subjects = JSON.parse(storedSubs);
    } else {
      subjects = [...DEMO_SUBJECTS];
      localStorage.setItem('student_subjects', JSON.stringify(subjects));
    }

    if (storedTasks) {
      tasks = JSON.parse(storedTasks);
    } else {
      tasks = [...DEMO_TASKS];
      localStorage.setItem('student_tasks', JSON.stringify(tasks));
    }

    const activeSubId = subjects.length > 0 
      ? (get().currentSubjectId && subjects.some(s => s.id === get().currentSubjectId) ? get().currentSubjectId : subjects[0].id)
      : null;

    set({
      subjects,
      tasks,
      currentSubjectId: activeSubId,
      isLoading: false,
    });
  },

  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ theme });
  },

  setFilter: (filter) => set({ filter }),

  setCurrentSubjectId: (id) => set({ currentSubjectId: id }),

  setUser: (user) => set({ user }),

  signOut: async () => {
    if (isSupabaseModeActive()) {
      await supabase!.auth.signOut();
    }
    set({ user: null, subjects: [], tasks: [], currentSubjectId: null });
    get().init();
  },

  addSubject: async (name) => {
    const newSubjectId = crypto.randomUUID();
    const userId = get().user?.id || 'local-user';
    const newSubject: Subject = {
      id: newSubjectId,
      user_id: userId,
      name,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseModeActive() && get().user) {
      try {
        const { error } = await supabase!
          .from('subjects')
          .insert([{ id: newSubjectId, user_id: userId, name }]);
        if (error) throw error;
      } catch (e) {
        console.error('Supabase write error:', e);
      }
    }

    // Sync state and localStorage (as safety / fallback)
    const updatedSubjects = [...get().subjects, newSubject];
    localStorage.setItem('student_subjects', JSON.stringify(updatedSubjects));
    
    set({
      subjects: updatedSubjects,
      currentSubjectId: get().currentSubjectId || newSubjectId,
    });
  },

  deleteSubject: async (id) => {
    if (isSupabaseModeActive() && get().user) {
      try {
        const { error } = await supabase!
          .from('subjects')
          .delete()
          .eq('id', id);
        if (error) throw error;
      } catch (e) {
        console.error('Supabase delete error:', e);
      }
    }

    const updatedSubjects = get().subjects.filter(s => s.id !== id);
    const updatedTasks = get().tasks.filter(t => t.subject_id !== id);

    localStorage.setItem('student_subjects', JSON.stringify(updatedSubjects));
    localStorage.setItem('student_tasks', JSON.stringify(updatedTasks));

    const activeSubId = updatedSubjects.length > 0 ? updatedSubjects[0].id : null;

    set({
      subjects: updatedSubjects,
      tasks: updatedTasks,
      currentSubjectId: activeSubId,
    });
  },

  addTask: async (title, priority, dueDate) => {
    const subjectId = get().currentSubjectId;
    if (!subjectId) return;

    const newTaskId = crypto.randomUUID();
    
    // Find next order index
    const subjectTasks = get().tasks.filter(t => t.subject_id === subjectId);
    const order_index = subjectTasks.length > 0 
      ? Math.max(...subjectTasks.map(t => t.order_index)) + 1 
      : 0;

    const newTask: Task = {
      id: newTaskId,
      subject_id: subjectId,
      title,
      priority,
      status: 'pending',
      order_index,
      created_at: new Date().toISOString(),
      due_date: dueDate || undefined,
    };

    if (isSupabaseModeActive() && get().user) {
      try {
        const { error } = await supabase!
          .from('tasks')
          .insert([{
            id: newTaskId,
            subject_id: subjectId,
            title,
            priority,
            status: 'pending',
            order_index,
            due_date: dueDate || null
          }]);
        if (error) throw error;
      } catch (e) {
        console.error('Supabase task write error:', e);
      }
    }

    const updatedTasks = [...get().tasks, newTask];
    localStorage.setItem('student_tasks', JSON.stringify(updatedTasks));

    set({ tasks: updatedTasks });
  },

  updateTask: async (taskId, updates) => {
    if (isSupabaseModeActive() && get().user) {
      try {
        const { error } = await supabase!
          .from('tasks')
          .update(updates)
          .eq('id', taskId);
        if (error) throw error;
      } catch (e) {
        console.error('Supabase task update error:', e);
      }
    }

    const updatedTasks = get().tasks.map(t => t.id === taskId ? { ...t, ...updates } : t);
    localStorage.setItem('student_tasks', JSON.stringify(updatedTasks));

    set({ tasks: updatedTasks });
  },

  deleteTask: async (taskId) => {
    if (isSupabaseModeActive() && get().user) {
      try {
        const { error } = await supabase!
          .from('tasks')
          .delete()
          .eq('id', taskId);
        if (error) throw error;
      } catch (e) {
        console.error('Supabase task delete error:', e);
      }
    }

    const updatedTasks = get().tasks.filter(t => t.id !== taskId);
    localStorage.setItem('student_tasks', JSON.stringify(updatedTasks));

    set({ tasks: updatedTasks });
  },

  reorderTasks: async (newTasks) => {
    // Keep updated list in local state instantly for latency compensation
    set({ tasks: newTasks });
    localStorage.setItem('student_tasks', JSON.stringify(newTasks));

    if (isSupabaseModeActive() && get().user) {
      try {
        // Build batch updates
        const updates = newTasks.map(t => ({
          id: t.id,
          subject_id: t.subject_id,
          title: t.title,
          priority: t.priority,
          status: t.status,
          order_index: t.order_index,
          due_date: t.due_date || null
        }));

        const { error } = await supabase!
          .from('tasks')
          .upsert(updates);
        if (error) throw error;
      } catch (e) {
        console.error('Supabase task reorder error:', e);
      }
    }
  }
}));

function isSupabaseModeActive() {
  return isSupabaseConfigured;
}
