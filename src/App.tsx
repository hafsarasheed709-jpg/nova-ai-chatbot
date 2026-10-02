import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Conversation, Message, Attachment, UserSettings } from './types';
import {
  loadConversations,
  saveConversations,
  loadActiveConversationId,
  saveActiveConversationId,
  loadSettings,
  saveSettings,
} from './utils/storage';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { Composer } from './components/Composer';
import { SettingsModal } from './components/SettingsModal';
import { ImageModal } from './components/ImageModal';
import { cn } from './utils/cn';

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>(() => loadConversations());
  const [activeId, setActiveId] = useState<string | null>(() => loadActiveConversationId());
  const [settings, setSettings] = useState<UserSettings>(() => loadSettings());
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync theme with HTML class
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  }, [settings.theme]);

  // Sync to localStorage
  useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

  useEffect(() => {
    saveActiveConversationId(activeId);
  }, [activeId]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Ensure an active conversation exists
  useEffect(() => {
    if (conversations.length > 0 && !activeId) {
      setActiveId(conversations[0].id);
    } else if (conversations.length === 0) {
      createNewConversation();
    }
  }, [conversations.length, activeId]);

  // Find active conversation
  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === activeId) || null;
  }, [conversations, activeId]);

  // Create a new chat
  const createNewConversation = () => {
    // If active conversation is already empty, just stay on it
    if (activeConversation && activeConversation.messages.length === 0) {
      return activeConversation.id;
    }

    const newId = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newConv: Conversation = {
      id: newId,
      title: 'New Conversation',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      model: settings.model,
    };

    setConversations((prev) => [newConv, ...prev]);
    setActiveId(newId);
    return newId;
  };

  // Keyboard shortcut listener (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        createNewConversation();
      }
      if (e.key === 'Escape') {
        setSettingsModalOpen(false);
        setPreviewAttachment(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeConversation]);

  // Delete conversation
  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => {
      const filtered = prev.filter((c) => c.id !== id);
      if (id === activeId) {
        if (filtered.length > 0) {
          setActiveId(filtered[0].id);
        } else {
          setActiveId(null);
        }
      }
      return filtered;
    });
  };

  // Rename conversation
  const handleRenameConversation = (id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle, updatedAt: Date.now() } : c))
    );
  };

  // Clear current chat
  const handleClearChat = () => {
    if (!activeId) return;
    setConversations((prev) =>
      prev.map((c) => (c.id === activeId ? { ...c, messages: [], updatedAt: Date.now() } : c))
    );
  };

  // Clear all chats
  const handleClearAllConversations = () => {
    setConversations([]);
    setActiveId(null);
  };

  // Stop generating
  const handleStopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);

    // Turn off streaming indicator on last model message
    if (activeId) {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== activeId) return c;
          const updatedMessages = c.messages.map((m, idx) => {
            if (idx === c.messages.length - 1 && m.role === 'model') {
              return { ...m, isStreaming: false };
            }
            return m;
          });
          return { ...c, messages: updatedMessages, updatedAt: Date.now() };
        })
      );
    }
  };

  // Send message
  const handleSendMessage = async (userText: string, attachments: Attachment[]) => {
    let targetConvId = activeId;
    if (!targetConvId || !conversations.some((c) => c.id === targetConvId)) {
      targetConvId = createNewConversation();
    }

    const userMessage: Message = {
      id: `msg_u_${Date.now()}`,
      role: 'user',
      content: userText,
      timestamp: Date.now(),
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    const modelMessageId = `msg_m_${Date.now()}`;
    const initialModelMessage: Message = {
      id: modelMessageId,
      role: 'model',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    };

    // Find the latest messages for this conversation
    const currentConv = conversations.find((c) => c.id === targetConvId);
    const prevMessages = currentConv?.messages || [];
    const isFirstTurn = prevMessages.length === 0;

    // Update conversation state with user message + placeholder model message
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== targetConvId) return c;
        return {
          ...c,
          messages: [...c.messages, userMessage, initialModelMessage],
          updatedAt: Date.now(),
        };
      })
    );

    setIsStreaming(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Trigger auto-title in background if first message
    if (isFirstTurn && settings.autoTitle && userText.trim()) {
      generateTitleInBackground(targetConvId, userText);
    }

    try {
      // Build messages payload for server
      const conversationHistory = [...prevMessages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
        attachments: m.attachments?.map((a) => ({
          name: a.name,
          type: a.type,
          mimeType: a.mimeType,
          data: a.base64,
          text: a.text,
        })),
      }));

      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversationHistory,
          model: settings.model,
          systemInstruction: settings.systemInstruction,
          temperature: settings.temperature,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `Server responded with HTTP ${res.status}`);
      }

      if (!res.body) {
        throw new Error('Readable stream not supported in response.');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulatedText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const jsonStr = trimmed.slice(5).trim();
          if (!jsonStr) continue;

          try {
            const data = JSON.parse(jsonStr);
            if (data.text) {
              accumulatedText += data.text;
              const currentContent = accumulatedText;
              setConversations((prev) =>
                prev.map((c) => {
                  if (c.id !== targetConvId) return c;
                  const updatedMessages = c.messages.map((m) =>
                    m.id === modelMessageId ? { ...m, content: currentContent } : m
                  );
                  return { ...c, messages: updatedMessages, updatedAt: Date.now() };
                })
              );
            }
            if (data.error) {
              setConversations((prev) =>
                prev.map((c) => {
                  if (c.id !== targetConvId) return c;
                  const updatedMessages = c.messages.map((m) =>
                    m.id === modelMessageId ? { ...m, error: data.error, isStreaming: false } : m
                  );
                  return { ...c, messages: updatedMessages, updatedAt: Date.now() };
                })
              );
            }
            if (data.done) {
              // Completed
            }
          } catch (e) {
            // Ignore partial parse
          }
        }
      }

      // Mark model message as finished streaming
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== targetConvId) return c;
          const updatedMessages = c.messages.map((m) =>
            m.id === modelMessageId ? { ...m, isStreaming: false } : m
          );
          return { ...c, messages: updatedMessages, updatedAt: Date.now() };
        })
      );
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Generation stopped by user');
      } else {
        console.error('Error generating chat response:', err);
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== targetConvId) return c;
            const updatedMessages = c.messages.map((m) =>
              m.id === modelMessageId
                ? {
                    ...m,
                    error: err.message || 'Failed to generate response. Please try again.',
                    isStreaming: false,
                  }
                : m
            );
            return { ...c, messages: updatedMessages, updatedAt: Date.now() };
          })
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  // Regenerate last response
  const handleRegenerateResponse = () => {
    if (!activeConversation || isStreaming) return;
    const msgs = activeConversation.messages;
    if (msgs.length === 0) return;

    // Find the last user message
    let lastUserIndex = -1;
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === 'user') {
        lastUserIndex = i;
        break;
      }
    }

    if (lastUserIndex === -1) return;
    const userMsg = msgs[lastUserIndex];

    // Remove everything from lastUserIndex onwards and re-send
    const prunedMessages = msgs.slice(0, lastUserIndex);
    setConversations((prev) =>
      prev.map((c) => (c.id === activeId ? { ...c, messages: prunedMessages } : c))
    );

    // Now send the user message again
    setTimeout(() => {
      handleSendMessage(userMsg.content, userMsg.attachments || []);
    }, 50);
  };

  // Auto-generate title in background
  const generateTitleInBackground = async (convId: string, messageText: string) => {
    try {
      const res = await fetch('/api/chat/title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.title) {
        setConversations((prev) =>
          prev.map((c) => (c.id === convId ? { ...c, title: data.title } : c))
        );
      }
    } catch (e) {
      console.error('Failed to generate title in background', e);
    }
  };

  const fontScaleClass = {
    sm: 'text-xs sm:text-sm',
    md: 'text-sm sm:text-base',
    lg: 'text-base sm:text-lg',
  }[settings.fontSize];

  return (
    <div
      className={cn(
        'flex h-screen w-screen overflow-hidden font-sans select-none bg-[#0b0d13] text-slate-100',
        fontScaleClass
      )}
    >
      {/* Left Sidebar */}
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelectConversation={(id) => setActiveId(id)}
        onNewChat={createNewConversation}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        settings={settings}
        onUpdateSettings={(newSettings) => setSettings((s) => ({ ...s, ...newSettings }))}
        onOpenSettings={() => setSettingsModalOpen(true)}
        isOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
      />

      {/* Main Chat Workspace */}
      <div
        className={cn(
          'flex-1 flex flex-col h-full overflow-hidden transition-all duration-300',
          sidebarOpen ? 'md:ml-80' : 'ml-0'
        )}
      >
        {/* Chat Message Area */}
        <ChatArea
          conversation={activeConversation}
          isStreaming={isStreaming}
          onSendMessage={handleSendMessage}
          onRegenerateResponse={handleRegenerateResponse}
          onClearChat={handleClearChat}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          onSelectImagePreview={(att) => setPreviewAttachment(att)}
          sidebarOpen={sidebarOpen}
        />

        {/* Bottom Composer */}
        <Composer
          onSendMessage={handleSendMessage}
          isStreaming={isStreaming}
          onStopGenerating={handleStopGenerating}
          onSelectImagePreview={(att) => setPreviewAttachment(att)}
          modelName={settings.model}
        />
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        settings={settings}
        onSaveSettings={(newSettings) => setSettings(newSettings)}
        conversations={conversations}
        onClearAllConversations={handleClearAllConversations}
      />

      {/* Image Attachment Lightbox Modal */}
      <ImageModal
        attachment={previewAttachment}
        onClose={() => setPreviewAttachment(null)}
      />
    </div>
  );
}
