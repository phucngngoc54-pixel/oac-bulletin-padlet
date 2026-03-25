export type User = {
  id: string;
  name: string;
  avatar: string;
  role: string;
  office: string;
  isOnline: boolean;
  lastActive?: string;
  contributions?: number;
};

export type EventTag = 'Team meeting' | 'Buddy Team meeting' | 'Client meeting' | 'Pop up meeting';

export type EventDocument = {
  id: string;
  name: string;
  url: string;
  type: 'file' | 'link';
};

export type Event = {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  details: string;
  coverImage?: string;
  type: 'news' | 'event' | 'alert';
  publisherId: string;
  tag: EventTag;
  documents?: EventDocument[];
  attendees?: string[];
};

export type NoteCategory = 'BD' | 'AM' | 'Delivery' | 'Studying' | 'Health';

export type ReactionType = 'Like' | 'Love' | 'Haha' | 'Wow' | 'Sad' | 'Angry';

export type Comment = {
  id: string;
  authorId: string;
  content: string;
  timestamp: string;
  replies?: Comment[];
};

export type Note = {
  id: string;
  creatorId: string;
  content: string;
  category: NoteCategory;
  color: string;
  timestamp: string;
  youtubeLink?: string;
  imageUrl?: string;
  videoUrl?: string;
  reactions: Record<ReactionType, number>;
  comments: Comment[];
};

export type NotificationType = 'mention' | 'assignment' | 'engagement';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  read: boolean;
  timestamp: string;
  linkTo: { tab: string, eventId?: string, noteId?: string };
  actorId: string;
}

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'mention',
    message: 'mentioned you in a note',
    read: false,
    timestamp: new Date().toISOString(),
    linkTo: { tab: 'padlet', noteId: '1' },
    actorId: '2'
  },
  {
    id: '2',
    type: 'assignment',
    message: 'added you to a meeting',
    read: false,
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    linkTo: { tab: 'bulletin', eventId: '1' },
    actorId: '3'
  },
  {
    id: '3',
    type: 'engagement',
    message: 'reacted to your note',
    read: true,
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    linkTo: { tab: 'padlet', noteId: '2' },
    actorId: '4'
  }
];

export type ToDo = {
  id: string;
  text: string;
  completed: boolean;
  priority: boolean;
};

export const MOCK_TODOS: ToDo[] = [
  { id: '1', text: 'Review Q3 Strategy Deck', completed: false, priority: true },
  { id: '2', text: 'Send weekly update to team', completed: false, priority: false },
  { id: '3', text: 'Prepare for Client Onboarding', completed: true, priority: false },
  { id: '4', text: 'Update project timeline', completed: false, priority: false },
  { id: '5', text: 'Review design mockups', completed: false, priority: false },
  { id: '6', text: 'Schedule 1:1s', completed: false, priority: false },
];

export const MOCK_USERS: User[] = [
  {
    id: '1',
    name: 'Mr. Đức',
    role: 'CEO',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100',
    office: 'Hanoi HQ',
    isOnline: true,
    contributions: 42
  },
  {
    id: '2',
    name: 'Ms. Jane',
    role: 'Advisor',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100',
    office: 'Hanoi HQ',
    isOnline: true,
    contributions: 38
  },
  {
    id: '3',
    name: 'Coby',
    role: 'Business Intelligence',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100',
    office: 'Saigon Branch',
    isOnline: true,
    contributions: 25
  },
  {
    id: '4',
    name: 'Matthew',
    role: 'Business Intelligence',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100',
    office: 'Hanoi HQ',
    isOnline: true,
    lastActive: '10m ago',
    contributions: 31
  },
  {
    id: '5',
    name: 'Lauren',
    role: 'Buddy / Recruiter',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100',
    office: 'Saigon Branch',
    isOnline: true,
    contributions: 19
  },
  {
    id: '6',
    name: 'Ellie',
    role: 'Buddy / Recruiter',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=100',
    office: 'Hanoi HQ',
    isOnline: false,
    contributions: 15
  },
  {
    id: '7',
    name: 'Chloe',
    role: 'Recruiter',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=100',
    office: 'Saigon Branch',
    isOnline: true,
    contributions: 22
  },
  {
    id: '8',
    name: 'Tyler',
    role: 'Recruiter',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100',
    office: 'Hanoi HQ',
    isOnline: false,
    contributions: 12
  },
  {
    id: '9',
    name: 'Tess',
    role: 'Recruiter',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100',
    office: 'Saigon Branch',
    isOnline: true,
    contributions: 8
  },
  {
    id: '10',
    name: 'Lucy',
    role: 'Recruiter',
    avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&q=80&w=100',
    office: 'Hanoi HQ',
    isOnline: false,
    contributions: 5
  },
  {
    id: '11',
    name: 'Daisy',
    role: 'Recruiter',
    avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e16fd3c?auto=format&fit=crop&q=80&w=100',
    office: 'Saigon Branch',
    isOnline: true,
    contributions: 3
  },
  {
    id: '12',
    name: 'Cindi',
    role: 'Recruiter',
    avatar: 'https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&q=80&w=100',
    office: 'Hanoi HQ',
    isOnline: false,
    contributions: 2
  },
  {
    id: '13',
    name: 'Tracy',
    role: 'Recruiter',
    avatar: 'https://images.unsplash.com/photo-1554151228-14d9def656e4?auto=format&fit=crop&q=80&w=100',
    office: 'Saigon Branch',
    isOnline: true,
    contributions: 1
  }
];

export const MOCK_EVENTS: Event[] = [
  {
    id: '1',
    title: 'Q3 Strategy Alignment & Market Expansion',
    date: '2026-04-15',
    time: '09:00 AM',
    location: 'Hanoi Office & Virtual',
    details: 'Join us for the quarterly strategy alignment where we will discuss our expansion plans for the upcoming year. Mandatory for all senior consultants and above.',
    coverImage: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=800',
    type: 'alert',
    publisherId: '1',
    tag: 'Team meeting',
    documents: [
      { id: 'd1', name: 'Q3_Strategy_Deck.pdf', url: '#', type: 'file' },
      { id: 'd2', name: 'Market Research Notion', url: '#', type: 'link' }
    ],
    attendees: ['1', '2', '3']
  },
  {
    id: '2',
    title: 'New Client Onboarding: TechCorp VN',
    date: '2026-03-28',
    time: '02:00 PM',
    location: 'Saigon Office',
    details: 'Kickoff meeting for our new enterprise client. Delivery team to prepare initial assessment reports.',
    type: 'news',
    publisherId: '2',
    tag: 'Client meeting',
    documents: [
      { id: 'd3', name: 'Client_Brief.docx', url: '#', type: 'file' }
    ],
    attendees: ['1', '4', '5']
  },
  {
    id: '3',
    title: 'OAC Annual Retreat 2026',
    date: '2026-05-10',
    time: 'All Day',
    location: 'Da Nang',
    details: 'Pack your bags! We are heading to Da Nang for our annual company retreat. Team building, workshops, and relaxation.',
    coverImage: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&q=80&w=800',
    type: 'event',
    publisherId: '1',
    tag: 'Buddy Team meeting',
    attendees: ['1', '2', '3', '4', '5']
  }
];

export const MOCK_NOTES: Note[] = [
  {
    id: '6',
    creatorId: '2',
    content: 'Check out this quick demo of the new internal tool we built! 🚀 It makes tracking our BD pipeline so much easier. Let me know what you think in the comments.',
    category: 'Delivery',
    color: '#ffffff',
    timestamp: '2026-03-24T10:00:00Z',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    reactions: { Like: 10, Love: 5, Haha: 0, Wow: 8, Sad: 0, Angry: 0 },
    comments: []
  },
  {
    id: '1',
    creatorId: '2',
    content: 'Just closed the deal with RetailPlus! Great effort from the whole BD team this quarter. 🎉',
    category: 'BD',
    color: '#fef08a', // pastel yellow
    timestamp: '2026-03-24T09:30:00Z',
    reactions: { Like: 5, Love: 2, Haha: 0, Wow: 1, Sad: 0, Angry: 0 },
    comments: [
      {
        id: 'c1',
        authorId: '1',
        content: 'Amazing work Minh! Let\'s celebrate this Friday.',
        timestamp: '2026-03-24T09:45:00Z',
        replies: [
          {
            id: 'r1',
            authorId: '2',
            content: 'Absolutely! Drinks on me.',
            timestamp: '2026-03-24T10:00:00Z'
          }
        ]
      }
    ]
  },
  {
    id: '2',
    creatorId: '1',
    content: 'Found this amazing framework for digital transformation consulting. Worth a read for the Delivery folks.',
    category: 'Studying',
    color: '#bfdbfe', // pastel blue
    timestamp: '2026-03-23T14:15:00Z',
    youtubeLink: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    reactions: { Like: 3, Love: 0, Haha: 0, Wow: 2, Sad: 0, Angry: 0 },
    comments: []
  },
  {
    id: '3',
    creatorId: '3',
    content: 'Reminder: AM weekly sync moved to Thursday 10 AM due to client visits.',
    category: 'AM',
    color: '#bbf7d0', // pastel green
    timestamp: '2026-03-22T11:00:00Z',
    reactions: { Like: 4, Love: 0, Haha: 0, Wow: 0, Sad: 0, Angry: 0 },
    comments: [
      {
        id: 'c2',
        authorId: '4',
        content: 'Noted. Will update the calendar invite.',
        timestamp: '2026-03-22T11:15:00Z'
      }
    ]
  },
  {
    id: '4',
    creatorId: '5',
    content: 'Completed my first 5K run this weekend! 🏃‍♂️',
    category: 'Health',
    color: '#fbcfe8', // pastel pink
    timestamp: '2026-03-21T08:45:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&q=80&w=400',
    reactions: { Like: 2, Love: 5, Haha: 0, Wow: 1, Sad: 0, Angry: 0 },
    comments: []
  },
  {
    id: '5',
    creatorId: '4',
    content: 'Delivery phase 1 for FinServe is officially signed off. Great work team!',
    category: 'Delivery',
    color: '#e9d5ff', // pastel purple
    timestamp: '2026-03-20T16:20:00Z',
    reactions: { Like: 6, Love: 1, Haha: 0, Wow: 0, Sad: 0, Angry: 0 },
    comments: []
  }
];
