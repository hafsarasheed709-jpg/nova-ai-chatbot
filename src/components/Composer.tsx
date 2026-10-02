import React, { useState, useRef, useEffect } from 'react';
import { Attachment } from '../types';
import {
  ArrowUp,
  Square,
  Paperclip,
  Image as ImageIcon,
  X,
  FileText,
  FileCode,
  Sparkles,
} from 'lucide-react';
import { processFile, formatFileSize } from '../utils/fileHelpers';
import { cn } from '../utils/cn';

interface ComposerProps {
  onSendMessage: (content: string, attachments: Attachment[]) => void;
  isStreaming: boolean;
  onStopGenerating: () => void;
  onSelectImagePreview?: (att: Attachment) => void;
  placeholder?: string;
  modelName?: string;
}

export const Composer: React.FC<ComposerProps> = ({
  onSendMessage,
  isStreaming,
  onStopGenerating,
  onSelectImagePreview,
  placeholder = 'Ask NOVA AI anything, upload documents, or share images...',
  modelName = 'gemini-3.8-flash',
}) => {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      // Max height approx 180px
      textareaRef.current.style.height = `${Math.min(scrollHeight, 180)}px`;
    }
  }, [content]);

  // Handle file uploads
  const handleFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setIsProcessingFiles(true);

    try {
      const processed: Attachment[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 20 * 1024 * 1024) {
          alert(`File "${file.name}" exceeds the 20MB limit.`);
          continue;
        }
        const att = await processFile(file);
        processed.push(att);
      }
      setAttachments((prev) => [...prev, ...processed]);
    } catch (err) {
      console.error('Error handling files', err);
    } finally {
      setIsProcessingFiles(false);
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isStreaming) {
      onStopGenerating();
      return;
    }

    const trimmed = content.trim();
    if (!trimmed && attachments.length === 0) return;

    onSendMessage(trimmed, attachments);
    setContent('');
    setAttachments([]);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Drag and drop support
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFiles(e.dataTransfer.files);
    }
  };

  const hasInput = content.trim().length > 0 || attachments.length > 0;

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative w-full max-w-4xl mx-auto px-4 pb-4 pt-1"
    >
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".txt,.md,.markdown,.json,.csv,.tsv,.pdf,.py,.js,.ts,.tsx,.html,.css,.yaml,.yml,.xml"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
          e.target.value = '';
        }}
        className="hidden"
      />
      <input
        ref={imageInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
          e.target.value = '';
        }}
        className="hidden"
      />

      {/* Drag & drop visual overlay */}
      {isDragging && (
        <div className="absolute inset-0 mx-4 mb-4 z-20 flex flex-col items-center justify-center rounded-2xl bg-cyan-950/80 border-2 border-dashed border-cyan-400 backdrop-blur-xs text-cyan-200 pointer-events-none animate-in fade-in zoom-in-95">
          <Sparkles className="w-8 h-8 text-cyan-300 animate-spin mb-2" />
          <p className="text-sm font-semibold">Drop files here to analyze with NOVA</p>
          <p className="text-xs text-cyan-400/80 mt-1">Images, PDFs, documents, or code</p>
        </div>
      )}

      {/* Composer Card */}
      <div className="relative rounded-2xl bg-[#141822]/95 border border-white/[0.1] hover:border-white/[0.16] shadow-xl shadow-black/40 backdrop-blur-md transition-all focus-within:border-cyan-500/50 focus-within:ring-1 focus-within:ring-cyan-500/30">
        
        {/* Attachment Previews Strip */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 p-3 border-b border-white/[0.06] bg-white/[0.02]">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="group relative flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-white/10 text-xs text-slate-200 shadow-sm"
              >
                {att.type === 'image' && att.dataUrl ? (
                  <img
                    src={att.dataUrl}
                    alt={att.name}
                    onClick={() => onSelectImagePreview?.(att)}
                    className="w-8 h-8 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity border border-white/10"
                  />
                ) : att.name.endsWith('.pdf') ? (
                  <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center justify-center shrink-0">
                    <FileCode className="w-4 h-4" />
                  </div>
                )}

                <div className="flex flex-col min-w-0 max-w-[130px] sm:max-w-[180px]">
                  <span className="font-medium text-white truncate text-[11px] sm:text-xs">
                    {att.name}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {formatFileSize(att.size)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveAttachment(att.id)}
                  className="p-1 rounded-md text-slate-400 hover:text-red-400 hover:bg-white/10 transition-colors"
                  title="Remove attachment"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Text Input Row */}
        <div className="flex items-end gap-2 px-3 pt-3 pb-2.5">
          <textarea
            ref={textareaRef}
            rows={1}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full max-h-44 resize-none bg-transparent text-sm sm:text-[15px] text-slate-100 placeholder:text-slate-400 focus:outline-hidden leading-relaxed py-1 px-1 scrollbar-thin scrollbar-thumb-white/10"
          />

          {/* Action Tools (Right / Bottom) */}
          <div className="flex items-center gap-1.5 shrink-0 self-end pb-0.5">
            {/* Attach Document Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-slate-400 hover:text-cyan-300 hover:bg-white/[0.08] rounded-xl transition-all"
              title="Attach Document (.pdf, .txt, .json, .csv, code)"
              disabled={isProcessingFiles}
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Attach Image Button */}
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="p-2 text-slate-400 hover:text-cyan-300 hover:bg-white/[0.08] rounded-xl transition-all"
              title="Attach Image (multimodal vision)"
              disabled={isProcessingFiles}
            >
              <ImageIcon className="w-4 h-4" />
            </button>

            {/* Submit or Stop Button */}
            {isStreaming ? (
              <button
                type="button"
                onClick={onStopGenerating}
                className="flex items-center justify-center w-8 h-8 rounded-xl bg-red-500/20 text-red-300 hover:bg-red-500 hover:text-white border border-red-500/40 active:scale-95 transition-all shadow-md shadow-red-500/20"
                title="Stop Generating"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={!hasInput || isProcessingFiles}
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-xl transition-all active:scale-95',
                  hasInput && !isProcessingFiles
                    ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-500/25 hover:brightness-110 cursor-pointer'
                    : 'bg-white/[0.06] text-slate-400 cursor-not-allowed'
                )}
                title="Send message"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>

        {/* Micro Footer inside card */}
        <div className="flex items-center justify-between px-3.5 py-1.5 border-t border-white/[0.04] text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 font-mono text-[10px] text-cyan-400/90">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              {modelName === 'gemini-3.1-flash-lite' ? 'Gemini 3.1 Flash Lite' : 'Gemini 3.8 Flash'}
            </span>
            <span className="hidden sm:inline text-slate-500">•</span>
            <span className="hidden sm:inline text-slate-400">Multimodal & Documents enabled</span>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-[10px] text-slate-400">
            <span>Shift + Enter for new line</span>
          </div>
        </div>
      </div>

      <p className="mt-2 text-center text-[11px] text-slate-400">
        NOVA AI uses Google Gemini. Always verify critical facts, code, and calculations.
      </p>
    </div>
  );
};
