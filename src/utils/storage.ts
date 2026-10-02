import { Conversation, UserSettings } from '../types';

const CONVERSATIONS_KEY = 'nova_conversations_v1';
const ACTIVE_CONV_KEY = 'nova_active_conversation_id';
const SETTINGS_KEY = 'nova_user_settings_v1';

export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'dark',
  model: 'gemini-3.8-flash',
  systemInstruction: 'You are NOVA AI, a high-intelligence, modern cognitive assistant powered by Google Gemini.\nYou provide precise, insightful, and beautifully structured responses with markdown formatting.\nBe helpful, concise yet thorough, and friendly.',
  temperature: 0.7,
  fontSize: 'md',
  autoTitle: true,
};

export function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(CONVERSATIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to load conversations from localStorage', e);
    return [];
  }
}

export function saveConversations(conversations: Conversation[]) {
  try {
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
  } catch (e) {
    console.error('Failed to save conversations to localStorage', e);
  }
}

export function loadActiveConversationId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_CONV_KEY);
  } catch {
    return null;
  }
}

export function saveActiveConversationId(id: string | null) {
  try {
    if (id) {
      localStorage.setItem(ACTIVE_CONV_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_CONV_KEY);
    }
  } catch (e) {
    console.error('Failed to save active conversation id', e);
  }
}

export function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: UserSettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings', e);
  }
}

export function exportConversationsToJSON(conversations: Conversation[]) {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(conversations, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `nova_ai_conversations_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function exportChatToMarkdown(conversation: Conversation) {
  let md = `# ${conversation.title}\n\n*Created on ${new Date(conversation.createdAt).toLocaleString()}*\n\n---\n\n`;
  for (const msg of conversation.messages) {
    const author = msg.role === 'user' ? '### 👤 User' : '### ✦ NOVA AI';
    md += `${author}\n\n${msg.content}\n\n`;
    if (msg.attachments && msg.attachments.length > 0) {
      md += `*Attachments:* ${msg.attachments.map(a => a.name).join(', ')}\n\n`;
    }
    md += `---\n\n`;
  }

  const dataStr = 'data:text/markdown;charset=utf-8,' + encodeURIComponent(md);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `${conversation.title.replace(/[^a-z0-9_-]/gi, '_')}.md`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
