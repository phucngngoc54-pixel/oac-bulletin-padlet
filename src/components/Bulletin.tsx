import React, { useState, useEffect, useRef } from 'react';
import { Plus, Calendar, MapPin, Clock, FileText, Link as LinkIcon, X, Upload, File as FileIcon, Check, Image as ImageIcon, Crop as CropIcon, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Event, EventTag, EventDocument, MOCK_USERS } from '../data/mockData';
import { parseISO } from 'date-fns';
import { safeFormat } from '../utils/dateUtils';
import { MentionTextarea, renderDescriptionWithMentions } from './MentionTextarea';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { useAppContext } from '../context/AppContext';
import { addEvent as addEventApi } from '../api/gasApi';

const TAG_COLORS: Record<EventTag, string> = {
  'Team meeting': 'bg-blue-100 text-blue-700',
  'Buddy Team meeting': 'bg-purple-100 text-purple-700',
  'Client meeting': 'bg-green-100 text-green-700',
  'Pop up meeting': 'bg-orange-100 text-orange-700'
};

export function Bulletin({ 
  searchQuery, 
  selectedEvent, 
  setSelectedEvent 
}: { 
  searchQuery: string, 
  selectedEvent: Event | null, 
  setSelectedEvent: (e: Event | null) => void 
}) {
  const { events, users, refreshData } = useAppContext();
  const [localEvents, setLocalEvents] = useState<Event[]>(events);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTag, setActiveTag] = useState<'All' | EventTag>('All');
  // Keep local events synced when context updates
  useEffect(() => { setLocalEvents(events); }, [events]);

  // Form State
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventTag, setNewEventTag] = useState<EventTag>('Team meeting');
  const [newEventDocs, setNewEventDocs] = useState<EventDocument[]>([]);
  const [newEventDetails, setNewEventDetails] = useState('');
  const [newEventAttendees, setNewEventAttendees] = useState<string[]>([]);
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventTime, setNewEventTime] = useState('');
  const [newEventLocation, setNewEventLocation] = useState('');
  const [newEventCoverImage, setNewEventCoverImage] = useState('');
  const [showAttendeeDropdown, setShowAttendeeDropdown] = useState(false);

  // Image Crop State
  const [imgSrc, setImgSrc] = useState('');
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isCropping, setIsCropping] = useState(false);

  // 3-dot menu state
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  // Link URL prompt state (for adding link docs)
  const [linkUrlInput, setLinkUrlInput] = useState<{ idx: number; value: string } | null>(null);
  
  const [isUploading, setIsUploading] = useState(false);

  // Smart Modal Exit
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false);
        setSelectedEvent(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setIsModalOpen(false);
      setSelectedEvent(null);
    }
  };

  // Filter Logic
  const filteredEvents = localEvents.filter(e => {
    const matchesSearch = (e.title || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (e.details || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (users.find(u => u.id === e.publisherId)?.name || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = activeTag === 'All' || e.tag === activeTag;
    return matchesSearch && matchesTag;
  });

  // Find the latest 'Team meeting' for the headline from the filtered list
  const teamMeetings = filteredEvents.filter(e => e.tag === 'Team meeting').sort((a, b) => {
    const timeA = a.date ? new Date(a.date).getTime() : 0;
    const timeB = b.date ? new Date(b.date).getTime() : 0;
    return timeB - timeA;
  });
  const headlineEvent = teamMeetings.length > 0 ? teamMeetings[0] : (filteredEvents.length > 0 ? filteredEvents[0] : null);
  
  const otherEvents = filteredEvents.filter(e => headlineEvent && e.id !== headlineEvent.id);

  const handleAddDoc = (type: 'file' | 'link') => {
    const newDoc: EventDocument = {
      id: Date.now().toString(),
      name: type === 'file' ? '' : '',
      url: '',
      type
    };
    const newDocs = [...newEventDocs, newDoc];
    setNewEventDocs(newDocs);
    if (type === 'link') {
      setLinkUrlInput({ idx: newDocs.length - 1, value: '' });
    }
  };

  const docFileInputRef = useRef<HTMLInputElement>(null);

  const handleDocFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      if (data.success) {
        const newDoc: EventDocument = {
          id: Date.now().toString(),
          name: file.name,
          url: data.webViewLink,
          type: 'file'
        };
        setNewEventDocs(prev => [...prev, newDoc]);
      } else {
        alert('Upload failed: ' + data.error);
      }
    } catch (error) {
      console.error('Error uploading:', error);
      alert('Error uploading document');
    } finally {
      setIsUploading(false);
    }
    
    // reset so same file can be picked again
    e.target.value = '';
  };

  const handleDeleteEvent = (eventId: string) => {
    setLocalEvents(prev => prev.filter(e => e.id !== eventId));
    setOpenMenuId(null);
    if (selectedEvent?.id === eventId) setSelectedEvent(null);
    // TODO: call deleteEvent API when backend supports it
  };

  const openEditModal = (event: Event) => {
    setEditingEvent(event);
    setNewEventTitle(event.title);
    setNewEventTag(event.tag);
    setNewEventDate(event.date ? event.date.split('T')[0] : '');
    setNewEventTime(event.time);
    setNewEventLocation(event.location);
    setNewEventDetails(event.details);
    setNewEventAttendees(event.attendees || []);
    setNewEventDocs(event.documents || []);
    setNewEventCoverImage(event.coverImage || '');
    setImgSrc('');
    setIsCropping(false);
    setOpenMenuId(null);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingEvent(null);
    setNewEventTitle('');
    setNewEventTag('Team meeting');
    setNewEventDocs([]);
    setNewEventDetails('');
    setNewEventAttendees([]);
    setNewEventDate('');
    setNewEventTime('');
    setNewEventLocation('');
    setNewEventCoverImage('');
    setImgSrc('');
    setIsCropping(false);
  };

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined);
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImgSrc(reader.result?.toString() || '');
        setIsCropping(true);
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const cropWidthInPercent = (150 / width) * 100;
    setCrop({
      unit: '%',
      width: cropWidthInPercent,
      height: cropWidthInPercent,
      x: (100 - cropWidthInPercent) / 2,
      y: (100 - cropWidthInPercent) / 2
    });
  };

  const handleCropComplete = () => {
    if (completedCrop && imgRef.current) {
      const canvas = document.createElement('canvas');
      const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
      const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
      canvas.width = completedCrop.width;
      canvas.height = completedCrop.height;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.drawImage(
          imgRef.current,
          completedCrop.x * scaleX,
          completedCrop.y * scaleY,
          completedCrop.width * scaleX,
          completedCrop.height * scaleY,
          0,
          0,
          completedCrop.width,
          completedCrop.height
        );

        canvas.toBlob(async (blob) => {
          if (!blob) return;
          try {
            setIsUploading(true);
            const formData = new FormData();
            formData.append('file', blob, 'cover.jpg');
            
            const response = await fetch('/api/upload', {
              method: 'POST',
              body: formData,
            });
            const data = await response.json();
            
            if (data.success) {
              setNewEventCoverImage(data.webViewLink);
            } else {
              alert('Failed to upload cropped image: ' + data.error);
            }
          } catch (error) {
            console.error('Error uploading crop:', error);
            alert('Error uploading cropped image');
          } finally {
            setIsUploading(false);
            setIsCropping(false);
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  const handlePublishEvent = async () => {
    if (!newEventTitle || !newEventDate || !newEventTime) return;

    const currentUser = users[0];
    const eventDate = new Date(newEventDate).toISOString();

    if (editingEvent) {
      // --- EDIT MODE: patch local state ---
      const updated: Event = {
        ...editingEvent,
        title: newEventTitle,
        tag: newEventTag,
        date: eventDate,
        time: newEventTime,
        location: newEventLocation || 'TBD',
        details: newEventDetails,
        attendees: newEventAttendees,
        documents: newEventDocs,
        coverImage: newEventCoverImage || undefined,
      };
      setLocalEvents(prev => prev.map(e => e.id === editingEvent.id ? updated : e));
      setIsModalOpen(false);
      resetForm();
      // TODO: call editEvent API when backend supports it
      return;
    }

    // --- CREATE MODE ---
    const newEvent: Event = {
      id: Date.now().toString(),
      title: newEventTitle,
      tag: newEventTag,
      date: eventDate,
      time: newEventTime,
      location: newEventLocation || 'TBD',
      details: newEventDetails,
      publisherId: currentUser?.id || '1',
      attendees: newEventAttendees,
      documents: newEventDocs,
      coverImage: newEventCoverImage || undefined,
      type: 'event'
    };

    // Optimistic update
    setLocalEvents(prev => [newEvent, ...prev]);
    setIsModalOpen(false);
    resetForm();
    
    // POST to GAS API (include docs and cover so GAS can store them)
    addEventApi({
      Title: newEventTitle,
      Tag: newEventTag,
      Date: eventDate,
      Time: newEventTime,
      Location: newEventLocation || 'TBD',
      Details: newEventDetails,
      PublisherId: currentUser?.id || '1',
      Attendees: newEventAttendees,
      CoverImage: newEventCoverImage || '',
      Documents: newEventDocs.map(d => ({ name: d.name, url: d.url, type: d.type })),
    }).then(() => refreshData()).catch(console.warn);
  };

  const getDocIcon = (doc: EventDocument) => {
    if (doc.type === 'link') return <LinkIcon className="w-5 h-5" />;
    if (doc.name.endsWith('.pdf')) return <FileText className="w-5 h-5" />;
    return <FileIcon className="w-5 h-5" />;
  };

  const currentUser = users[0];

  const EventCard = ({ event, isHeadline = false }: { event: Event, isHeadline?: boolean, key?: string | number }) => {
    const publisher = users.find(u => u.id === event.publisherId);
    const isCreator = currentUser?.id === event.publisherId;
    const isMenuOpen = openMenuId === event.id;

    return (
      <div 
        onClick={() => { if (!isMenuOpen) setSelectedEvent(event); }}
        className={`bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group relative ${isHeadline ? '' : 'p-4 flex flex-col sm:flex-row gap-4'}`}
      >
        {/* 3-dot menu — only for creator */}
        {isCreator && (
          <div
            className={`absolute z-10 ${isHeadline ? 'top-4 right-4' : 'top-3 right-3'}`}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setOpenMenuId(isMenuOpen ? null : event.id)}
              className="p-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-white shadow-sm transition-all opacity-0 group-hover:opacity-100"
              title="Options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {isMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                <div className="absolute right-0 mt-1 w-36 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                  <button
                    onClick={() => openEditModal(event)}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Pencil className="w-4 h-4 text-blue-500" /> Edit
                  </button>
                  <button
                    onClick={() => handleDeleteEvent(event.id)}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {isHeadline && event.coverImage && (
          <div className="h-64 w-full relative overflow-hidden">
            <img src={event.coverImage} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">Headline</span>
              <span className={`text-xs font-bold px-3 py-1 rounded-full shadow-sm ${TAG_COLORS[event.tag]}`}>{event.tag}</span>
            </div>
          </div>
        )}
        {!isHeadline && event.coverImage && (
          <div className="w-full sm:w-32 h-40 sm:h-auto shrink-0 rounded-xl overflow-hidden relative">
            <img src={event.coverImage} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          </div>
        )}
        <div className={`flex flex-col flex-1 ${isHeadline ? 'p-8' : 'p-5'}`}>
          {!isHeadline && (
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${TAG_COLORS[event.tag]}`}>{event.tag}</span>
              <span className="text-xs text-gray-500">{safeFormat(event.date, 'MMM d, yyyy')}</span>
            </div>
          )}
          <h3 className={`${isHeadline ? 'text-2xl mb-3' : 'text-base mb-1'} font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2`}>{event.title}</h3>
          <p className={`text-gray-600 ${isHeadline ? 'mb-6 leading-relaxed' : 'text-xs line-clamp-2 mb-3'}`}>{event.details}</p>
          <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500 ${isHeadline ? '' : 'mt-auto text-[11px]'}`}>
            <div className="flex items-center gap-1.5">
              <img src={publisher?.avatar || MOCK_USERS[0].avatar} alt={publisher?.name || 'Unknown'} className="w-4 h-4 rounded-full bg-gray-100" />
              <span className="font-medium text-gray-700">{publisher?.name || 'Unknown'}</span>
            </div>
            {isHeadline && (
              <div className="flex items-center gap-2"><Calendar className="w-4 h-4" />{safeFormat(event.date, 'MMMM d, yyyy')}</div>
            )}
            <div className="flex items-center gap-1"><Clock className={isHeadline ? 'w-4 h-4' : 'w-3 h-3'} />{event.time}</div>
            <div className="flex items-center gap-1"><MapPin className={isHeadline ? 'w-4 h-4' : 'w-3 h-3'} /><span className="truncate max-w-[100px]">{event.location}</span></div>
            {event.documents && event.documents.length > 0 && (
              <div className="flex items-center gap-1 text-blue-600 font-medium">
                <FileText className={isHeadline ? 'w-4 h-4' : 'w-3 h-3'} />{event.documents.length} Docs
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-[#f8f9fa]">
      <div className="flex-1 overflow-y-auto p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">OAC Bulletin</h2>
            <p className="text-gray-500 mt-1">Company news, strategy updates, and upcoming events.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            Create Event
          </button>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <button
            onClick={() => setActiveTag('All')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeTag === 'All' ? 'bg-gray-900 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            All Events
          </button>
          {(Object.keys(TAG_COLORS) as EventTag[]).map(tag => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeTag === tag 
                  ? `ring-2 ring-offset-1 ring-gray-400 ${TAG_COLORS[tag]}`
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              #{tag.replace(/\s+/g, '')}
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

        <div className="grid grid-cols-1 gap-8">
          <div className="space-y-8">
            {/* Headline Event */}
            {headlineEvent ? (
              <EventCard event={headlineEvent} isHeadline={true} />
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-500">
                No events found matching your criteria.
              </div>
            )}

            {/* Other News & Events */}
            {otherEvents.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Internal News & Upcoming</h3>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {otherEvents.map(event => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detailed View Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={handleBackdropClick}>
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            {selectedEvent.coverImage && (
              <div className="h-48 w-full relative shrink-0">
                <img src={selectedEvent.coverImage} alt={selectedEvent.title} className="w-full h-full object-cover" />
                <button 
                  onClick={() => setSelectedEvent(null)} 
                  className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-md transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
            
            <div className="p-8 overflow-y-auto">
              {!selectedEvent.coverImage && (
                <button 
                  onClick={() => setSelectedEvent(null)} 
                  className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              )}
              
              <div className="flex items-center gap-3 mb-4">
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${TAG_COLORS[selectedEvent.tag]}`}>
                  {selectedEvent.tag}
                </span>
                <span className="text-sm text-gray-500">{safeFormat(selectedEvent.date, 'MMMM d, yyyy')}</span>
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-6">{selectedEvent.title}</h2>
              
              <div className="flex flex-wrap gap-6 mb-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Time</p>
                    <p className="text-sm font-bold text-gray-900">{selectedEvent.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Location</p>
                    <p className="text-sm font-bold text-gray-900">{selectedEvent.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <img 
                    src={users.find(u => u.id === selectedEvent.publisherId)?.avatar || MOCK_USERS[0].avatar} 
                    alt="Publisher" 
                    className="w-10 h-10 rounded-full bg-gray-200" 
                  />
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Published By</p>
                    <p className="text-sm font-bold text-gray-900">{users.find(u => u.id === selectedEvent.publisherId)?.name || 'Unknown'}</p>
                  </div>
                </div>
              </div>

              <div className="prose prose-blue max-w-none mb-8">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Description & Requirements</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{renderDescriptionWithMentions(selectedEvent.details)}</p>
              </div>

              {selectedEvent.documents && selectedEvent.documents.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Preparation Documents</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedEvent.documents.map(doc => (
                      <a 
                        key={doc.id} 
                        href={doc.url}
                        className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${doc.type === 'file' ? (doc.name.endsWith('.pdf') ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600') : 'bg-gray-100 text-gray-600'}`}>
                          {getDocIcon(doc)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate group-hover:text-blue-700">{doc.name}</p>
                          <p className="text-xs text-gray-500 uppercase">{doc.type}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={handleBackdropClick}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
              <h3 className="text-xl font-bold text-gray-900">{editingEvent ? 'Edit Event' : 'Create New Event'}</h3>
              <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tag / Category</label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(TAG_COLORS) as EventTag[]).map(tag => (
                    <button
                      key={tag}
                      onClick={() => setNewEventTag(tag)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        newEventTag === tag 
                          ? `ring-2 ring-offset-1 ring-gray-400 ${TAG_COLORS[tag]}`
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image</label>
                {!newEventCoverImage && !isCropping && (
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-colors relative group">
                    <div className="space-y-1 text-center">
                      <ImageIcon className="mx-auto h-12 w-12 text-gray-400 group-hover:text-blue-500 transition-colors" />
                      <div className="flex text-sm text-gray-600 justify-center">
                        <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                          <span>Upload a file</span>
                          <input id="file-upload" name="file-upload" type="file" accept="image/*" className="sr-only" onChange={onSelectFile} />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                    </div>
                  </div>
                )}
                
                {isCropping && imgSrc && (
                  <div className="mt-2 border border-gray-200 rounded-xl p-4 bg-gray-50">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                        <CropIcon className="w-4 h-4 text-blue-500" />
                        Crop Image
                      </h4>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => { setIsCropping(false); setImgSrc(''); }}
                          className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handleCropComplete}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                        >
                          Apply Crop
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-center bg-black/5 rounded-lg overflow-hidden max-h-[400px]">
                      <ReactCrop
                        crop={crop}
                        onChange={(_, percentCrop) => setCrop(percentCrop)}
                        onComplete={(c) => setCompletedCrop(c)}
                        aspect={16 / 9}
                        className="max-h-[400px]"
                      >
                        <img
                          ref={imgRef}
                          alt="Crop me"
                          src={imgSrc}
                          onLoad={onImageLoad}
                          className="max-h-[400px] w-auto object-contain"
                        />
                      </ReactCrop>
                    </div>
                  </div>
                )}

                {newEventCoverImage && !isCropping && (
                  <div className="mt-2 relative rounded-xl overflow-hidden border border-gray-200 group">
                    <img src={newEventCoverImage} alt="Cover preview" className="w-full h-48 object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <label className="cursor-pointer px-4 py-2 bg-white text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
                        Change Image
                        <input type="file" accept="image/*" className="sr-only" onChange={onSelectFile} />
                      </label>
                      <button 
                        onClick={() => setNewEventCoverImage('')}
                        className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input type="text" value={newEventTitle} onChange={e => setNewEventTitle(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Event title" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" value={newEventDate} onChange={e => setNewEventDate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <input type="time" value={newEventTime} onChange={e => setNewEventTime(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input type="text" value={newEventLocation} onChange={e => setNewEventLocation(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Office or meeting link" />
              </div>

              {/* Attendee Selection */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Attendees</label>
                <div 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent min-h-[42px] flex flex-wrap gap-2 cursor-text"
                  onClick={() => setShowAttendeeDropdown(true)}
                >
                  {newEventAttendees.map(id => {
                    const user = users.find(u => u.id === id);
                    if (!user) return null;
                    return (
                      <span key={id} className="inline-flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full text-xs font-medium text-gray-700">
                        <img src={user.avatar} className="w-4 h-4 rounded-full" />
                        {user.name}
                        <button 
                          onClick={(e) => { e.stopPropagation(); setNewEventAttendees(prev => prev.filter(uid => uid !== id)); }}
                          className="hover:text-red-500 ml-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                  <input 
                    type="text" 
                    className="flex-1 bg-transparent border-none p-0 text-sm focus:ring-0 min-w-[100px]" 
                    placeholder={newEventAttendees.length === 0 ? "Add attendees..." : ""}
                    onFocus={() => setShowAttendeeDropdown(true)}
                  />
                </div>
                
                {showAttendeeDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowAttendeeDropdown(false)} />
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      <div 
                        className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2 border-b border-gray-100"
                        onClick={() => {
                          if (newEventAttendees.length === users.length) {
                            setNewEventAttendees([]);
                          } else {
                            setNewEventAttendees(users.map(u => u.id));
                          }
                        }}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${newEventAttendees.length === users.length ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-300'}`}>
                          {newEventAttendees.length === users.length && <Check className="w-3 h-3" />}
                        </div>
                        <span className="text-sm font-bold text-gray-900">Select Everyone</span>
                      </div>
                      {users.map(user => {
                        const isSelected = newEventAttendees.includes(user.id);
                        return (
                          <div 
                            key={user.id} 
                            className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-3"
                            onClick={() => {
                              if (isSelected) {
                                setNewEventAttendees(prev => prev.filter(id => id !== user.id));
                              } else {
                                setNewEventAttendees(prev => [...prev, user.id]);
                              }
                            }}
                          >
                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-300'}`}>
                              {isSelected && <Check className="w-3 h-3" />}
                            </div>
                            <img src={user.avatar} className="w-6 h-6 rounded-full" />
                            <span className="text-sm font-medium text-gray-700">{user.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Details & Requirements</label>
                <MentionTextarea value={newEventDetails} onChange={setNewEventDetails} />
              </div>
              
              <div className="pt-4 border-t border-gray-100">
                {/* Hidden file input for doc upload */}
                <input
                  ref={docFileInputRef}
                  type="file"
                  className="sr-only"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,image/*"
                  onChange={handleDocFileChange}
                />
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">Preparation Documents</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => docFileInputRef.current?.click()}
                      className="text-xs flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
                    >
                      <Upload className="w-3 h-3" /> {isUploading ? 'Uploading...' : 'Upload File'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddDoc('link')}
                      className="text-xs flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      <LinkIcon className="w-3 h-3" /> Insert Link
                    </button>
                  </div>
                </div>

                {newEventDocs.length > 0 ? (
                  <div className="space-y-2">
                    {newEventDocs.map((doc, idx) => (
                      <div key={doc.id} className="rounded-lg border border-gray-200 bg-gray-50 overflow-hidden">
                        <div className="flex items-center gap-3 p-2">
                          {getDocIcon(doc)}
                          <div className="flex-1 min-w-0">
                            <input
                              type="text"
                              value={doc.name}
                              onChange={e => {
                                const updated = [...newEventDocs];
                                updated[idx] = { ...updated[idx], name: e.target.value };
                                setNewEventDocs(updated);
                              }}
                              className="w-full bg-transparent border-none text-sm focus:ring-0 p-0 font-medium"
                              placeholder={doc.type === 'link' ? 'Link label...' : 'File name...'}
                            />
                            {doc.type === 'link' && doc.url && (
                              <p className="text-xs text-blue-500 truncate">{doc.url}</p>
                            )}
                          </div>
                          <button
                            onClick={() => setNewEventDocs(newEventDocs.filter(d => d.id !== doc.id))}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        {/* Inline URL input for link type */}
                        {doc.type === 'link' && linkUrlInput?.idx === idx && (
                          <div className="px-3 pb-2 flex gap-2">
                            <input
                              type="url"
                              autoFocus
                              value={linkUrlInput.value}
                              onChange={e => setLinkUrlInput({ idx, value: e.target.value })}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  const updated = [...newEventDocs];
                                  updated[idx] = { ...updated[idx], url: linkUrlInput.value, name: updated[idx].name || linkUrlInput.value };
                                  setNewEventDocs(updated);
                                  setLinkUrlInput(null);
                                }
                                if (e.key === 'Escape') setLinkUrlInput(null);
                              }}
                              className="flex-1 text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="https://..."
                            />
                            <button
                              onClick={() => {
                                const updated = [...newEventDocs];
                                updated[idx] = { ...updated[idx], url: linkUrlInput.value, name: updated[idx].name || linkUrlInput.value };
                                setNewEventDocs(updated);
                                setLinkUrlInput(null);
                              }}
                              className="text-xs px-2 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                            >
                              Save
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-4 border-2 border-dashed border-gray-200 rounded-lg text-gray-500 text-sm">
                    No documents added yet.
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shrink-0 rounded-b-2xl">
              <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900">Cancel</button>
              <button onClick={handlePublishEvent} className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800">{editingEvent ? 'Save Changes' : 'Publish Event'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

