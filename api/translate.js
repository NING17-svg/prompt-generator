const axios = require('axios');

module.exports = async (req, res) => {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // 处理OPTIONS请求
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).json({ message: 'OK' });
  }

  // 只允许POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只允许POST请求' });
  }

  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: '缺少必要的text参数' });
    }

    // 调用翻译API
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/v1/chat/completions`,
      {
        model: process.env.NEXT_PUBLIC_API_MODEL || "gpt-4o-mini",
        temperature: 0.7,
        top_p: 1,
        messages: [
          {
            role: "system",
            content: "你是一个专业的中英翻译助手。请将以下中文翻译成英文，只返回翻译结果，不要有任何解释。"
          },
          {
            role: "user",
            content: `请将这段中文翻译成英文：${text}`
          }
        ],
        stream: false
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // 返回翻译结果
    if (response.data.choices && response.data.choices.length > 0) {
      return res.status(200).json({ 
        translation: response.data.choices[0].message.content.trim() 
      });
    }

    throw new Error('API返回格式错误');
  } catch (error) {
    console.error('翻译失败:', error);
    return res.status(500).json({ 
      error: '翻译失败',
      message: error.message 
    });
  }
}; 