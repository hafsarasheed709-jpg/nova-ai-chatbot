import React from 'react';
import { Attachment } from '../types';
import { X, Download } from 'lucide-react';
import { formatFileSize } from '../utils/fileHelpers';

interface ImageModalProps {
  attachment: Attachment | null;
  onClose: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({ attachment, onClose }) => {
  if (!attachment || !attachment.dataUrl) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = attachment.dataUrl!;
    a.download = attachment.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-4xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden bg-black/60 border border-white/10 shadow-2xl"
      >
        {/* Top Controls */}
        <div className="flex items-center justify-between px-4 py-3 bg-black/60 backdrop-blur-md border-b border-white/10 text-white z-10">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-semibold truncate">{attachment.name}</span>
            <span className="text-xs text-slate-400">({formatFileSize(attachment.size)})</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Download image"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Close preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image Content */}
        <div className="flex-1 flex items-center justify-center p-2 overflow-auto bg-black/40">
          <img
            src={attachment.dataUrl}
            alt={attachment.name}
            className="max-h-[75vh] w-auto object-contain rounded-lg shadow-lg"
          />
        </div>
      </div>
    </div>
  );
};
