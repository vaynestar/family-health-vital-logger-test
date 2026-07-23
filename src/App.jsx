import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import HeroReadingCard from './components/HeroReadingCard';
import VoiceMicButton from './components/VoiceMicButton';
import ParseConfirmModal from './components/ParseConfirmModal';
import ManualEntryModal from './components/ManualEntryModal';
import HistoryList from './components/HistoryList';
import SettingsModal from './components/SettingsModal';

import { saveRecord, getAllRecords, deleteRecord, markAsSynced } from './lib/db';
import { parseSpeechTranscript } from './lib/gemini';
import { isSpeechSupported, createSpeechRecognizer } from './lib/speechRecognition';
import { loadGoogleScripts, initGoogleOAuthClient, appendRecordToSheet, getStoredAccessToken } from './lib/googleSheets';

export default function App() {
  const [records, setRecords] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [speechError, setSpeechError] = useState('');
  const [parsedResult, setParsedResult] = useState(null);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [syncStatus, setSyncStatus] = useState('synced'); // 'synced' | 'syncing' | 'offline'

  const recognizerRef = useRef(null);

  // 1. Initial Load & Google Scripts
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

    // Online/offline listeners
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

  // 2. Syncing unsynced records to Google Sheet
  const syncPendingRecords = async () => {
    const sheetId = localStorage.getItem('gdrive_sheet_id');
    const token = getStoredAccessToken();

    if (!sheetId || !token) {
      setSyncStatus('offline');
      return;
    }

    setSyncStatus('syncing');
    try {
      const all = await getAllRecords();
      const pending = all.filter(r => !r.synced);

      for (const rec of pending) {
        await appendRecordToSheet(sheetId, rec, token);
        await markAsSynced(rec.id);
      }

      await loadRecords();
      setSyncStatus('synced');
    } catch (err) {
      console.warn('Sync pending records error:', err);
      setSyncStatus('offline');
    }
  };

  // 3. Speech Recognition Logic
  const handleStartListening = () => {
    setSpeechError('');
    setTranscript('');

    if (!isSpeechSupported()) {
      setSpeechError('当前浏览器不支持语音识别，请直接点击“手动输入”');
      setShowManualModal(true);
      return;
    }

    const recognizer = createSpeechRecognizer({
      onStart: () => setIsListening(true),
      onResult: ({ transcript }) => {
        setTranscript(transcript);
      },
      onError: ({ message }) => {
        setIsListening(false);
        setSpeechError(message);
      },
      onEnd: () => {
        setIsListening(false);
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

    if (transcript.trim()) {
      handleProcessTranscript(transcript);
    }
  };

  // 4. Gemini Parsing
  const handleProcessTranscript = async (textToParse) => {
    setIsProcessing(true);
    setSpeechError('');

    try {
      const customApiKey = localStorage.getItem('gemini_api_key') || '';
      const result = await parseSpeechTranscript(textToParse, customApiKey);
      setParsedResult(result);
    } catch (err) {
      console.error('Parsing error:', err);
      setSpeechError(err.message || 'AI 解析语音失败，请重试');
    } finally {
      setIsProcessing(false);
    }
  };

  // 5. Saving Record (Local IndexedDB + Try Google Sheet Sync)
  const handleConfirmRecordSave = async (recordData) => {
    try {
      const saved = await saveRecord(recordData);
      setParsedResult(null);
      setTranscript('');

      // Attempt immediate Google Sheet sync
      const sheetId = localStorage.getItem('gdrive_sheet_id');
      const token = getStoredAccessToken();

      if (sheetId && token) {
        setSyncStatus('syncing');
        try {
          await appendRecordToSheet(sheetId, saved, token);
          await markAsSynced(saved.id);
          setSyncStatus('synced');
        } catch (syncErr) {
          console.warn('Immediate sync error, kept in offline queue:', syncErr);
          setSyncStatus('offline');
        }
      }

      await loadRecords();
    } catch (err) {
      alert(`保存失败: ${err.message}`);
    }
  };

  // 6. Delete Record
  const handleDeleteRecord = async (id) => {
    if (window.confirm('确定要删除这条健康记录吗？')) {
      await deleteRecord(id);
      await loadRecords();
    }
  };

  // 7. CSV Export
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
      
      {/* Header Bar */}
      <Header
        syncStatus={syncStatus}
        onOpenSettings={() => setShowSettingsModal(true)}
        onManualSync={syncPendingRecords}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6">
        
        {/* Hero Card with latest reading */}
        <HeroReadingCard latestRecord={latestRecord} />

        {/* Massive Voice Mic Button */}
        <VoiceMicButton
          isListening={isListening}
          isProcessing={isProcessing}
          transcript={transcript}
          errorMsg={speechError}
          onStartListening={handleStartListening}
          onStopListening={handleStopListening}
          onOpenManualEntry={() => setShowManualModal(true)}
        />

        {/* History Log List */}
        <HistoryList
          records={records}
          onDeleteRecord={handleDeleteRecord}
          onSyncRecord={syncPendingRecords}
          onExportCSV={handleExportCSV}
        />

      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-slate-500 text-sm border-t border-slate-900 bg-slate-950">
        <p>❤️ 专为长辈设计的关爱健康记录仪 (Voice PWA)</p>
        <p className="text-xs text-slate-600 mt-1">支持离线存储与 Google Drive 云端安全备份</p>
      </footer>

      {/* Modals */}
      <ParseConfirmModal
        parsedResult={parsedResult}
        onConfirm={handleConfirmRecordSave}
        onCancel={() => setParsedResult(null)}
        onReRecord={() => {
          setParsedResult(null);
          handleStartListening();
        }}
      />

      <ManualEntryModal
        isOpen={showManualModal}
        onClose={() => setShowManualModal(false)}
        onSave={handleConfirmRecordSave}
      />

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onSaveSettings={loadRecords}
      />

    </div>
  );
}
