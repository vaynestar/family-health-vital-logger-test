import React from 'react';
import { Settings, Cloud, CloudOff, RefreshCw, Heart } from 'lucide-react';

export default function Header({ syncStatus, onOpenSettings, onManualSync }) {
  const currentDateStr = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 px-4 py-3 sm:px-6">
      <div className="max-w-3xl mx-auto flex items-center justify-between">
        
        {/* App Title & Date */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-rose-400 flex items-center justify-center shadow-lg shadow-rose-950/50">
            <Heart className="w-6 h-6 text-white fill-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2">
              长辈健康记录
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">{currentDateStr}</p>
          </div>
        </div>

        {/* Sync Status Badge & Settings Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Sync status */}
          <button
            onClick={onManualSync}
            title="点击手动同步至 Google Sheet"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold border transition-all active:scale-95 ${
              syncStatus === 'synced'
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80 hover:bg-emerald-900'
                : syncStatus === 'syncing'
                ? 'bg-sky-950/80 text-sky-300 border-sky-700/80 animate-pulse'
                : 'bg-amber-950/80 text-amber-300 border-amber-700/80 hover:bg-amber-900'
            }`}
          >
            {syncStatus === 'synced' && (
              <>
                <Cloud className="w-4 h-4 text-emerald-400" />
                <span>已同步</span>
              </>
            )}
            {syncStatus === 'syncing' && (
              <>
                <RefreshCw className="w-4 h-4 text-sky-400 animate-spin" />
                <span>同步中...</span>
              </>
            )}
            {syncStatus === 'offline' && (
              <>
                <CloudOff className="w-4 h-4 text-amber-400" />
                <span>离线/待同步</span>
              </>
            )}
          </button>

          {/* Settings Button (Extra Large for Senior touch) */}
          <button
            onClick={onOpenSettings}
            aria-label="设置"
            className="w-11 h-11 rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 border border-slate-700 flex items-center justify-center transition-all active:scale-90"
          >
            <Settings className="w-6 h-6 text-slate-300" />
          </button>
        </div>
      </div>
    </header>
  );
}
