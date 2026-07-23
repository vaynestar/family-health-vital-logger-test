import React, { useState, useEffect } from 'react';
import { X, Save, Key, FileSpreadsheet, LogIn, ExternalLink, Sparkles, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { createHealthSpreadsheet, requestGoogleAccessToken, getStoredAccessToken } from '../lib/googleSheets';

export default function SettingsModal({ isOpen, onClose, onSaveSettings }) {
  const [clientId, setClientId] = useState('');
  const [sheetId, setSheetId] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setClientId(localStorage.getItem('gdrive_client_id') || '');
      setSheetId(localStorage.getItem('gdrive_sheet_id') || '');
      setGeminiApiKey(localStorage.getItem('gemini_api_key') || '');
      setGoogleConnected(!!getStoredAccessToken());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('gdrive_client_id', clientId.trim());
    localStorage.setItem('gdrive_sheet_id', sheetId.trim());
    localStorage.setItem('gemini_api_key', geminiApiKey.trim());

    onSaveSettings({
      clientId: clientId.trim(),
      sheetId: sheetId.trim(),
      geminiApiKey: geminiApiKey.trim()
    });

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleGoogleLogin = () => {
    try {
      requestGoogleAccessToken();
    } catch (err) {
      alert(err.message || 'Google 登录初始化失败，请先填入有效的 Google Client ID。');
    }
  };

  const handleAutoCreateSheet = async () => {
    const token = getStoredAccessToken();
    if (!token) {
      alert('请先登录 Google 帐号后再创建表格');
      return;
    }

    try {
      setIsCreatingSheet(true);
      const newSheetId = await createHealthSpreadsheet(token);
      setSheetId(newSheetId);
      localStorage.setItem('gdrive_sheet_id', newSheetId);
      alert(`创建成功！Google Sheet ID 已自动填入：\n${newSheetId}`);
    } catch (err) {
      alert(`创建 Google Sheet 失败: ${err.message}`);
    } finally {
      setIsCreatingSheet(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h3 className="text-2xl font-black text-white flex items-center gap-2">
            ⚙️ 参数设置与 Google 云端同步
          </h3>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-4 space-y-5">
          
          {/* Section 1: Google OAuth & Drive Sync */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h4 className="text-lg font-bold text-sky-400 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" /> 1. Google Drive / Sheets 自动同步
            </h4>

            {/* Login button */}
            <div className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-semibold text-slate-200">
                  {googleConnected ? 'Google 账号：已授权登录' : 'Google 账号：未授权登录'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95"
              >
                <LogIn className="w-4 h-4" />
                <span>{googleConnected ? '重新授权登录' : '登录 Google 帐号'}</span>
              </button>
            </div>

            <div>
              <label className="block text-slate-300 font-bold text-sm mb-1">
                Google OAuth 2.0 Client ID
              </label>
              <input
                type="text"
                value={clientId}
                onChange={e => setClientId(e.target.value)}
                placeholder="例如: 123456789-xxx.apps.googleusercontent.com"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm font-mono focus:border-sky-400 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-bold text-sm">
                  Google Sheet ID
                </label>
                <button
                  type="button"
                  onClick={handleAutoCreateSheet}
                  disabled={isCreatingSheet}
                  className="text-xs text-emerald-400 hover:underline font-bold flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" /> 自动在云端创建新表格
                </button>
              </div>
              <input
                type="text"
                value={sheetId}
                onChange={e => setSheetId(e.target.value)}
                placeholder="Google Sheet 网址中的 Spreadsheet ID 字符串"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm font-mono focus:border-sky-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Section 2: Gemini 2.5 Flash API Key */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h4 className="text-lg font-bold text-amber-400 flex items-center gap-2">
              <Key className="w-5 h-5" /> 2. Google Gemini 2.5 Flash API Key
            </h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              如果在 Vercel 后台已配置环境变量 <code>GEMINI_API_KEY</code>，此处可留空。若本地直连或离线模式，可填入自定义 API Key。
            </p>
            <input
              type="password"
              value={geminiApiKey}
              onChange={e => setGeminiApiKey(e.target.value)}
              placeholder="AIZASy..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm font-mono focus:border-amber-400 focus:outline-none"
            />
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              className="flex-1 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-lg flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all"
            >
              {savedSuccess ? (
                <>
                  <CheckCircle2 className="w-6 h-6 text-white" />
                  <span>已成功保存设置！</span>
                </>
              ) : (
                <>
                  <Save className="w-6 h-6" />
                  <span>保存参数配置</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3.5 rounded-2xl bg-slate-800 text-slate-300 font-bold text-base border border-slate-700"
            >
              关闭
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
