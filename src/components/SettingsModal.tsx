import React, { useState } from 'react';
import { UserSettings, Conversation } from '../types';
import { DEFAULT_SETTINGS, exportConversationsToJSON } from '../utils/storage';
import {
  X,
  Sliders,
  Sparkles,
  Database,
  Sun,
  Moon,
  RotateCcw,
  Check,
  AlertTriangle,
  Download,
} from 'lucide-react';
import { cn } from '../utils/cn';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSaveSettings: (settings: UserSettings) => void;
  conversations: Conversation[];
  onClearAllConversations: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  conversations,
  onClearAllConversations,
}) => {
  const [current, setCurrent] = useState<UserSettings>(settings);
  const [activeTab, setActiveTab] = useState<'general' | 'intelligence' | 'data'>('intelligence');
  const [confirmClear, setConfirmClear] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings(current);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  const handleReset = () => {
    setCurrent(DEFAULT_SETTINGS);
  };

  const handleClearData = () => {
    onClearAllConversations();
    setConfirmClear(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-xl rounded-2xl bg-[#121622] border border-white/[0.12] shadow-2xl shadow-black overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#161b28]">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">NOVA AI Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-white/[0.08] bg-white/[0.02] px-6 text-xs font-medium">
          <button
            onClick={() => setActiveTab('intelligence')}
            className={cn(
              'py-3 border-b-2 transition-all mr-6 flex items-center gap-1.5',
              activeTab === 'intelligence'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            )}
          >
            <Sparkles className="w-4 h-4" />
            Intelligence & Model
          </button>
          <button
            onClick={() => setActiveTab('general')}
            className={cn(
              'py-3 border-b-2 transition-all mr-6 flex items-center gap-1.5',
              activeTab === 'general'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            )}
          >
            <Sun className="w-4 h-4" />
            Appearance
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={cn(
              'py-3 border-b-2 transition-all flex items-center gap-1.5',
              activeTab === 'data'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            )}
          >
            <Database className="w-4 h-4" />
            Data & Privacy
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs sm:text-sm text-slate-300 scrollbar-thin scrollbar-thumb-white/10">
          {activeTab === 'intelligence' && (
            <div className="space-y-5">
              {/* Model Choice */}
              <div>
                <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-2">
                  Gemini Foundation Model
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div
                    onClick={() => setCurrent({ ...current, model: 'gemini-3.8-flash' })}
                    className={cn(
                      'p-3 rounded-xl border cursor-pointer transition-all',
                      current.model === 'gemini-3.8-flash'
                        ? 'bg-cyan-500/10 border-cyan-500/60 ring-1 ring-cyan-500/30'
                        : 'bg-slate-900/40 border-white/10 hover:border-white/20'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white text-xs sm:text-sm">Gemini 3.8 Flash</span>
                      {current.model === 'gemini-3.8-flash' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Deep reasoning, high-throughput multimodal intelligence.
                    </p>
                  </div>

                  <div
                    onClick={() => setCurrent({ ...current, model: 'gemini-3.1-flash-lite' })}
                    className={cn(
                      'p-3 rounded-xl border cursor-pointer transition-all',
                      current.model === 'gemini-3.1-flash-lite'
                        ? 'bg-cyan-500/10 border-cyan-500/60 ring-1 ring-cyan-500/30'
                        : 'bg-slate-900/40 border-white/10 hover:border-white/20'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white text-xs sm:text-sm">Gemini 3.1 Flash Lite</span>
                      {current.model === 'gemini-3.1-flash-lite' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Ultra-low latency, instant responses, high availability.
                    </p>
                  </div>
                </div>
              </div>

              {/* Temperature Slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-white uppercase tracking-wider">
                    Temperature (Creativity)
                  </label>
                  <span className="font-mono text-cyan-400 font-bold">
                    {current.temperature.toFixed(1)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.1"
                  value={current.temperature}
                  onChange={(e) =>
                    setCurrent({ ...current, temperature: parseFloat(e.target.value) })
                  }
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                  <span>0.0 (Precise / Code)</span>
                  <span>0.7 (Balanced)</span>
                  <span>1.5 (Creative / Novel)</span>
                </div>
              </div>

              {/* System Instruction */}
              <div>
                <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-2">
                  System Persona & Instructions
                </label>
                <textarea
                  rows={4}
                  value={current.systemInstruction}
                  onChange={(e) =>
                    setCurrent({ ...current, systemInstruction: e.target.value })
                  }
                  placeholder="Define NOVA AI's tone, rules, and behavior..."
                  className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-xs sm:text-sm text-white placeholder-slate-400 focus:border-cyan-500/50 outline-none leading-relaxed"
                />
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Directs how NOVA answers every question across your chats.
                </p>
              </div>

              {/* Auto Title Generation */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-white/5">
                <div>
                  <p className="font-semibold text-white text-xs sm:text-sm">Auto-generate Titles</p>
                  <p className="text-xs text-slate-400">
                    Automatically create descriptive titles from your first prompt.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={current.autoTitle}
                  onChange={(e) => setCurrent({ ...current, autoTitle: e.target.checked })}
                  className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                />
              </div>
            </div>
          )}

          {activeTab === 'general' && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-2">
                  Theme
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrent({ ...current, theme: 'dark' })}
                    className={cn(
                      'flex items-center justify-center gap-2 p-3.5 rounded-xl border text-sm font-medium transition-all',
                      current.theme === 'dark'
                        ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-300'
                        : 'bg-white/[0.02] border-white/10 text-slate-400 hover:text-white'
                    )}
                  >
                    <Moon className="w-4 h-4" />
                    Dark Mode (Recommended)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrent({ ...current, theme: 'light' })}
                    className={cn(
                      'flex items-center justify-center gap-2 p-3.5 rounded-xl border text-sm font-medium transition-all',
                      current.theme === 'light'
                        ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-300'
                        : 'bg-white/[0.02] border-white/10 text-slate-400 hover:text-white'
                    )}
                  >
                    <Sun className="w-4 h-4" />
                    Light Mode
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-2">
                  Chat Font Scale
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['sm', 'md', 'lg'] as const).map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setCurrent({ ...current, fontSize: size })}
                      className={cn(
                        'py-2 rounded-xl border text-xs font-medium uppercase tracking-wider transition-all',
                        current.fontSize === size
                          ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-300'
                          : 'bg-white/[0.02] border-white/10 text-slate-400 hover:text-white'
                      )}
                    >
                      {size === 'sm' ? 'Compact' : size === 'md' ? 'Normal' : 'Spacious'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-slate-900/40 border border-white/10 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-white text-xs sm:text-sm">Export All Conversations</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Download a full JSON backup of all {conversations.length} conversation histories.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => exportConversationsToJSON(conversations)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export JSON
                </button>
              </div>

              <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/20">
                <h4 className="font-semibold text-red-300 text-xs sm:text-sm flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  Danger Zone
                </h4>
                <p className="text-xs text-slate-300 mt-1 mb-3">
                  Erase all conversation history stored locally in your browser. This action cannot be undone.
                </p>

                {confirmClear ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleClearData}
                      className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors"
                    >
                      Confirm Erase Everything
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClear(false)}
                      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-slate-300 text-xs transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmClear(true)}
                    className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-medium transition-colors"
                  >
                    Clear All Chats
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.08] bg-[#161b28]">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white text-xs font-semibold shadow-md shadow-cyan-500/20 hover:brightness-110 active:scale-95 transition-all"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  Saved!
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
