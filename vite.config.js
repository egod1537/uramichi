import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

function claudeApiProxyPlugin() {
  const handleClaudeRequest = async (request, response) => {
    if (request.method !== 'POST') {
      response.statusCode = 405;
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify({ error: 'Method not allowed' }));
      return;
    }

    const requestBody = await new Promise((resolve) => {
      let rawBody = '';
      request.on('data', (chunk) => {
        rawBody += chunk;
      });
      request.on('end', () => {
        resolve(rawBody);
      });
    });

    let parsedBody = {};
    try {
      parsedBody = requestBody ? JSON.parse(requestBody) : {};
    } catch {
      response.statusCode = 400;
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify({ error: 'Invalid JSON body' }));
      return;
    }

    const chatMessages = Array.isArray(parsedBody.messages) ? parsedBody.messages : [];
    const safeMessages = chatMessages
      .filter(
        (messageItem) =>
          messageItem &&
          typeof messageItem.text === 'string' &&
          typeof messageItem.role === 'string',
      )
      .slice(-20)
      .map((messageItem) => ({
        role: messageItem.role === 'assistant' ? 'assistant' : 'user',
        content: messageItem.text,
      }));

    if (safeMessages.length === 0) {
      response.statusCode = 400;
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify({ error: 'messages is required' }));
      return;
    }

    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicApiKey) {
      response.statusCode = 500;
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify({ error: 'ANTHROPIC_API_KEY is missing in .env.local' }));
      return;
    }

    try {
      const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicApiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
          max_tokens: Number(process.env.ANTHROPIC_MAX_TOKENS || 512),
          messages: safeMessages,
        }),
      });

      const anthropicResponseBody = await anthropicResponse.json();

      if (!anthropicResponse.ok) {
        response.statusCode = anthropicResponse.status;
        response.setHeader('Content-Type', 'application/json');
        response.end(
          JSON.stringify({
            error: anthropicResponseBody?.error?.message || 'Failed to fetch Claude response',
          }),
        );
        return;
      }

      const assistantText = (anthropicResponseBody.content || [])
        .filter((contentBlock) => contentBlock?.type === 'text')
        .map((contentBlock) => contentBlock.text)
        .join('\n')
        .trim();

      response.statusCode = 200;
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify({ text: assistantText }));
    } catch {
      response.statusCode = 500;
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify({ error: 'Claude API request failed' }));
    }
  };

  return {
    name: 'claude-api-proxy',
    configureServer(server) {
      server.middlewares.use('/api/chat/claude', handleClaudeRequest);
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/chat/claude', handleClaudeRequest);
    },
  };
}

export default defineConfig(({ mode }) => {
  const loadedEnv = loadEnv(mode, process.cwd(), '');
  process.env = { ...process.env, ...loadedEnv };

  return {
    plugins: [react(), tailwindcss(), claudeApiProxyPlugin()],
  };
});
