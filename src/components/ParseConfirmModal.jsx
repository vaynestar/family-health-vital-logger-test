import React, { useState, useEffect } from 'react';
import { getBPCategory } from '../lib/bpCategory';
import { Check, X, Plus, Minus, Heart, Activity, FileText, RotateCcw, Calculator, Layers } from 'lucide-react';

export default function ParseConfirmModal({
  parsedResult,
  onConfirm,
  onCancel,
  onReRecord
}) {
  const [systolic, setSystolic] = useState(120);
  const [diastolic, setDiastolic] = useState(80);
  const [heartRate, setHeartRate] = useState(72);
  const [notes, setNotes] = useState('');
  
  // Multi-round drafts storage
  const [rounds, setRounds] = useState([]);
  const [selectedRoundIndex, setSelectedRoundIndex] = useState(0);

  useEffect(() => {
    if (parsedResult) {
      const sys = parsedResult.systolic || 120;
      const dia = parsedResult.diastolic || 80;
      const hr = parsedResult.heart_rate || 72;
      const noteStr = parsedResult.notes || '';

      setSystolic(sys);
      setDiastolic(dia);
      setHeartRate(hr);
      setNotes(noteStr);

      setRounds(prev => {
        const nextRound = { systolic: sys, diastolic: dia, heart_rate: hr, notes: noteStr, roundNum: prev.length + 1 };
        return [...prev, nextRound];
      });
      setSelectedRoundIndex(prev => prev);
    }
  }, [parsedResult]);

  if (!parsedResult) return null;

  const category = getBPCategory(systolic, diastolic);

  const handleSelectRound = (index) => {
    if (rounds[index]) {
      setSelectedRoundIndex(index);
      setSystolic(rounds[index].systolic);
      setDiastolic(rounds[index].diastolic);
      setHeartRate(rounds[index].heart_rate);
    }
  };

  const handleCalculateAverage = () => {
    if (rounds.length === 0) return;
    const avgSys = Math.round(rounds.reduce((acc, r) => acc + r.systolic, 0) / rounds.length);
    const avgDia = Math.round(rounds.reduce((acc, r) => acc + r.diastolic, 0) / rounds.length);
    const avgHr = Math.round(rounds.reduce((acc, r) => acc + r.heart_rate, 0) / rounds.length);

    setSystolic(avgSys);
    setDiastolic(avgDia);
    setHeartRate(avgHr);
    setNotes(`前${rounds.length}次测量平均值 (${avgSys}/${avgDia} mmHg, ${avgHr}bpm)`);
  };

  const handleSave = () => {
    onConfirm({
      systolic: Number(systolic),
      diastolic: Number(diastolic),
      heart_rate: Number(heartRate),
      notes: notes.trim(),
      timestamp: new Date().toISOString()
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-4 sm:p-5 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-150 my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
          <h3 className="text-xl font-black text-white flex items-center gap-2">
            ✨ 测量数据核对
          </h3>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Multi-round switcher banner */}
        {rounds.length > 1 && (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-2 my-2">
            <div className="text-[11px] font-bold text-slate-400 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5 text-sky-400" /> 已记录 {rounds.length} 轮：</span>
              <button
                type="button"
                onClick={handleCalculateAverage}
                className="text-[11px] font-bold text-amber-400 hover:underline flex items-center gap-0.5"
              >
                <Calculator className="w-3 h-3" /> 平均值
              </button>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              {rounds.map((r, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectRound(idx)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                    selectedRoundIndex === idx
                      ? 'bg-sky-600 border-sky-400 text-white shadow'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  第{idx + 1}次 ({r.systolic}/{r.diastolic})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Category Preview */}
        <div className={`py-1.5 px-3 rounded-xl border text-center font-bold text-sm my-2.5 ${category.color}`}>
          状态分类：{category.label}
        </div>

        {/* Value Fine-Tuning Grid (Compact single screen) */}
        <div className="space-y-2.5">
          
          {/* Systolic (高压) */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-2.5 sm:p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-sky-400 shrink-0" />
              <div>
                <div className="text-slate-200 font-bold text-sm sm:text-base">高压 (SYS 最上方)</div>
                <div className="text-[10px] text-slate-500 font-medium">收缩压 mmHg</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSystolic(prev => Math.max(50, prev - 1))}
                className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-black text-xl flex items-center justify-center border border-slate-700 active:scale-95"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                value={systolic}
                onChange={e => setSystolic(Number(e.target.value))}
                className="w-16 text-center text-2xl font-black bg-transparent text-white focus:outline-none"
              />
              <button
                onClick={() => setSystolic(prev => Math.min(260, prev + 1))}
                className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-black text-xl flex items-center justify-center border border-slate-700 active:scale-95"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Diastolic (低压) */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-2.5 sm:p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-teal-400 shrink-0" />
              <div>
                <div className="text-slate-200 font-bold text-sm sm:text-base">低压 (DIA 中间)</div>
                <div className="text-[10px] text-slate-500 font-medium">舒张压 mmHg</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setDiastolic(prev => Math.max(30, prev - 1))}
                className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-black text-xl flex items-center justify-center border border-slate-700 active:scale-95"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                value={diastolic}
                onChange={e => setDiastolic(Number(e.target.value))}
                className="w-16 text-center text-2xl font-black bg-transparent text-white focus:outline-none"
              />
              <button
                onClick={() => setDiastolic(prev => Math.min(180, prev + 1))}
                className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-black text-xl flex items-center justify-center border border-slate-700 active:scale-95"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Heart Rate (心率) */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-2.5 sm:p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500 shrink-0" />
              <div>
                <div className="text-slate-200 font-bold text-sm sm:text-base">心率 (PULSE 最下方)</div>
                <div className="text-[10px] text-slate-500 font-medium">脉搏 bpm</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setHeartRate(prev => Math.max(30, prev - 1))}
                className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-black text-xl flex items-center justify-center border border-slate-700 active:scale-95"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                value={heartRate}
                onChange={e => setHeartRate(Number(e.target.value))}
                className="w-16 text-center text-2xl font-black bg-transparent text-rose-400 focus:outline-none"
              />
              <button
                onClick={() => setHeartRate(prev => Math.min(220, prev + 1))}
                className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-black text-2xl flex items-center justify-center border border-slate-700 active:scale-95"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5">
            <div className="flex items-center gap-1.5 text-slate-300 font-bold text-xs mb-1">
              <FileText className="w-4 h-4 text-amber-400" />
              <span>备注说明 (选填)</span>
            </div>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="例如：早上服药"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 text-xs font-medium focus:outline-none focus:border-amber-400"
            />
          </div>

        </div>

        {/* Action Buttons */}
        <div className="mt-4 space-y-2">
          <button
            onClick={handleSave}
            className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black text-lg flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 transition-all active:scale-95"
          >
            <Check className="w-6 h-6" />
            <span>确认保存该次记录</span>
          </button>

          <button
            onClick={onReRecord}
            className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-slate-700 active:scale-95"
          >
            <RotateCcw className="w-4 h-4 text-sky-400" />
            <span>再测一轮 / 重新口述下一次</span>
          </button>
        </div>

      </div>
    </div>
  );
}
