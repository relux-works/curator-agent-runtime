const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const helpers = require('../site/app.js');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'dist/index.html'), 'utf8');
const match = html.match(/<script id="guide-data" type="application\/json">([\s\S]*?)<\/script>/);
assert.ok(match, 'Embedded data must be available without fetch');
const data = JSON.parse(match[1]);
const documents = Object.values(data.documents).filter(d => d.kind !== 'dir');
let checks = 0;
function check(name, action) { action(); checks += 1; console.log('PASS ' + name); }

check('all ten routes are defined, invalid routes use the overview', () => {
  assert.equal(data.nav.length, 10);
  data.nav.forEach(([route]) => assert.equal(helpers.normalizeRoute(route), route));
  ['missing', '', '__proto__', '<script>', null].forEach(route => assert.equal(helpers.normalizeRoute(route), 'overview'));
});
check('scenario stepping cannot wrap or produce an undefined stage', () => {
  assert.equal(data.scenarios.length, 6);
  data.scenarios.forEach(scenario => {
    assert.ok(scenario.steps.length >= 3);
    assert.equal(helpers.boundedStep(-1, scenario.steps.length), 0);
    assert.equal(helpers.boundedStep(Infinity, scenario.steps.length), 0);
    assert.equal(helpers.boundedStep(999, scenario.steps.length), scenario.steps.length - 1);
    scenario.steps.forEach((step, index) => {
      assert.equal(helpers.boundedStep(index, scenario.steps.length), index);
      assert.equal(step.length, 5);
      step.forEach(value => assert.ok(typeof value === 'string' && value.length));
    });
  });
});
check('source and diagram links exist for every scenario and component', () => {
  data.scenarios.forEach(s => {
    assert.ok(data.documents[s.source]);
    assert.equal(data.documents[s.diagram].kind, 'svg');
  });
  data.overview.nodes.forEach(n => assert.ok(data.documents[n.source]));
});
check('core connects through the broker, and graph identities are closed', () => {
  const ids = data.overview.nodes.map(n => n.id);
  assert.equal(new Set(ids).size, 11);
  data.overview.edges.forEach(([from, to]) => {
    assert.ok(ids.includes(from) && ids.includes(to));
    if (from === 'core') assert.equal(to, 'broker');
    if (to === 'core') assert.equal(from, 'broker');
  });
  data.overview.nodes.forEach(n => {
    assert.ok(n.x >= 0 && n.x + 172 <= 1200);
    assert.ok(n.y >= 0 && n.y + 70 <= 450);
  });
});
check('research source links resolve to actual embedded anchors', () => {
  assert.equal(data.systems.length, 28);
  const report = data.documents['.research/260908_runtime-landscape.md'];
  data.systems.forEach(s => {
    assert.ok(report.anchors.includes(s.id.toLowerCase()), s.id);
    assert.match(s.repository.sha, /^[0-9a-f]{40}$/);
  });
});
check('the full source corpus is present and retains its SHA-256 bytes', () => {
  assert.equal(documents.length, 70);
  assert.equal(documents.filter(d => d.kind === 'md').length, 37);
  assert.equal(documents.filter(d => d.kind === 'json').length, 9);
  documents.forEach(doc => assert.equal(crypto.createHash('sha256').update(doc.text).digest('hex'), doc.sha256, doc.path));
});
check('all diagrams have original SVG and PlantUML source', () => {
  assert.equal(data.diagrams.length, 11);
  data.diagrams.forEach(diagram => {
    assert.equal(data.documents[diagram.path].kind, 'svg');
    assert.equal(data.documents[diagram.path.replace(/\.svg$/, '.puml')].kind, 'puml');
    assert.ok(diagram.data_uri.startsWith('data:image/svg+xml;base64,'));
  });
});
check('the prospective conformance matrix retains V01 through V21', () => {
  assert.equal(data.vectors.length, 21);
  data.vectors.forEach((v, i) => assert.equal(v.id, 'V' + String(i + 1).padStart(2, '0')));
  assert.equal(data.coverage.runtime_execution_count, 0);
  assert.equal(data.coverage.claim_of_exhaustiveness, false);
});
check('full-text search finds source text and applies category boundaries', () => {
  assert.equal(helpers.findResources(documents, '', 'all').length, 70);
  const result = helpers.findResources(documents, 'reconciliation', 'Архитектура Apiary');
  assert.ok(result.length > 0);
  assert.ok(result.every(d => d.category === 'Архитектура Apiary'));
  assert.deepEqual(
    helpers.findResources(documents, 'RECONCILIATION', 'Архитектура Apiary').map(d => d.path),
    result.map(d => d.path)
  );
  assert.equal(helpers.findResources(documents, 'no-such-resource-4b6d17e2', 'all').length, 0);
  assert.ok(helpers.findResources(documents, 'полномочия', 'all').length > 0);
});
check('text interpolation escapes markup and attribute delimiters', () => {
  const result = helpers.escapeHTML('<img src=x onerror="bad()"> & \'');
  assert.equal(result, '&lt;img src=x onerror=&quot;bad()&quot;&gt; &amp; &#39;');
});
check('the live application script matches the CSP hash in the HTML', () => {
  const script = fs.readFileSync(path.join(root, 'site/app.js'), 'utf8');
  const digest = crypto.createHash('sha256').update(script).digest('base64');
  assert.ok(html.includes("script-src 'sha256-" + digest + "'"));
  assert.ok(html.includes('<script>' + script + '</script>'));
  assert.ok(!/\b(fetch|XMLHttpRequest|WebSocket|EventSource)\b/.test(script));
});
check('the hosted and downloadable HTML are identical standalone artifacts', () => {
  assert.equal(fs.readFileSync(path.join(root, 'dist/apiary.html'), 'utf8'), html);
  assert.equal(fs.readFileSync(path.join(root, 'docs/interactive/apiary.html'), 'utf8'), html);
  assert.ok(html.includes('href="apiary.html" download="apiary.html"'));
  assert.ok(!html.includes('@@DATA@@'));
  assert.ok(!html.includes('@@SCRIPT@@'));
});
console.log(JSON.stringify({checks, failures:0, browser_tests:0, runtime_conformance_probes:0}));
