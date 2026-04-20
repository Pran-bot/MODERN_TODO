import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  Calendar, 
  AlertCircle, 
  ChevronRight, 
  Sparkles, 
  Edit2, 
  X,
  Filter,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";

// --- Types ---

type Priority = 'low' | 'medium' | 'high';

interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: Priority;
  completed: boolean;
  createdAt: number;
}

// --- Icons Helper ---

const PriorityIcon = ({ priority }: { priority: Priority }) => {
  switch (priority) {
    case 'high': return <AlertCircle className="w-4 h-4 text-rose-500" />;
    case 'medium': return <AlertCircle className="w-4 h-4 text-amber-500" />;
    case 'low': return <AlertCircle className="w-4 h-4 text-emerald-500" />;
  }
};

// --- Main Application ---

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('smart-tasks');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');

  useEffect(() => {
    localStorage.setItem('smart-tasks', JSON.stringify(tasks));
  }, [tasks]);

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newTask: Task = {
      id: crypto.randomUUID(),
      title,
      description,
      dueDate,
      priority,
      completed: false,
      createdAt: Date.now(),
    };

    setTasks([newTask, ...tasks]);
    resetForm();
  };

  const updateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !title.trim()) return;

    setTasks(tasks.map(t => t.id === editingTask.id ? {
      ...t,
      title,
      description,
      dueDate,
      priority
    } : t));
    resetForm();
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDueDate('');
    setPriority('medium');
    setIsAdding(false);
    setEditingTask(null);
  };

  const startEdit = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description);
    setDueDate(task.dueDate);
    setPriority(task.priority);
    setIsAdding(true);
  };

  const filteredTasks = useMemo(() => {
    return tasks
      .filter(t => {
        const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || 
                            t.description.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filter === 'all' ? true : 
                            filter === 'completed' ? t.completed : !t.completed;
        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        const priorityScore = { high: 3, medium: 2, low: 1 };
        if (priorityScore[a.priority] !== priorityScore[b.priority]) {
          return priorityScore[b.priority] - priorityScore[a.priority];
        }
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
  }, [tasks, search, filter]);

  const getSmartBreakdown = async (task: Task) => {
    try {
      setAiLoading(true);
      setAiSuggestion(null);
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `I have this task: "${task.title}". Context: ${task.description}. 
        Provide a very short, actionable 3-step breakdown to get this done. 
        Keep it concise and encouraging. 
        Format as clear bullet points.`,
      });
      setAiSuggestion(response.text || "Couldn't get a suggestion right now.");
    } catch (error) {
      console.error("AI Error:", error);
      setAiSuggestion("Failed to connect to the smart brain. Try again later.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-80 bg-white border-r border-slate-200 p-8 flex-col justify-between shrink-0">
        <section>
          <div className="mb-12">
            <h1 className="text-4xl font-black tracking-tighter mb-1">SMART</h1>
            <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Task Manager v2.0</p>
          </div>
          <nav className="space-y-8">
            <button 
              onClick={() => setFilter('all')}
              className={`group flex flex-col items-start w-full text-left transition-all ${filter === 'all' ? 'text-blue-600' : 'text-slate-400'}`}
            >
              <span className="block text-[10px] font-black uppercase mb-1">01</span>
              <span className={`text-2xl font-bold group-hover:pl-2 transition-all duration-200 ${filter === 'all' ? 'text-slate-900' : 'hover:text-slate-900'}`}>Inbox</span>
            </button>
            <button 
              onClick={() => setFilter('active')}
              className={`group flex flex-col items-start w-full text-left transition-all ${filter === 'active' ? 'text-blue-600' : 'text-slate-400'}`}
            >
              <span className="block text-[10px] font-black uppercase mb-1">02</span>
              <span className={`text-2xl font-bold group-hover:pl-2 transition-all duration-200 ${filter === 'active' ? 'text-slate-900' : 'hover:text-slate-900'}`}>Today</span>
            </button>
            <button 
              onClick={() => setFilter('completed')}
              className={`group flex flex-col items-start w-full text-left transition-all ${filter === 'completed' ? 'text-blue-600' : 'text-slate-400'}`}
            >
              <span className="block text-[10px] font-black uppercase mb-1">03</span>
              <span className={`text-2xl font-bold group-hover:pl-2 transition-all duration-200 ${filter === 'completed' ? 'text-slate-900' : 'hover:text-slate-900'}`}>Finished</span>
            </button>
          </nav>
        </section>
        
        <section>
          <div className="bg-slate-900 text-white p-6 rounded-2xl">
            <h2 className="text-5xl font-black mb-2 leading-none">
              {tasks.filter(t => !t.completed).length.toString().padStart(2, '0')}
            </h2>
            <p className="text-[10px] font-bold tracking-widest uppercase opacity-60">Tasks left for today</p>
          </div>
        </section>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 md:p-12 lg:p-16">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
            <div className="max-w-md">
              <p className="text-xs font-black text-blue-600 uppercase tracking-[0.2em] mb-4">
                {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
              </p>
              <h2 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.85]">
                DO IT<br />
                <span className="text-slate-200">NOW.</span>
              </h2>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsAdding(true)}
              className="bg-slate-900 text-white px-10 py-5 rounded-full font-black text-lg hover:bg-blue-600 transition-colors flex items-center gap-3 shrink-0 shadow-xl shadow-slate-200"
            >
              <span className="text-2xl leading-none">+</span> New Task
            </motion.button>
          </header>

          {/* Search Bar - Theme Integrated */}
          <div className="mb-12 relative max-w-xl">
            <input 
              type="text"
              placeholder="SEARCH TASKS..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent border-b-2 border-slate-200 py-4 text-xl font-bold placeholder:text-slate-300 placeholder:font-black tracking-tighter focus:border-blue-600 outline-none transition-all uppercase"
            />
          </div>

          <section className="flex-1">
            <AnimatePresence mode="popLayout text-nowrap">
              {filteredTasks.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-32 flex flex-col items-center justify-center border-t border-slate-100"
                >
                   <h3 className="text-4xl font-black text-slate-200 tracking-tighter uppercase">Nothing here</h3>
                   <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-2">Enjoy your free time</p>
                </motion.div>
              ) : (
                <div className="space-y-6">
                  {filteredTasks.map(task => (
                    <motion.div
                      layout
                      key={task.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`flex items-start md:items-center gap-6 p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:border-blue-500 transition-all group ${
                        task.completed ? 'opacity-60 grayscale' : ''
                      }`}
                    >
                      <button 
                        onClick={() => toggleTask(task.id)}
                        className={`mt-1 md:mt-0 transition-transform active:scale-90 flex-shrink-0 ${
                          task.completed ? 'text-blue-600' : 'text-slate-300 hover:text-blue-600'
                        }`}
                      >
                        {task.completed ? <CheckCircle2 className="w-8 h-8" /> : <Circle className="w-8 h-8" />}
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-2 py-0.5 text-[10px] font-black rounded uppercase tracking-wider ${
                            task.completed ? 'bg-slate-100 text-slate-500' :
                            task.priority === 'high' ? 'bg-red-100 text-red-600' :
                            task.priority === 'medium' ? 'bg-blue-100 text-blue-600' :
                            'bg-emerald-100 text-emerald-600'
                          }`}>
                            {task.priority}
                          </span>
                          {task.dueDate && (
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              Due {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                        </div>
                        <h3 className={`text-xl md:text-2xl font-black tracking-tight leading-none ${
                          task.completed ? 'line-through text-slate-400' : 'text-slate-900'
                        }`}>
                          {task.title}
                        </h3>
                      </div>

                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => getSmartBreakdown(task)}
                          className="p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-blue-600 transition-colors"
                        >
                          <Sparkles className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => startEdit(task)}
                          className="p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-900 transition-colors"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => deleteTask(task.id)}
                          className="p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </section>

          <footer className="mt-16 pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex gap-12">
              {[
                { label: 'Total Tasks', value: tasks.length },
                { label: 'Completed', value: tasks.filter(t => t.completed).length },
                { label: 'Pending', value: tasks.filter(t => !t.completed).length }
              ].map(stat => (
                <div key={stat.label} className="text-center md:text-left">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                  <p className="text-2xl font-black">{stat.value.toString().padStart(2, '0')}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <div className="w-2 h-2 rounded-full bg-slate-900"></div>
              <div className="w-2 h-2 rounded-full bg-slate-200"></div>
              <div className="w-2 h-2 rounded-full bg-slate-200"></div>
            </div>
          </footer>
        </div>
      </main>

      {/* Adding/Editing Modal - Bold Theme */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={resetForm}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-[3rem] shadow-2xl overflow-hidden p-10 md:p-16"
            >
              <div className="flex justify-between items-center mb-12">
                <div>
                  <h2 className="text-4xl font-black tracking-tighter uppercase leading-none">
                    {editingTask ? 'Edit' : 'New'}<br />
                    <span className="text-slate-200">Task.</span>
                  </h2>
                </div>
                <button onClick={resetForm} className="p-3 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                  <X className="w-8 h-8" />
                </button>
              </div>

              <form onSubmit={editingTask ? updateTask : addTask} className="space-y-10">
                <div className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">The Headline</label>
                    <input
                      autoFocus
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="ENTER TASK TITLE"
                      className="w-full bg-transparent border-b-2 border-slate-100 py-4 text-2xl font-black placeholder:text-slate-200 outline-none focus:border-blue-600 transition-all uppercase tracking-tighter"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">The Context</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="DESCRIBE THE ACTION..."
                      className="w-full bg-transparent border-b-2 border-slate-100 py-4 text-lg font-bold placeholder:text-slate-200 outline-none focus:border-blue-600 transition-all uppercase tracking-tight h-24 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-12">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Deadline</label>
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full bg-transparent border-b-2 border-slate-100 py-3 text-lg font-black outline-none focus:border-blue-600 transition-all uppercase"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Priority</label>
                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as Priority)}
                        className="w-full bg-transparent border-b-2 border-slate-100 py-3 text-lg font-black outline-none focus:border-blue-600 transition-all uppercase cursor-pointer appearance-none"
                      >
                        <option value="low">Low Impact</option>
                        <option value="medium">Medium Impact</option>
                        <option value="high">Critical Need</option>
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-6 bg-slate-900 text-white rounded-full font-black text-xl hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3 uppercase tracking-widest group"
                >
                  <span>{editingTask ? 'Save Updates' : 'Add to Inbox'}</span>
                  <ChevronRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Suggestion - Bold Integrated */}
      <AnimatePresence>
        {(aiSuggestion || aiLoading) && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed bottom-12 right-12 w-full max-w-md z-50 p-1"
          >
            <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl border-4 border-white">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-blue-600 rounded-2xl">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-black text-xl tracking-tighter uppercase leading-none">Smart Breakdown</h4>
                  <p className="text-[10px] text-blue-400 uppercase tracking-[0.2em] font-black mt-1">AI STRATEGY v1.0</p>
                </div>
                <button 
                  onClick={() => setAiSuggestion(null)}
                  className="ml-auto p-2 hover:bg-white/10 rounded-full transition-colors text-slate-500"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {aiLoading ? (
                <div className="flex flex-col items-center gap-4 py-12">
                  <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-blue-600"
                      animate={{ x: [-200, 400] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  </div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Processing Intelligence...</span>
                </div>
              ) : (
                <div className="bg-slate-800/50 p-6 rounded-2xl border border-white/5">
                  <div className="prose prose-invert max-w-none text-slate-200">
                    {aiSuggestion?.split('\n').map((line, i) => (
                      <p key={i} className="mb-2 last:mb-0 font-bold uppercase text-xs tracking-wider leading-relaxed">
                        {line.startsWith('-') || line.startsWith('*') ? line : `> ${line}`}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
