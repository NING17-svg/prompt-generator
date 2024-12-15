const axios = require('axios');

module.exports = async (req, res) => {
  console.log('API请求开始 - 方法:', req.method);
  
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // 处理OPTIONS请求
  if (req.method === 'OPTIONS') {
    console.log('处理OPTIONS请求');
    return res.status(200).json({ message: 'OK' });
  }

  // 只允许POST请求
  if (req.method !== 'POST') {
    console.log('非法请求方法:', req.method);
    return res.status(405).json({ error: '只允许POST请求' });
  }

  try {
    console.log('请求体:', req.body);
    const { text } = req.body;
    
    if (!text) {
      console.log('缺少text参数');
      return res.status(400).json({ error: '缺少必要的text参数' });
    }

    // 检查环境变量
    if (!process.env.API_KEY) {
      console.error('缺少API_KEY环境变量');
      return res.status(500).json({ error: '服务器配置错误: 缺少API密钥' });
    }

    if (!process.env.NEXT_PUBLIC_API_URL) {
      console.error('缺少NEXT_PUBLIC_API_URL环境变量');
      return res.status(500).json({ error: '服务器配置错误: 缺少API地址' });
    }

    console.log('准备调用翻译API, URL:', process.env.NEXT_PUBLIC_API_URL);

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

    console.log('翻译API响应状态:', response.status);

    // 返回翻译结果
    if (response.data.choices && response.data.choices.length > 0) {
      const translation = response.data.choices[0].message.content.trim();
      console.log('翻译成功:', { input: text, output: translation });
      return res.status(200).json({ translation });
    }

    console.error('API响应格式错误:', response.data);
    throw new Error('API返回格式错误');
  } catch (error) {
    console.error('翻译失败:', error);
    console.error('错误详情:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    });
    
    return res.status(500).json({ 
      error: '翻译失败',
      message: error.message,
      details: error.response?.data
    });
  }
}; 