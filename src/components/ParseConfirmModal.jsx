import React, { useState, useEffect } from 'react';
import { getBPCategory } from '../lib/bpCategory';
import { Check, X, Plus, Minus, Heart, Activity, FileText, RotateCcw } from 'lucide-react';

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

  useEffect(() => {
    if (parsedResult) {
      setSystolic(parsedResult.systolic || 120);
      setDiastolic(parsedResult.diastolic || 80);
      setHeartRate(parsedResult.heart_rate || 72);
      setNotes(parsedResult.notes || '');
    }
  }, [parsedResult]);

  if (!parsedResult) return null;

  const category = getBPCategory(systolic, diastolic);

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
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h3 className="text-2xl font-black text-white flex items-center gap-2">
            ✨ AI 识别结果确认
          </h3>
          <button
            onClick={onCancel}
            className="w-10 h-10 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <p className="text-slate-400 text-base my-3 font-medium">
          请检查下方数值。如需微调，点击两侧的 <strong>+</strong> 或 <strong>-</strong> 按钮：
        </p>

        {/* Category Preview */}
        <div className={`p-3 rounded-2xl border text-center font-bold text-lg mb-4 ${category.color}`}>
          状态分类：{category.label}
        </div>

        {/* Value Fine-Tuning Grid */}
        <div className="space-y-4">
          
          {/* Systolic (高压) */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-6 h-6 text-sky-400" />
              <div>
                <div className="text-slate-200 font-bold text-lg">高压 (收缩压)</div>
                <div className="text-xs text-slate-500 font-medium">mmHg</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSystolic(prev => Math.max(50, prev - 1))}
                className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-black text-2xl flex items-center justify-center border border-slate-700"
              >
                <Minus className="w-6 h-6" />
              </button>
              <input
                type="number"
                value={systolic}
                onChange={e => setSystolic(Number(e.target.value))}
                className="w-20 text-center text-3xl font-black bg-transparent text-white focus:outline-none"
              />
              <button
                onClick={() => setSystolic(prev => Math.min(260, prev + 1))}
                className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-black text-2xl flex items-center justify-center border border-slate-700"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Diastolic (低压) */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-6 h-6 text-teal-400" />
              <div>
                <div className="text-slate-200 font-bold text-lg">低压 (舒张压)</div>
                <div className="text-xs text-slate-500 font-medium">mmHg</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDiastolic(prev => Math.max(30, prev - 1))}
                className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-black text-2xl flex items-center justify-center border border-slate-700"
              >
                <Minus className="w-6 h-6" />
              </button>
              <input
                type="number"
                value={diastolic}
                onChange={e => setDiastolic(Number(e.target.value))}
                className="w-20 text-center text-3xl font-black bg-transparent text-white focus:outline-none"
              />
              <button
                onClick={() => setDiastolic(prev => Math.min(180, prev + 1))}
                className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-black text-2xl flex items-center justify-center border border-slate-700"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Heart Rate (心率) */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-6 h-6 text-rose-500" />
              <div>
                <div className="text-slate-200 font-bold text-lg">心率 / 脉搏</div>
                <div className="text-xs text-slate-500 font-medium">bpm</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setHeartRate(prev => Math.max(30, prev - 1))}
                className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-black text-2xl flex items-center justify-center border border-slate-700"
              >
                <Minus className="w-6 h-6" />
              </button>
              <input
                type="number"
                value={heartRate}
                onChange={e => setHeartRate(Number(e.target.value))}
                className="w-20 text-center text-3xl font-black bg-transparent text-rose-400 focus:outline-none"
              />
              <button
                onClick={() => setHeartRate(prev => Math.min(220, prev + 1))}
                className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-black text-2xl flex items-center justify-center border border-slate-700"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Notes Input */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-slate-300 font-bold mb-2">
              <FileText className="w-5 h-5 text-amber-400" />
              <span>备注记录 (可留空)</span>
            </div>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="例如：早上吃了降压药，身体无异样"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 text-base font-medium focus:outline-none focus:border-amber-400"
            />
          </div>

        </div>

        {/* Action Buttons */}
        <div className="mt-6 space-y-3">
          <button
            onClick={handleSave}
            className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black text-xl flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/60 transition-all active:scale-95"
          >
            <Check className="w-7 h-7" />
            <span>确认保存并同步</span>
          </button>

          <button
            onClick={onReRecord}
            className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-base flex items-center justify-center gap-2 border border-slate-700"
          >
            <RotateCcw className="w-5 h-5" />
            <span>取消，重新录音说话</span>
          </button>
        </div>

      </div>
    </div>
  );
}
