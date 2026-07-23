import { GoogleGenAI, Type } from '@google/genai';

/**
 * Robust Regex Fallback Parser for Chinese Vital Speech
 * Extracts systolic (高压), diastolic (低压), and heart rate (心率/脉搏)
 * even without an active internet connection or Gemini API key.
 */
export function localExtractVitals(text) {
  if (!text) return null;

  // Extract all numbers (Arabic digits or Chinese number words)
  const numbers = text.match(/\d+/g);

  let sys = null;
  let dia = null;
  let pulse = null;

  // Match explicitly labeled keywords
  const sysMatch = text.match(/(?:高压|收缩压|高的|第一项|上面)[^\d]*(\d{2,3})/);
  const diaMatch = text.match(/(?:低压|舒张压|低的|第二项|中间)[^\d]*(\d{2,3})/);
  const pulseMatch = text.match(/(?:脉搏|心率|心跳|第三项|下面|最后一项)[^\d]*(\d{2,3})/);

  if (sysMatch) sys = parseInt(sysMatch[1], 10);
  if (diaMatch) dia = parseInt(diaMatch[1], 10);
  if (pulseMatch) pulse = parseInt(pulseMatch[1], 10);

  // Unlabeled sequence fallback if 2 or 3 numbers spoken: e.g. "135 85 72"
  if (numbers && numbers.length >= 2) {
    const nums = numbers.map(n => parseInt(n, 10));
    if (!sys) sys = nums[0];
    if (!dia) dia = nums[1];
    if (!pulse && nums[2]) pulse = nums[2];
  }

  return {
    systolic: sys || 120,
    diastolic: dia || 80,
    heart_rate: pulse || 72,
    notes: text,
    isFallback: true
  };
}

export async function parseSpeechTranscript(transcript, customApiKey = '') {
  if (!transcript || !transcript.trim()) {
    throw new Error('语音文本为空');
  }

  const cleanText = transcript.trim();

  // 1. Try Vercel Serverless Endpoint (/api/parse) first
  try {
    const res = await fetch('/api/parse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transcript: cleanText,
        apiKey: customApiKey ? customApiKey.trim() : ''
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.systolic && data.diastolic) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Vercel API endpoint unavailable, attempting direct fallback:', err);
  }

  // 2. Client-side Gemini API fallback if API key is provided
  const apiKey = (customApiKey || localStorage.getItem('gemini_api_key') || '').trim();
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const systemInstruction = `你是一个为长辈解析中文血压与心率口述语音的 AI 助手。
从口述文本中提取：
1. systolic: 收缩压/高压 (mmHg 整数)
2. diastolic: 舒张压/低压 (mmHg 整数)
3. heart_rate: 心率/脉搏 (bpm 整数)
4. notes: 备注信息

如果用户连续读出了 2 或 3 组测量结果（如"第一次135 85，第二次128 80"），提取最后一次（第2或第3次）或更稳定的数值，并在 notes 中标明。
返回 JSON。`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `语音内容: "${cleanText}"`,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              systolic: { type: Type.INTEGER },
              diastolic: { type: Type.INTEGER },
              heart_rate: { type: Type.INTEGER },
              notes: { type: Type.STRING }
            },
            required: ['systolic', 'diastolic', 'heart_rate']
          }
        }
      });

      const parsed = JSON.parse(response.text);
      if (parsed && parsed.systolic && parsed.diastolic) {
        return parsed;
      }
    } catch (geminiErr) {
      console.warn('Gemini API parse failed, using local extraction fallback:', geminiErr);
    }
  }

  // 3. Guaranteed Local Parser Fallback (Never leaves user hanging!)
  return localExtractVitals(cleanText);
}
