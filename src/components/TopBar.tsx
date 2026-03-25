import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, MessageCircle, Calendar, Heart, User, LogOut, Settings, ChevronDown } from 'lucide-react';
import { MOCK_USERS, Notification, MOCK_NOTIFICATIONS } from '../data/mockData';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { AvatarSelectionModal } from './AvatarSelectionModal';
import { useAppContext } from '../context/AppContext';
import { markNotificationRead } from '../api/gasApi';

type TopBarProps = {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setActiveTab: (tab: string) => void;
  currentUserAvatar: string;
  setCurrentUserAvatar: (url: string) => void;
};

export function TopBar({ searchQuery, setSearchQuery, setActiveTab, currentUserAvatar, setCurrentUserAvatar }: TopBarProps) {
  const currentUser = MOCK_USERS[0];
  const { notifications, refreshData } = useAppContext();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  const [localNotifications, setLocalNotifications] = useState(notifications || []);
  useEffect(() => {
    setLocalNotifications(notifications);
  }, [notifications]);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const unreadCount = localNotifications.filter(n => !n.read).length;

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'mention': return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'assignment': return <Calendar className="w-4 h-4 text-green-500" />;
      case 'engagement': return <Heart className="w-4 h-4 text-red-500" />;
      default: return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const handleSelectAvatar = (url: string) => {
    setCurrentUserAvatar(url);
    setShowAvatarModal(false);
  };

  const profileMenuItems = [
    {
      icon: User,
      label: 'View Profile',
      onClick: () => { setShowProfileMenu(false); },
      divider: false,
    },
    {
      icon: Settings,
      label: 'Settings',
      onClick: () => { setActiveTab('settings'); setShowProfileMenu(false); },
      divider: false,
    },
    {
      // Custom trigger item for avatar
      icon: null,
      label: 'Change Avatar',
      onClick: () => { setShowProfileMenu(false); setShowAvatarModal(true); },
      isAvatar: true,
      divider: true,
    },
    {
      icon: LogOut,
      label: 'Sign out',
      onClick: () => { setShowProfileMenu(false); },
      divider: false,
      danger: true,
    },
  ];

  return (
    <>
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0 relative z-50">
        {/* Search */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search across OAC..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 ml-8">
          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button
              className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
              onClick={() => { setShowNotifications(!showNotifications); setShowProfileMenu(false); }}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                  {unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50"
                >
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900">Notifications</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={async () => {
                          const unread = localNotifications.filter(n => !n.read);
                          
                          // Optimistic UI update
                          setLocalNotifications(localNotifications.map(n => ({ ...n, read: true })));
                          
                          try {
                            await Promise.all(unread.map(n => markNotificationRead(n.id)));
                            refreshData();
                          } catch (e) {
                            console.error(e);
                            setLocalNotifications(notifications);
                          }
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-[400px] overflow-y-auto">
                    {localNotifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-500 text-sm">
                        No notifications yet
                      </div>
                    ) : (
                      localNotifications.map(notification => {
                        const actor = MOCK_USERS.find(u => u.id === notification.actorId);
                        return (
                          <div
                            key={notification.id}
                            onClick={async () => {
                              if (!notification.read) {
                                // Optimistic update
                                setLocalNotifications(localNotifications.map(n => 
                                  n.id === notification.id ? { ...n, read: true } : n
                                ));
                                
                                try {
                                  await markNotificationRead(notification.id);
                                  refreshData();
                                } catch (e) {
                                  console.error(e);
                                  setLocalNotifications(notifications);
                                }
                              }
                            }}
                            className={`p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors flex gap-3 ${!notification.read ? 'bg-blue-50/50' : ''}`}
                          >
                            <div className="relative shrink-0">
                              <img src={actor?.avatar} alt={actor?.name} className="w-10 h-10 rounded-full bg-gray-100" />
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100">
                                {getNotificationIcon(notification.type)}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-900 leading-snug">
                                <span className="font-bold">{actor?.name}</span> {notification.message}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatDistanceToNow(parseISO(notification.timestamp), { addSuffix: true })}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1.5" />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile Section */}
          <div className="relative pl-4 border-l border-gray-200" ref={profileRef}>
            <button
              onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); }}
              className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium text-gray-900">{currentUser.name}</p>
                <p className="text-xs text-gray-500">{currentUser.role}</p>
              </div>
              <div className="relative shrink-0">
                <img
                  src={currentUserAvatar}
                  alt={currentUser.name}
                  className="w-9 h-9 rounded-full bg-gray-100 border-2 border-white shadow-sm object-cover"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-white rounded-full" />
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform hidden md:block ${showProfileMenu ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50"
                >
                  {/* User identity header */}
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50">
                    <img
                      src={currentUserAvatar}
                      alt={currentUser.name}
                      className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{currentUser.name}</p>
                      <p className="text-xs text-gray-500 truncate">{currentUser.role}</p>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="py-1">
                    {profileMenuItems.map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <React.Fragment key={idx}>
                          {item.divider && <div className="my-1 border-t border-gray-100" />}
                          <button
                            onClick={item.onClick}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left ${
                              (item as any).danger
                                ? 'text-red-600 hover:bg-red-50'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {(item as any).isAvatar ? (
                              <span className="flex items-center gap-2">
                                <img
                                  src={currentUserAvatar}
                                  alt="avatar"
                                  className="w-5 h-5 rounded-full object-cover border border-gray-200"
                                />
                                Change Avatar
                              </span>
                            ) : (
                              <>
                                {Icon && <Icon className="w-4 h-4 shrink-0" />}
                                {item.label}
                              </>
                            )}
                          </button>
                        </React.Fragment>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Avatar Selection Modal – rendered outside header so z-index stacks correctly */}
      <AvatarSelectionModal
        isOpen={showAvatarModal}
        currentAvatar={currentUserAvatar}
        onSelect={handleSelectAvatar}
        onClose={() => setShowAvatarModal(false)}
      />
    </>
  );
}
