import React, { useState, useEffect, useRef } from 'react';
import { Plus, Crown, Image as ImageIcon, Link as LinkIcon, X, Heart, MessageCircle, Volume2, VolumeX, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NoteCategory, Note, ReactionType, Comment, User, MOCK_USERS } from '../data/mockData';
import { safeFormat } from '../utils/dateUtils';
import { MentionTextarea, renderDescriptionWithMentions } from './MentionTextarea';
import { TiptapEditor } from './TiptapEditor';
import { useAppContext } from '../context/AppContext';
import { addNote as addNoteApi, addComment as addCommentApi, reactToNote as reactApi } from '../api/gasApi';
import Skeleton, { NoteSkeleton } from './Skeleton';

const CATEGORIES: { id: NoteCategory; color: string }[] = [
  { id: 'BD', color: 'bg-yellow-200 text-yellow-800' },
  { id: 'AM', color: 'bg-green-200 text-green-800' },
  { id: 'Delivery', color: 'bg-purple-200 text-purple-800' },
  { id: 'Studying', color: 'bg-blue-200 text-blue-800' },
  { id: 'Health', color: 'bg-pink-200 text-pink-800' },
];

const PRESET_COLORS = ['#fef08a', '#bfdbfe', '#bbf7d0', '#fbcfe8', '#e9d5ff', '#ffffff'];

const REACTION_EMOJIS: Record<ReactionType, string> = {
  Like: '👍',
  Love: '❤️',
  Haha: '😆',
  Wow: '😮',
  Sad: '😢',
  Angry: '😡'
};

const TruncatedText = ({ text }: { text: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const needsTruncation = text.length > 120 || text.split('\n').length > 3;
  
  // Simple regex to wrap @mentions in HTML
  const processHtml = (html: string) => {
    return html.replace(/@(\w+)/g, '<span class="text-blue-600 font-bold">@$1</span>');
  };

  return (
    <div>
      <div 
        className={`text-gray-800 font-medium leading-relaxed prose prose-sm max-w-none ${!isExpanded && needsTruncation ? 'line-clamp-3' : ''}`}
        dangerouslySetInnerHTML={{ __html: processHtml(text) }}
      />
      {needsTruncation && (
        <button 
          onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }} 
          className="text-sm font-bold text-gray-500 hover:text-gray-900 mt-1 transition-colors"
        >
          {isExpanded ? '...show less' : '...view more'}
        </button>
      )}
    </div>
  );
};

const VideoPlayer = ({ src, isExpandedView = false }: { src: string, isExpandedView?: boolean }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);

  return (
    <div 
      className={`mt-4 rounded-xl overflow-hidden relative bg-black ${isExpandedView ? 'h-full flex items-center justify-center' : ''}`}
      onMouseEnter={() => !isExpandedView && videoRef.current?.play()}
      onMouseLeave={() => !isExpandedView && videoRef.current?.pause()}
    >
      <video 
        ref={videoRef} 
        src={src} 
        muted={isExpandedView ? isMuted : true} 
        loop 
        playsInline 
        autoPlay={isExpandedView}
        controls={isExpandedView}
        className={`w-full object-contain ${isExpandedView ? 'h-full max-h-[80vh]' : 'h-auto max-h-64'}`} 
      />
      {!isExpandedView && (
        <div className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider pointer-events-none">
          Hover to play
        </div>
      )}
      {isExpandedView && (
        <button 
          onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
          className="absolute bottom-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-md transition-colors z-10"
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      )}
    </div>
  );
};

const ReactionButton = ({ 
  note, 
  userReaction, 
  totalReactions, 
  onReact 
}: { 
  note: Note; 
  userReaction?: ReactionType; 
  totalReactions: number; 
  onReact: (noteId: string, type: ReactionType) => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 500);
  };

  return (
    <div 
      className="relative flex items-center gap-1.5"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button 
        className="text-gray-600 hover:text-red-500 transition-colors flex items-center gap-1.5 py-1"
        onClick={() => onReact(note.id, 'Like')}
      >
        {userReaction ? (
          <span className="text-xl leading-none">{REACTION_EMOJIS[userReaction]}</span>
        ) : (
          <Heart className="w-5 h-5" />
        )}
        {totalReactions > 0 && <span className="text-sm font-bold">{totalReactions}</span>}
      </button>
      
      <AnimatePresence>
        {isHovered && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-0 mb-0 pb-1 z-20 origin-bottom-left pointer-events-auto"
          >
            {/* Safe Bridge */}
            <div className="absolute bottom-0 left-0 w-full h-2 bg-transparent pointer-events-auto" />
            
            <div className="flex items-center gap-1 p-1.5 rounded-full bg-white shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-gray-100 relative">
              {(Object.keys(REACTION_EMOJIS) as ReactionType[]).map(type => (
                <motion.button
                  key={type}
                  whileHover={{ scale: 1.5, y: -8 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: 'spring', bounce: 0.6, duration: 0.4 }}
                  onClick={(e) => { e.stopPropagation(); onReact(note.id, type); setIsHovered(false); }}
                  className="p-1 hover:bg-black/5 rounded-full transition-colors text-2xl leading-none origin-bottom"
                  title={type}
                >
                  {REACTION_EMOJIS[type]}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export function Padlet({ searchQuery }: { searchQuery: string }) {
  const { notes: contextNotes, users, refreshData, loading, offlineToast } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notes, setNotes] = useState<Note[]>(contextNotes);
  const [activeTag, setActiveTag] = useState<'All' | NoteCategory>('All');
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [replyingTo, setReplyingTo] = useState<{ noteId: string, commentId?: string } | null>(null);
  const [commentText, setCommentText] = useState('');
  const [userReactions, setUserReactions] = useState<Record<string, ReactionType>>({});
  
  // Modal State
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteCategory, setNewNoteCategory] = useState<NoteCategory>('BD');
  const [newNoteColor, setNewNoteColor] = useState('#fef08a');
  const [uploadedFile, setUploadedFile] = useState<{ url: string, type: 'image' | 'video' } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result as string;
        // Remove data:image/png;base64, prefix for raw base64
        const rawBase64 = base64String.split(',')[1] || '';
        resolve(rawBase64);
      };
      reader.onerror = error => reject(error);
    });
  };

  // Expanded View State
  const [expandedNote, setExpandedNote] = useState<Note | null>(null);

  // Sync with context
  useEffect(() => { setNotes(contextNotes); }, [contextNotes]);

  const topContributors = [...users].sort((a, b) => (b.contributions || 0) - (a.contributions || 0)).slice(0, 5);
  const currentUser = users[0] || MOCK_USERS[0];

  // Smart Modal Exit
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false);
        setExpandedNote(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const localUrl = URL.createObjectURL(file);
      setUploadedFile({
        url: localUrl,
        type: file.type.startsWith('video/') ? 'video' : 'image'
      });
    }
  };

  const handleAddNote = async () => {
    if (!newNoteContent.trim() && !uploadedFile) return;
    
    // Add optimistic note
    const tempId = 'temp-' + Date.now().toString();
    const newNote: Note = {
      id: tempId,
      creatorId: currentUser?.id || '1',
      content: newNoteContent,
      category: newNoteCategory,
      color: newNoteColor,
      timestamp: new Date().toISOString(),
      imageUrl: uploadedFile?.type === 'image' ? uploadedFile.url : undefined,
      videoUrl: uploadedFile?.type === 'video' ? uploadedFile.url : undefined,
      reactions: { Like: 0, Love: 0, Haha: 0, Wow: 0, Sad: 0, Angry: 0 },
      comments: []
    };

    setNotes([newNote, ...notes]);
    setIsModalOpen(false);
    setNewNoteContent('');
    setUploadedFile(null);

    // Call n8n Webhook
    try {
      setIsUploading(true);
      let fileData = '';
      let fileName = '';
      
      if (selectedFile) {
        fileData = await fileToBase64(selectedFile);
        fileName = selectedFile.name;
      }

      const response = await fetch('https://n8n.oachiring.com/webhook/oac-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileData,
          fileName,
          Title: newNoteContent.substring(0, 30) || 'New Note',
          Tag: newNoteCategory,
          Details: newNoteContent
        })
      });

      if (!response.ok) throw new Error('Failed to send to n8n');
      
      refreshData?.();
    } catch(err) {
      console.error('Failed to add note to n8n:', err);
      alert('Failed to publish note');
    } finally {
      setIsUploading(false);
      setSelectedFile(null);
    }
  };

  const handleReaction = async (noteId: string, type: ReactionType) => {
    const currentReaction = userReactions[noteId];
    
    setNotes(notes.map(note => {
      if (note.id === noteId) {
        const newReactions = { ...note.reactions };
        
        if (currentReaction === type) {
          // Un-react
          newReactions[type] = Math.max(0, newReactions[type] - 1);
          const newUserReactions = { ...userReactions };
          delete newUserReactions[noteId];
          setUserReactions(newUserReactions);
        } else {
          // Change reaction or new reaction
          if (currentReaction) {
            newReactions[currentReaction] = Math.max(0, newReactions[currentReaction] - 1);
          }
          newReactions[type] += 1;
          setUserReactions({ ...userReactions, [noteId]: type });
        }
        
        return { ...note, reactions: newReactions };
      }
      return note;
    }));

    try {
      await reactApi({
        NoteId: noteId,
        UserId: currentUser?.id || '1',
        ReactionType: type
      });
      refreshData?.();
    } catch(err) {
      console.error('Failed to add reaction to GAS:', err);
    }
  };

  const handleAddComment = async (noteId: string, parentCommentId?: string) => {
    if (!commentText.trim()) return;

    const commentContent = commentText;
    const newComment: Comment = {
      id: 'temp-' + Date.now().toString(),
      authorId: currentUser.id,
      content: commentContent,
      timestamp: new Date().toISOString(),
      replies: []
    };

    setNotes(notes.map(note => {
      if (note.id === noteId) {
        if (parentCommentId) {
          return {
            ...note,
            comments: note.comments.map(c => {
              if (c.id === parentCommentId) {
                return { ...c, replies: [...(c.replies || []), newComment] };
              }
              return c;
            })
          };
        } else {
          return {
            ...note,
            comments: [...note.comments, newComment]
          };
        }
      }
      return note;
    }));

    setCommentText('');
    setReplyingTo(null);

    // Call API
    try {
      await addCommentApi({
        NoteId: noteId,
        Content: commentContent,
        AuthorId: currentUser.id,
        ParentCommentId: parentCommentId
      });
      refreshData?.();
    } catch(err) {
      console.error('Failed to add comment to GAS:', err);
    }
  };

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const getTotalReactions = (reactions: Record<ReactionType, number>) => {
    return Object.values(reactions).reduce((a, b) => a + b, 0);
  };

  const filteredNotes = notes.filter(note => {
    const creator = users.find(u => u.id === note.creatorId);
    const matchesSearch = note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          creator?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = activeTag === 'All' || note.category === activeTag;
    return matchesSearch && matchesTag;
  });

  const CommentItem = ({ comment, noteId, isReply = false }: { comment: Comment, noteId: string, isReply?: boolean, key?: string | number }) => {
    const author = users.find(u => u.id === comment.authorId) || MOCK_USERS[0];
    return (
      <div className={`flex gap-2 ${isReply ? 'ml-8 mt-2' : 'mt-3'}`}>
        <img src={author?.avatar} alt={author?.name} className="w-6 h-6 rounded-full bg-white/50 shrink-0" />
        <div className="flex-1">
          <div className="bg-black/5 rounded-2xl px-3 py-2 text-sm">
            <span className="font-bold text-gray-900 mr-2">{author?.name}</span>
            <span className="text-gray-800">{renderDescriptionWithMentions(comment.content)}</span>
          </div>
          <div className="flex items-center gap-3 mt-1 ml-2 text-xs text-gray-500 font-medium">
            <span>{safeFormat(comment.timestamp, 'h:mm a')}</span>
            {!isReply && (
              <button 
                onClick={() => setReplyingTo({ noteId, commentId: comment.id })}
                className="hover:text-gray-900 transition-colors"
              >
                Reply
              </button>
            )}
          </div>
          
          {/* Replies */}
          {comment.replies && comment.replies.map(reply => (
            <CommentItem key={reply.id} comment={reply} noteId={noteId} isReply={true} />
          ))}

          {/* Reply Input */}
          {replyingTo?.commentId === comment.id && (
            <div className="flex gap-2 mt-2 ml-8">
              <img src={currentUser.avatar} alt={currentUser.name} className="w-6 h-6 rounded-full bg-white/50 shrink-0" />
              <div className="flex-1 flex items-center bg-white/50 rounded-2xl border border-black/10 focus-within:border-black/30 transition-colors">
                <MentionTextarea 
                  value={commentText}
                  onChange={(v) => setCommentText(v)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAddComment(noteId, comment.id);
                    }
                  }}
                  rows={1}
                  placeholder="Write a reply..."
                  className="w-full bg-transparent border-none text-sm focus:ring-0 p-0 placeholder-gray-500 py-2 px-3"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-[#fdfbf7]">
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {offlineToast && (
          <div className="bg-amber-50 border-b border-amber-100 py-2 px-8 flex items-center gap-2 text-amber-700 text-sm animate-in fade-in slide-in-from-top duration-300 shrink-0">
            <Volume2 className="w-4 h-4" />
            <span>{offlineToast}</span>
          </div>
        )}
        <div className="px-8 py-6 border-b border-gray-200/60 bg-white/50 backdrop-blur-sm z-10 shrink-0 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-black tracking-tight text-gray-900 font-sans" style={{ fontFamily: "'Comic Sans MS', 'Chalkboard SE', sans-serif" }}>OAC Padlet ✨</h2>
              <p className="text-gray-500 mt-1 font-medium">Share wins, ideas, and good vibes.</p>
            </div>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-orange-400 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-orange-200 transition-all shrink-0"
            >
              <Plus className="w-5 h-5" />
              Add Note
            </motion.button>
          </div>
          
          {/* Filter Chips */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTag('All')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeTag === 'All' ? 'bg-gray-900 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              All Notes
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveTag(cat.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeTag === cat.id 
                    ? `ring-2 ring-offset-1 ring-gray-400 ${cat.color}`
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                #{cat.id}
              </button>
            ))}
            {activeTag !== 'All' && (
              <button
                onClick={() => setActiveTag('All')}
                className="px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors ml-2 flex items-center gap-1"
              >
                <X className="w-4 h-4" /> Clear
              </button>
            )}
          </div>

          {/* Who's Sharing — horizontal strip */}
          {topContributors.length > 0 && (
            <div className="flex items-center gap-4 overflow-x-auto pb-1 scrollbar-hide">
              <span className="text-xs font-black uppercase tracking-widest text-gray-400 shrink-0 flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 text-yellow-400" /> Who's Sharing
              </span>
              <div className="flex items-center gap-3">
                {topContributors.map((u, i) => (
                  <div key={u.id} className="flex items-center gap-2 bg-white border border-gray-100 rounded-full px-3 py-1 shadow-sm shrink-0">
                    <div className="relative">
                      <img src={u.avatar} alt={u.name} className="w-6 h-6 rounded-full bg-gray-100 object-cover" />
                      {i === 0 && (
                        <span className="absolute -top-1 -right-1 text-[9px] leading-none">👑</span>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-gray-800 whitespace-nowrap">{u.name.split(' ')[0]}</span>
                    <span className="text-xs text-gray-400 font-medium">{u.contributions ?? 0}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notes Wall */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="columns-1 md:columns-2 xl:columns-3 gap-6 space-y-6">
            {loading ? (
              [1, 2, 3, 4, 5, 6].map(i => <NoteSkeleton key={i} />)
            ) : (
              <AnimatePresence>
                {filteredNotes.map((note) => {
                const creator = users.find(u => u.id === note.creatorId) || MOCK_USERS[0];
                const catStyle = CATEGORIES.find(c => c.id === note.category)?.color;
                const ytId = note.youtubeLink ? getYoutubeId(note.youtubeLink) : null;
                const totalReactions = getTotalReactions(note.reactions);
                const isExpanded = expandedComments[note.id];
                const displayComments = isExpanded ? note.comments : note.comments.slice(0, 3);

                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    key={note.id}
                    className="break-inside-avoid rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all border border-black/5 relative group"
                    style={{ backgroundColor: note.color }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <img src={creator.avatar} alt={creator.name} className="w-8 h-8 rounded-full bg-white/50" />
                        <div>
                          <p className="text-sm font-bold text-gray-900">{creator.name}</p>
                          <p className="text-xs text-gray-600 opacity-70">{safeFormat(note.timestamp, 'MMM d, h:mm a')}</p>
                        </div>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg ${catStyle}`}>
                        {note.category}
                      </span>
                    </div>
                    
                    <TruncatedText text={note.content} />

                    {note.imageUrl && (
                      <div className="mt-4 rounded-xl overflow-hidden">
                        <img src={note.imageUrl} alt="attachment" className="w-full h-auto object-cover" />
                      </div>
                    )}

                    {note.videoUrl && (
                      <VideoPlayer src={note.videoUrl} />
                    )}

                    {ytId && (
                      <div className="mt-4 rounded-xl overflow-hidden relative pt-[56.25%]">
                        <img 
                          src={`https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`} 
                          alt="YouTube Thumbnail"
                          className="absolute top-0 left-0 w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                            <div className="w-0 h-0 border-t-8 border-t-transparent border-l-[12px] border-l-white border-b-8 border-b-transparent ml-1"></div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-black/5">
                      <ReactionButton 
                        note={note} 
                        userReaction={userReactions[note.id]} 
                        totalReactions={totalReactions} 
                        onReact={handleReaction} 
                      />

                      <button 
                        onClick={() => setReplyingTo({ noteId: note.id })}
                        className="text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-1.5"
                      >
                        <MessageCircle className="w-5 h-5" />
                        {note.comments.length > 0 && <span className="text-sm font-bold">{note.comments.length}</span>}
                      </button>

                      <div className="flex-1" />
                      
                      <button 
                        onClick={() => setExpandedNote(note)}
                        className="text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1.5"
                      >
                        <Maximize2 className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Comments Section */}
                    {(note.comments.length > 0 || replyingTo?.noteId === note.id) && (
                      <div className="mt-4 pt-4 border-t border-black/5">
                        {displayComments.map(comment => (
                          <CommentItem key={comment.id} comment={comment} noteId={note.id} />
                        ))}
                        
                        {note.comments.length > 3 && (
                          <button 
                            onClick={() => setExpandedComments({ ...expandedComments, [note.id]: !isExpanded })}
                            className="text-xs font-bold text-gray-500 hover:text-gray-900 mt-2 ml-8 transition-colors"
                          >
                            {isExpanded ? 'Show less' : `View ${note.comments.length - 3} more comments`}
                          </button>
                        )}

                        {/* Main Note Reply Input */}
                        {replyingTo?.noteId === note.id && !replyingTo?.commentId && (
                          <div className="flex gap-2 mt-3">
                            <img src={currentUser.avatar} alt={currentUser.name} className="w-6 h-6 rounded-full bg-white/50 shrink-0" />
                            <div className="flex-1 flex items-center bg-white/50 rounded-2xl border border-black/10 focus-within:border-black/30 transition-colors">
                              <MentionTextarea 
                                value={commentText}
                                onChange={(v) => setCommentText(v)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleAddComment(note.id);
                                  }
                                }}
                                rows={1}
                                placeholder="Write a comment..."
                                className="w-full bg-transparent border-none text-sm focus:ring-0 p-0 placeholder-gray-500 py-2 px-3"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
              </AnimatePresence>
            )}
            {!loading && filteredNotes.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-500 font-medium">
                No notes found matching your criteria.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Note Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
                <h3 className="text-xl font-bold text-gray-900 font-sans">Create a Note</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-6 overflow-y-auto" style={{ backgroundColor: newNoteColor, transition: 'background-color 0.3s ease' }}>
                {/* Category Selection */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 opacity-80">Category</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setNewNoteCategory(cat.id)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                          newNoteCategory === cat.id 
                            ? 'ring-2 ring-black ring-offset-2 scale-105 ' + cat.color
                            : 'bg-white/50 text-gray-600 hover:bg-white/80'
                        }`}
                      >
                        {cat.id}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 opacity-80">Content</label>
                  <div className="bg-white/60 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-black/20 focus-within:bg-white transition-all">
                    <TiptapEditor 
                      content={newNoteContent} 
                      onChange={setNewNoteContent} 
                    />
                  </div>
                </div>

                {/* Attachments */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 opacity-80">Attachment (Image or Video)</label>
                  <div className="relative">
                    <input 
                      type="file" 
                      accept="image/*,video/mp4,video/webm,video/ogg"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                      className="w-full bg-white/60 border-0 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-black/20 focus:bg-white transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-black file:text-white hover:file:bg-gray-800 disabled:opacity-50" 
                    />
                  </div>
                  {isUploading && <div className="mt-2 text-sm text-blue-600 font-bold">Uploading to Drive...</div>}
                  {uploadedFile && !isUploading && (
                    <div className="mt-3 relative rounded-xl overflow-hidden bg-black/5 aspect-video flex items-center justify-center">
                      {uploadedFile.type === 'image' ? (
                        <img src={uploadedFile.url} alt="Preview" className="max-w-full max-h-full object-contain" />
                      ) : (
                        <video src={uploadedFile.url} className="max-w-full max-h-full object-contain" controls />
                      )}
                      <button 
                        onClick={() => setUploadedFile(null)}
                        className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full backdrop-blur-md transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Color Picker */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 opacity-80">Note Color</label>
                  <div className="flex items-center gap-3">
                    {PRESET_COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => setNewNoteColor(color)}
                        className={`w-8 h-8 rounded-full border-2 transition-transform ${
                          newNoteColor === color ? 'border-black scale-110' : 'border-transparent hover:scale-110'
                        }`}
                        style={{ backgroundColor: color, boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}
                      />
                    ))}
                    <div className="w-px h-6 bg-black/10 mx-1"></div>
                    <input 
                      type="color" 
                      value={newNoteColor}
                      onChange={(e) => setNewNoteColor(e.target.value)}
                      className="w-8 h-8 rounded-full cursor-pointer border-0 p-0 bg-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white border-t border-gray-100 flex justify-end gap-3 shrink-0">
                <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors">
                  Cancel
                </button>
                <button 
                  onClick={handleAddNote}
                  disabled={isUploading || (!newNoteContent.trim() && !uploadedFile)}
                  className="px-5 py-2.5 bg-black text-white text-sm font-bold rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
                >
                  Post Note
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Expanded Note Modal */}
      <AnimatePresence>
        {expandedNote && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setExpandedNote(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-6xl h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
            >
              <button 
                onClick={() => setExpandedNote(null)} 
                className="absolute top-4 right-4 p-2 bg-white/50 hover:bg-white/80 text-gray-900 rounded-full transition-colors z-20 backdrop-blur-md md:hidden"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Left Column: Media */}
              <div className="w-full md:w-3/5 bg-black flex items-center justify-center relative shrink-0 h-64 md:h-full">
                {expandedNote.imageUrl ? (
                  <img src={expandedNote.imageUrl} alt="attachment" className="w-full h-full object-contain" />
                ) : expandedNote.videoUrl ? (
                  <VideoPlayer src={expandedNote.videoUrl} isExpandedView={true} />
                ) : expandedNote.youtubeLink ? (
                  <iframe 
                    src={`https://www.youtube.com/embed/${getYoutubeId(expandedNote.youtubeLink)}?autoplay=1`} 
                    className="w-full h-full"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/50 font-medium" style={{ backgroundColor: expandedNote.color }}>
                    No media attached
                  </div>
                )}
              </div>

              {/* Right Column: Content & Engagement */}
              <div className="w-full md:w-2/5 flex flex-col h-full bg-white relative">
                <button 
                  onClick={() => setExpandedNote(null)} 
                  className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors z-20 hidden md:block"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="p-6 border-b border-gray-100 shrink-0">
                  <div className="flex items-center gap-3">
                    <img 
                      src={users.find(u => u.id === expandedNote.creatorId)?.avatar || MOCK_USERS[0].avatar} 
                      alt={users.find(u => u.id === expandedNote.creatorId)?.name || 'Unknown'} 
                      className="w-10 h-10 rounded-full bg-gray-100" 
                    />
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {users.find(u => u.id === expandedNote.creatorId)?.name || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {safeFormat(expandedNote.timestamp, 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Content & Comments Scrollable Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Caption */}
                  <div 
                    className="prose prose-sm max-w-none text-gray-800 leading-relaxed font-medium"
                    dangerouslySetInnerHTML={{ 
                      __html: expandedNote.content.replace(/@(\w+)/g, '<span class="text-blue-600 font-bold">@$1</span>') 
                    }}
                  />

                  {/* Comments */}
                  <div className="space-y-4 pt-6 border-t border-gray-100">
                    <h4 className="text-sm font-bold text-gray-900">Comments</h4>
                    {expandedNote.comments.length === 0 ? (
                      <p className="text-sm text-gray-500">No comments yet. Be the first to reply!</p>
                    ) : (
                      expandedNote.comments.map(comment => (
                        <CommentItem key={comment.id} comment={comment} noteId={expandedNote.id} />
                      ))
                    )}
                  </div>
                </div>

                {/* Footer: Actions & Input */}
                <div className="p-6 border-t border-gray-100 bg-gray-50/50 shrink-0">
                  <div className="flex items-center gap-4 mb-4">
                    <ReactionButton 
                      note={expandedNote} 
                      userReaction={userReactions[expandedNote.id]} 
                      totalReactions={getTotalReactions(expandedNote.reactions)} 
                      onReact={handleReaction} 
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <img src={currentUser.avatar} alt={currentUser.name} className="w-8 h-8 rounded-full bg-white shrink-0 shadow-sm" />
                    <div className="flex-1 flex items-center bg-white rounded-2xl border border-gray-200 focus-within:border-gray-400 transition-colors shadow-sm">
                      <MentionTextarea 
                        value={commentText}
                        onChange={(v) => setCommentText(v)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleAddComment(expandedNote.id);
                          }
                        }}
                        rows={1}
                        placeholder="Add a comment..."
                        className="w-full bg-transparent border-none text-sm focus:ring-0 p-0 placeholder-gray-400 py-3 px-4 resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
