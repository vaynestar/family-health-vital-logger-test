import React, { useState } from 'react';
import { getBPCategory } from '../lib/bpCategory';
import { X, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Activity, Heart, AlertCircle } from 'lucide-react';

export default function CalendarModal({ isOpen, onClose, records }) {
  if (!isOpen) return null;

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDateStr, setSelectedDateStr] = useState(today.toISOString().slice(0, 10));

  // Helper to format Date to YYYY-MM-DD
  const formatDateKey = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Group records by YYYY-MM-DD
  const recordsByDate = {};
  records.forEach(r => {
    const d = new Date(r.timestamp);
    const key = formatDateKey(d);
    if (!recordsByDate[key]) recordsByDate[key] = [];
    recordsByDate[key].push(r);
  });

  // Month navigation
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Generate days in month
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun

  const monthNames = [
    '一月', '二月', '三月', '四月', '五月', '六月',
    '七月', '八月', '九月', '十月', '十一月', '十二月'
  ];

  // Selected date records & 3 aspects analysis
  const dayRecords = recordsByDate[selectedDateStr] || [];
  
  let sysAvg = 0, sysMin = 0, sysMax = 0;
  let diaAvg = 0, diaMin = 0, diaMax = 0;
  let hrAvg = 0, hrMin = 0, hrMax = 0;

  if (dayRecords.length > 0) {
    const sysList = dayRecords.map(r => r.systolic);
    const diaList = dayRecords.map(r => r.diastolic);
    const hrList = dayRecords.map(r => r.heart_rate);

    sysAvg = Math.round(sysList.reduce((a, b) => a + b, 0) / sysList.length);
    sysMin = Math.min(...sysList);
    sysMax = Math.max(...sysList);

    diaAvg = Math.round(diaList.reduce((a, b) => a + b, 0) / diaList.length);
    diaMin = Math.min(...diaList);
    diaMax = Math.max(...diaList);

    hrAvg = Math.round(hrList.reduce((a, b) => a + b, 0) / hrList.length);
    hrMin = Math.min(...hrList);
    hrMax = Math.max(...hrList);
  }

  const selectedCategory = sysAvg && diaAvg ? getBPCategory(sysAvg, diaAvg) : null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-5 sm:p-7 max-w-xl w-full shadow-2xl animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-emerald-400" />
            健康测量日历
          </h3>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Month Selector */}
        <div className="flex items-center justify-between my-4 bg-slate-950 p-3 rounded-2xl border border-slate-800">
          <button
            onClick={prevMonth}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <span className="text-lg font-black text-white">
            {currentYear}年 {monthNames[currentMonth]}
          </span>

          <button
            onClick={nextMonth}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3">
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-500 mb-2">
            <span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {/* Empty slots for starting day */}
            {Array.from({ length: startingDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="h-10 sm:h-12" />
            ))}

            {/* Days of month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateObj = new Date(currentYear, currentMonth, dayNum);
              const dateKey = formatDateKey(dateObj);
              const hasRecords = recordsByDate[dateKey] && recordsByDate[dateKey].length > 0;
              const isSelected = selectedDateStr === dateKey;

              // Color badge for day status
              let dayBadgeColor = 'bg-slate-800';
              if (hasRecords) {
                const daySysList = recordsByDate[dateKey].map(r => r.systolic);
                const dayDiaList = recordsByDate[dateKey].map(r => r.diastolic);
                const maxSys = Math.max(...daySysList);
                const maxDia = Math.max(...dayDiaList);
                const cat = getBPCategory(maxSys, maxDia);
                dayBadgeColor = cat.badgeColor;
              }

              return (
                <button
                  key={dayKey}
                  onClick={() => setSelectedDateStr(dateKey)}
                  className={`h-10 sm:h-12 rounded-xl flex flex-col items-center justify-center relative transition-all active:scale-95 border ${
                    isSelected
                      ? 'border-sky-400 bg-sky-950/80 text-white font-black shadow-md'
                      : hasRecords
                      ? 'border-slate-700 bg-slate-900 text-slate-200 font-bold hover:bg-slate-800'
                      : 'border-slate-900 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <span className="text-sm">{dayNum}</span>
                  {hasRecords && (
                    <span className={`w-2 h-2 rounded-full mt-0.5 ${dayBadgeColor}`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Details: 3 Aspects Summary */}
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between text-slate-300 font-bold text-base">
            <span>📅 {selectedDateStr} 测量详情</span>
            <span className="text-xs text-slate-400">共 {dayRecords.length} 次测定</span>
          </div>

          {dayRecords.length === 0 ? (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-center text-slate-500 font-medium">
              该日期暂无血压心率记录
            </div>
          ) : (
            <>
              {/* 3 Aspects Grid */}
              <div className="grid grid-cols-3 gap-2">
                
                {/* Aspect 1: Systolic (高压) */}
                <div className="bg-slate-950 border border-sky-500/50 rounded-2xl p-3 text-center">
                  <div className="text-xs font-bold text-sky-400 flex items-center justify-center gap-1">
                    <Activity className="w-3.5 h-3.5" /> 高压 (收缩压)
                  </div>
                  <div className="text-2xl font-black text-white my-1">
                    {sysAvg} <span className="text-xs font-normal text-slate-400">mmHg</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    范围: {sysMin}~{sysMax}
                  </div>
                </div>

                {/* Aspect 2: Diastolic (低压) */}
                <div className="bg-slate-950 border border-teal-500/50 rounded-2xl p-3 text-center">
                  <div className="text-xs font-bold text-teal-400 flex items-center justify-center gap-1">
                    <Activity className="w-3.5 h-3.5" /> 低压 (舒张压)
                  </div>
                  <div className="text-2xl font-black text-white my-1">
                    {diaAvg} <span className="text-xs font-normal text-slate-400">mmHg</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    范围: {diaMin}~{diaMax}
                  </div>
                </div>

                {/* Aspect 3: Heart Rate (心率) */}
                <div className="bg-slate-950 border border-rose-500/50 rounded-2xl p-3 text-center">
                  <div className="text-xs font-bold text-rose-400 flex items-center justify-center gap-1">
                    <Heart className="w-3.5 h-3.5" /> 心率 (脉搏)
                  </div>
                  <div className="text-2xl font-black text-rose-400 my-1">
                    {hrAvg} <span className="text-xs font-normal text-slate-400">bpm</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    范围: {hrMin}~{hrMax}
                  </div>
                </div>

              </div>

              {/* Day Category Banner */}
              {selectedCategory && (
                <div className={`p-2.5 rounded-xl border text-center font-bold text-xs ${selectedCategory.color}`}>
                  全天平均评估：{selectedCategory.label}
                </div>
              )}

              {/* Day's Detailed Record List */}
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {dayRecords.map(r => {
                  const tStr = new Date(r.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
                  return (
                    <div key={r.id} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">{tStr}</span>
                      <span className="font-black text-white">{r.systolic} / {r.diastolic} mmHg</span>
                      <span className="font-bold text-rose-400">❤️ {r.heart_rate} bpm</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Close Button */}
        <div className="mt-5">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-base border border-slate-700"
          >
            返回主页
          </button>
        </div>

      </div>
    </div>
  );
}
