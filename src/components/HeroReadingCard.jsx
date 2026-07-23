import React from 'react';
import { getBPCategory } from '../lib/bpCategory';
import { Activity, Heart, Calendar, AlertCircle } from 'lucide-react';

export default function HeroReadingCard({ latestRecord }) {
  if (!latestRecord) {
    return (
      <div className="bg-slate-900 border-2 border-dashed border-slate-800 rounded-3xl p-6 sm:p-8 text-center my-4 shadow-xl">
        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-500">
          <Activity className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-200 mb-2">暂无测定记录</h2>
        <p className="text-slate-400 text-lg">点击下方的大麦克风按钮，说出您的血压和心率，例如：</p>
        <p className="text-emerald-400 font-bold text-xl mt-3 bg-slate-950/60 py-2.5 px-4 rounded-2xl border border-slate-800 inline-block">
          “高压120，低压80，心率72”
        </p>
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
    <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-slate-800 rounded-3xl p-6 sm:p-8 my-4 shadow-2xl relative overflow-hidden">
      
      {/* Background Subtle Accent Glow */}
      <div className={`absolute -right-16 -top-16 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none ${category.dotColor}`} />

      {/* Top Bar: Title & Category Status Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <span className={`w-3.5 h-3.5 rounded-full ${category.dotColor} animate-ping`} />
          <span className="text-slate-400 text-lg font-bold">最新测量记录</span>
          <span className="text-slate-500 text-base font-medium flex items-center gap-1 ml-2">
            <Calendar className="w-4 h-4" /> {formattedTime}
          </span>
        </div>

        {/* Clinical Status Badge */}
        <div className={`px-4 py-1.5 rounded-full text-base font-extrabold border shadow-lg flex items-center gap-2 ${category.color}`}>
          <span>{category.label}</span>
        </div>
      </div>

      {/* Primary Numbers Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-2">
        
        {/* Blood Pressure Card */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <span className="text-slate-400 text-base font-bold flex items-center gap-2">
            <Activity className="w-5 h-5 text-sky-400" />
            血压 (收缩压 / 舒张压)
          </span>
          <div className="my-3">
            <div className="text-4xl sm:text-5xl font-black tracking-tight text-white flex items-baseline gap-1">
              <span>{latestRecord.systolic}</span>
              <span className="text-slate-500 text-3xl font-light">/</span>
              <span>{latestRecord.diastolic}</span>
              <span className="text-lg font-normal text-slate-400 ml-2">mmHg</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-1 font-semibold">
              <span>高压 (收缩压)</span>
              <span>低压 (舒张压)</span>
            </div>
          </div>
        </div>

        {/* Heart Rate Card */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <span className="text-slate-400 text-base font-bold flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500 fill-rose-500/20" />
            心率 / 脉搏
          </span>
          <div className="my-3">
            <div className="text-4xl sm:text-5xl font-black tracking-tight text-rose-400 flex items-baseline gap-2">
              <span>{latestRecord.heart_rate}</span>
              <span className="text-lg font-normal text-slate-400">bpm (次/分)</span>
            </div>
            <div className="text-xs text-slate-500 mt-1 font-semibold">
              正常静息心率：60 ~ 100 次/分
            </div>
          </div>
        </div>
      </div>

      {/* Notes / Advice Banner */}
      {latestRecord.notes && (
        <div className="mt-4 bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">备注情况</div>
            <div className="text-slate-200 text-base font-medium mt-0.5">{latestRecord.notes}</div>
          </div>
        </div>
      )}

      {/* Clinical Advice */}
      <div className="mt-3 text-slate-400 text-sm font-medium bg-slate-950/40 rounded-xl p-3 border border-slate-900">
        💡 <strong className="text-slate-300">温馨提示：</strong>{category.advice}
      </div>
    </div>
  );
}
