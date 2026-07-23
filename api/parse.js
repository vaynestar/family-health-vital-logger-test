import { GoogleGenAI, Type } from '@google/genai';

export default async function handler(req, res) {
  // CORS setup
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { transcript, apiKey: clientApiKey } = req.body || {};

    if (!transcript || typeof transcript !== 'string') {
      return res.status(400).json({ error: 'Transcript string is required' });
    }

    // Use environment variable GEMINI_API_KEY on Vercel, or client-provided key
    const apiKey = process.env.GEMINI_API_KEY || clientApiKey;

    if (!apiKey) {
      return res.status(401).json({
        error: 'Missing Gemini API key. Please set GEMINI_API_KEY on Vercel or in app Settings.'
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `你是一个专门为长辈解析中文血压与心率口述语音记录的 AI 助手。
从用户的口述内容中提取：
1. systolic: 收缩压/高压 (mmHg，整数)
2. diastolic: 舒张压/低压 (mmHg，整数)
3. heart_rate: 心率/脉搏 (bpm，整数)
4. notes: 备注信息 (如服药、早晚、不适等情况；如无则为空字符串)

如果用户口述缺少心率或舒张压，根据上下文推断或合理保留（例如常用数值范围：高压 90-180，低压 50-120，心率 50-130）。如果未提及心率，默认返回 75 并记录在 notes。
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
            systolic: { type: Type.INTEGER, description: '高压 / 收缩压 (mmHg)' },
            diastolic: { type: Type.INTEGER, description: '低压 / 舒张压 (mmHg)' },
            heart_rate: { type: Type.INTEGER, description: '心率 / 脉搏 (BPM)' },
            notes: { type: Type.STRING, description: '备注或服药记录' }
          },
          required: ['systolic', 'diastolic', 'heart_rate']
        }
      }
    });

    const parsedJson = JSON.parse(response.text);
    return res.status(200).json(parsedJson);
  } catch (err) {
    console.error('Gemini Parse Error:', err);
    return res.status(500).json({
      error: 'AI 语音解析失败，请检查 API Key 或重试',
      details: err.message
    });
  }
}
