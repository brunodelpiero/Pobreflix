import { layout, escapeHtml } from './layout.js';

function movieCard(movie) {
  const url = `/watch?file=${encodeURIComponent(movie.file)}`;
  const thumb = movie.cover
    ? `<img class="card-image" src="/thumb?img=${encodeURIComponent(movie.cover)}" alt="${escapeHtml(movie.title)}" loading="lazy">`
    : `<div class="card-placeholder">🎬</div>`;

  return `
    <a class="card" href="${url}">
      ${thumb}
      <div class="card-body">
        <div class="card-title">${escapeHtml(movie.title)}</div>
        <div class="card-subtitle">${escapeHtml(movie.category)}</div>
      </div>
    </a>
  `;
}

function serieCard(serie) {
  const url = `/serie?nome=${encodeURIComponent(serie.name)}`;
  const thumb = serie.cover
    ? `<img class="card-image" src="/thumb?img=${encodeURIComponent(serie.cover)}" alt="${escapeHtml(serie.name)}" loading="lazy">`
    : `<div class="card-placeholder">📺</div>`;

  const count = serie.episodeCount;
  const subtitle = count === 1 ? '1 episódio' : `${count} episódios`;

  return `
    <a class="card" href="${url}">
      ${thumb}
      <div class="card-body">
        <div class="card-title">${escapeHtml(serie.name)}</div>
        <div class="card-subtitle">${subtitle}</div>
      </div>
    </a>
  `;
}

export function renderHome({ movies, series }) {
  const body = `
    <header>
      <h1><a href="/">Pobre<span class="dot">·</span>flix</a></h1>
    </header>

    <h2>Filmes</h2>
    ${
      movies.length
        ? `<div class="grid">${movies.map(movieCard).join('')}</div>`
        : `<div class="empty">Nenhum filme encontrado em <code>Filmes/</code></div>`
    }

    <h2>Séries</h2>
    ${
      series.length
        ? `<div class="grid">${series.map(serieCard).join('')}</div>`
        : `<div class="empty">Nenhuma série encontrada em <code>Series/</code></div>`
    }
  `;

  return layout({ title: 'Pobreflix', body });
}
