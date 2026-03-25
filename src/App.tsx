import React, { useState, useRef, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { Bulletin } from './components/Bulletin';
import { Padlet } from './components/Padlet';
import { RightSidebar } from './components/RightSidebar';
import { Event, MOCK_USERS } from './data/mockData';
import { useAppContext } from './context/AppContext';

export default function App() {
  const [activeTab, setActiveTab] = useState('bulletin');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [currentUserAvatar, setCurrentUserAvatar] = useState(MOCK_USERS?.[0]?.avatar || '');
  const { refreshData } = useAppContext();
  
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const handleEventClick = (event: Event) => {
    setActiveTab('bulletin');
    setSelectedEvent(event);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      // Calculate new width based on window width - mouse X position
      // because the sidebar is on the right
      const newWidth = window.innerWidth - e.clientX;
      
      if (newWidth >= 250 && newWidth <= 450) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      // Prevent text selection while resizing
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  return (
    <div className="flex h-screen w-full bg-white overflow-hidden font-sans relative">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery} 
          setActiveTab={setActiveTab}
          currentUserAvatar={currentUserAvatar}
          setCurrentUserAvatar={setCurrentUserAvatar}
        />
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {activeTab === 'bulletin' && (
            <Bulletin 
              searchQuery={searchQuery} 
              selectedEvent={selectedEvent} 
              setSelectedEvent={setSelectedEvent} 
            />
          )}
          {activeTab === 'padlet' && <Padlet searchQuery={searchQuery} />}
          {activeTab === 'home' && (
            <div className="flex-1 flex items-center justify-center bg-gray-50 text-gray-500">
              Home View (Select Bulletin or Padlet)
            </div>
          )}
          {activeTab === 'resources' && (
            <div className="flex-1 flex items-center justify-center bg-gray-50 text-gray-500">
              Resources View
            </div>
          )}
          {activeTab === 'settings' && (
            <div className="flex-1 flex items-center justify-center bg-gray-50 text-gray-500">
              Settings View
            </div>
          )}
        </main>
      </div>
      
      {/* Resizer Handle */}
      <div 
        className="w-1 hover:w-1.5 hover:bg-blue-400 bg-gray-200 cursor-col-resize transition-all z-50 shrink-0 hidden xl:block"
        onMouseDown={() => setIsResizing(true)}
      />
      
      <div ref={sidebarRef} style={{ width: sidebarWidth }} className="shrink-0 hidden xl:block h-full">
        <RightSidebar searchQuery={searchQuery} onEventClick={handleEventClick} />
      </div>
    </div>
  );
}

