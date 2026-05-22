import { layout, escapeHtml } from './layout.js';

function episodeCard(ep) {
  const url = `/watch?file=${encodeURIComponent(ep.file)}`;
  return `
    <a class="card" href="${url}">
      <div class="card-placeholder">▶</div>
      <div class="card-body">
        <div class="card-title">${escapeHtml(ep.title)}</div>
      </div>
    </a>
  `;
}

/**
 * Agrupa episódios por temporada (se houver subpastas).
 * Se nenhum tem temporada definida, retorna um único grupo com null.
 */
function groupBySeason(episodes) {
  const groups = new Map();
  for (const ep of episodes) {
    const key = ep.season || '__all__';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(ep);
  }
  return [...groups.entries()].sort(([a], [b]) =>
    a.localeCompare(b, undefined, { numeric: true })
  );
}

export function renderSerie({ nome, episodes }) {
  const groups = groupBySeason(episodes);

  const sections = groups
    .map(([season, eps]) => {
      const heading = season === '__all__' ? 'Episódios' : escapeHtml(season);
      return `
        <h2>${heading}</h2>
        <div class="grid">${eps.map(episodeCard).join('')}</div>
      `;
    })
    .join('');

  const body = `
    <header>
      <h1><a href="/">Pobre<span class="dot">·</span>flix</a></h1>
    </header>

    <a class="back-link" href="/">← Voltar</a>

    <h2 style="color: var(--text); font-size: 24px; font-family: Georgia, serif; text-transform: none; letter-spacing: 0; padding-top: 20px;">${escapeHtml(nome)}</h2>

    ${
      episodes.length
        ? sections
        : `<div class="empty">Nenhum episódio encontrado</div>`
    }
  `;

  return layout({ title: `${nome} · Pobreflix`, body });
}
