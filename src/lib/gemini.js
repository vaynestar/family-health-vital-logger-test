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
 * SUPPORTS:
 * 1. "高压 135 低压 85 心率 72"
 * 2. "第一个 135 第二个 85 第三个 72"
 * 3. "上面 135 中间 85 下面 72"
 * 4. Positional sequence [1st=SYS, 2nd=DIA, 3rd=PULSE]
 */
export function localExtractVitals(rawText) {
  if (!rawText) return null;

  const text = convertChineseNumbers(rawText);
  const numbers = text.match(/\d+/g);

  let sys = null;
  let dia = null;
  let pulse = null;

  // Keyword extraction for "第一个/上面", "第二个/中间", "第三个/下面"
  const sysMatch = text.match(/(?:第一个|第一项|第一|上面|上面的|高压|收缩压|高的)[^\d]*(\d{2,3})/);
  const diaMatch = text.match(/(?:第二个|第二项|第二|中间|中间的|低压|舒张压|低的)[^\d]*(\d{2,3})/);
  const pulseMatch = text.match(/(?:第三个|第三项|第三|下面|下面的|最下面|最下|脉搏|心率|心跳)[^\d]*(\d{2,3})/);

  if (sysMatch) sys = parseInt(sysMatch[1], 10);
  if (diaMatch) dia = parseInt(diaMatch[1], 10);
  if (pulseMatch) pulse = parseInt(pulseMatch[1], 10);

  // If keyword matching didn't catch all, fallback to strict positional order
  if (numbers && numbers.length >= 3) {
    const nums = numbers.map(n => parseInt(n, 10));
    if (!sys) sys = nums[0];
    if (!dia) dia = nums[1];
    if (!pulse) pulse = nums[2];
  } else if (numbers && numbers.length === 2) {
    const nums = numbers.map(n => parseInt(n, 10));
    if (!sys) sys = nums[0];
    if (!dia) dia = nums[1];
    if (!pulse) pulse = 75;
  } else if (numbers && numbers.length > 0) {
    const nums = numbers.map(n => parseInt(n, 10));
    if (!sys) sys = nums[0];
    if (!dia && nums[1]) dia = nums[1];
    if (!pulse && nums[2]) pulse = nums[2];
  }

  // Extract clean remark text
  let cleanNote = rawText
    .replace(/(?:第一个|第二个|第三个|第一项|第二项|第三项|第一|第二|第三|上面|中间|下面|最下|高压|低压|收缩压|舒张压|心率|脉搏|心跳|次|分钟|毫米汞柱|mmHg|bpm|\d+)/gi, '')
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
长辈可能会说：
- "高压、低压、心率"
- "第一个、第二个、第三个"
- "上面、中间、下面"

解析映射规则：
- 第1个 / 第一个 / 上面 / 高压 = systolic (收缩压)
- 第2个 / 第二个 / 中间 / 低压 = diastolic (舒张压)
- 第3个 / 第三个 / 下面 / 心率 / 脉搏 = heart_rate (心率)

严格要求：第二个/中间必须是低压(diastolic)，第三个/下面必须是心率(heart_rate)！绝对不能颠倒！
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
