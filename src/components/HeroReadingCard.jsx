import React from 'react';
import { getBPCategory } from '../lib/bpCategory';
import { Activity, Heart, Calendar, AlertCircle } from 'lucide-react';

export default function HeroReadingCard({ latestRecord }) {
  if (!latestRecord) {
    return (
      <div className="bg-slate-900 border-2 border-dashed border-slate-800 rounded-2xl p-4 sm:p-6 text-center my-2 shadow-lg">
        <div className="flex items-center justify-center gap-2 text-slate-300 font-bold text-base mb-1">
          <Activity className="w-5 h-5 text-emerald-400" />
          <span>暂无测定记录，欢迎点击下方大麦克风记录</span>
        </div>
      </div>
    );
  }

  const category = getBPCategory(latestRecord.systolic, latestRecord.diastolic);
  const recordDate = new Date(latestRecord.timestamp);
  const formattedTime = recordDate.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-slate-800 rounded-3xl p-4 sm:p-6 my-2 shadow-xl relative overflow-hidden">
      
      {/* Background Accent Glow */}
      <div className={`absolute -right-16 -top-16 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none ${category.dotColor}`} />

      {/* Top Bar: Title & Category Status Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${category.dotColor} animate-ping`} />
          <span className="text-slate-400 text-sm sm:text-base font-bold">最新测定</span>
          <span className="text-slate-500 text-xs sm:text-sm font-medium flex items-center gap-1 ml-1">
            <Calendar className="w-3.5 h-3.5" /> {formattedTime}
          </span>
        </div>

        {/* Clinical Status Badge */}
        <div className={`px-3 py-1 rounded-full text-xs sm:text-sm font-extrabold border shadow flex items-center gap-1.5 ${category.color}`}>
          <span>{category.label}</span>
        </div>
      </div>

      {/* Primary Numbers Grid */}
      <div className="grid grid-cols-2 gap-3 my-1">
        
        {/* Blood Pressure Card */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between">
          <span className="text-slate-400 text-xs sm:text-sm font-bold flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-sky-400" />
            血压 (SYS/DIA)
          </span>
          <div className="my-1">
            <div className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-baseline gap-1">
              <span>{latestRecord.systolic}</span>
              <span className="text-slate-500 text-2xl font-light">/</span>
              <span>{latestRecord.diastolic}</span>
              <span className="text-xs font-normal text-slate-400 ml-1">mmHg</span>
            </div>
          </div>
        </div>

        {/* Heart Rate Card */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between">
          <span className="text-slate-400 text-xs sm:text-sm font-bold flex items-center gap-1.5">
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20" />
            心率 / 脉搏
          </span>
          <div className="my-1">
            <div className="text-3xl sm:text-4xl font-black tracking-tight text-rose-400 flex items-baseline gap-1">
              <span>{latestRecord.heart_rate}</span>
              <span className="text-xs font-normal text-slate-400 ml-1">bpm</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes (Only if exists) */}
      {latestRecord.notes && (
        <div className="mt-2 bg-slate-800/80 border border-slate-700/80 rounded-xl p-2.5 flex items-center gap-2 text-xs">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-slate-200 font-medium">{latestRecord.notes}</span>
        </div>
      )}
    </div>
  );
}
