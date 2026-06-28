import express from 'express';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { initDb } from './db';

// Route imports
import authRoutes from './routes/auth';
import postRoutes from './routes/posts';
import commentRoutes from './routes/comments';
import uploadRoutes from './routes/upload';
import newsletterRoutes from './routes/newsletter';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Global Express middlewares
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Bootstrapping tables
  try {
    await initDb();
  } catch (err) {
    console.error('Database connection failed to initialize:', err);
  }

  // API endpoints mounted before Vite SPA catchall
  app.use('/api/auth', authRoutes);
  app.use('/api/posts', postRoutes);
  app.use('/api/comments', commentRoutes);
  app.use('/api/upload', uploadRoutes);
  app.use('/api/newsletter', newsletterRoutes);

  // Server health monitoring
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
  });

  // Single-Port Integration: Serve Vite in Dev, static assets in Production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[Server] Vite middleware mounted for hot development.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log(`[Server] Serving production static files from: ${distPath}`);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Running on port http://localhost:${PORT}`);
  });
}

startServer();
