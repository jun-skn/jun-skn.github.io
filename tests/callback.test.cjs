const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const vm = require('node:vm');

const html = readFileSync(new URL('../gsync/callback.html', `file://${__filename}`), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const pathname = '/gsync/callback.html';

// No browser storage, network or token APIs are provided: using them fails the test.
function openPage(params = {}, { historyBlocked = false } = {}) {
  const elements = Object.fromEntries(['title', 'msg', 'open'].map(id => [id, {
    textContent: '', href: '#', classList: new Set(),
  }]));
  const location = { search: `?${new URLSearchParams(params)}`, pathname, href: '' };
  const historyCalls = [];
  const timers = [];
  vm.runInNewContext(script, {
    window: { location },
    document: { getElementById: id => elements[id] },
    history: { replaceState: (...args) => {
      if (historyBlocked) throw new Error('Browser denied history access');
      historyCalls.push(args);
    } },
    setTimeout: (callback, delay) => timers.push({ callback, delay }),
    URLSearchParams, Uint8Array, TextDecoder, atob,
  });
  return { elements, location, historyCalls, timers };
}

function stateFor(vault) {
  return `test-nonce~${Buffer.from(vault).toString('base64url')}`;
}

function target(page) {
  const url = new URL(page.elements.open.href);
  assert.equal(url.protocol, 'obsidian:');
  assert.equal(url.hostname, 'gsync-auth');
  return url.searchParams;
}

test('direct visits show instructions without opening Obsidian', () => {
  const page = openPage();
  assert.match(page.elements.msg.textContent, /GSync設定/);
  assert.ok(page.elements.open.classList.has('hidden'));
  assert.equal(page.timers.length, 0);
  assert.equal(page.location.href, '');
});

test('a state without a code or error does not open Obsidian', () => {
  const page = openPage({ state: stateFor('Notes') });
  assert.ok(page.elements.open.classList.has('hidden'));
  assert.equal(page.timers.length, 0);
});

test('Japanese vault names and complete state survive the round trip', () => {
  const state = stateFor('研究ノート 📚 / 個人');
  const page = openPage({ code: 'dummy-code', state });
  assert.equal(target(page).get('vault'), '研究ノート 📚 / 個人');
  assert.equal(target(page).get('code'), 'dummy-code');
  assert.equal(target(page).get('state'), state);
  assert.equal(page.timers.length, 1);
  assert.equal(page.timers[0].delay, 300);
  page.timers[0].callback();
  assert.equal(page.location.href, page.elements.open.href);
});

test('code/state/error query and fragment are removed from the current history entry', () => {
  const page = openPage({ code: 'dummy-code', state: stateFor('Notes'), scope: 'unused' });
  assert.deepEqual(page.historyCalls, [[null, '', pathname]]);
  assert.equal(target(page).has('scope'), false);
});

test('Google cancellation is shown as text and returned to the plugin', () => {
  const error = '<img src=x onerror=alert(1)>&extra=value';
  const state = stateFor('Notes');
  const page = openPage({ error, state, error_description: 'not forwarded' });
  assert.match(page.elements.title.textContent, /完了しません/);
  assert.ok(page.elements.msg.textContent.includes(error));
  assert.equal(target(page).get('error'), error);
  assert.equal(target(page).get('state'), state);
  assert.equal(target(page).has('code'), false);
  assert.equal(target(page).has('extra'), false);
  assert.equal(target(page).has('error_description'), false);
  assert.deepEqual(page.historyCalls, [[null, '', pathname]]);
});

test('encoded parameter delimiters cannot inject a different vault or target URL', () => {
  const vault = 'Notes&code=other#fragment';
  const code = 'dummy+code&vault=other?x=#%/日本語';
  const page = openPage({ code, state: stateFor(vault), redirect_uri: 'https://example.invalid/' });
  assert.equal(target(page).get('code'), code);
  assert.equal(target(page).get('vault'), vault);
  assert.equal(target(page).getAll('vault').length, 1);
  assert.equal(target(page).has('redirect_uri'), false);
});

test('legacy state without a vault suffix is passed through unchanged', () => {
  const page = openPage({ code: 'dummy-code', state: 'legacy-state' });
  assert.equal(target(page).get('state'), 'legacy-state');
  assert.equal(target(page).has('vault'), false);
});

test('invalid base64url does not prevent state validation by GSync', () => {
  const state = 'test-nonce~%%%';
  const page = openPage({ code: 'dummy-code', state });
  assert.equal(target(page).get('state'), state);
  assert.equal(target(page).has('vault'), false);
});

test('missing state is left for the plugin to reject', () => {
  const page = openPage({ code: 'dummy-code' });
  assert.equal(target(page).get('code'), 'dummy-code');
  assert.equal(target(page).has('state'), false);
});

test('manual and automatic Obsidian return remain available when history cleanup is blocked', () => {
  const page = openPage({ code: 'dummy-code', state: stateFor('Notes') }, { historyBlocked: true });
  assert.equal(target(page).get('code'), 'dummy-code');
  assert.equal(page.timers.length, 1);
  page.timers[0].callback();
  assert.equal(page.location.href, page.elements.open.href);
});

test('callback uses no external assets and keeps referrer protection and upstream notice', () => {
  assert.match(html, /<meta name="referrer" content="no-referrer">/);
  assert.match(html, /Copyright \(c\) 2026 dg0988/);
  assert.match(html, /<noscript>/);
  assert.doesNotMatch(html, /<(?:script|img|iframe|link)\b[^>]*(?:src|href)=/i);
});
