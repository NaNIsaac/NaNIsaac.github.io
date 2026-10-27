// Run: node scripts/reports.cjs
// Writes _data/reports.json for /reports/ from each repository's docs/reports/README.md: the
// repository description and the newest finished reports. Run it again when a repository
// publishes a report; GitHub Pages only reads the JSON.
const fs = require('node:fs');
const path = require('node:path');

const REPOS = ['NaNIsaac/QoraPhase', 'NaNIsaac-Research/ReflectoLearn', 'NaNIsaac-Research/TraTT'];
const INDEX = 'docs/reports/README.md';
const LATEST = 2;

const plain = (md) =>
  md
    .replace(/\\\|/g, '|')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/[`*]/g, '')
    .replace(/\s*\(#\d+\)/g, '')
    .trim();

const cells = (line) => line.slice(1, -1).split(/(?<!\\)\|/).map((c) => c.trim());

function rows(markdown, base) {
  return markdown
    .split('\n')
    .filter((line) => /^\|\s*\d{4}-\d{2}-\d{2}\s*\|/.test(line))
    .map(cells)
    .map(([date, report, result, status = '']) => {
      const href = report.match(/\]\(([^)]+)\)/)[1];
      return { date, title: plain(report).replace(/^\d+\.\s+/, ''), url: new URL(href, base).href, result: plain(result), status: plain(status) };
    });
}

async function get(url, accept) {
  const response = await fetch(url, { headers: { Accept: accept, 'User-Agent': 'nanisaac.github.io' } });
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  return accept.includes('json') ? response.json() : response.text();
}

async function main() {
  const repos = [];
  for (const name of REPOS) {
    const info = await get(`https://api.github.com/repos/${name}`, 'application/vnd.github+json');
    const branch = info.default_branch;
    const markdown = await get(`https://raw.githubusercontent.com/${name}/${branch}/${INDEX}`, 'text/plain');
    const index = `https://github.com/${name}/blob/${branch}/${INDEX}`;
    const finished = rows(markdown, index).filter((r) => !/^(draft|superseded)/.test(r.status));
    repos.push({
      name: info.name,
      url: info.html_url,
      description: info.description ?? '',
      index,
      latest: finished.slice(0, LATEST).map(({ date, title, url, result }) => ({ date, title, url, result })),
    });
  }
  const out = path.join(__dirname, '..', '_data', 'reports.json');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, `${JSON.stringify({ repos }, null, 1)}\n`);
  console.log(`${out}: ${repos.map((r) => `${r.name} ${r.latest.length}`).join(', ')}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
