// API配置
const API_CONFIG = {
    url: "https://api.bltcy.ai",
    key: "sk-ISpPXk088Byag1phC284E6Ce28B542D8B4C716302d017748",
    model: "gpt-4o-mini"
};

// 获取所有DOM元素
const inputs = {
    composition: document.getElementById('composition'),
    subject: document.getElementById('subject'),
    clothing: document.getElementById('clothing'),
    action: document.getElementById('action'),
    animal: document.getElementById('animal'),
    interaction: document.getElementById('interaction'),
    environment: document.getElementById('environment'),
    background: document.getElementById('background'),
    quality: document.getElementById('quality'),
    technical: document.getElementById('technical'),
    constraints: document.getElementById('constraints')
};

const generateButton = document.getElementById('generate');
const previewArea = document.getElementById('preview');
const copyButton = document.getElementById('copy');

// 获取状态显示元素
const statusElement = document.getElementById('status');
const statusTextElement = document.getElementById('status-text');

// 状态管理函数
function showStatus(message, type = 'info') {
    statusElement.classList.remove('hidden', 'bg-blue-100', 'bg-red-100', 'bg-green-100');
    statusTextElement.classList.remove('text-blue-700', 'text-red-700', 'text-green-700');
    
    switch(type) {
        case 'error':
            statusElement.classList.add('bg-red-100');
            statusTextElement.classList.add('text-red-700');
            break;
        case 'success':
            statusElement.classList.add('bg-green-100');
            statusTextElement.classList.add('text-green-700');
            break;
        default:
            statusElement.classList.add('bg-blue-100');
            statusTextElement.classList.add('text-blue-700');
    }
    
    statusTextElement.textContent = message;
    statusElement.classList.remove('hidden');
}

function hideStatus() {
    statusElement.classList.add('hidden');
}

// 预设内容
const presets = {
    composition: "full body, facing the camera",
    subject: "a breathtakingly beautiful 20-year-old woman",
    clothing: "white formal gown",
    action: "",
    animal: "",
    interaction: "",
    environment: "ice and snow, sunshine",
    background: "Long blurred background",
    quality: "realistic, include as much detail as possible",
    technical: "4K, shot on Canon A7C2",
    constraints: "--no sexy --ar 9:16"
};

// 从localStorage加载翻译缓存
let translationCache = {};
try {
    const savedTranslations = localStorage.getItem('translation_cache');
    if (savedTranslations) {
        translationCache = JSON.parse(savedTranslations);
        console.log('从本地存储加载翻译缓存');
    }
} catch (error) {
    console.error('加载翻译缓存失败:', error);
}

// 保存翻译缓存
function saveTranslation(text, translation) {
    try {
        translationCache[text] = translation;
        localStorage.setItem('translation_cache', JSON.stringify(translationCache));
        console.log(`翻译已缓存: ${text} -> ${translation}`);
    } catch (error) {
        console.error('保存翻译失败:', error);
    }
}

// API翻译函数
async function translateWithAPI(text) {
    try {
        showStatus('正在调用翻译API...');
        const response = await fetch(`${API_CONFIG.url}/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_CONFIG.key}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: API_CONFIG.model,
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
            })
        });

        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status}`);
        }

        const result = await response.json();
        if (result.choices && result.choices.length > 0) {
            return result.choices[0].message.content.trim();
        }
        throw new Error('API返回格式错误');
    } catch (error) {
        console.error('翻译API调用失败:', error);
        showStatus('翻译API调用失败', 'error');
        return null;
    }
}

// 分析中文短语的核心内容
function analyzeChinesePhrase(text) {
    // 由于浏览器端无法使用jieba，我们使用简化的规则：
    // 1. 移除常见的时态词和语气词
    text = text.replace(/正在|在|着|了|的/g, '');
    
    // 2. 移除空格
    text = text.replace(/\s+/g, '');
    
    return text;
}

// 计算两个字符串的相似度
function calculateSimilarity(str1, str2) {
    // 对中文短语进行预处理
    const processed1 = analyzeChinesePhrase(str1);
    const processed2 = analyzeChinesePhrase(str2);
    
    // 如果处理后完全相同
    if (processed1 === processed2) return 1;
    
    // 如果一个是另一个的子串
    if (processed1.includes(processed2) || processed2.includes(processed1)) {
        return Math.min(processed1.length, processed2.length) / Math.max(processed1.length, processed2.length);
    }
    
    // 计算编辑距离
    const matrix = [];
    for (let i = 0; i <= processed1.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= processed2.length; j++) {
        matrix[0][j] = j;
    }
    
    for (let i = 1; i <= processed1.length; i++) {
        for (let j = 1; j <= processed2.length; j++) {
            if (processed1[i-1] === processed2[j-1]) {
                matrix[i][j] = matrix[i-1][j-1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i-1][j-1] + 1,  // 替换
                    matrix[i][j-1] + 1,    // 插入
                    matrix[i-1][j] + 1     // 删除
                );
            }
        }
    }
    
    // 计算相似度
    const maxLength = Math.max(processed1.length, processed2.length);
    const distance = matrix[processed1.length][processed2.length];
    return (maxLength - distance) / maxLength;
}

// 翻译函数
async function translate(text) {
    if (!text) return '';
    
    // 检查是否包含中文
    const hasChinese = /[\u4e00-\u9fff]/.test(text);
    if (!hasChinese) {
        return text; // 如果不包含中文，直接返回原文
    }
    
    // 检查完全匹配的缓存
    if (translationCache[text]) {
        console.log(`使用完全匹配的缓存: ${text} -> ${translationCache[text]}`);
        return translationCache[text];
    }
    
    // 尝试模糊匹配
    let bestMatch = '';
    let bestSimilarity = 0;
    
    for (const cachedText of Object.keys(translationCache)) {
        const similarity = calculateSimilarity(text, cachedText);
        if (similarity > bestSimilarity && similarity > 0.9) { // 提高相似度阈值到0.9
            bestSimilarity = similarity;
            bestMatch = cachedText;
        }
    }
    
    if (bestMatch) {
        console.log(`使用相似词的缓存 (相似度: ${bestSimilarity.toFixed(2)}): ${text} -> ${bestMatch} -> ${translationCache[bestMatch]}`);
        // 同时保存当前词的翻译，避免下次重复计算
        saveTranslation(text, translationCache[bestMatch]);
        return translationCache[bestMatch];
    }
    
    // 如果没有找到合适的缓存，调用API翻译
    console.log(`调用API翻译: ${text}`);
    const apiTranslation = await translateWithAPI(text);
    if (apiTranslation) {
        // 保存到缓存
        saveTranslation(text, apiTranslation);
        return apiTranslation;
    }
    
    // 如果API翻译失败，返回原文
    console.log(`翻译失败，返回原文: ${text}`);
    return text;
}

// 生成提示词
async function generatePrompt() {
    try {
        showStatus('正在生成提示词...');
        generateButton.disabled = true;
        
        // 获取并翻译所有输入，如果输入为空则使用预设值
        const translatedInputs = {};
        for (const [key, input] of Object.entries(inputs)) {
            const value = input.value.trim() || presets[key];
            if (value) {
                translatedInputs[key] = await translate(value);
            }
        }
        
        // 组合提示词
        const parts = [];
        
        // 添加构图信息
        if (translatedInputs.composition) {
            parts.push(translatedInputs.composition);
        }
        
        // 添加主体描述
        if (translatedInputs.subject) {
            parts.push(translatedInputs.subject);
        }
        
        // 添加服装
        if (translatedInputs.clothing) {
            parts.push(`in ${translatedInputs.clothing}`);
        }
        
        // 添加动作
        if (translatedInputs.action) {
            parts.push(translatedInputs.action);
        }
        
        // 处理动物和互动
        if (translatedInputs.animal) {
            const animalPart = translatedInputs.animal.startsWith('a ') ? 
                translatedInputs.animal : `a ${translatedInputs.animal}`;
                
            if (translatedInputs.interaction) {
                parts.push(`${translatedInputs.interaction} ${animalPart}`);
            } else {
                parts.push(`next to ${animalPart}`);
            }
        }
        
        // 添加环境
        if (translatedInputs.environment) {
            parts.push(translatedInputs.environment);
        }
        
        // 添加背景
        if (translatedInputs.background) {
            parts.push(translatedInputs.background);
        }
        
        // 添加画质要求
        if (translatedInputs.quality) {
            parts.push(translatedInputs.quality);
        }
        
        // 添加技术参数
        if (translatedInputs.technical) {
            parts.push(translatedInputs.technical);
        }
        
        // 添加约束条件
        if (translatedInputs.constraints) {
            parts.push(translatedInputs.constraints);
        }
        
        // 更新预览
        previewArea.value = parts.join(', ');
        showStatus('提示词生成成功！', 'success');
        setTimeout(hideStatus, 3000);
    } catch (error) {
        console.error('生成提示词失败:', error);
        showStatus('生成提示词失败', 'error');
    } finally {
        generateButton.disabled = false;
    }
}

// 复制到剪贴板
function copyToClipboard() {
    try {
        previewArea.select();
        document.execCommand('copy');
        
        // 显示复制成功的反馈
        const originalText = copyButton.textContent;
        copyButton.textContent = '已复制！';
        showStatus('已复制到剪贴板！', 'success');
        setTimeout(() => {
            copyButton.textContent = originalText;
            hideStatus();
        }, 2000);
    } catch (error) {
        console.error('复制失败:', error);
        showStatus('复制失败，请手动复制', 'error');
    }
}

// 绑定事件
generateButton.addEventListener('click', generatePrompt);
copyButton.addEventListener('click', copyToClipboard); 