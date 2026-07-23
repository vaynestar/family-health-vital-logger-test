import React from 'react';
import { X, HelpCircle, ArrowDown } from 'lucide-react';

export default function MachineGuideModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h3 className="text-2xl font-black text-white flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-sky-400" />
            血压计屏幕读数说明
          </h3>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <p className="text-slate-300 text-base my-3 font-medium">
          以常见欧姆龙 (OMRON) 电子血压计为例，屏幕从上到下依次对应 3 个数值：
        </p>

        {/* Illustrated Machine Diagram Box */}
        <div className="bg-slate-950 border-4 border-slate-700 rounded-3xl p-5 my-4 space-y-4 shadow-inner relative">
          
          <div className="text-center font-black text-slate-400 tracking-wider text-sm border-b border-slate-800 pb-2">
            OMRON 血压计显示屏
          </div>

          {/* TOP NUMBER */}
          <div className="bg-slate-900 border-2 border-sky-500/80 rounded-2xl p-3 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-sky-400 uppercase">SYS mmHg</div>
              <div className="text-slate-200 font-extrabold text-lg">最上方数字 (Top)</div>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black text-sky-400">128</span>
              <div className="text-xs font-bold text-sky-300">高压 (收缩压)</div>
            </div>
          </div>

          <div className="flex justify-center text-slate-600">
            <ArrowDown className="w-5 h-5 animate-bounce" />
          </div>

          {/* MIDDLE NUMBER */}
          <div className="bg-slate-900 border-2 border-teal-500/80 rounded-2xl p-3 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-teal-400 uppercase">DIA mmHg</div>
              <div className="text-slate-200 font-extrabold text-lg">中间数字 (Middle)</div>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black text-teal-400">82</span>
              <div className="text-xs font-bold text-teal-300">低压 (舒张压)</div>
            </div>
          </div>

          <div className="flex justify-center text-slate-600">
            <ArrowDown className="w-5 h-5 animate-bounce" />
          </div>

          {/* BOTTOM NUMBER */}
          <div className="bg-slate-900 border-2 border-rose-500/80 rounded-2xl p-3 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-rose-400 uppercase">PULSE /min</div>
              <div className="text-slate-200 font-extrabold text-lg">最下方数字 (Bottom)</div>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black text-rose-400">72</span>
              <div className="text-xs font-bold text-rose-300">心率 / 脉搏 (bpm)</div>
            </div>
          </div>

        </div>

        {/* Tip for Multi-Round Measurements */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 text-sm text-slate-300 font-medium">
          💡 <strong>多次测量建议：</strong> 连续测量 2 ~ 3 次时，中间休息 1-2 分钟。可在口述时直接读出最后一次更精准的数值，或直接按步骤依次保存。
        </div>

        <div className="mt-5">
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-black text-lg shadow-lg active:scale-95 transition-all"
          >
            我知道了，开始记录
          </button>
        </div>

      </div>
    </div>
  );
}
