import React, { useState, useRef } from 'react';
import { User, MOCK_USERS } from '../data/mockData';

export const MentionTextarea = ({ 
  value, 
  onChange, 
  placeholder = "Type @ to mention...",
  className = "",
  rows = 4,
  onKeyDown
}: { 
  value: string, 
  onChange: (v: string) => void,
  placeholder?: string,
  className?: string,
  rows?: number,
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionQuery, setSuggestionQuery] = useState('');
  const [cursorPos, setCursorPos] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    onChange(val);
    
    const pos = e.target.selectionStart;
    setCursorPos(pos);

    const textBeforeCursor = val.substring(0, pos);
    const match = textBeforeCursor.match(/@(\w*)$/);
    if (match) {
      setSuggestionQuery(match[1]);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions) {
      if (e.key === 'Enter') {
        e.preventDefault();
        const users = MOCK_USERS.filter(u => u.name.toLowerCase().includes(suggestionQuery.toLowerCase()));
        if (users.length > 0) {
          insertMention(users[0]);
        }
        return;
      }
    }
    if (onKeyDown) {
      onKeyDown(e);
    }
  };

  const insertMention = (user: User) => {
    const textBeforeCursor = value.substring(0, cursorPos);
    const textAfterCursor = value.substring(cursorPos);
    const match = textBeforeCursor.match(/@(\w*)$/);
    if (match) {
      const newTextBefore = textBeforeCursor.substring(0, match.index) + `@${user.name} `;
      onChange(newTextBefore + textAfterCursor);
      setShowSuggestions(false);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.selectionStart = newTextBefore.length;
          textareaRef.current.selectionEnd = newTextBefore.length;
        }
      }, 0);
    }
  };

  const renderHighlightedText = () => {
    const names = MOCK_USERS.map(u => `@${u.name}`);
    if (names.length === 0) return <span>{value}</span>;
    
    const escapedNames = names.map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp(`(${escapedNames.join('|')})`, 'g');
    const parts = value.split(regex);
    
    return parts.map((part, i) => {
      if (names.includes(part)) {
        return <span key={i} className="font-bold text-blue-600 bg-blue-50 px-1 rounded">{part}</span>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="relative">
      <div 
        className={`absolute inset-0 px-3 py-2 text-sm whitespace-pre-wrap break-words pointer-events-none border border-transparent font-sans ${className}`}
        aria-hidden="true"
      >
        {renderHighlightedText()}
        {value.endsWith('\n') ? <br /> : null}
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        onClick={(e) => setCursorPos(e.currentTarget.selectionStart)}
        onKeyUp={(e) => setCursorPos(e.currentTarget.selectionStart)}
        onKeyDown={handleKeyDown}
        rows={rows}
        className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-transparent text-transparent caret-black font-sans m-0 ${className}`}
        placeholder={placeholder}
        style={{ color: 'transparent' }}
        spellCheck={false}
      />
      {showSuggestions && (
        <div className="absolute z-10 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 w-64 max-h-48 overflow-y-auto">
          {MOCK_USERS.filter(u => u.name.toLowerCase().includes(suggestionQuery.toLowerCase())).map(user => (
            <div 
              key={user.id} 
              className="px-3 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2"
              onClick={() => insertMention(user)}
            >
              <img src={user.avatar} className="w-6 h-6 rounded-full" />
              <span className="text-sm font-medium">{user.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const renderDescriptionWithMentions = (text: string) => {
  const names = MOCK_USERS.map(u => `@${u.name}`);
  if (names.length === 0) return text;
  
  const escapedNames = names.map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escapedNames.join('|')})`, 'g');
  const parts = text.split(regex);
  
  return parts.map((part, i) => {
    if (names.includes(part)) {
      return <span key={i} className="font-bold text-blue-600 bg-blue-50 px-1 rounded">{part}</span>;
    }
    return <span key={i}>{part}</span>;
  });
};
