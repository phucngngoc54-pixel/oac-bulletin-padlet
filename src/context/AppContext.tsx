import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Event, Note, Notification, ToDo, MOCK_USERS, MOCK_EVENTS, MOCK_NOTES, MOCK_NOTIFICATIONS, MOCK_TODOS } from '../data/mockData';
import { fetchUsers, fetchEvents, fetchNotes, fetchNotifications, fetchToDos } from '../api/gasApi';

interface AppContextType {
  users: User[];
  events: Event[];
  notes: Note[];
  notifications: Notification[];
  todos: ToDo[];
  loading: boolean;
  error: string | null;
  offlineToast: string | null;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [events, setEvents] = useState<Event[]>(MOCK_EVENTS);
  const [notes, setNotes] = useState<Note[]>(MOCK_NOTES);
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [todos, setTodos] = useState<ToDo[]>(MOCK_TODOS);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [offlineToast, setOfflineToast] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await import('../api/gasApi').then(m => m.fetchAppData());
      
      const hasData = (data.users.length > 0) || 
                      (data.events.length > 0) || 
                      (data.notes.length > 0) || 
                      (data.notifications.length > 0) || 
                      (data.todos.length > 0);

      if (!hasData) {
        throw new Error('Empety response from GAS API');
      }

      setUsers(data.users);
      setEvents(data.events);
      setNotes(data.notes);
      setNotifications(data.notifications);
      setTodos(data.todos);
      setOfflineToast(null);
    } catch (err) {
      console.warn('API fetch fail or empty, showing Mock Data:', err);
      // Ensure we keep existing state (MOCK_DATA by default) instead of setting it to empty
      setOfflineToast('Using offline placeholder data');
      setError('Connection failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    
    // Set up auto-refresh every 5 minutes
    const interval = setInterval(() => {
      loadData();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <AppContext.Provider
      value={{
        users,
        events,
        notes,
        notifications,
        todos,
        loading,
        error,
        offlineToast,
        refreshData: loadData
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
