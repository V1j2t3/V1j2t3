/* --- BEGIN: README tests (Jest) --- */
const fs = require('fs');
const path = require('path');

function readFirstExisting(candidates) {
  for (const p of candidates) {
    const full = path.resolve(process.cwd(), p);
    try {
      const text = fs.readFileSync(full, 'utf8');
      return { path: full, text };
    } catch (_) {}
  }
  return { path: null, text: null };
}

const readme = readFirstExisting(['README.md', 'Readme.md', 'readme.md']);
const text = readme.text || '';

describe('README.md (profile template from PR diff)', () => {
  test('file exists at a standard path', () => {
    expect(readme.path).toBeTruthy();
    expect(readme.text).toBeTruthy();
  });

  test('contains greeting with GitHub handle @v1j2t3', () => {
    expect(text).toMatch(/👋\s*Hi,\s*I[’']m\s*@v1j2t3/);
  });

  test('contains expected bullet placeholders (interests, learning, collaboration, contact, pronouns, fun fact)', () => {
    const bullets = [
      /👀\s*I[’']m\s*interested\s*in\s*\.\.\./,
      /🌱\s*I[’']m\s*currently\s*learning\s*\.\.\./,
      /💞️\s*I[’']m\s*looking\s*to\s*collaborate\s*on\s*\.\.\./,
      /📫\s*How\s*to\s*reach\s*me\s*\.\.\./,
      /😄\s*Pronouns:\s*\.\.\./,
      /⚡\s*Fun\s*fact:\s*\.\.\./,
    ];
    for (const re of bullets) {
      expect(text).toMatch(re);
    }
  });

  test('lists the bullet placeholders in the expected order', () => {
    const indices = [
      text.search(/👀\s*I[’']m\s*interested\s*in/),
      text.search(/🌱\s*I[’']m\s*currently\s*learning/),
      text.search(/💞️\s*I[’']m\s*looking\s*to\s*collaborate\s*on/),
      text.search(/📫\s*How\s*to\s*reach\s*me/),
      text.search(/😄\s*Pronouns/),
      text.search(/⚡\s*Fun\s*fact/),
    ];
    expect(indices.every(i => i >= 0)).toBe(true);
    const sorted = [...indices].sort((a, b) => a - b);
    expect(indices).toEqual(sorted);
  });

  test('includes GitHub profile README explanatory comment text', () => {
    expect(text).toMatch(/special\s*✨\s*repository\s*because\s*its\s*`README\.md`.*appears\s*on\s*your\s*GitHub\s*profile/i);
    expect(text).toMatch(/You\s*can\s*click\s*the\s*Preview\s*link\s*to\s*take\s*a\s*look\s*at\s*your\s*changes/i);
  });

  test('has at least one HTML comment block marker (open/close)', () => {
    // Accept both <!-- and <!--- variants and corresponding closers
    const openers = (text.match(/<!---?/g) || []).length;
    const closers = (text.match(/--->?/g) || []).length;
    expect(Math.max(openers, closers)).toBeGreaterThanOrEqual(1);
  });

  test('no unresolved merge conflict markers present', () => {
    expect(text).not.toMatch(/<<<<<<<|=======|>>>>>>>/);
  });

  test('file ends with a newline', () => {
    // If file missing, this fails via the existence test
    if (readme.text) {
      expect(readme.text.endsWith('\n')).toBe(true);
    } else {
      // Make this explicit to avoid TypeError in CI logs
      expect(readme.text).toBeTruthy();
    }
  });

  test('no trailing whitespace on any line', () => {
    const offending = text.split(/\r?\n/).filter(l => /\s+$/.test(l));
    expect(offending).toEqual([]);
  });

  test('gracefully handles presence/absence of Markdown links (no broken local links)', () => {
    const linkRe = /\[([^\]]+)\]\(([^)]+)\)/g;
    const localLinks = [];
    for (const m of text.matchAll(linkRe)) {
      const url = (m[2] || '').trim();
      if (/^https?:\/\//i.test(url)) continue; // skip remote checks
      if (url.startsWith('#')) continue; // intra-doc anchor
      localLinks.push(url.replace(/#.*/, '')); // strip hash part
    }
    // For each local link, assert the file exists (relative to repo root)
    for (const rel of localLinks) {
      const p = path.resolve(process.cwd(), rel);
      expect(fs.existsSync(p)).toBe(true);
    }
  });
});
/* --- END: README tests (Jest) --- */