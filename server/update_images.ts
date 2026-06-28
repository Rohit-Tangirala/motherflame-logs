import { dbService, initDb, pool } from './db.js';

const categoryImages: Record<string, string> = {
  Technology: 'https://source.unsplash.com/800x500/?technology',
  Fitness: 'https://source.unsplash.com/800x500/?fitness',
  Anime: 'https://source.unsplash.com/800x500/?anime',
  Chess: 'https://source.unsplash.com/800x500/?chess',
  Philosophy: 'https://source.unsplash.com/800x500/?philosophy',
  Japan: 'https://source.unsplash.com/800x500/?japan',
  Career: 'https://source.unsplash.com/800x500/?career',
  "Creative Writing": 'https://source.unsplash.com/800x500/?writing',
};

async function updateImages() {
  try {
    await initDb();
    if (pool) {
      console.log('Updating images in MySQL...');
      const [posts] = await pool.query('SELECT id, category, cover_image FROM posts');
      for (const p of posts as any[]) {
        const img = categoryImages[p.category] || categoryImages['Technology'];
        await pool.query('UPDATE posts SET cover_image = ? WHERE id = ?', [img, p.id]);
      }
      console.log('MySQL images updated!');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

updateImages();
