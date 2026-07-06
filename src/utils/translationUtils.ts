import { requestUrl } from 'obsidian';

interface SiliconFlowTranslationResponse {
  choices?: Array<{
    message?: {
      content?: unknown;
    };
  }>;
}

/**
 * 调用硅基流动API翻译文本
 */
export async function translateText(
  text: string,
  apiKey: string,
  model: string = 'Qwen/Qwen2.5-7B-Instruct'
): Promise<string> {
  if (!apiKey) {
    throw new Error('API Key 未设置');
  }

  try {
    const response = await requestUrl({
      url: 'https://api.siliconflow.cn/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: '你是一个专业的学术翻译助手。请将用户提供的学术论文摘要翻译成中文，保持专业术语的准确性，翻译要流畅自然。'
          },
          {
            role: 'user',
            content: `请翻译以下摘要：\n\n${text}`
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`API 请求失败: ${response.status} - ${response.text}`);
    }

    const data = response.json as SiliconFlowTranslationResponse;
    const translatedText = data.choices?.[0]?.message?.content;

    if (typeof translatedText !== 'string' || !translatedText) {
      throw new Error('API 返回数据格式错误');
    }

    return translatedText.trim();
  } catch (error) {
    console.error('[Translation Error]', error);
    throw error;
  }
}
