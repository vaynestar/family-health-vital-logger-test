import React from 'react';
import { Mic, MicOff, Loader2, Keyboard, Sparkles, Volume2 } from 'lucide-react';

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
    <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-6 sm:p-8 my-6 text-center shadow-2xl relative">
      
      <div className="mb-4">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center justify-center gap-2">
          <Sparkles className="w-6 h-6 text-amber-400" />
          语音快速记录
        </h2>
        <p className="text-slate-400 text-base sm:text-lg mt-1 font-medium">
          点击下方按钮，用普通话读出您的测量数据
        </p>
      </div>

      {/* Massive Senior-Friendly Touch Microphone Button */}
      <div className="my-8 flex justify-center items-center">
        <button
          onClick={isListening ? onStopListening : onStartListening}
          disabled={isProcessing}
          className={`w-36 h-36 sm:w-44 sm:h-44 rounded-full flex flex-col items-center justify-center transition-all duration-300 transform active:scale-95 shadow-2xl relative border-4 ${
            isListening
              ? 'bg-rose-600 border-rose-400 text-white animate-pulse shadow-rose-900/80 scale-105'
              : isProcessing
              ? 'bg-sky-600 border-sky-400 text-white cursor-wait opacity-90'
              : 'bg-gradient-to-tr from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 border-rose-300/40 text-white shadow-rose-950/90 hover:scale-105'
          }`}
        >
          {/* Animated Waveform Outer Rings */}
          {isListening && (
            <>
              <span className="absolute inset-0 rounded-full border-4 border-rose-400 animate-ping opacity-75 pointer-events-none" />
              <span className="absolute -inset-4 rounded-full border-2 border-rose-500/50 animate-pulse pointer-events-none" />
            </>
          )}

          {isProcessing ? (
            <>
              <Loader2 className="w-14 h-14 animate-spin text-white mb-1" />
              <span className="text-base font-extrabold tracking-wider">AI 解析中</span>
            </>
          ) : isListening ? (
            <>
              <Volume2 className="w-14 h-14 text-white mb-1 animate-bounce" />
              <span className="text-lg font-black tracking-wider">正在倾听...</span>
              <span className="text-xs text-rose-200 mt-1 font-bold">再次点击结束</span>
            </>
          ) : (
            <>
              <Mic className="w-14 h-14 text-white mb-1 drop-shadow-md" />
              <span className="text-xl font-black tracking-wider">点击说话</span>
              <span className="text-xs text-rose-100 font-semibold mt-0.5">普通话口述</span>
            </>
          )}
        </button>
      </div>

      {/* Live Transcript Display Box */}
      {transcript && (
        <div className="bg-slate-950 border border-slate-700/80 rounded-2xl p-4 my-4 max-w-lg mx-auto text-left shadow-inner">
          <div className="text-xs text-amber-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
            <Volume2 className="w-3.5 h-3.5" /> 识别到语音文本：
          </div>
          <div className="text-slate-100 text-lg font-bold leading-relaxed">
            "{transcript}"
          </div>
        </div>
      )}

      {/* Error Message Alert */}
      {errorMsg && (
        <div className="bg-rose-950/80 border border-rose-700 text-rose-200 text-base font-semibold rounded-2xl p-3 my-3 max-w-md mx-auto">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Manual Keyboard Entry Button */}
      <div className="mt-6 pt-4 border-t border-slate-800 flex justify-center">
        <button
          onClick={onOpenManualEntry}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 border border-slate-700 font-bold text-base transition-all active:scale-95 shadow-md"
        >
          <Keyboard className="w-5 h-5 text-amber-400" />
          <span>不方便说话？切换手动键盘输入</span>
        </button>
      </div>
    </div>
  );
}
