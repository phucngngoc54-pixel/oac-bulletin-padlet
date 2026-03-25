import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent, Mark, mergeAttributes } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import { Bold, Italic, Strikethrough, Underline as UnderlineIcon, Heading1, Quote, Palette } from 'lucide-react';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

// Simple plugin to highlight @mentions in the editor
const MentionHighlightPlugin = new Plugin({
  key: new PluginKey('mentionHighlight'),
  state: {
    init() {
      return DecorationSet.empty;
    },
    apply(tr, oldSet) {
      const decorations: Decoration[] = [];
      const doc = tr.doc;
      
      doc.descendants((node, pos) => {
        if (node.isText && node.text) {
          const regex = /@(\w+)/g;
          let match;
          while ((match = regex.exec(node.text)) !== null) {
            decorations.push(
              Decoration.inline(pos + match.index, pos + match.index + match[0].length, {
                class: 'text-blue-600 font-bold',
              })
            );
          }
        }
      });
      
      return DecorationSet.create(doc, decorations);
    },
  },
  props: {
    decorations(state) {
      return this.getState(state);
    },
  },
});

import { Extension } from '@tiptap/react';

const MentionHighlightExtension = Extension.create({
  name: 'mentionHighlight',
  addProseMirrorPlugins() {
    return [MentionHighlightPlugin];
  },
});

export function TiptapEditor({ content, onChange }: { content: string, onChange: (html: string) => void }) {
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPos, setSlashMenuPos] = useState({ top: 0, left: 0 });
  const [showColorPicker, setShowColorPicker] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        blockquote: {
          HTMLAttributes: {
            class: 'border-l-4 border-[#4B4B4B] pl-4 italic text-gray-700 my-4',
          },
        },
        heading: {
          levels: [1],
          HTMLAttributes: {
            class: 'text-2xl font-bold mt-4 mb-2',
          },
        },
      }),
      Placeholder.configure({
        placeholder: "Type '/' for commands...",
      }),
      TextStyle,
      Color,
      Underline,
      MentionHighlightExtension as any,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
      
      const { state, view } = editor;
      const { selection } = state;
      const { $head } = selection;
      
      // Check if the text before cursor ends with '/'
      const textBefore = $head.parent.textContent.slice(0, $head.parentOffset);
      if (textBefore.endsWith('/')) {
        const coords = view.coordsAtPos(selection.from);
        setSlashMenuPos({ top: coords.bottom, left: coords.left });
        setShowSlashMenu(true);
      } else {
        setShowSlashMenu(false);
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[150px] p-4',
      },
    },
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowSlashMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!editor) {
    return null;
  }

  const setTextColor = (color: string) => {
    editor.chain().focus().setColor(color).run();
    setShowColorPicker(false);
  };

  const executeCommand = (type: 'heading' | 'quote') => {
    if (!editor) return;
    
    // Delete the '/' character
    editor.chain().focus().deleteRange({ from: editor.state.selection.from - 1, to: editor.state.selection.from }).run();
    
    if (type === 'heading') {
      editor.chain().focus().setNode('heading', { level: 1 }).run();
    } else if (type === 'quote') {
      editor.chain().focus().setNode('blockquote').run();
    }
    setShowSlashMenu(false);
  };

  return (
    <div className="relative border border-gray-200 rounded-xl bg-white/50 backdrop-blur-sm overflow-visible">
      <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-white/80 rounded-t-xl">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded hover:bg-gray-100 ${editor.isActive('bold') ? 'bg-gray-200' : ''}`}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded hover:bg-gray-100 ${editor.isActive('italic') ? 'bg-gray-200' : ''}`}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded hover:bg-gray-100 ${editor.isActive('underline') ? 'bg-gray-200' : ''}`}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-1.5 rounded hover:bg-gray-100 ${editor.isActive('strike') ? 'bg-gray-200' : ''}`}
          title="Strikethrough (Ctrl+S)"
        >
          <Strikethrough className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-gray-300 mx-1" />
        <div className="relative">
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="p-1.5 rounded hover:bg-gray-100 flex items-center gap-1"
            title="Text Color"
          >
            <Palette className="w-4 h-4" />
          </button>
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-gray-200 rounded-lg shadow-xl flex gap-1 z-50">
              {['#000000', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'].map(color => (
                <button
                  key={color}
                  onClick={() => setTextColor(color)}
                  className="w-6 h-6 rounded-full border border-gray-200"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <EditorContent editor={editor} />
      
      {showSlashMenu && (
        <div 
          ref={menuRef}
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-xl py-1 w-48"
          style={{ top: slashMenuPos.top + 5, left: slashMenuPos.left }}
        >
          <button
            className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm text-gray-700"
            onClick={() => executeCommand('heading')}
          >
            <Heading1 className="w-4 h-4" /> Heading 1
          </button>
          <button
            className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm text-gray-700"
            onClick={() => executeCommand('quote')}
          >
            <Quote className="w-4 h-4" /> Quote
          </button>
        </div>
      )}
    </div>
  );
}
