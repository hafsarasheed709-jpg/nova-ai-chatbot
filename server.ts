import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

const app = express();
app.use(express.json({ limit: '30mb' }));

// Initialise GoogleGenAI with required User-Agent
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasKey: Boolean(process.env.GEMINI_API_KEY),
    defaultModel: 'gemini-3.8-flash',
  });
});

// Title generation endpoint with fallback
app.post('/api/chat/title', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.json({ title: message.slice(0, 30).trim() + (message.length > 30 ? '...' : '') });
    }

    const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
    let generatedTitle = '';

    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: `Create a brief 3 to 5 word title summarizing this initial user query for a chat sidebar. Output ONLY the title text, no quotes, no markdown, no punctuation:\n\n"${message.slice(0, 350)}"`,
          config: {
            maxOutputTokens: 20,
            temperature: 0.3,
          },
        });
        const text = response.text?.trim();
        if (text) {
          generatedTitle = text.replace(/^["']|["']$/g, '').slice(0, 45);
          break;
        }
      } catch (err: any) {
        // Continue to next candidate
      }
    }

    res.json({ title: generatedTitle || message.slice(0, 30) });
  } catch (error: any) {
    const fallback = (req.body?.message || 'New Chat').slice(0, 30);
    res.json({ title: fallback });
  }
});

interface ChatAttachment {
  name: string;
  type: 'image' | 'file';
  mimeType: string;
  data?: string; // base64
  text?: string; // extracted text content
}

interface IncomingMessage {
  role: 'user' | 'model';
  content: string;
  attachments?: ChatAttachment[];
}

// Helper to write SSE chunk
function writeSSE(res: express.Response, data: object) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
  if (typeof (res as any).flush === 'function') {
    (res as any).flush();
  }
}

// Streaming chat endpoint with resilient fallback
app.post('/api/chat/stream', async (req, res) => {
  const { messages, model, systemInstruction, temperature } = req.body as {
    messages: IncomingMessage[];
    model?: string;
    systemInstruction?: string;
    temperature?: number;
  };

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Valid messages array is required.' });
  }

  // Set SSE Headers
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  let isClientConnected = true;
  res.on('close', () => {
    if (!res.writableEnded) {
      isClientConnected = false;
    }
  });

  // Format messages for @google/genai contents
  const contents = messages.map((msg) => {
    const parts: any[] = [];

    // Attachments
    if (msg.role === 'user' && msg.attachments && msg.attachments.length > 0) {
      for (const att of msg.attachments) {
        if (att.data) {
          parts.push({
            inlineData: {
              mimeType: att.mimeType,
              data: att.data,
            },
          });
        } else if (att.text) {
          parts.push({
            text: `[Attached Document: ${att.name}]\n\`\`\`\n${att.text}\n\`\`\`\n`,
          });
        }
      }
    }

    // Main text
    if (msg.content) {
      parts.push({ text: msg.content });
    } else if (parts.length === 0) {
      parts.push({ text: '...' });
    }

    return {
      role: msg.role === 'user' ? 'user' : 'model',
      parts: parts,
    };
  });

  const defaultSystem = `You are NOVA AI, a high-intelligence, modern cognitive assistant powered by Google Gemini.
You provide precise, insightful, and beautifully structured responses.
Always use GitHub-flavored markdown formatting for code blocks, tables, math, bullet points, and headers.
When providing code, specify the language identifier and provide explanations before or after code blocks.
Be concise yet thorough, helpful, friendly, and intellectually sharp.`;

  const primaryModel = model || 'gemini-3.8-flash';
  // Include fallback models in case primary model suffers high demand
  const candidateModels = [
    primaryModel,
    ...(primaryModel !== 'gemini-3.1-flash-lite' ? ['gemini-3.1-flash-lite'] : []),
    ...(primaryModel !== 'gemini-flash-latest' ? ['gemini-flash-latest'] : []),
  ];

  const config = {
    systemInstruction: systemInstruction?.trim() || defaultSystem,
    temperature: typeof temperature === 'number' ? temperature : 0.7,
  };

  let streamedSuccessfully = false;
  let lastErrorMsg = '';

  for (const candidate of candidateModels) {
    if (!isClientConnected) break;

    try {
      // Race initial stream response with a 3.5s timeout for fast fallback if primary is hung/503
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT_CONNECT')), candidate === primaryModel ? 3500 : 15000)
      );

      const stream = (await Promise.race([
        ai.models.generateContentStream({
          model: candidate,
          contents,
          config,
        }),
        timeoutPromise,
      ])) as any;

      for await (const chunk of stream) {
        if (!isClientConnected) break;
        const text = chunk.text;
        if (text) {
          writeSSE(res, { text });
          streamedSuccessfully = true;
        }
      }

      if (streamedSuccessfully) {
        break;
      }
    } catch (err: any) {
      console.warn(`Streaming attempt with ${candidate} failed:`, err?.message || err);
      lastErrorMsg = err?.message || String(err);
      continue;
    }
  }

  if (isClientConnected) {
    if (streamedSuccessfully) {
      writeSSE(res, { done: true });
    } else {
      writeSSE(res, {
        error: lastErrorMsg || 'Unable to generate response. Please try again in a few moments.',
        done: true,
      });
    }
    res.end();
  }
});

// Setup Vite middleware in dev or static serving in prod
async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NOVA AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
