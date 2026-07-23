import { GoogleGenAI, Type } from '@google/genai';

export async function parseSpeechTranscript(transcript, customApiKey = '') {
  if (!transcript || !transcript.trim()) {
    throw new Error('语音文本为空');
  }

  // 1. Try serverless endpoint first (/api/parse)
  try {
    const res = await fetch('/api/parse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transcript,
        apiKey: customApiKey
      })
    });

    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.warn('Vercel API route unavailable or offline, attempting client-side fallback parsing:', err);
  }

  // 2. Client-side fallback if customApiKey is provided in localStorage/Settings
  const apiKey = customApiKey || localStorage.getItem('gemini_api_key');
  if (!apiKey) {
    throw new Error('未检测到 Gemini API Key。请在设置中配置，或在 Vercel 部署 GEMINI_API_KEY 环境变量。');
  }

  const ai = new GoogleGenAI({ apiKey });
  const systemInstruction = `你是一个专门为长辈解析中文血压与心率口述语音记录的 AI 助手。
从用户的口述内容中提取：
1. systolic: 收缩压/高压 (mmHg，整数)
2. diastolic: 舒张压/低压 (mmHg，整数)
3. heart_rate: 心率/脉搏 (bpm，整数)
4. notes: 备注信息 (如服药、早晚、不适等情况；如无则为空字符串)

如果用户口述缺少心率或舒张压，根据上下文推断或合理保留。
只返回结构化 JSON 格式。`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `用户口述语音: "${transcript}"`,
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

  return JSON.parse(response.text);
}
