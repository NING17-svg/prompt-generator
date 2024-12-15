# AI绘画提示词生成器

一个简单的Web应用，用于生成标准化的AI绘画提示词。本项目是从PyQt6桌面应用迁移到Web版本。

## 项目结构

```
prompt_generator/
├── app/                    # Next.js应用目录
│   ├── page.tsx           # 主页面
│   └── api/               # API路由
│       ├── translate      # 翻译接口
│       └── dictionary     # 词典管理接口
├── lib/                   # 工具函数
│   └── translator.ts      # 翻译逻辑(从Python迁移)
├── components/            # React组件
└── public/               # 静态资源
```

## 技术栈
- Next.js 13+ (App Router)
- Vercel KV Storage
- TailwindCSS
- TypeScript

## 核心功能
1. **结构化提示词生成**
   - 预设提示词模板
   - 中文关键词输入
   - 自动英文转换
   - 格式化输出

2. **词典管理**
   - 在线词典存储
   - 自动更新词条
   - 实时同步

## 开发步骤

### 1. 项目初始化
```bash
# 创建Next.js项目
npx create-next-app@latest prompt-generator-web --typescript --tailwind --app

# 安装依赖
cd prompt-generator-web
npm install @vercel/kv
```

### 2. 移植翻译逻辑
1. 创建`lib/translator.ts`:
```typescript
// 从Python版本移植核心翻译逻辑
export class Translator {
  // 实现翻译方法
  async translate(text: string): Promise<string> {
    // ...翻译逻辑
  }
  
  // 实现分词方法
  async splitText(text: string): Promise<string[]> {
    // ...分词逻辑
  }
}
```

### 3. 实现API接口
1. 创建翻译接口 `app/api/translate/route.ts`:
```typescript
import { kv } from '@vercel/kv'
import { Translator } from '@/lib/translator'

export async function POST(req: Request) {
  const { text } = await req.json()
  const translator = new Translator()
  const result = await translator.translate(text)
  return Response.json({ translation: result })
}
```

2. 创建词典更新接口 `app/api/dictionary/route.ts`:
```typescript
import { kv } from '@vercel/kv'

export async function POST(req: Request) {
  const { chinese, english } = await req.json()
  const dictionary = await kv.get('translations') || {}
  dictionary[chinese] = english
  await kv.set('translations', dictionary)
  return Response.json({ success: true })
}
```

### 4. 开发前端界面
1. 创建主页面 `app/page.tsx`:
```typescript
'use client'
import { useState } from 'react'

export default function Home() {
  // 实现用户界面
  // ...
}
```

2. 添加必要的组件:
- 输入框组件
- 翻译结果显示
- 词典管理界面

### 5. 数据迁移
1. 导出现有词典:
```bash
# 将dictionary.json转换为适合KV存储的格式
python scripts/export_dictionary.py
```

2. 导入到Vercel KV:
```bash
# 使用Vercel CLI导入数据
vercel kv:set translations "$(cat exported_dictionary.json)"
```

### 6. 部署配置
1. 创建Vercel项目:
```bash
vercel
```

2. 配置KV存储:
```bash
vercel kv add
```

3. 设置环境变量:
```bash
vercel env add KV_URL
vercel env add KV_REST_API_URL
vercel env add KV_REST_API_TOKEN
```

### 7. 测试和部署
1. 本地测试:
```bash
npm run dev
```

2. 部署到Vercel:
```bash
vercel deploy
```

## 使用方法
1. 访问应用URL
2. 在输入框中输入中文提示词
3. 点击翻译按钮获取结果
4. 新的翻译会自动保存到在线词典

## 注意事项
- 确保Vercel KV存储已正确配置
- 注意API请求限制
- 定期备份词典数据
- 监控错误日志

## 开发计划
1. 基础功能迁移 ✅
2. 在线词典实现 ✅
3. 用户界面优化 ⏳
4. 错误处理完善 ⏳
5. 性能优化 ⏳

## 参考资源
- [Next.js文档](https://nextjs.org/docs)
- [Vercel KV文档](https://vercel.com/docs/storage/vercel-kv)
- [TailwindCSS文档](https://tailwindcss.com/docs)
```

这个README详细说明了从桌面应用迁移到Web应用的每个步骤。每个部分都包含了具体的代码示例和命令，方便按步骤实施。你觉得这个文档结构和内容如何？需要我详细展开某个部分吗？