import express from 'express';
import { createServer as createViteServer } from 'vite';

const app = express();
app.use(express.json());

async function createServer() {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'custom',
  });

  app.use(vite.middlewares);

  app.use('/api/auth/verify', async (req, res) => {
    const { default: verifyHandler } = await import('./api/auth/verify.js');
    verifyHandler(req, res);
  });

  app.use('/api/chat', async (req, res) => {
    const { default: chatHandler } = await import('./api/chat.js');
    chatHandler(req, res);
  });

  app.use('*', async (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) {
      return next();
    }
    try {
      const html = await vite.transformIndexHtml(req.originalUrl, '<!DOCTYPE html><html><body><div id="root"></div></body></html>');
      res.send(html);
    } catch (e) {
      next(e);
    }
  });

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Cipher running at http://localhost:${port}`);
  });
}

createServer();