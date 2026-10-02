import React, { useState, useMemo } from 'react';
import { Conversation, UserSettings } from '../types';
import {
  Plus,
  Search,
  MessageSquare,
  Trash2,
  Edit3,
  Check,
  X,
  Settings as SettingsIcon,
  Sun,
  Moon,
  Sparkles,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import { cn } from '../utils/cn';

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onOpenSettings: () => void;
  isOpen: boolean;
  onToggleSidebar: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation,
  settings,
  onUpdateSettings,
  onOpenSettings,
  isOpen,
  onToggleSidebar,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  // Start editing
  const handleStartRename = (e: React.MouseEvent, conv: Conversation) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  // Save rename
  const handleSaveRename = (e: React.MouseEvent | React.FormEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  // Cancel rename
  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  // Group conversations by relative time
  const groupedConversations = useMemo(() => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const sevenDays = 7 * oneDay;

    const filtered = conversations.filter((c) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const inTitle = c.title.toLowerCase().includes(q);
      const inMessages = c.messages.some((m) => m.content.toLowerCase().includes(q));
      return inTitle || inMessages;
    });

    // Sort newest first
    const sorted = [...filtered].sort((a, b) => b.updatedAt - a.updatedAt);

    const groups: { [key: string]: Conversation[] } = {
      Today: [],
      Yesterday: [],
      'Previous 7 Days': [],
      Older: [],
    };

    sorted.forEach((conv) => {
      const diff = now - conv.updatedAt;
      if (diff < oneDay) {
        groups['Today'].push(conv);
      } else if (diff < 2 * oneDay) {
        groups['Yesterday'].push(conv);
      } else if (diff < sevenDays) {
        groups['Previous 7 Days'].push(conv);
      } else {
        groups['Older'].push(conv);
      }
    });

    return groups;
  }, [conversations, searchQuery]);

  const toggleTheme = () => {
    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
    onUpdateSettings({ theme: nextTheme });
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onToggleSidebar}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col w-72 md:w-80 bg-[#0e1117] border-r border-white/[0.08] transition-all duration-300 ease-in-out select-none',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-0 md:border-r-0 md:overflow-hidden'
        )}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-500 shadow-md shadow-cyan-500/20">
              <Sparkles className="w-4 h-4 text-white animate-pulse" />
              <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-white/30" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold tracking-wider text-base text-white">NOVA</span>
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  AI
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono tracking-tight">
                {settings.model === 'gemini-3.1-flash-lite' ? 'Gemini 3.1 Flash Lite' : 'Gemini 3.8 Flash'}
              </p>
            </div>
          </div>

          <button
            onClick={onToggleSidebar}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            title="Collapse Sidebar"
          >
            <PanelLeftClose className="w-5 h-5" />
          </button>
        </div>

        {/* New Chat & Search Bar */}
        <div className="p-3 space-y-2 border-b border-white/[0.06]">
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) onToggleSidebar();
            }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500/15 via-indigo-500/15 to-purple-500/15 border border-cyan-500/30 hover:border-cyan-400/60 text-white font-medium text-sm shadow-sm hover:shadow-cyan-500/10 active:scale-[0.98] transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1 rounded-md bg-cyan-500/20 text-cyan-300 group-hover:bg-cyan-500 group-hover:text-black transition-colors">
                <Plus className="w-4 h-4" />
              </div>
              <span>New Conversation</span>
            </div>
            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-slate-400">
              ⌘K
            </span>
          </button>

          {/* Search box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] focus:border-cyan-500/50 focus:bg-white/[0.07] text-xs text-white placeholder-slate-400 outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Conversations History List */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center text-slate-400 text-xs">
              <MessageSquare className="w-8 h-8 text-slate-500 mb-2 stroke-[1.5]" />
              <p className="font-medium text-slate-300">No conversations yet</p>
              <p className="mt-1 text-[11px] text-slate-500">
                Start a new chat to begin exploring with NOVA AI.
              </p>
            </div>
          ) : (
            Object.entries(groupedConversations).map(([groupTitle, list]) => {
              if (list.length === 0) return null;
              return (
                <div key={groupTitle} className="space-y-1">
                  <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    {groupTitle}
                  </div>
                  <div className="space-y-0.5">
                    {list.map((conv) => {
                      const isActive = conv.id === activeId;
                      const isEditing = editingId === conv.id;

                      return (
                        <div
                          key={conv.id}
                          onClick={() => {
                            if (!isEditing) {
                              onSelectConversation(conv.id);
                              if (window.innerWidth < 768) onToggleSidebar();
                            }
                          }}
                          className={cn(
                            'group relative flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all',
                            isActive
                              ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/10 text-cyan-200 border border-cyan-500/40 shadow-xs'
                              : 'text-slate-300 hover:bg-white/[0.05] hover:text-white border border-transparent'
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <MessageSquare
                              className={cn(
                                'w-4 h-4 shrink-0 transition-colors',
                                isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-300'
                              )}
                            />

                            {isEditing ? (
                              <form
                                onSubmit={(e) => handleSaveRename(e, conv.id)}
                                className="flex items-center gap-1 flex-1 mr-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <input
                                  type="text"
                                  value={editTitle}
                                  onChange={(e) => setEditTitle(e.target.value)}
                                  autoFocus
                                  className="w-full px-1.5 py-0.5 rounded bg-black/60 border border-cyan-400 text-xs text-white outline-none"
                                />
                                <button
                                  type="submit"
                                  className="p-1 text-emerald-400 hover:bg-white/10 rounded"
                                  title="Save"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancelRename}
                                  className="p-1 text-slate-400 hover:bg-white/10 rounded"
                                  title="Cancel"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </form>
                            ) : (
                              <span className="truncate text-left">{conv.title || 'Untitled Chat'}</span>
                            )}
                          </div>

                          {/* Action icons on hover */}
                          {!isEditing && (
                            <div className="hidden group-hover:flex items-center gap-1 ml-1 shrink-0">
                              <button
                                onClick={(e) => handleStartRename(e, conv)}
                                className="p-1 text-slate-400 hover:text-cyan-300 hover:bg-white/10 rounded transition-colors"
                                title="Rename"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteConversation(conv.id);
                                }}
                                className="p-1 text-slate-400 hover:text-red-400 hover:bg-white/10 rounded transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-white/[0.06] bg-[#0c0e14] flex items-center justify-between gap-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all"
            title={`Switch to ${settings.theme === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            {settings.theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span>Light</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-400" />
                <span>Dark</span>
              </>
            )}
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all"
            title="Settings"
          >
            <SettingsIcon className="w-4 h-4 text-cyan-400" />
            <span>Settings</span>
          </button>
        </div>
      </aside>
    </>
  );
};
