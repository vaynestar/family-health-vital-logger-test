/**
 * Google Sheets Integration:
 * Supports BOTH:
 * 1. No-Login Webhook Sync (Google Apps Script Web App URL) - BEST FOR ELDERLY PARENTS!
 * 2. Direct OAuth 2.0 GIS Client (Google Identity Services)
 */

const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file';

let tokenClient = null;
let gapiInited = false;
let gsisInited = false;

// -------------------------------------------------------------
// 1. NO-LOGIN WEBHOOK SYNC (Google Apps Script)
// -------------------------------------------------------------
export async function sendRecordViaWebhook(record, webhookUrl) {
  const targetUrl = (webhookUrl || localStorage.getItem('gdrive_webhook_url') || '').trim();
  if (!targetUrl) {
    throw new Error('未配置 Google Apps Script Webhook URL');
  }

  const sys = Number(record.systolic);
  const dia = Number(record.diastolic);
  let categoryText = '正常 Normal';
  if (sys >= 140 || dia >= 90) categoryText = '2级高血压 Stage 2 High';
  else if (sys >= 130 || dia >= 80) categoryText = '1级高血压 Stage 1 High';
  else if (sys >= 120) categoryText = '正常高值 Elevated';

  const formattedDate = new Date(record.timestamp).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const payload = {
    timestamp: formattedDate,
    systolic: record.systolic,
    diastolic: record.diastolic,
    heart_rate: record.heart_rate,
    category: categoryText,
    notes: record.notes || ''
  };

  await fetch(targetUrl, {
    method: 'POST',
    mode: 'no-cors',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify(payload)
  });

  return true;
}

// -------------------------------------------------------------
// 2. OAUTH 2.0 GIS CLIENT
// -------------------------------------------------------------
export function loadGoogleScripts() {
  return new Promise((resolve, reject) => {
    if (!document.getElementById('google-gis-script')) {
      const scriptGis = document.createElement('script');
      scriptGis.id = 'google-gis-script';
      scriptGis.src = 'https://accounts.google.com/gsi/client';
      scriptGis.async = true;
      scriptGis.defer = true;
      scriptGis.onload = () => {
        gsisInited = true;
        if (gapiInited) resolve();
      };
      scriptGis.onerror = reject;
      document.body.appendChild(scriptGis);
    } else {
      gsisInited = true;
    }

    if (!document.getElementById('google-gapi-script')) {
      const scriptGapi = document.createElement('script');
      scriptGapi.id = 'google-gapi-script';
      scriptGapi.src = 'https://apis.google.com/js/api.js';
      scriptGapi.async = true;
      scriptGapi.defer = true;
      scriptGapi.onload = () => {
        window.gapi.load('client', async () => {
          gapiInited = true;
          if (gsisInited) resolve();
        });
      };
      scriptGapi.onerror = reject;
      document.body.appendChild(scriptGapi);
    } else {
      gapiInited = true;
      if (gsisInited) resolve();
    }
  });
}

export function initGoogleOAuthClient(clientId, onTokenReceived, onError) {
  if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
    return null;
  }

  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: SCOPES,
    callback: async (resp) => {
      if (resp.error !== undefined) {
        if (onError) onError(resp);
        return;
      }
      localStorage.setItem('gdrive_access_token', resp.access_token);
      localStorage.setItem('gdrive_token_expires_at', Date.now() + (resp.expires_in * 1000));
      if (onTokenReceived) onTokenReceived(resp.access_token);
    },
  });

  return tokenClient;
}

export function requestGoogleAccessToken() {
  if (tokenClient) {
    tokenClient.requestAccessToken({ prompt: 'consent' });
  } else {
    throw new Error('Google OAuth 客户端未初始化');
  }
}

export function getStoredAccessToken() {
  const token = localStorage.getItem('gdrive_access_token');
  const expiresAt = Number(localStorage.getItem('gdrive_token_expires_at') || 0);
  if (token && Date.now() < expiresAt - 60000) {
    return token;
  }
  return null;
}

export async function createHealthSpreadsheet(accessToken) {
  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: { title: '长辈健康血压心率日志 | Family Health Vital Logger' },
      sheets: [{
        properties: { title: '血压心率记录 | Vitals' },
        data: [{
          startRow: 0, startColumn: 0,
          rowData: [{
            values: [
              { userEnteredValue: { stringValue: '测量时间 Date & Time' } },
              { userEnteredValue: { stringValue: '收缩压/高压 Systolic (mmHg)' } },
              { userEnteredValue: { stringValue: '舒张压/低压 Diastolic (mmHg)' } },
              { userEnteredValue: { stringValue: '心率/脉搏 Heart Rate (BPM)' } },
              { userEnteredValue: { stringValue: '血压状态 BP Status' } },
              { userEnteredValue: { stringValue: '备注说明 Notes' } }
            ]
          }]
        }]
      }]
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || '创建 Google Sheet 失败');
  }

  const data = await response.json();
  return data.spreadsheetId;
}

export async function appendRecordToSheet(spreadsheetId, record, accessToken) {
  const token = accessToken || getStoredAccessToken();
  if (!token) {
    throw new Error('Google 帐号未登录或 Access Token 已过期');
  }

  const formattedDate = new Date(record.timestamp).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false
  });

  const sys = Number(record.systolic);
  const dia = Number(record.diastolic);
  let categoryText = '正常 Normal';
  if (sys >= 140 || dia >= 90) categoryText = '2级高血压 Stage 2 High';
  else if (sys >= 130 || dia >= 80) categoryText = '1级高血压 Stage 1 High';
  else if (sys >= 120) categoryText = '正常高值 Elevated';

  const values = [[formattedDate, record.systolic, record.diastolic, record.heart_rate, categoryText, record.notes || '']];
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'血压心率记录 | Vitals'!A:F:append?valueInputOption=USER_ENTERED`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ values })
  });

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.error?.message || '写入 Google Sheet 失败');
  }

  return await response.json();
}
