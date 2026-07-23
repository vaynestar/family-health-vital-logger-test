import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import HeroReadingCard from './components/HeroReadingCard';
import VoiceMicButton from './components/VoiceMicButton';
import ParseConfirmModal from './components/ParseConfirmModal';
import ManualEntryModal from './components/ManualEntryModal';
import MachineGuideModal from './components/MachineGuideModal';
import CalendarModal from './components/CalendarModal';
import HistoryList from './components/HistoryList';
import SettingsModal from './components/SettingsModal';

import { saveRecord, getAllRecords, deleteRecord, markAsSynced } from './lib/db';
import { parseSpeechTranscript, localExtractVitals } from './lib/gemini';
import { isSpeechSupported, createSpeechRecognizer } from './lib/speechRecognition';
import { loadGoogleScripts, initGoogleOAuthClient, appendRecordToSheet, sendRecordViaWebhook, getStoredAccessToken } from './lib/googleSheets';

export default function App() {
  const [records, setRecords] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [speechError, setSpeechError] = useState('');
  const [parsedResult, setParsedResult] = useState(null);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [syncStatus, setSyncStatus] = useState('synced');

  const recognizerRef = useRef(null);
  const latestTranscriptRef = useRef('');

  useEffect(() => {
    loadRecords();

    loadGoogleScripts().then(() => {
      const clientId = localStorage.getItem('gdrive_client_id');
      if (clientId) {
        initGoogleOAuthClient(
          clientId,
          () => setSyncStatus('synced'),
          (err) => console.warn('OAuth error:', err)
        );
      }
    }).catch(err => console.warn('Google script load issue:', err));

    const handleOnline = () => syncPendingRecords();
    const handleOffline = () => setSyncStatus('offline');
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadRecords = async () => {
    try {
      const data = await getAllRecords();
      setRecords(data);
      const unsynced = data.filter(r => !r.synced);
      if (unsynced.length > 0) {
        setSyncStatus('offline');
      } else {
        setSyncStatus('synced');
      }
    } catch (err) {
      console.error('Error loading IndexedDB records:', err);
    }
  };

  const syncPendingRecords = async () => {
    const webhookUrl = localStorage.getItem('gdrive_webhook_url');
    const sheetId = localStorage.getItem('gdrive_sheet_id');
    const token = getStoredAccessToken();

    if (!webhookUrl && (!sheetId || !token)) {
      setSyncStatus('offline');
      return;
    }

    setSyncStatus('syncing');
    try {
      const all = await getAllRecords();
      const pending = all.filter(r => !r.synced);

      for (const rec of pending) {
        if (webhookUrl) {
          await sendRecordViaWebhook(rec, webhookUrl);
          await markAsSynced(rec.id);
        } else if (sheetId && token) {
          await appendRecordToSheet(sheetId, rec, token);
          await markAsSynced(rec.id);
        }
      }

      await loadRecords();
      setSyncStatus('synced');
    } catch (err) {
      console.warn('Sync pending records error:', err);
      setSyncStatus('offline');
    }
  };

  const handleStartListening = () => {
    setSpeechError('');
    setTranscript('');
    latestTranscriptRef.current = '';

    if (!isSpeechSupported()) {
      setSpeechError('当前浏览器不支持语音识别，已打开“手动输入”');
      setShowManualModal(true);
      return;
    }

    const recognizer = createSpeechRecognizer({
      onStart: () => setIsListening(true),
      onResult: ({ transcript: tText }) => {
        setTranscript(tText);
        latestTranscriptRef.current = tText;
      },
      onError: ({ message }) => {
        setIsListening(false);
        setSpeechError(message);
      },
      onEnd: () => {
        setIsListening(false);
        const textToProcess = latestTranscriptRef.current || transcript;
        if (textToProcess.trim()) {
          handleProcessTranscript(textToProcess);
        }
      }
    });

    if (recognizer) {
      recognizerRef.current = recognizer;
      try {
        recognizer.start();
      } catch (err) {
        console.warn('Error starting recognizer:', err);
        setIsListening(false);
      }
    }
  };

  const handleStopListening = () => {
    if (recognizerRef.current) {
      try {
        recognizerRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    setIsListening(false);

    const textToProcess = latestTranscriptRef.current || transcript;
    if (textToProcess.trim()) {
      handleProcessTranscript(textToProcess);
    }
  };

  const handleProcessTranscript = async (textToParse) => {
    setIsProcessing(true);
    setSpeechError('');

    try {
      const customApiKey = localStorage.getItem('gemini_api_key') || '';
      const result = await parseSpeechTranscript(textToParse, customApiKey);
      setParsedResult(result);
    } catch (err) {
      console.warn('AI Parsing fallback triggered:', err);
      const fallback = localExtractVitals(textToParse);
      setParsedResult(fallback);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmRecordSave = async (recordData) => {
    try {
      const saved = await saveRecord(recordData);
      setParsedResult(null);
      setTranscript('');
      latestTranscriptRef.current = '';

      const webhookUrl = localStorage.getItem('gdrive_webhook_url');
      const sheetId = localStorage.getItem('gdrive_sheet_id');
      const token = getStoredAccessToken();

      if (webhookUrl || (sheetId && token)) {
        setSyncStatus('syncing');
        try {
          if (webhookUrl) {
            await sendRecordViaWebhook(saved, webhookUrl);
            await markAsSynced(saved.id);
          } else {
            await appendRecordToSheet(sheetId, saved, token);
            await markAsSynced(saved.id);
          }
          setSyncStatus('synced');
        } catch (syncErr) {
          console.warn('Immediate sync error, stored offline:', syncErr);
          setSyncStatus('offline');
        }
      }

      await loadRecords();
    } catch (err) {
      alert(`保存失败: ${err.message}`);
    }
  };

  const handleDeleteRecord = async (id) => {
    if (window.confirm('确定要删除这条健康记录吗？')) {
      await deleteRecord(id);
      await loadRecords();
    }
  };

  const handleExportCSV = () => {
    if (!records || records.length === 0) return;

    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';
    csvContent += '测量时间,高压(收缩压),低压(舒张压),心率(脉搏),备注\n';

    records.forEach(r => {
      const dateStr = new Date(r.timestamp).toLocaleString('zh-CN');
      csvContent += `"${dateStr}",${r.systolic},${r.diastolic},${r.heart_rate},"${r.notes || ''}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `长辈血压心率日志_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const latestRecord = records.length > 0 ? records[0] : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-rose-500 selection:text-white">
      
      <Header
        syncStatus={syncStatus}
        onOpenSettings={() => setShowSettingsModal(true)}
        onManualSync={syncPendingRecords}
      />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6">
        
        <div className="mb-2 text-right">
          <button
            onClick={() => setShowGuideModal(true)}
            className="text-xs sm:text-sm text-sky-400 hover:text-sky-300 font-bold underline flex items-center gap-1 ml-auto"
          >
            📖 查看血压计(SYS/DIA/PULSE)屏幕数字说明
          </button>
        </div>

        <HeroReadingCard latestRecord={latestRecord} />

        <VoiceMicButton
          isListening={isListening}
          isProcessing={isProcessing}
          transcript={transcript}
          errorMsg={speechError}
          onStartListening={handleStartListening}
          onStopListening={handleStopListening}
          onOpenManualEntry={() => setShowManualModal(true)}
        />

        <HistoryList
          records={records}
          onDeleteRecord={handleDeleteRecord}
          onSyncRecord={syncPendingRecords}
          onExportCSV={handleExportCSV}
          onOpenCalendar={() => setShowCalendarModal(true)}
        />

      </main>

      <footer className="text-center py-6 text-slate-500 text-sm border-t border-slate-900 bg-slate-950">
        <p>❤️ 专为长辈设计的关爱健康记录仪 (Voice PWA)</p>
        <p className="text-xs text-slate-600 mt-1">支持无登录自动同步 Google Sheet & 离线保护</p>
      </footer>

      <ParseConfirmModal
        parsedResult={parsedResult}
        onConfirm={handleConfirmRecordSave}
        onCancel={() => setParsedResult(null)}
        onReRecord={() => {
          handleStartListening();
        }}
      />

      <ManualEntryModal
        isOpen={showManualModal}
        onClose={() => setShowManualModal(false)}
        onSave={handleConfirmRecordSave}
      />

      <MachineGuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
      />

      <CalendarModal
        isOpen={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
        records={records}
      />

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onSaveSettings={loadRecords}
      />

    </div>
  );
}
