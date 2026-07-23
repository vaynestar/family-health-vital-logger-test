import React from 'react';
import { getBPCategory } from '../lib/bpCategory';
import { History, Download, Trash2, Cloud, CloudOff, RefreshCw, AlertCircle } from 'lucide-react';

export default function HistoryList({ records, onDeleteRecord, onSyncRecord, onExportCSV }) {
  if (!records || records.length === 0) {
    return (
      <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-6 my-6 text-center shadow-lg">
        <History className="w-8 h-8 text-slate-600 mx-auto mb-2" />
        <p className="text-slate-400 font-bold text-lg">尚无历史日志记录</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-6 sm:p-8 my-6 shadow-2xl">
      
      {/* Title & CSV Export */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <History className="w-6 h-6 text-emerald-400" />
          <h3 className="text-2xl font-black text-white">历史日志记录 ({records.length}条)</h3>
        </div>

        <button
          onClick={onExportCSV}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 border border-slate-700 font-bold text-sm transition-all active:scale-95 shadow-sm"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>导出 CSV 数据表格</span>
        </button>
      </div>

      {/* Record Cards */}
      <div className="space-y-4">
        {records.map((record) => {
          const category = getBPCategory(record.systolic, record.diastolic);
          const dateStr = new Date(record.timestamp).toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          });

          return (
            <div
              key={record.id}
              className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-slate-700 transition-colors shadow-md"
            >
              
              {/* Left Info: Vitals & Category */}
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <span className="text-slate-400 text-sm font-semibold">{dateStr}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${category.badgeColor}`}>
                    {category.label}
                  </span>
                  
                  {/* Sync Status Tag */}
                  {record.synced ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800">
                      <Cloud className="w-3 h-3" /> 已同步
                    </span>
                  ) : (
                    <button
                      onClick={() => onSyncRecord(record)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-950/60 text-amber-300 border border-amber-800 hover:bg-amber-900"
                      title="点击重试同步至 Google Sheet"
                    >
                      <CloudOff className="w-3 h-3 text-amber-400" /> 未同步 (点击同步)
                    </button>
                  )}
                </div>

                {/* Main Numbers */}
                <div className="flex items-baseline gap-4">
                  <div className="text-2xl sm:text-3xl font-black text-white">
                    {record.systolic} <span className="text-slate-500 font-light">/</span> {record.diastolic}
                    <span className="text-xs text-slate-400 font-normal ml-1">mmHg</span>
                  </div>
                  <div className="text-xl font-bold text-rose-400">
                    ❤️ {record.heart_rate} <span className="text-xs text-slate-400 font-normal">bpm</span>
                  </div>
                </div>

                {/* Notes */}
                {record.notes && (
                  <div className="text-sm text-slate-300 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{record.notes}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={() => onDeleteRecord(record.id)}
                  aria-label="删除记录"
                  className="p-2.5 rounded-xl bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-800 transition-all active:scale-95"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
