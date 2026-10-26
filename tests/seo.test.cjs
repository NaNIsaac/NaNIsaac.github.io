// Run: node tests/seo.test.cjs
// Structured data and canonical URLs: every page names the same Person (#person), the homepage
// is the only place that describes it in full, and each page's canonical URL is its own address.
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const site = 'https://nanisaac.github.io';
const personId = `${site}/#person`;
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const jsonLd = (html) =>
  [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));

function people(node, found = []) {
  if (Array.isArray(node)) node.forEach((n) => people(n, found));
  else if (node && typeof node === 'object') {
    if (node['@type'] === 'Person') found.push(node);
    Object.values(node).forEach((v) => people(v, found));
  }
  return found;
}

const pages = { 'index.html': '/', 'tools/index.html': '/tools/', 'lab/index.html': '/lab/' };
const described = [];
for (const [file, url] of Object.entries(pages)) {
  const html = read(file);
  const canonical = [...html.matchAll(/<link rel="canonical" href="([^"]+)">/g)].map((m) => m[1]);
  assert.deepStrictEqual(canonical, [`${site}${url}`], `${file}: canonical`);
  for (const person of people(jsonLd(html))) {
    assert.strictEqual(person['@id'], personId, `${file}: Person @id`);
    assert.strictEqual(person.name, 'Isaac Yong', `${file}: Person name`);
    if (person.alternateName || person.sameAs) described.push(file);
  }
}
assert.deepStrictEqual(described, ['index.html'], 'only the homepage describes the Person in full');

const [profile] = jsonLd(read('index.html')).filter((d) => d['@type'] === 'ProfilePage');
assert.ok(profile, 'index.html: ProfilePage');
assert.strictEqual(profile.mainEntity['@id'], personId, 'ProfilePage.mainEntity');
assert.deepStrictEqual(profile.mainEntity.alternateName, ['용이삭', 'NaNIsaac'], 'Isaac Yong = 용이삭 = NaNIsaac');

// People search for the GitHub handle, so the homepage title and the site name carry it.
const home = read('index.html');
assert.match(home.match(/<title>([^<]*)<\/title>/)[1], /^Isaac Yong \(NaNIsaac\)/, 'index.html: title');
const [website] = jsonLd(home).filter((d) => d['@type'] === 'WebSite');
assert.ok(website, 'index.html: WebSite');
assert.strictEqual(website.url, `${site}/`, 'WebSite.url is the homepage');
assert.deepStrictEqual(website.alternateName, ['NaNIsaac', '용이삭'], 'WebSite.alternateName');
assert.strictEqual(website.publisher['@id'], personId, 'WebSite.publisher');
assert.ok(read('_layouts/base.html').includes('<meta property="og:site_name" content="Isaac Yong (NaNIsaac)">'), 'base og:site_name');
assert.ok(/path: "google[0-9a-f]+\.html" \}\n\s+values: \{ sitemap: false \}/.test(read('_config.yml')), 'verification file kept out of the sitemap');

// The note layout is Liquid, so check its author reference and canonical tag as text.
assert.ok(read('_layouts/note.html').includes(`"author":{"@type":"Person","@id":"${personId}"`), 'note author @id');
assert.ok(read('_layouts/base.html').includes('<link rel="canonical" href="{{ page.url | absolute_url }}">'), 'base canonical');

console.log('seo: ok');
