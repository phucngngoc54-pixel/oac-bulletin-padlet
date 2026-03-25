import { User, Event, Note, Notification, ToDo, MOCK_USERS, MOCK_EVENTS, MOCK_NOTES, MOCK_NOTIFICATIONS, MOCK_TODOS } from '../data/mockData';

export const API_URL = 'https://script.google.com/macros/s/AKfycbzBhCOMLh0Vo48O_MRuxFubbg72k4fZ4StsQzEo38JYhssFek-OUY8vvIG4UoeSwk4-/exec';

const handleNA = (val: any) => (val === 'N/A' || val === 'Unknown' || !val) ? undefined : val;

export async function fetchAppData(): Promise<{
  users: User[];
  events: Event[];
  notes: Note[];
  notifications: Notification[];
  todos: ToDo[];
}> {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error(`GAS API HTTP Error: ${response.status}`);
    const raw = await response.json();
    
    const users = Array.isArray(raw.Users) ? raw.Users.map((u: any) => ({
      id: String(u.Id || u.id),
      name: u.Name || u.name || 'Unknown User',
      avatar: u.Avatar || u.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100',
      role: u.Role || u.role || 'Staff',
      office: u.Office || u.office || 'Hanoi HQ',
      isOnline: !!u.IsOnline,
      lastActive: handleNA(u.LastActive || u.lastActive),
      contributions: Number(u.Contributions || u.contributions || 0)
    })) : MOCK_USERS;

    const events = Array.isArray(raw.Events) ? raw.Events.map((e: any) => ({
      id: String(e.Id || e.id),
      title: e.Title || e.title || 'Untitled Event',
      date: handleNA(e.Date || e.date) || new Date().toISOString().split('T')[0],
      time: handleNA(e.Time || e.time) || '12:00 PM',
      location: handleNA(e.Location || e.location) || 'TBD',
      details: handleNA(e.Details || e.details) || '',
      coverImage: handleNA(e.CoverImage || e.coverImage || e.CoverUrl),
      type: (e.Type || e.type || 'event').toLowerCase() as any,
      publisherId: String(e.PublisherId || e.publisherId || '1'),
      tag: e.Tag || e.tag || 'Team meeting',
      attendees: Array.isArray(e.Attendees) ? e.Attendees.map(String) : [],
      documents: Array.isArray(e.Documents) ? e.Documents : []
    })) : MOCK_EVENTS;

    const notes = Array.isArray(raw.Padlet_Notes) ? raw.Padlet_Notes.map((n: any) => ({
      id: String(n.Id || n.id),
      creatorId: String(n.CreatorId || n.creatorId || n.AuthorId || n.authorId || '1'),
      content: n.Content || n.content || '',
      category: n.Category || n.category || 'Delivery',
      color: n.Color || n.color || '#ffffff',
      timestamp: n.Timestamp || n.timestamp || new Date().toISOString(),
      youtubeLink: handleNA(n.YoutubeLink || n.youtubeLink),
      imageUrl: handleNA(n.ImageUrl || n.imageUrl),
      videoUrl: handleNA(n.VideoUrl || n.videoUrl),
      reactions: typeof n.Reactions === 'object' ? n.Reactions : { Like: 0, Love: 0, Haha: 0, Wow: 0, Sad: 0, Angry: 0 },
      comments: Array.isArray(n.Comments) ? n.Comments : []
    })) : MOCK_NOTES;

    const notifications = Array.isArray(raw.Notifications) ? raw.Notifications : MOCK_NOTIFICATIONS;
    const todos = Array.isArray(raw.ToDos) ? raw.ToDos.map((t: any) => ({
      id: String(t.Id || t.id),
      text: t.Text || t.text || '',
      completed: !!t.Completed,
      priority: !!t.Priority
    })) : MOCK_TODOS;

    return { 
      users: users.length ? users : MOCK_USERS, 
      events: events.length ? events : MOCK_EVENTS, 
      notes: notes.length ? notes : MOCK_NOTES, 
      notifications: notifications.length ? notifications : MOCK_NOTIFICATIONS, 
      todos: todos.length ? todos : MOCK_TODOS 
    };
  } catch (err) {
    console.error('fetchAppData failed, using MOCK data:', err);
    return {
      users: MOCK_USERS,
      events: MOCK_EVENTS,
      notes: MOCK_NOTES,
      notifications: MOCK_NOTIFICATIONS,
      todos: MOCK_TODOS
    };
  }
}

// Convenience wrappers used by AppContext
export async function fetchUsers(): Promise<User[]> {
  try { const d = await fetchAppData(); return d.users; } catch { return []; }
}
export async function fetchEvents(): Promise<Event[]> {
  try { const d = await fetchAppData(); return d.events; } catch { return []; }
}
export async function fetchNotes(): Promise<Note[]> {
  try { const d = await fetchAppData(); return d.notes; } catch { return []; }
}
export async function fetchNotifications(): Promise<Notification[]> {
  try { const d = await fetchAppData(); return d.notifications; } catch { return []; }
}
export async function fetchToDos(): Promise<ToDo[]> {
  try { const d = await fetchAppData(); return d.todos; } catch { return []; }
}

/**
 * Generic POST for mutations.
 * GAS expects: { Action: string, Payload: object }
 * Using text/plain to avoid CORS preflight.
 */
export async function postAppData(action: string, payload: object) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ Action: action, Payload: payload }),
  });
  if (!response.ok) throw new Error(`POST failed for action: ${action}`);
  return response.json();
}

// --- Typed action helpers with Capital-keyed payloads as required by GAS API ---

export interface AddEventPayload {
  Title: string;
  Tag: string;
  Date: string;
  Time: string;
  Location: string;
  Details: string;
  PublisherId: string;
  Attendees: string[];
  CoverImage?: string;
  Documents?: { name: string; url: string; type: string }[];
}
export const addEvent = (payload: AddEventPayload) =>
  postAppData('addEvent', payload);

export interface AddNotePayload {
  Title: string;
  Content: string;
  AuthorId: string;
  Category: string;
  IsPriority: boolean;
  Color?: string;
  ImageUrl?: string;
  VideoUrl?: string;
}
export const addNote = (payload: AddNotePayload) =>
  postAppData('addNote', payload);

export interface AddCommentPayload {
  NoteId: string;
  Content: string;
  AuthorId: string;
  ParentCommentId?: string;
}
export const addComment = (payload: AddCommentPayload) =>
  postAppData('addComment', payload);

export interface ReactPayload {
  NoteId: string;
  UserId: string;
  ReactionType: string;
}
export const reactToNote = (payload: ReactPayload) =>
  postAppData('react', payload);

export const markNotificationRead = (notificationId: string) =>
  postAppData('markRead', { NotificationId: notificationId });

export interface AddToDoPayload {
  Text: string;
}

export interface UpdateToDoPayload {
  ToDoId: string;
  Completed: boolean;
  Priority: boolean;
}

export interface DeleteToDoPayload {
  ToDoId: string;
}

export const addToDo = (payload: AddToDoPayload) => postAppData('addToDo', payload);
export const updateToDo = (payload: UpdateToDoPayload) => postAppData('updateToDo', payload);
export const deleteToDo = (payload: DeleteToDoPayload) => postAppData('deleteToDo', payload);
