import React, { useRef, useEffect, useState } from 'react';
import { Conversation, Message, Attachment, QuickActionItem } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import {
  Sparkles,
  Bot,
  User,
  Copy,
  Check,
  RotateCw,
  Share2,
  Download,
  Trash2,
  Menu,
  BookOpen,
  FileSearch,
  Code2,
  PenTool,
  Lightbulb,
  Cpu,
  AlertCircle,
  Maximize2,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { exportChatToMarkdown } from '../utils/storage';
import { formatFileSize } from '../utils/fileHelpers';

interface ChatAreaProps {
  conversation: Conversation | null;
  isStreaming: boolean;
  onSendMessage: (content: string, attachments: Attachment[]) => void;
  onRegenerateResponse: () => void;
  onClearChat: () => void;
  onToggleSidebar: () => void;
  onSelectImagePreview: (att: Attachment) => void;
  sidebarOpen: boolean;
}

const QUICK_ACTIONS: QuickActionItem[] = [
  {
    id: 'explain',
    title: 'Explain something',
    description: 'Break down complex concepts simply',
    prompt: 'Explain the concept of quantum computing and superposition using a clear everyday analogy and real-world applications.',
    iconName: 'lightbulb',
    badge: 'Concepts',
  },
  {
    id: 'study',
    title: 'Help me study',
    description: 'Master new topics with active recall',
    prompt: 'Help me study: Create a 5-question multiple choice quiz on Machine Learning fundamentals with detailed answer explanations.',
    iconName: 'book',
    badge: 'Education',
  },
  {
    id: 'write',
    title: 'Write for me',
    description: 'Draft emails, articles, and proposals',
    prompt: 'Write a compelling, professional launch announcement email for a high-tech modern AI product called NOVA AI.',
    iconName: 'pen',
    badge: 'Creative',
  },
  {
    id: 'code',
    title: 'Help me code',
    description: 'Debug, refactor, and build software',
    prompt: 'Help me code: Write a clean, production-ready TypeScript implementation of an LRU Cache with full type annotations and test cases.',
    iconName: 'code',
    badge: 'Engineering',
  },
  {
    id: 'analyze',
    title: 'Analyze a document',
    description: 'Extract insights, pros/cons, and summaries',
    prompt: 'How can you help me analyze documents? Outline the best way to upload files (PDFs, CSVs, code) and the types of insights you can extract.',
    iconName: 'file',
    badge: 'Analysis',
  },
  {
    id: 'brainstorm',
    title: 'Brainstorm ideas',
    description: 'Generate fresh angles and creative solutions',
    prompt: 'Brainstorm 5 innovative, high-impact product ideas that leverage multimodal AI for personal productivity in 2026.',
    iconName: 'cpu',
    badge: 'Strategy',
  },
];

export const ChatArea: React.FC<ChatAreaProps> = ({
  conversation,
  isStreaming,
  onSendMessage,
  onRegenerateResponse,
  onClearChat,
  onToggleSidebar,
  onSelectImagePreview,
  sidebarOpen,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  const messages = conversation?.messages || [];
  const hasMessages = messages.length > 0;

  // Auto-scroll to bottom as messages stream
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: isStreaming ? 'auto' : 'smooth' });
  }, [messages, isStreaming]);

  const handleCopyMessage = async (msgId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMsgId(msgId);
      setTimeout(() => setCopiedMsgId(null), 2000);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  const getQuickActionIcon = (iconName: string) => {
    switch (iconName) {
      case 'lightbulb':
        return <Lightbulb className="w-5 h-5 text-amber-400" />;
      case 'book':
        return <BookOpen className="w-5 h-5 text-emerald-400" />;
      case 'pen':
        return <PenTool className="w-5 h-5 text-purple-400" />;
      case 'code':
        return <Code2 className="w-5 h-5 text-cyan-400" />;
      case 'file':
        return <FileSearch className="w-5 h-5 text-blue-400" />;
      case 'cpu':
        return <Cpu className="w-5 h-5 text-pink-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#0b0d13]">
      {/* Top Header Bar */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08] bg-[#0d1017]/80 backdrop-blur-md z-10 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onToggleSidebar}
            className="p-1.5 -ml-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            title={sidebarOpen ? 'Collapse sidebar' : 'Open sidebar'}
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-sm font-semibold text-white truncate max-w-[200px] sm:max-w-md">
              {conversation?.title || 'New Conversation'}
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Online
            </span>
          </div>
        </div>

        {/* Header Action Tools */}
        {hasMessages && conversation && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => exportChatToMarkdown(conversation)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
              title="Export as Markdown"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClearChat}
              className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-white/5 transition-colors"
              title="Clear conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </header>

      {/* Main Chat Scroll Container */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        <div className="max-w-4xl mx-auto space-y-6">
          {!hasMessages ? (
            /* Empty State: "How can I help you today?" + 6 Quick Actions */
            <div className="flex flex-col items-center justify-center min-h-[60vh] py-8 text-center animate-in fade-in duration-500">
              {/* NOVA AI Hero Icon */}
              <div className="relative mb-6">
                <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-purple-500/20 blur-xl animate-pulse" />
                <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#121927] to-[#1c2438] border border-cyan-500/30 shadow-2xl shadow-cyan-500/20">
                  <Sparkles className="w-8 h-8 text-cyan-400 animate-pulse" />
                </div>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
                How can I help you today?
              </h2>
              <p className="text-sm text-slate-400 max-w-lg mb-8 leading-relaxed">
                Supercharged intelligence with real-time Google Gemini streaming, image vision, and deep document analysis.
              </p>

              {/* 6 Quick Action Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full max-w-3xl text-left">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => onSendMessage(action.prompt, [])}
                    className="group relative flex flex-col p-4 rounded-2xl bg-[#12151e]/80 hover:bg-[#181d2a] border border-white/[0.08] hover:border-cyan-500/40 shadow-sm hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-200 cursor-pointer text-left active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 rounded-xl bg-white/[0.04] group-hover:bg-cyan-500/10 transition-colors">
                        {getQuickActionIcon(action.iconName)}
                      </div>
                      {action.badge && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/[0.05] text-slate-400 group-hover:text-cyan-300 group-hover:bg-cyan-500/10 transition-colors">
                          {action.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-white group-hover:text-cyan-200 transition-colors">
                      {action.title}
                    </span>
                    <span className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {action.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Messages Stream */
            messages.map((message, index) => {
              const isUser = message.role === 'user';
              const isLastModel = !isUser && index === messages.length - 1;

              return (
                <div
                  key={message.id}
                  className={cn(
                    'group flex gap-3 sm:gap-4 transition-opacity',
                    isUser ? 'justify-end' : 'justify-start'
                  )}
                >
                  {/* Model Avatar */}
                  {!isUser && (
                    <div className="relative shrink-0 flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 shadow-md shadow-cyan-500/20 text-white mt-1">
                      <Sparkles className="w-4 h-4" />
                      <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/30" />
                    </div>
                  )}

                  {/* Message Bubble Body */}
                  <div
                    className={cn(
                      'flex flex-col max-w-[92%] sm:max-w-[85%] rounded-2xl text-sm sm:text-[15px]',
                      isUser
                        ? 'items-end bg-gradient-to-r from-cyan-600/90 to-indigo-600/90 text-white px-4 py-3 rounded-tr-xs shadow-md shadow-cyan-900/20'
                        : 'items-start bg-[#121622]/90 border border-white/[0.08] text-slate-200 px-4 sm:px-5 py-3.5 rounded-tl-xs shadow-sm w-full'
                    )}
                  >
                    {/* User attachments preview */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3 w-full">
                        {message.attachments.map((att) => (
                          <div
                            key={att.id}
                            className="relative group/att overflow-hidden rounded-xl border border-white/15 bg-black/30"
                          >
                            {att.type === 'image' && att.dataUrl ? (
                              <div
                                onClick={() => onSelectImagePreview(att)}
                                className="relative cursor-pointer"
                              >
                                <img
                                  src={att.dataUrl}
                                  alt={att.name}
                                  className="h-28 sm:h-36 max-w-full rounded-xl object-cover hover:scale-105 transition-transform duration-200"
                                />
                                <div className="absolute inset-0 bg-black/0 hover:bg-black/30 flex items-center justify-center transition-colors">
                                  <Maximize2 className="w-5 h-5 text-white opacity-0 group-hover/att:opacity-100 transition-opacity" />
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 px-3 py-2 text-xs">
                                <div className="w-6 h-6 rounded bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-mono font-bold text-[10px]">
                                  DOC
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-medium text-white truncate max-w-[140px]">
                                    {att.name}
                                  </span>
                                  <span className="text-[10px] text-slate-300">
                                    {formatFileSize(att.size)}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Content */}
                    {isUser ? (
                      <div className="whitespace-pre-wrap leading-relaxed select-text font-normal">
                        {message.content}
                      </div>
                    ) : (
                      <div className="w-full select-text">
                        {message.error ? (
                          <div className="flex items-start gap-2 text-red-400 bg-red-950/30 border border-red-500/20 p-3 rounded-xl text-xs sm:text-sm">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <p className="font-semibold">Generation encountered an issue</p>
                              <p className="text-slate-300">{message.error}</p>
                            </div>
                          </div>
                        ) : (
                          <MarkdownRenderer
                            content={message.content}
                            isStreaming={message.isStreaming}
                          />
                        )}
                      </div>
                    )}

                    {/* AI Message Footer Tools: Copy, Regenerate */}
                    {!isUser && !message.isStreaming && message.content && (
                      <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-white/[0.06] w-full text-slate-400 text-xs">
                        <button
                          onClick={() => handleCopyMessage(message.id, message.content)}
                          className="flex items-center gap-1 px-2 py-1 rounded-md hover:text-white hover:bg-white/5 transition-colors"
                          title="Copy response"
                        >
                          {copiedMsgId === message.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400 text-[11px]">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span className="text-[11px]">Copy</span>
                            </>
                          )}
                        </button>

                        {isLastModel && (
                          <button
                            onClick={onRegenerateResponse}
                            disabled={isStreaming}
                            className="flex items-center gap-1 px-2 py-1 rounded-md hover:text-cyan-300 hover:bg-white/5 transition-colors"
                            title="Regenerate response"
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                            <span className="text-[11px]">Regenerate</span>
                          </button>
                        )}

                        <span className="ml-auto text-[10px] text-slate-400 font-mono">
                          {new Date(message.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* User Avatar */}
                  {isUser && (
                    <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-xl bg-slate-800 border border-white/10 text-cyan-300 mt-1">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
};
