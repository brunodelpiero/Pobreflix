/**
 * Escapa caracteres HTML perigosos para evitar XSS quando inserindo
 * nomes de arquivo (que podem conter <, >, &, etc.) no HTML.
 */
export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]));
}

/**
 * Layout HTML base. Recebe um título e o corpo (HTML string) e devolve a página completa.
 */
export function layout({ title = 'Pobreflix', body }) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    :root {
      --bg: #0d0b08;
      --bg-elevated: #1a1612;
      --bg-card: #1f1a14;
      --bg-card-hover: #2a221a;
      --accent: #d4a256;
      --accent-dim: #8b6a3a;
      --text: #f0e8d8;
      --text-dim: #8a8275;
      --border: rgba(212, 162, 86, 0.15);
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: Georgia, 'Times New Roman', serif;
      background: var(--bg);
      background-image:
        radial-gradient(ellipse at top, rgba(212, 162, 86, 0.06), transparent 60%),
        radial-gradient(ellipse at bottom right, rgba(139, 106, 58, 0.04), transparent 50%);
      background-attachment: fixed;
      color: var(--text);
      min-height: 100vh;
      font-feature-settings: 'liga' 1, 'kern' 1;
    }

    header {
      padding: 24px 32px;
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      z-index: 10;
      background: rgba(13, 11, 8, 0.85);
      -webkit-backdrop-filter: blur(8px);
      backdrop-filter: blur(8px);
    }

    header h1 {
      font-size: 22px;
      font-weight: 400;
      letter-spacing: 4px;
      text-transform: uppercase;
    }

    header h1 a {
      color: var(--accent);
      text-decoration: none;
    }

    header h1 .dot {
      color: var(--text-dim);
      margin: 0 4px;
    }

    h2 {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      padding: 32px 32px 14px;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: var(--text-dim);
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 18px;
      padding: 10px 32px 40px;
    }

    .card {
      background: var(--bg-card);
      border-radius: 4px;
      overflow: hidden;
      transition: transform 0.25s ease, box-shadow 0.25s ease, background 0.25s ease;
      cursor: pointer;
      display: block;
      text-decoration: none;
      color: inherit;
      border: 1px solid transparent;
    }

    .card:hover {
      transform: translateY(-4px);
      background: var(--bg-card-hover);
      border-color: var(--border);
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5);
    }

    .card-image, .card-placeholder {
      width: 100%;
      aspect-ratio: 2 / 3;
      object-fit: cover;
      background: var(--bg-elevated);
      display: block;
    }

    .card-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 48px;
      color: var(--accent-dim);
    }

    .card-body {
      padding: 12px 14px 16px;
    }

    .card-title {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
      font-weight: 500;
      color: var(--text);
      line-height: 1.35;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    .card-subtitle {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 11px;
      color: var(--text-dim);
      margin-top: 4px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    .empty {
      padding: 40px 32px;
      color: var(--text-dim);
      font-style: italic;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
    }

    .empty code {
      background: var(--bg-elevated);
      padding: 2px 8px;
      border-radius: 3px;
      font-family: 'Consolas', monospace;
      color: var(--accent);
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin: 20px 32px 0;
      color: var(--text-dim);
      text-decoration: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 13px;
      transition: color 0.2s;
    }

    .back-link:hover { color: var(--accent); }

    @media (max-width: 600px) {
      header { padding: 18px 20px; }
      header h1 { font-size: 18px; letter-spacing: 3px; }
      h2 { padding: 24px 20px 10px; }
      .grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; padding: 8px 20px 30px; }
    }
  </style>
</head>
<body>
${body}
</body>
</html>`;
}
