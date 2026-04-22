const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const VIDEO_DIR = __dirname; // pasta atual

function getContentType(file) {
  if (file.endsWith('.mp4')) return 'video/mp4';
  if (file.endsWith('.avi')) return 'video/x-msvideo';
  if (file.endsWith('.mkv')) return 'video/x-matroska';
  return 'application/octet-stream';
}

http.createServer((req, res) => {

  // Página inicial lista vídeos
  if (req.url === '/') {

   let list = '';

// ===== FILMES =====
const filmesPath = path.join(VIDEO_DIR, 'Filmes');

if (fs.existsSync(filmesPath)) {
  const categorias = fs.readdirSync(filmesPath);

  categorias.forEach(cat => {
    const catPath = path.join(filmesPath, cat);

    if (fs.statSync(catPath).isDirectory()) {

      const files = fs.readdirSync(catPath)
        .filter(f => f.match(/\.(mp4|avi|mkv)$/));

      files.forEach(f => {
        const name = f.replace(/\.(mp4|avi|mkv)$/i, '');
        const img = `${name}.jpg`;

        list += `
          <a href="/watch?file=Filmes/${cat}/${f}">
            <div class="card">
              <img src="/thumb?img=Filmes/${cat}/${img}">
              <div class="title">${name}</div>
            </div>
          </a>
        `;
      });

    }
  });
}


// ===== SERIES =====
const seriesPath = path.join(VIDEO_DIR, 'Series');

if (fs.existsSync(seriesPath)) {
  const categorias = fs.readdirSync(seriesPath);

  categorias.forEach(cat => {
    const catPath = path.join(seriesPath, cat);

    if (fs.statSync(catPath).isDirectory()) {

      const files = fs.readdirSync(catPath)
        .filter(f => f.match(/\.(mp4|avi|mkv)$/));

      files.forEach(f => {
        const name = f.replace(/\.(mp4|avi|mkv)$/i, '');

        list += `
          <a href="/watch?file=Series/${cat}/${f}">
            <div class="card">
              <div class="thumb">📺</div>
              <div class="title">${cat} - ${name}</div>
            </div>
          </a>
        `;
      });

    }
  });
}

    res.writeHead(200, { 'Content-Type': 'text/html' });
return res.end(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Minha Biblioteca</title>
  <style>
    body {
      margin: 0;
      font-family: Arial;
      background: #141414;
      color: white;
    }

    h1 {
      padding: 20px;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 15px;
      padding: 20px;
    }

    .card {
      background: #1f1f1f;
      border-radius: 10px;
      overflow: hidden;
      transition: 0.3s;
      cursor: pointer;
    }

    .card img {
     width: 100%;
     height: 250px;
     object-fit: cover;
    }

    .card:hover {
      transform: scale(1.05);
      background: #2a2a2a;
    }

    .thumb {
      height: 120px;
      background: #333;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 40px;
    }

    .title {
      padding: 10px;
      font-size: 14px;
      word-break: break-word;
    }

    a {
      text-decoration: none;
      color: white;
    }
  </style>
</head>
<body>

  <h1>🎬 POBREFLIX</h1>

 <div class="grid">
  ${list}
</div>

</body>
</html>
`);
  }

  // Página de player
  else if (req.url.startsWith('/watch')) {
    const file = new URL(req.url, `http://${req.headers.host}`).searchParams.get('file');

    res.writeHead(200, { 'Content-Type': 'text/html' });
return res.end(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      margin: 0;
      background: black;
      display: flex;
      flex-direction: column;
      height: 100vh;
    }

    video {
      width: 100%;
      height: 100%;
      background: black;
    }

    .topbar {
      position: absolute;
      top: 10px;
      left: 10px;
    }

    a {
      color: white;
      text-decoration: none;
      font-size: 18px;
      background: rgba(0,0,0,0.6);
      padding: 8px 12px;
      border-radius: 5px;
    }
  </style>
</head>
<body>

  <div class="topbar">
    <a href="/">⬅ Voltar</a>
  </div>

  <video controls autoplay>
    <source src="/video?file=${file}">
  </video>

</body>
</html>
`);
  }

  // Streaming
  else if (req.url.startsWith('/video')) {
    const file = new URL(req.url, `http://${req.headers.host}`).searchParams.get('file');
    const videoPath = path.join(VIDEO_DIR, file);

    if (!fs.existsSync(videoPath)) {
      res.writeHead(404);
      return res.end('Arquivo não encontrado');
    }

    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;
    const contentType = getContentType(file);

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      const chunkSize = (end - start) + 1;
      const stream = fs.createReadStream(videoPath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType,
      });

      stream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': contentType,
      });

      fs.createReadStream(videoPath).pipe(res);
    }
  }

    else if (req.url.startsWith('/thumb')) {
      const img = new URL(req.url, `http://${req.headers.host}`).searchParams.get('img');
      const imgPath = path.join(__dirname, img);

      console.log("Imagem solicitada:", img);
      console.log("Caminho:", imgPath);

      if (fs.existsSync(imgPath)) {
       res.writeHead(200, { 'Content-Type': 'image/jpeg' });
       fs.createReadStream(imgPath).pipe(res);
     } else {
          console.log("Imagem NÃO encontrada");
          res.writeHead(404);
          res.end("Imagem não encontrada");
  }
} 

  else {
    res.writeHead(404);
    res.end('Rota não encontrada');
  }

}).listen(PORT, '0.0.0.0', () => {
  console.log(`http://192.168.98.14:${PORT}`);
});