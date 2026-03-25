import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Star, Calendar, CheckCircle2, ChevronUp, ChevronDown, X } from 'lucide-react';
import { MOCK_EVENTS, Event, MOCK_USERS } from '../data/mockData';
import { isToday, isValid } from 'date-fns';
import { safeFormat } from '../utils/dateUtils';
import { useAppContext } from '../context/AppContext';

type Task = {
  id: string;
  text: string;
  completed: boolean;
  priority: boolean;
};

export function ProductivityHub({ onEventClick, searchQuery }: { onEventClick: (event: Event) => void, searchQuery: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'My Day' | 'My Tasks'>('My Tasks');
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', text: 'Review Q3 Strategy Deck', completed: false, priority: true },
    { id: '2', text: 'Send weekly update to team', completed: false, priority: false },
    { id: '3', text: 'Prepare for Client Onboarding', completed: true, priority: false },
  ]);
  const [newTaskText, setNewTaskText] = useState('');

  const currentUser = MOCK_USERS[0]; // Assuming Linh Nguyen is the current user

  const todayEvents = MOCK_EVENTS.filter(e => {
    // Filter by today
    // Note: For testing purposes, if you want to see events, you might need to adjust the date in mockData or remove isToday check.
    // We will keep it as requested, but maybe just filter by attendee and search query for now to ensure they show up if they are today.
    // Actually, let's just use the mock data dates.
    const eventDate = new Date(e.date);
    const isEventToday = isValid(eventDate) ? isToday(eventDate) : false;
    const isAttendee = e.attendees?.includes(currentUser.id);
    const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) || e.details.toLowerCase().includes(searchQuery.toLowerCase());
    return isEventToday && isAttendee && matchesSearch;
  });

  const toggleTaskCompletion = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const priorityCount = tasks.filter(t => t.priority).length;

  const toggleTaskPriority = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    if (!task.priority && priorityCount >= 3) {
      return; // Handled by disabled state and tooltip
    }

    setTasks(tasks.map(t => t.id === id ? { ...t, priority: !t.priority } : t));
  };

  const addTask = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newTaskText.trim()) {
      setTasks([...tasks, { id: Date.now().toString(), text: newTaskText.trim(), completed: false, priority: false }]);
      setNewTaskText('');
    }
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const filteredTasks = tasks.filter(t => t.text.toLowerCase().includes(searchQuery.toLowerCase()));

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.priority && !b.priority) return -1;
    if (!a.priority && b.priority) return 1;
    if (a.completed && !b.completed) return 1;
    if (!a.completed && b.completed) return -1;
    return 0;
  });

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', bounce: 0.3, duration: 0.5 }}
            className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-80 mb-4 overflow-hidden flex flex-col max-h-[600px]"
          >
            <div className="bg-gray-900 text-white p-4 flex flex-col shrink-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  Productivity Hub
                </h3>
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex gap-4 border-b border-gray-700">
                <button
                  onClick={() => setActiveTab('My Day')}
                  className={`pb-2 text-sm font-medium transition-colors relative ${activeTab === 'My Day' ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  My Day
                  {activeTab === 'My Day' && (
                    <motion.div layoutId="activeTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('My Tasks')}
                  className={`pb-2 text-sm font-medium transition-colors relative ${activeTab === 'My Tasks' ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  My Tasks
                  {activeTab === 'My Tasks' && (
                    <motion.div layoutId="activeTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {activeTab === 'My Day' && (
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Today's Meetings
                  </h4>
                  {todayEvents.length > 0 ? (
                    <div className="space-y-2">
                      {todayEvents.map(event => (
                        <div 
                          key={event.id} 
                          onClick={() => onEventClick(event)}
                          className="p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-gray-300 hover:bg-gray-100 cursor-pointer transition-all group"
                        >
                          <p className="text-xs font-bold text-blue-600 mb-1">{event.time}</p>
                          <p className="text-sm font-medium text-gray-900 group-hover:text-blue-700 transition-colors line-clamp-2">{event.title}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No meetings today. Enjoy your focus time!</p>
                  )}
                </div>
              )}

              {activeTab === 'My Tasks' && (
                <div className="flex flex-col h-full">
                  <div className="flex-1 overflow-y-auto space-y-2 pb-4">
                    <AnimatePresence mode="popLayout">
                      {sortedTasks.map(task => (
                        <motion.div
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ type: 'spring', bounce: 0.4, duration: 0.6 }}
                          key={task.id}
                          className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all group ${
                            task.priority 
                              ? 'bg-yellow-50/50 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.2)]' 
                              : 'bg-white border-gray-100 hover:border-gray-200'
                          } ${task.completed ? 'opacity-60 bg-gray-50' : ''}`}
                        >
                          <button 
                            onClick={() => toggleTaskCompletion(task.id)}
                            className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                              task.completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-green-500'
                            }`}
                          >
                            {task.completed && <Check className="w-3 h-3" />}
                          </button>
                          
                          <span className={`flex-1 text-sm transition-all ${
                            task.completed ? 'line-through text-gray-500' : 
                            task.priority ? 'font-bold text-gray-900' : 'text-gray-700'
                          }`}>
                            {task.text}
                          </span>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="relative group/star">
                              <button 
                                onClick={() => toggleTaskPriority(task.id)}
                                disabled={!task.priority && priorityCount >= 3}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  task.priority ? 'text-yellow-500 hover:bg-yellow-100' : 
                                  (!task.priority && priorityCount >= 3) ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-yellow-500 hover:bg-gray-100'
                                }`}
                              >
                                <Star className="w-4 h-4" fill={task.priority ? "currentColor" : "none"} />
                              </button>
                              {(!task.priority && priorityCount >= 3) && (
                                <div className="absolute bottom-full right-0 mb-2 hidden group-hover/star:block w-max bg-gray-900 text-white text-xs rounded py-1 px-2">
                                  Max 3 priorities reached
                                </div>
                              )}
                            </div>
                            <button 
                              onClick={() => deleteTask(task.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                  <input 
                    type="text" 
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    onKeyDown={addTask}
                    placeholder="Add a new task... (Press Enter)"
                    className="w-full mt-auto bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gray-900 text-white p-4 rounded-full shadow-xl hover:shadow-2xl transition-all flex items-center justify-center"
      >
        {isOpen ? <ChevronDown className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
      </motion.button>
    </div>
  );
}
