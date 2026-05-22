import path from 'node:path';

/**
 * Resolve um caminho recebido do usuário de forma segura.
 * Garante que o resultado fica dentro do diretório base, prevenindo
 * path traversal (ex: "../../../etc/passwd").
 *
 * Também decodifica %20, %C3%A7 etc. das URLs.
 *
 * @param {string} base - Diretório raiz permitido (absoluto)
 * @param {...string} parts - Partes do caminho vindas do usuário
 * @returns {string} Caminho absoluto seguro
 * @throws {Error} com code='EBADPATH' se tentar sair do base
 */
export function safeJoin(base, ...parts) {
  const decoded = parts.map((p) => decodeURIComponent(p || ''));
  const resolved = path.resolve(base, ...decoded);
  const baseResolved = path.resolve(base);

  // Aceita o próprio base ou qualquer coisa dentro dele
  const isInside =
    resolved === baseResolved ||
    resolved.startsWith(baseResolved + path.sep);

  if (!isInside) {
    const err = new Error(`Path traversal detectado: ${parts.join('/')}`);
    err.code = 'EBADPATH';
    throw err;
  }
  return resolved;
}
