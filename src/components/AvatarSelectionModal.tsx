import React, { useRef, useState } from 'react';
import { X, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const MARIOKART_AVATARS = [
  { name: 'Mario', src: '/mariokart/Mario.png' },
  { name: 'Luigi', src: '/mariokart/Luigi.png' },
  { name: 'Peach', src: '/mariokart/peach.png' },
  { name: 'Rosalina', src: '/mariokart/rosalina.png' },
  { name: 'Yoshi', src: '/mariokart/Yoshi.png' },
  { name: 'Bowser', src: '/mariokart/bowser.png' },
  { name: 'Waluigi', src: '/mariokart/waluigi.png' },
  { name: 'Birdo', src: '/mariokart/birdo.png' },
  { name: 'Lakitu', src: '/mariokart/lakitu.png' },
  { name: 'Kamek', src: '/mariokart/kamek.png' },
  { name: 'Link', src: '/mariokart/link.png' },
  { name: 'C.C.', src: '/mariokart/C.C.png' },
  { name: 'Conkdor', src: '/mariokart/Conkdor.png' },
  { name: 'Monty Mole', src: '/mariokart/montymole.png' },
  { name: 'Goku', src: '/mariokart/goku.png' },
];

type Props = {
  isOpen: boolean;
  currentAvatar: string;
  onSelect: (url: string) => void;
  onClose: () => void;
};

export function AvatarSelectionModal({ isOpen, currentAvatar, onSelect, onClose }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleCustomUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      if (data.success) {
        onSelect(data.webViewLink);
      } else {
        alert('Upload failed: ' + data.error);
      }
    } catch (err) {
      console.error('Error uploading avatar:', err);
      alert('Error uploading avatar');
    } finally {
      setIsUploading(false);
    }
    
    // Reset input so the same file can be re-selected
    e.target.value = '';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[101] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Choose your avatar</h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-6">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Mario Kart Characters</p>
              <div className="grid grid-cols-5 gap-3">
                {MARIOKART_AVATARS.map((avatar) => {
                  const isSelected = currentAvatar === avatar.src;
                  return (
                    <button
                      key={avatar.src}
                      onClick={() => onSelect(avatar.src)}
                      className={`group flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-transparent hover:border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="relative w-14 h-14">
                        <img
                          src={avatar.src}
                          alt={avatar.name}
                          className="w-full h-full object-contain rounded-lg"
                        />
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586l-3.293-3.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] font-medium text-gray-600 text-center leading-tight">{avatar.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer – Custom Upload */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCustomUpload}
              />
              <button
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm font-medium text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                {isUploading ? 'Uploading...' : 'Upload custom avatar'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
