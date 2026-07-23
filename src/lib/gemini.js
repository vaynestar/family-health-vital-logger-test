import { GoogleGenAI, Type } from '@google/genai';

/**
 * Converts Chinese spoken number phrases (e.g. "一百三十五", "八十五", "七十二")
 * to standard Arabic digits (135, 85, 72) for robust local fallback extraction.
 */
export function convertChineseNumbers(str) {
  if (!str) return '';

  let text = str
    .replace(/一白|一佰|1百/g, '一百')
    .replace(/八十/g, '80')
    .replace(/九十/g, '90')
    .replace(/七十/g, '70')
    .replace(/六十/g, '60')
    .replace(/五十/g, '50')
    .replace(/四十/g, '40')
    .replace(/三十/g, '30')
    .replace(/二十/g, '20');

  const cnNumMap = {
    '零': 0, '一': 1, '二': 2, '两': 2, '三': 3, '四': 4,
    '五': 5, '六': 6, '七': 7, '八': 8, '九': 9
  };

  text = text.replace(/一百([一二两三四五六七八九])?十?([一二两三四五六七八九])?/g, (match, p1, p2) => {
    let tens = 0;
    let ones = 0;
    if (p1) tens = cnNumMap[p1] || 0;
    if (p2) ones = cnNumMap[p2] || 0;
    if (p1 && !p2 && !match.includes('十')) {
      return String(100 + tens * 10);
    }
    return String(100 + tens * 10 + ones);
  });

  text = text.replace(/([一二两三四五六七八九])?十([一二两三四五六七八九])?/g, (match, p1, p2) => {
    const tens = p1 ? cnNumMap[p1] : 1;
    const ones = p2 ? cnNumMap[p2] : 0;
    return String(tens * 10 + ones);
  });

  return text.replace(/[零一二两三四五六七八九]/g, (char) => cnNumMap[char] ?? char);
}

/**
 * Robust Local Fallback Parser
 * STRICT POSITION RULE:
 * In standard blood pressure readings (and machine screen top/middle/bottom order):
 * 1st number = Systolic / 高压 (SYS)
 * 2nd number = Diastolic / 低压 (DIA)
 * 3rd number = Heart Rate / 心率 (PULSE)
 * 
 * Never swap Diastolic (2nd) and Heart Rate (3rd)!
 */
export function localExtractVitals(rawText) {
  if (!rawText) return null;

  const text = convertChineseNumbers(rawText);
  const numbers = text.match(/\d+/g);

  let sys = null;
  let dia = null;
  let pulse = null;

  // 1. If 3 numbers are spoken sequentially (e.g. "135 85 72" or "高压135 低压85 心率72")
  // Positional order ALWAYS takes precedence to prevent swapping DIA and PULSE!
  if (numbers && numbers.length >= 3) {
    const nums = numbers.map(n => parseInt(n, 10));
    sys = nums[0];
    dia = nums[1];
    pulse = nums[2];
  } else if (numbers && numbers.length === 2) {
    const nums = numbers.map(n => parseInt(n, 10));
    sys = nums[0];
    dia = nums[1];
    pulse = 75; // Default resting pulse if omitted
  } else {
    // Keyword fallback for single or partial matches
    const sysMatch = text.match(/(?:高压|收缩压|高的|第一项|上面)[^\d]*(\d{2,3})/);
    const diaMatch = text.match(/(?:低压|舒张压|低的|第二项|中间)[^\d]*(\d{2,3})/);
    const pulseMatch = text.match(/(?:脉搏|心率|心跳|第三项|下面|最后一项)[^\d]*(\d{2,3})/);

    if (sysMatch) sys = parseInt(sysMatch[1], 10);
    if (diaMatch) dia = parseInt(diaMatch[1], 10);
    if (pulseMatch) pulse = parseInt(pulseMatch[1], 10);

    if (numbers && numbers.length > 0) {
      const nums = numbers.map(n => parseInt(n, 10));
      if (!sys) sys = nums[0];
      if (!dia && nums[1]) dia = nums[1];
      if (!pulse && nums[2]) pulse = nums[2];
    }
  }

  // Extract clean remark text (remove numbers and vital keywords)
  let cleanNote = rawText
    .replace(/(?:高压|低压|收缩压|舒张压|心率|脉搏|次|分钟|毫米汞柱|mmHg|bpm|\d+)/gi, '')
    .replace(/[，。！？\s,.]+/g, ' ')
    .trim();

  if (cleanNote.length <= 1) {
    cleanNote = '';
  }

  return {
    systolic: sys || 120,
    diastolic: dia || 80,
    heart_rate: pulse || 72,
    notes: cleanNote,
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
根据血压计屏幕（上、中、下）固定顺序：
第1个数字 = systolic (高压 / 收缩压)
第2个数字 = diastolic (低压 / 舒张压)
第3个数字 = heart_rate (心率 / 脉搏)

严格规则：第二个数字是低压(diastolic)，第三个数字是心率(heart_rate)！绝对不能颠倒低压和心率！
只返回结构化 JSON。`;

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

  // 3. Guaranteed Local Parser Fallback
  return localExtractVitals(cleanText);
}
