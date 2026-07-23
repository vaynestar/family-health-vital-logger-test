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
长辈口述可能有多种常用表达方式：
1. "高压、低压、心率" (例如: "高压135，低压85，心率72")
2. "第一个、第二个、第三个" (例如: "第一个135，第二个85，第三个72")
3. "上面、中间、下面" (例如: "上面135，中间85，下面72")

解析对应规则：
- 第 1 个数值 / 上面 / 高压 = systolic (收缩压)
- 第 2 个数值 / 中间 / 低压 = diastolic (舒张压)
- 第 3 个数值 / 下面 / 心率 / 脉搏 = heart_rate (心率)

⚠️ 核心逻辑：第 2 个数值必须给 diastolic，第 3 个数值必须给 heart_rate。绝对不能颠倒低压和心率！
如果用户无额外说明，notes 必须返回空字符串 ""。只返回结构化 JSON。`;

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
