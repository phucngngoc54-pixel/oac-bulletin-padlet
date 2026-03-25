import React from 'react';
import { Home, LayoutDashboard, StickyNote, FolderOpen, Settings } from 'lucide-react';
import { cn } from '../lib/utils';

type SidebarProps = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
};

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'bulletin', label: 'Bulletin', icon: LayoutDashboard },
  { id: 'padlet', label: 'Padlet', icon: StickyNote },
  { id: 'resources', label: 'Resources', icon: FolderOpen },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full shrink-0">
      <div className="p-6">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">OAC<span className="text-blue-600">Portal</span></h1>
      </div>
      
      <nav className="flex-1 px-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive 
                  ? "bg-blue-50 text-blue-700" 
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive ? "text-blue-700" : "text-gray-400")} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Offices</p>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center justify-between">
              <span>Hanoi HQ</span>
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
            </div>
            <div className="flex items-center justify-between">
              <span>Saigon Branch</span>
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
