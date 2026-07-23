import React, { useState } from 'react';
import { getBPCategory } from '../lib/bpCategory';
import { Check, X, Keyboard, Activity, Heart, FileText } from 'lucide-react';

export default function ManualEntryModal({ isOpen, onClose, onSave }) {
  const [systolic, setSystolic] = useState(120);
  const [diastolic, setDiastolic] = useState(80);
  const [heartRate, setHeartRate] = useState(72);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const category = getBPCategory(systolic, diastolic);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      systolic: Number(systolic),
      diastolic: Number(diastolic),
      heart_rate: Number(heartRate),
      notes: notes.trim(),
      timestamp: new Date().toISOString()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h3 className="text-2xl font-black text-white flex items-center gap-2">
            <Keyboard className="w-6 h-6 text-amber-400" />
            手动输入血压心率
          </h3>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          
          {/* BP Preview */}
          <div className={`p-3 rounded-2xl border text-center font-bold text-base ${category.color}`}>
            状态预测：{category.label}
          </div>

          {/* Systolic */}
          <div>
            <label className="block text-slate-300 font-bold text-base mb-1 flex items-center gap-2">
              <Activity className="w-5 h-5 text-sky-400" /> 高压 (收缩压 mmHg)
            </label>
            <input
              type="number"
              required
              min="50"
              max="260"
              value={systolic}
              onChange={e => setSystolic(e.target.value)}
              className="w-full bg-slate-950 border-2 border-slate-700 rounded-2xl px-4 py-3 text-3xl font-black text-white focus:border-sky-400 focus:outline-none"
            />
          </div>

          {/* Diastolic */}
          <div>
            <label className="block text-slate-300 font-bold text-base mb-1 flex items-center gap-2">
              <Activity className="w-5 h-5 text-teal-400" /> 低压 (舒张压 mmHg)
            </label>
            <input
              type="number"
              required
              min="30"
              max="180"
              value={diastolic}
              onChange={e => setDiastolic(e.target.value)}
              className="w-full bg-slate-950 border-2 border-slate-700 rounded-2xl px-4 py-3 text-3xl font-black text-white focus:border-teal-400 focus:outline-none"
            />
          </div>

          {/* Heart Rate */}
          <div>
            <label className="block text-slate-300 font-bold text-base mb-1 flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500" /> 心率 / 脉搏 (bpm 次/分)
            </label>
            <input
              type="number"
              required
              min="30"
              max="220"
              value={heartRate}
              onChange={e => setHeartRate(e.target.value)}
              className="w-full bg-slate-950 border-2 border-slate-700 rounded-2xl px-4 py-3 text-3xl font-black text-rose-400 focus:border-rose-400 focus:outline-none"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-slate-300 font-bold text-base mb-1 flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-400" /> 备注说明 (选填)
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="如：早上服药后测量"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 font-medium focus:border-amber-400 focus:outline-none"
            />
          </div>

          {/* Buttons */}
          <div className="pt-4 space-y-3">
            <button
              type="submit"
              className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xl flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/60 active:scale-95 transition-all"
            >
              <Check className="w-7 h-7" />
              <span>保存记录</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-2xl bg-slate-800 text-slate-300 font-bold text-base border border-slate-700"
            >
              取消
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
