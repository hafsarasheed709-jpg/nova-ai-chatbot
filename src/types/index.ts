export interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'file';
  size: number;
  mimeType: string;
  dataUrl?: string; // for rendering image thumbnails
  base64?: string; // raw base64 string for API
  text?: string; // extracted text content for documents
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  attachments?: Attachment[];
  isStreaming?: boolean;
  error?: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
  systemInstruction?: string;
  temperature?: number;
  model?: string;
}

export interface UserSettings {
  theme: 'dark' | 'light' | 'system';
  model: string;
  systemInstruction: string;
  temperature: number;
  fontSize: 'sm' | 'md' | 'lg';
  autoTitle: boolean;
}

export interface QuickActionItem {
  id: string;
  title: string;
  description: string;
  prompt: string;
  iconName: string;
  badge?: string;
}
