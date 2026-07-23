import React from 'react';
import { Mic, Loader2, Keyboard, Sparkles, Volume2, MessageSquare } from 'lucide-react';

export default function VoiceMicButton({
  isListening,
  isProcessing,
  transcript,
  onStartListening,
  onStopListening,
  onOpenManualEntry,
  errorMsg
}) {
  return (
    <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-4 sm:p-6 my-3 text-center shadow-xl relative">
      
      <div className="mb-2">
        <h2 className="text-xl sm:text-2xl font-extrabold text-white flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          语音快速记录
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm mt-0.5 font-medium">
          按顺序说出血压计数值（高压、低压、心率）
        </p>
      </div>

      {/* Prominent Standard Speech Reference Box */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3 my-2 text-left space-y-1.5 shadow-inner">
        <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
          <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
          <span>🗣️ 口述示范：</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs sm:text-sm font-bold">
          <div className="bg-slate-900/90 border border-slate-800 px-2.5 py-1.5 rounded-xl text-emerald-300">
            “高压 135，低压 85，心率 72”
          </div>
          <div className="bg-slate-900/90 border border-slate-800 px-2.5 py-1.5 rounded-xl text-sky-300">
            “高压一百二十，低压八十，心率七十五”
          </div>
        </div>
      </div>

      {/* Live Chinese Speech Preview Box */}
      {(transcript || isListening) && (
        <div className={`my-2 p-3 rounded-2xl border transition-all shadow-inner text-left ${
          isListening
            ? 'bg-rose-950/80 border-rose-600 text-rose-100 animate-pulse'
            : 'bg-slate-950 border-slate-700 text-slate-100'
        }`}>
          <div className="text-[11px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1 text-amber-400">
            <Volume2 className="w-3.5 h-3.5 text-rose-400 animate-bounce" />
            <span>{isListening ? '实时捕捉语音声音：' : '捕获的内容：'}</span>
          </div>
          <div className="text-lg sm:text-xl font-black leading-snug tracking-wide min-h-[2.5rem] flex items-center">
            {transcript ? `“ ${transcript} ”` : <span className="text-slate-500 font-medium italic">请大声说话...</span>}
          </div>
        </div>
      )}

      {/* Massive Senior Touch Microphone Button */}
      <div className="my-4 flex justify-center items-center">
        <button
          onClick={isListening ? onStopListening : onStartListening}
          disabled={isProcessing}
          className={`w-32 h-32 sm:w-40 sm:h-40 rounded-full flex flex-col items-center justify-center transition-all duration-300 transform active:scale-95 shadow-2xl relative border-4 ${
            isListening
              ? 'bg-rose-600 border-rose-400 text-white animate-pulse shadow-rose-900/80 scale-105'
              : isProcessing
              ? 'bg-sky-600 border-sky-400 text-white cursor-wait opacity-90'
              : 'bg-gradient-to-tr from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 border-rose-300/40 text-white shadow-rose-950/90 hover:scale-105'
          }`}
        >
          {isListening && (
            <>
              <span className="absolute inset-0 rounded-full border-4 border-rose-400 animate-ping opacity-75 pointer-events-none" />
              <span className="absolute -inset-4 rounded-full border-2 border-rose-500/50 animate-pulse pointer-events-none" />
            </>
          )}

          {isProcessing ? (
            <>
              <Loader2 className="w-12 h-12 animate-spin text-white mb-1" />
              <span className="text-sm font-extrabold tracking-wider">AI 解析中</span>
            </>
          ) : isListening ? (
            <>
              <Volume2 className="w-12 h-12 text-white mb-1 animate-bounce" />
              <span className="text-base font-black tracking-wider">正在倾听...</span>
              <span className="text-[10px] text-rose-200 font-bold">再次点击完成</span>
            </>
          ) : (
            <>
              <Mic className="w-12 h-12 text-white mb-1 drop-shadow-md" />
              <span className="text-lg font-black tracking-wider">按住 / 点击说话</span>
              <span className="text-[10px] text-rose-100 font-semibold">普通话口述</span>
            </>
          )}
        </button>
      </div>

      {errorMsg && (
        <div className="bg-rose-950/80 border border-rose-700 text-rose-200 text-xs font-semibold rounded-xl p-2.5 my-2 max-w-md mx-auto">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Manual Entry Toggle */}
      <div className="mt-2 pt-2 border-t border-slate-800 flex justify-center">
        <button
          onClick={onOpenManualEntry}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 border border-slate-700 font-bold text-xs transition-all active:scale-95 shadow-md"
        >
          <Keyboard className="w-3.5 h-3.5 text-amber-400" />
          <span>切换手动键盘输入</span>
        </button>
      </div>
    </div>
  );
}
