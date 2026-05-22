import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

import { safeJoin } from './lib/safePath.js';
import { scanMovies, scanSeries, listEpisodes } from './lib/library.js';
import { renderHome } from './views/home.js';
import { renderSerie } from './views/serie.js';
import { renderWatch } from './views/watch.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
const VIDEO_DIR = process.env.VIDEO_DIR
  ? path.resolve(process.env.VIDEO_DIR)
  : __dirname;

const app = express();

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const CONTENT_TYPES = {
  '.mp4': 'video/mp4',
  '.mkv': 'video/x-matroska',
  '.avi': 'video/x-msvideo',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
};

const IMAGE_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

function getContentType(file) {
  return CONTENT_TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
}

function getLocalIPs() {
  const ips = [];
  for (const iface of Object.values(os.networkInterfaces()).flat()) {
    if (iface && iface.family === 'IPv4' && !iface.internal) ips.push(iface.address);
  }
  return ips;
}

// ─────────────────────────────────────────────────────────────────────────────
// Rotas
// ─────────────────────────────────────────────────────────────────────────────

// Home: lista filmes e séries
app.get('/', async (req, res, next) => {
  try {
    const [movies, series] = await Promise.all([
      scanMovies(VIDEO_DIR),
      scanSeries(VIDEO_DIR),
    ]);
    res.type('html').send(renderHome({ movies, series }));
  } catch (err) {
    next(err);
  }
});

// Página de detalhe da série (lista episódios)
app.get('/serie', async (req, res, next) => {
  const nome = req.query.nome;
  if (!nome) return res.status(400).send('Parâmetro "nome" obrigatório');

  try {
    const seriePath = safeJoin(VIDEO_DIR, 'Series', nome);
    const episodes = await listEpisodes(seriePath, ['Series', decodeURIComponent(nome)]);
    res.type('html').send(renderSerie({ nome: decodeURIComponent(nome), episodes }));
  } catch (err) {
    if (err.code === 'EBADPATH') return res.status(400).send('Caminho inválido');
    if (err.code === 'ENOENT') return res.status(404).send('Série não encontrada');
    next(err);
  }
});

// Player
app.get('/watch', (req, res) => {
  const file = req.query.file;
  if (!file) return res.status(400).send('Parâmetro "file" obrigatório');

  let absPath;
  try {
    absPath = safeJoin(VIDEO_DIR, file);
  } catch {
    return res.status(400).send('Caminho inválido');
  }

  if (!fs.existsSync(absPath)) {
    return res.status(404).send('Arquivo não encontrado');
  }

  // Procura legenda .vtt com o mesmo nome do vídeo
  const vttPath = absPath.replace(/\.\w+$/, '.vtt');
  const hasSubtitle = fs.existsSync(vttPath);

  res.type('html').send(renderWatch({ file: decodeURIComponent(file), hasSubtitle }));
});

// Streaming do vídeo (com suporte a Range Requests)
app.get('/video', (req, res) => {
  const file = req.query.file;
  if (!file) return res.status(400).send('Parâmetro "file" obrigatório');

  let videoPath;
  try {
    videoPath = safeJoin(VIDEO_DIR, file);
  } catch {
    return res.status(400).send('Caminho inválido');
  }

  fs.stat(videoPath, (err, stat) => {
    if (err) return res.status(404).send('Arquivo não encontrado');

    const fileSize = stat.size;
    const contentType = getContentType(videoPath);
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize) {
        res.writeHead(416, { 'Content-Range': `bytes */${fileSize}` });
        return res.end();
      }

      const chunkSize = end - start + 1;
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType,
      });
      fs.createReadStream(videoPath, { start, end }).pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': contentType,
      });
      fs.createReadStream(videoPath).pipe(res);
    }
  });
});

// Capas / thumbnails (com cache do navegador)
app.get('/thumb', (req, res) => {
  const img = req.query.img;
  if (!img) return res.status(400).send('Parâmetro "img" obrigatório');

  let imgPath;
  try {
    imgPath = safeJoin(VIDEO_DIR, img);
  } catch {
    return res.status(400).send('Caminho inválido');
  }

  fs.stat(imgPath, (err) => {
    if (err) return res.status(404).send('Imagem não encontrada');
    const type = IMAGE_TYPES[path.extname(imgPath).toLowerCase()] || 'image/jpeg';
    res.setHeader('Content-Type', type);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    fs.createReadStream(imgPath).pipe(res);
  });
});

// Legendas WebVTT
app.get('/subtitle', (req, res) => {
  const file = req.query.file;
  if (!file) return res.status(400).send('Parâmetro "file" obrigatório');

  let subPath;
  try {
    subPath = safeJoin(VIDEO_DIR, file);
  } catch {
    return res.status(400).send('Caminho inválido');
  }

  fs.stat(subPath, (err) => {
    if (err) return res.status(404).send('Legenda não encontrada');
    res.setHeader('Content-Type', 'text/vtt; charset=utf-8');
    fs.createReadStream(subPath).pipe(res);
  });
});

// 404 catch-all
app.use((req, res) => res.status(404).send('Rota não encontrada'));

// Handler global de erro
app.use((err, req, res, _next) => {
  console.error('Erro:', err);
  res.status(500).send('Erro interno');
});

// ─────────────────────────────────────────────────────────────────────────────
// Boot
// ─────────────────────────────────────────────────────────────────────────────

app.listen(PORT, '0.0.0.0', () => {
  const ips = getLocalIPs();
  console.log('');
  console.log('  ╔══════════════════════════════════════╗');
  console.log('  ║          🎬 POBREFLIX ONLINE         ║');
  console.log('  ╚══════════════════════════════════════╝');
  console.log('');
  console.log(`  Local:    http://localhost:${PORT}`);
  for (const ip of ips) {
    console.log(`  Rede:     http://${ip}:${PORT}`);
  }
  console.log(`  Pasta:    ${VIDEO_DIR}`);
  console.log('');
  console.log('  Pressione Ctrl+C para parar');
  console.log('');
});
