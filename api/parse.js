import { GoogleGenAI, Type } from '@google/genai';

export default async function handler(req, res) {
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

    const rawApiKey = process.env.GEMINI_API_KEY || clientApiKey || '';
    const apiKey = rawApiKey.trim();

    if (!apiKey) {
      return res.status(401).json({
        error: 'Missing Gemini API key'
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `你是一个专门为长辈解析中文血压与心率口述语音记录的 AI 助手。
请从口述文本中提取：
1. systolic: 收缩压/高压 (mmHg，整数)
2. diastolic: 舒张压/低压 (mmHg，整数)
3. heart_rate: 心率/脉搏 (bpm，整数)
4. notes: 真正的额外备注 (如："早上吃了降压药"、"感觉头晕"；如果用户只读了血压数值，notes 必须返回空字符串 "")

⚠️ 重要规则：切勿在 notes 中重复写高压、低压或心率数字！如果无额外服药或身体描述，notes 必须为空字符串 ""。
如果未提及心率，默认返回 75。只返回结构化 JSON。`;

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
            notes: { type: Type.STRING, description: '额外备注（如无则留空）' }
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
