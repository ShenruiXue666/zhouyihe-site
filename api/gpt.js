export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { question } = req.body;
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    res.status(500).json({ error: 'OpenAI API key not set' });
    return;
  }

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        temperature: 0.6,
        max_tokens: 800,
        messages: [
          {
            role: 'system',
            content: `
你是一个情侣生活建议助手，专为一对年轻情侣提供时髦又接地气的吃饭、出行、约会灵感。
请严格遵循以下格式：

- 用户会输入类似「今天吃什么」或「我们去哪里玩」的模糊问题；
- 你必须推荐 5 个选项，每个选项是一句话，内容要潮流、有趣、可执行；
- 推荐要适合情侣，不要太土，不要太大众，也不要太虚幻（例如不要“去月球”这种）；
- 所有建议必须真实可信、自然生活化，不要编造不存在的地点；
- 结尾请输出一行：「选项: xxx, xxx, xxx, xxx, xxx」这一行只列出5个选项名，用中文逗号隔开；
- 不要解释，不要添加多余内容。

`
          },
          {
            role: 'user',
            content: question
          }
        ]
      })
    });

    const data = await openaiRes.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
} 