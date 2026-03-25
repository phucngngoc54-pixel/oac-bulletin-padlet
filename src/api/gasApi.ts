import { User, Event, Note, Notification, ToDo } from '../data/mockData';

export const API_URL = 'https://script.google.com/macros/s/AKfycbzBhCOMLh0Vo48O_MRuxFubbg72k4fZ4StsQzEo38JYhssFek-OUY8vvIG4UoeSwk4-/exec';

/**
 * Generic GET - fetches all data from the GAS endpoint.
 * GAS returns a JSON object with capitalized keys: Users, Events, Padlet_Notes, ToDos, Notifications
 */
export async function fetchAppData(): Promise<{
  users: User[];
  events: Event[];
  notes: Note[];
  notifications: Notification[];
  todos: ToDo[];
}> {
  const response = await fetch(API_URL);
  if (!response.ok) throw new Error('Failed to fetch from GAS API');
  const raw = await response.json();
  // Map capitalized GAS response keys to local camelCase keys
  return {
    users: Array.isArray(raw.Users) ? raw.Users : [],
    events: Array.isArray(raw.Events) ? raw.Events : [],
    notes: Array.isArray(raw.Padlet_Notes) ? raw.Padlet_Notes : [],
    notifications: Array.isArray(raw.Notifications) ? raw.Notifications : [],
    todos: Array.isArray(raw.ToDos) ? raw.ToDos : [],
  };
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
