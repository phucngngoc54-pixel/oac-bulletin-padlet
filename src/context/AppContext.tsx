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

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [apiUsers, apiEvents, apiNotes, apiNotifications, apiToDos] = await Promise.all([
        fetchUsers(),
        fetchEvents(),
        fetchNotes(),
        fetchNotifications(),
        fetchToDos()
      ]);

      // Use API data if available, otherwise fallback to mock data
      setUsers(apiUsers.length > 0 ? apiUsers : MOCK_USERS);
      setEvents(apiEvents.length > 0 ? apiEvents : MOCK_EVENTS);
      setNotes(apiNotes.length > 0 ? apiNotes : MOCK_NOTES);
      setNotifications(apiNotifications.length > 0 ? apiNotifications : MOCK_NOTIFICATIONS);
      setTodos(apiToDos.length > 0 ? apiToDos : MOCK_TODOS);
    } catch (err) {
      console.warn('Failed to fetch from API, falling back to mock data:', err);
      // Fallback is already handled by initial state or we can set it explicitly here
      setUsers(MOCK_USERS);
      setEvents(MOCK_EVENTS);
      setNotes(MOCK_NOTES);
      setNotifications(MOCK_NOTIFICATIONS);
      setTodos(MOCK_TODOS);
      setError('Using offline placeholder data.');
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
