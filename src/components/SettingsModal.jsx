import React, { useState, useEffect } from 'react';
import { X, Save, Key, FileSpreadsheet, LogIn, Sparkles, ShieldCheck, CheckCircle2, Link2, Copy, Check } from 'lucide-react';
import { createHealthSpreadsheet, requestGoogleAccessToken, getStoredAccessToken } from '../lib/googleSheets';

export default function SettingsModal({ isOpen, onClose, onSaveSettings }) {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [clientId, setClientId] = useState('');
  const [sheetId, setSheetId] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setWebhookUrl(localStorage.getItem('gdrive_webhook_url') || '');
      setClientId(localStorage.getItem('gdrive_client_id') || '');
      setSheetId(localStorage.getItem('gdrive_sheet_id') || '');
      setGeminiApiKey(localStorage.getItem('gemini_api_key') || '');
      setGoogleConnected(!!getStoredAccessToken());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('gdrive_webhook_url', webhookUrl.trim());
    localStorage.setItem('gdrive_client_id', clientId.trim());
    localStorage.setItem('gdrive_sheet_id', sheetId.trim());
    localStorage.setItem('gemini_api_key', geminiApiKey.trim());

    onSaveSettings({
      webhookUrl: webhookUrl.trim(),
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

  const appsScriptCode = `function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  if (sheet.getLastRow() == 0) {
    sheet.appendRow(["测量时间 Date & Time", "收缩压/高压 Systolic (mmHg)", "舒张压/低压 Diastolic (mmHg)", "心率/脉搏 Heart Rate (BPM)", "血压状态 BP Status", "备注说明 Notes"]);
  }
  var data = JSON.parse(e.postData.contents);
  sheet.appendRow([data.timestamp, data.systolic, data.diastolic, data.heart_rate, data.category, data.notes]);
  return ContentService.createTextOutput("SUCCESS");
}`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const handleGoogleLogin = () => {
    try {
      requestGoogleAccessToken();
    } catch (err) {
      alert(err.message || 'Google 登录初始化失败，请先填入有效的 Client ID');
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
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
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
          
          {/* Section 1: NO-LOGIN Google Sheet Webhook Sync */}
          <div className="bg-slate-950 border-2 border-emerald-500/80 rounded-2xl p-4 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-black text-emerald-400 flex items-center gap-2">
                <Link2 className="w-5 h-5" /> 方案 A：免登录自动同步 (推荐父母使用!)
              </h4>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-950 text-emerald-300 border border-emerald-700">
                父母端零摩擦
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              在您的 Google Sheet 中添加 1 行 Apps Script 代码，复制生成的 Webhook 链接填入下方。<strong>父母使用手机时无需登录任何 Gmail 账号</strong>，记录将自动静默写入您的中英双语 Google 表格中！
            </p>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-bold text-xs">
                  Google Apps Script Webhook URL
                </label>
                <button
                  type="button"
                  onClick={handleCopyScript}
                  className="text-xs text-sky-400 hover:underline font-bold flex items-center gap-1"
                >
                  {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedScript ? '已复制脚本代码' : '复制代码片段'}</span>
                </button>
              </div>
              <input
                type="text"
                value={webhookUrl}
                onChange={e => setWebhookUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm font-mono focus:border-emerald-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Section 2: OAuth 2.0 Direct Client */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h4 className="text-lg font-bold text-sky-400 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" /> 方案 B：Google OAuth 2.0 账号授权登录
            </h4>

            <div className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-semibold text-slate-200">
                  {googleConnected ? 'Google 账号：已授权' : 'Google 账号：未授权'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1 shadow-md active:scale-95"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{googleConnected ? '重新授权' : '登录 Google'}</span>
              </button>
            </div>

            <div>
              <label className="block text-slate-300 font-bold text-xs mb-1">
                Google OAuth Client ID
              </label>
              <input
                type="text"
                value={clientId}
                onChange={e => setClientId(e.target.value)}
                placeholder="123456789-xxx.apps.googleusercontent.com"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 text-xs font-mono focus:border-sky-400 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-bold text-xs">
                  Google Sheet ID
                </label>
                <button
                  type="button"
                  onClick={handleAutoCreateSheet}
                  disabled={isCreatingSheet}
                  className="text-xs text-emerald-400 hover:underline font-bold flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" /> 自动创建新表格
                </button>
              </div>
              <input
                type="text"
                value={sheetId}
                onChange={e => setSheetId(e.target.value)}
                placeholder="Spreadsheet ID 字符串"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 text-xs font-mono focus:border-sky-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Section 3: Gemini 2.5 Flash API Key */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
            <h4 className="text-lg font-bold text-amber-400 flex items-center gap-2">
              <Key className="w-5 h-5" /> 3. Gemini 2.5 Flash API Key
            </h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              在 Vercel 环境变量配置 <code>GEMINI_API_KEY</code> 后可留空。若本地直连，可填入 <code>AQ...</code> 或 <code>AIzaSy...</code> Key。
            </p>
            <input
              type="password"
              value={geminiApiKey}
              onChange={e => setGeminiApiKey(e.target.value)}
              placeholder="AQ... 或 AIzaSy..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm font-mono focus:border-amber-400 focus:outline-none"
            />
          </div>

          {/* Save Button */}
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
