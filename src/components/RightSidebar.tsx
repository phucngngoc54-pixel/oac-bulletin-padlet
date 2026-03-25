import React, { useState, useEffect } from 'react';
import { Users, Calendar, CheckCircle2, Star, X, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { MOCK_USERS, Event } from '../data/mockData';
import { format, isToday, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { addToDo, updateToDo, deleteToDo } from '../api/gasApi';

export function RightSidebar({ searchQuery, onEventClick }: { searchQuery: string, onEventClick: (event: Event) => void }) {
  const { users, events, todos, refreshData } = useAppContext();
  const currentUser = users[0] || MOCK_USERS[0];
  const onlineUsers = users.filter(u => u.isOnline);

  const [localTodos, setLocalTodos] = useState(todos);
  useEffect(() => {
    setLocalTodos(todos);
  }, [todos]);

  const [newTaskText, setNewTaskText] = useState('');
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [showAllMeetings, setShowAllMeetings] = useState(false);

  const todayEvents = events.filter(e => {
    // For testing, we might not have events today, so we just filter by attendee and search
    // const isEventToday = isToday(parseISO(e.date));
    const isAttendee = e.attendees?.includes(currentUser.id);
    const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) || e.details.toLowerCase().includes(searchQuery.toLowerCase());
    return isAttendee && matchesSearch;
  });

  const toggleTaskCompletion = async (id: string) => {
    const task = localTodos.find(t => t.id === id);
    if (!task) return;
    
    // Optimistic UI update
    setLocalTodos(localTodos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    
    // Fire api call to unblock
    try {
      await updateToDo({
        ToDoId: id,
        Completed: !task.completed,
        Priority: task.priority
      });
      refreshData();
    } catch (e) {
      console.error(e);
      // Revert if error
      setLocalTodos(todos);
    }
  };

  const priorityCount = localTodos.filter(t => t.priority).length;

  const toggleTaskPriority = async (id: string) => {
    const task = localTodos.find(t => t.id === id);
    if (!task) return;
    if (!task.priority && priorityCount >= 3) return;
    
    // Optimistic UI update
    setLocalTodos(localTodos.map(t => t.id === id ? { ...t, priority: !t.priority } : t));
    
    try {
      await updateToDo({
        ToDoId: id,
        Completed: task.completed,
        Priority: !task.priority
      });
      refreshData();
    } catch (e) {
      console.error(e);
      setLocalTodos(todos);
    }
  };

  const addTask = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newTaskText.trim()) {
      const text = newTaskText.trim();
      setNewTaskText('');
      
      // Optimistic UI Update
      const tempId = `temp-${Date.now()}`;
      setLocalTodos([...localTodos, { id: tempId, text: text, completed: false, priority: false }]);
      
      try {
        await addToDo({ Text: text });
        refreshData();
      } catch (err) {
        console.error(err);
        setLocalTodos(todos);
      }
    }
  };

  const deleteTask = async (id: string) => {
    // Optimistic UI update
    setLocalTodos(localTodos.filter(t => t.id !== id));
    
    try {
      await deleteToDo({ ToDoId: id });
      refreshData();
    } catch (e) {
      console.error(e);
      setLocalTodos(todos);
    }
  };

  const filteredTasks = localTodos.filter(t => t.text.toLowerCase().includes(searchQuery.toLowerCase()));

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.priority && !b.priority) return -1;
    if (!a.priority && b.priority) return 1;
    if (a.completed && !b.completed) return 1;
    if (!a.completed && b.completed) return -1;
    return 0;
  });

  const displayedTasks = showAllTasks ? sortedTasks : sortedTasks.slice(0, 4);
  const displayedMeetings = showAllMeetings ? todayEvents : todayEvents.slice(0, 4);

  return (
    <div className="w-full h-full bg-gray-50 border-l border-gray-200 p-6 overflow-y-auto shrink-0 space-y-6">
      
      {/* Who's Online Widget */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Users className="w-5 h-5 text-gray-400" />
          <h3 className="font-bold text-gray-900">Who's Online?</h3>
        </div>
        <div className="space-y-4">
          {onlineUsers.map(user => (
            <div key={user.id} className="flex items-center gap-3">
              <div className="relative">
                <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full bg-gray-100" />
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{user.office} • {user.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* My Day (Meetings) Widget */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="w-5 h-5 text-blue-500" />
          <h3 className="font-bold text-gray-900">My Day</h3>
        </div>
        <div className="space-y-3">
          <AnimatePresence>
            {displayedMeetings.map(event => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 bg-blue-50 rounded-lg border border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors"
                onClick={() => onEventClick(event)}
              >
                <p className="text-sm font-bold text-blue-900 truncate">{event.title}</p>
                <p className="text-xs text-blue-700 mt-1">{event.time} • {event.location}</p>
              </motion.div>
            ))}
          </AnimatePresence>
          {todayEvents.length === 0 && (
            <div className="text-center py-4 text-gray-500 text-sm">No meetings today.</div>
          )}
          {todayEvents.length > 4 && (
            <button 
              onClick={() => setShowAllMeetings(!showAllMeetings)}
              className="w-full text-center text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors mt-2 flex items-center justify-center gap-1"
            >
              {showAllMeetings ? (
                <><ChevronUp className="w-4 h-4" /> Show less</>
              ) : (
                <><ChevronDown className="w-4 h-4" /> View {todayEvents.length - 4} more meetings</>
              )}
            </button>
          )}
        </div>
      </div>

      {/* My Tasks (To-Do) Widget */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <h3 className="font-bold text-gray-900">My Tasks</h3>
          </div>
          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {localTodos.filter(t => t.completed).length}/{localTodos.length}
          </span>
        </div>
        
        <div className="mb-4">
          <input
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            onKeyDown={addTask}
            placeholder="Add a task and press Enter..."
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
          />
        </div>

        <div className="space-y-2">
          <AnimatePresence>
            {displayedTasks.map(task => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all group ${
                  task.priority 
                    ? 'bg-yellow-50/50 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.15)]' 
                    : task.completed ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <button
                    onClick={() => toggleTaskCompletion(task.id)}
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                      task.completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-green-500'
                    }`}
                  >
                    {task.completed && <Check className="w-3 h-3" />}
                  </button>
                  <span className={`text-sm truncate ${task.completed ? 'line-through text-gray-400' : 'text-gray-700 font-medium'}`}>
                    {task.text}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => toggleTaskPriority(task.id)}
                    disabled={!task.priority && priorityCount >= 3}
                    className={`p-1.5 rounded-md transition-colors relative group/star ${
                      task.priority ? 'text-yellow-500 hover:bg-yellow-100' : 'text-gray-400 hover:bg-gray-100 hover:text-yellow-500'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <Star className={`w-4 h-4 ${task.priority ? 'fill-current' : ''}`} />
                    {!task.priority && priorityCount >= 3 && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover/star:opacity-100 pointer-events-none transition-opacity">
                        Max 3 priorities reached
                      </div>
                    )}
                  </button>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {sortedTasks.length === 0 && (
            <div className="text-center py-4 text-gray-500 text-sm">No tasks found.</div>
          )}
          {sortedTasks.length > 4 && (
            <button 
              onClick={() => setShowAllTasks(!showAllTasks)}
              className="w-full text-center text-sm font-medium text-green-600 hover:text-green-800 transition-colors mt-2 flex items-center justify-center gap-1"
            >
              {showAllTasks ? (
                <><ChevronUp className="w-4 h-4" /> Show less</>
              ) : (
                <><ChevronDown className="w-4 h-4" /> View {sortedTasks.length - 4} more tasks</>
              )}
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
