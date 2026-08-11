import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 限流保护
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: '请求过于频繁，请稍后再试'
});
app.use('/api', limiter);

// 初始化 AI 客户端（支持中转站）
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com'
});

// 儿童内容安全过滤
function isChildSafe(text) {
  const bannedWords = [
    '暴力', '死亡', '恐怖', '成人', '血腥', '武器',
    'kill', 'death', 'blood', 'weapon', 'violence', 'adult'
  ];
  const lowerText = text.toLowerCase();
  return !bannedWords.some(word => lowerText.includes(word));
}

// 文本卡片生成接口（保留，可选用）
app.post('/api/generate-cards', async (req, res) => {
  try {
    const { topic, ageRange, cardCount = 5, includeImages = false } = req.body;

    const prompt = `你是一位儿童教育专家，请为${ageRange}的孩子生成${cardCount}张学习卡片。
主题：${topic}

要求：
1. 每张卡片包含：正面（问题/词汇）、背面（答案/解释）
2. 语言简单易懂，适合儿童
3. 内容积极、安全、无暴力或成人内容
4. 输出纯 JSON 数组格式：[{"front": "...", "back": "...", "image_prompt": "..."}]
5. image_prompt 用英文描述，用于生成卡通插图

示例：
[{"front": "这是什么动物？🐘", "back": "大象！它有长长的鼻子和大大的耳朵。", "image_prompt": "cartoon style elephant, colorful, children's book illustration, cute, simple background"}]

请直接返回 JSON 数组，不要有其他文字。`;

    const message = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    });

    let cards = JSON.parse(message.content[0].text);
    cards = cards.filter(card => isChildSafe(card.front) && isChildSafe(card.back));

    if (includeImages) {
      for (const card of cards) {
        if (!card.image_prompt) continue;
        try {
          const image = await openai.images.generate({
            model: process.env.OPENAI_MODEL || 'gpt-image-2',
            prompt: card.image_prompt + ', children book style, bright colors, cute, simple background, no text',
            n: 1,
            size: '512x512'
          });
          card.image_url = image.data[0].url;
        } catch (e) {
          card.image_url = null;
        }
      }
    }

    res.json({ success: true, cards, count: cards.length });
  } catch (error) {
    console.error('生成失败:', error);
    res.status(500).json({ success: false, message: error.message || '生成失败，请稍后重试' });
  }
});

// 多图片生成接口：根据单词数组生成每个单词一张图片
app.post('/api/generate-images', async (req, res) => {
  try {
    const { words } = req.body; // ["Green Apple", ...]
    if (!Array.isArray(words) || words.length === 0) {
      return res.status(400).json({ success: false, message: 'words 不能为空' });
    }

    const results = [];

    for (const word of words) {
      const prompt = `${word}, children flashcard, clean white background, bright colors, center composition, no extra text`;
      try {
        const image = await openai.images.generate({
          model: process.env.OPENAI_MODEL || 'gpt-image-2',
          prompt,
          n: 1,
          size: '512x512'
        });
        results.push({ word, image_url: image.data[0].url });
      } catch (e) {
        console.error('生成图片失败:', word, e.message);
        results.push({ word, image_url: null, error: e.message });
      }
    }

    res.json({ success: true, images: results });
  } catch (e) {
    console.error('多图片生成接口异常:', e);
    res.status(500).json({ success: false, message: e.message || '生成失败' });
  }
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
});
