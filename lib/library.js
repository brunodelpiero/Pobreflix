import fs from 'node:fs/promises';
import path from 'node:path';

const VIDEO_EXT = /\.(mp4|mkv|avi|mov|webm)$/i;
const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp'];

async function pathExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * Procura uma capa no diretório com o nome baseName.{jpg,jpeg,png,webp}.
 * Retorna o nome do arquivo encontrado, ou null.
 */
async function findCover(dir, baseName) {
  for (const ext of IMAGE_EXTS) {
    if (await pathExists(path.join(dir, baseName + ext))) {
      return baseName + ext;
    }
  }
  return null;
}

/**
 * Escaneia VIDEO_DIR/Filmes/Categoria/Filme.mp4
 * Procura capa com o mesmo nome do filme (Filme.jpg, Filme.png etc.)
 * Retorna: [{ title, category, file, cover }]
 */
export async function scanMovies(baseDir) {
  const moviesRoot = path.join(baseDir, 'Filmes');
  if (!(await pathExists(moviesRoot))) return [];

  const result = [];
  const categories = await fs.readdir(moviesRoot, { withFileTypes: true });

  for (const cat of categories) {
    if (!cat.isDirectory()) continue;
    const catDir = path.join(moviesRoot, cat.name);
    const files = await fs.readdir(catDir);

    for (const f of files) {
      if (!VIDEO_EXT.test(f)) continue;
      const title = f.replace(VIDEO_EXT, '');
      const coverName = await findCover(catDir, title);
      result.push({
        title,
        category: cat.name,
        file: ['Filmes', cat.name, f].join('/'),
        cover: coverName ? ['Filmes', cat.name, coverName].join('/') : null,
      });
    }
  }

  return result.sort((a, b) => a.title.localeCompare(b.title));
}

/**
 * Escaneia VIDEO_DIR/Series/Nome (suporta subpastas de temporada).
 * Procura capa como Series/Nome/cover.{ext} ou Series/Nome/{Nome}.{ext}
 * Retorna a lista de séries (sem os episódios): [{ name, cover, episodeCount }]
 */
export async function scanSeries(baseDir) {
  const seriesRoot = path.join(baseDir, 'Series');
  if (!(await pathExists(seriesRoot))) return [];

  const result = [];
  const dirs = await fs.readdir(seriesRoot, { withFileTypes: true });

  for (const d of dirs) {
    if (!d.isDirectory()) continue;
    const serieDir = path.join(seriesRoot, d.name);

    const episodes = await listEpisodes(serieDir, ['Series', d.name]);
    const cover =
      (await findCover(serieDir, 'cover')) ||
      (await findCover(serieDir, d.name));

    result.push({
      name: d.name,
      cover: cover ? ['Series', d.name, cover].join('/') : null,
      episodeCount: episodes.length,
    });
  }

  return result.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Lista episódios de uma série recursivamente (suporta temporadas em subpastas).
 *
 * @param {string} serieAbsPath - Caminho absoluto da pasta da série
 * @param {string[]} relPathParts - Partes do caminho relativo a VIDEO_DIR (ex: ['Series', 'Breaking Bad'])
 * @returns {Promise<Array<{ title, file, season }>>}
 */
export async function listEpisodes(serieAbsPath, relPathParts) {
  const result = [];

  async function walk(absPath, relParts, season = null) {
    const entries = await fs.readdir(absPath, { withFileTypes: true });

    for (const e of entries) {
      const full = path.join(absPath, e.name);
      const rel = [...relParts, e.name];

      if (e.isDirectory()) {
        // Subpasta = temporada
        await walk(full, rel, e.name);
      } else if (VIDEO_EXT.test(e.name)) {
        result.push({
          title: e.name.replace(VIDEO_EXT, ''),
          file: rel.join('/'),
          season,
        });
      }
    }
  }

  await walk(serieAbsPath, relPathParts);
  return result.sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true }));
}
