#!/usr/bin/env node
/**
 * Smoke test SEO: verifica status HTTP das rotas críticas do site público.
 *
 * Uso:
 *   1. Em outro terminal: npm run dev (ou npm start em build prod)
 *   2. Neste terminal: npm run seo:check [base-url]
 *
 * Default base-url: http://localhost:3000
 *
 * Saída: tabela com status por rota. Exit 1 se qualquer rota retornar
 * != 200.
 */

import process from 'node:process';

const BASE = (process.argv[2] || process.env.SEO_CHECK_BASE || 'http://localhost:3000').replace(/\/$/, '');

const ROUTES = [
  { path: '/', mustContain: ['<html lang="pt-BR"', '<title>', 'application/ld+json'] },
  { path: '/sitemap.xml', mustContain: ['<urlset', '<loc>'] },
  { path: '/robots.txt', mustContain: ['User-Agent:', 'Sitemap:'] },
  { path: '/manifest.webmanifest', mustContain: ['"name":"Numa', '"theme_color"'] },
  { path: '/opengraph-image', binary: true },
  // Rotas SEO de Fase 1+ que ainda não existem: validar apenas que
  // sitemap.xml as lista (já feito em /sitemap.xml acima).
];

const results = [];
let exitCode = 0;

for (const route of ROUTES) {
  const url = `${BASE}${route.path}`;
  let outcome = { path: route.path, url, status: 0, bytes: 0, ok: false, note: '' };

  try {
    const res = await fetch(url, { redirect: 'follow' });
    outcome.status = res.status;
    if (route.binary) {
      const buf = await res.arrayBuffer();
      outcome.bytes = buf.byteLength;
      outcome.ok = res.ok && buf.byteLength > 0;
      if (!outcome.ok) outcome.note = 'binary empty or non-ok';
    } else {
      const text = await res.text();
      outcome.bytes = text.length;
      outcome.ok = res.ok;
      if (route.mustContain) {
        for (const needle of route.mustContain) {
          if (!text.includes(needle)) {
            outcome.ok = false;
            outcome.note = `missing: ${needle}`;
            break;
          }
        }
      }
    }
  } catch (err) {
    outcome.note = err.message || String(err);
  }

  results.push(outcome);
  if (!outcome.ok) exitCode = 1;
}

console.log(`SEO check @ ${BASE}\n`);
for (const r of results) {
  const flag = r.ok ? 'OK ' : 'FAIL';
  console.log(`${flag}  ${r.status.toString().padStart(3)}  ${r.bytes.toString().padStart(6)}B  ${r.path}${r.note ? '   — ' + r.note : ''}`);
}
console.log('');
process.exit(exitCode);
