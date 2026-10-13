'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const GameDayRender = require('../../assets/js/render.js');

let JSDOM = null;
try {
  ({ JSDOM } = require('jsdom'));
} catch (_) {
  JSDOM = null;
}

const skip = JSDOM ? false : 'jsdom not installed; run `npm install` to enable DOM XSS tests';

function render(html) {
  const dom = new JSDOM('<!DOCTYPE html><body></body>');
  dom.window.document.body.innerHTML = html;
  return dom.window.document;
}

const XSS = `<script>alert(1)</script><img src=x onerror="window.__pwned=1">`;

test('eventCard escapes every untrusted field', { skip }, () => {
  const doc = render(GameDayRender.eventCard({
    id: XSS,
    isHome: true,
    sportColor: 'red; } body{background:url(javascript:alert(1))}',
    sportIcon: XSS,
    hasScores: false,
    isWin: false,
    time: XSS,
    status: XSS,
    relativeDate: XSS,
    eventTitle: XSS,
    schoolName: XSS,
    opponent: XSS,
    locationType: XSS,
    venueName: XSS
  }));

  assert.equal(doc.querySelectorAll('script, img').length, 0, 'no injected elements');
  assert.equal(doc.querySelectorAll('[onerror]').length, 0, 'no injected event attributes');
  assert.ok(doc.body.textContent.includes('<script>alert(1)</script>'), 'payload rendered as inert text');
});

test('gameModal escapes venue and keeps data attributes inert', { skip }, () => {
  const doc = render(GameDayRender.gameModal({
    hasScores: true,
    sportIcon: 'fa-basketball',
    sport: XSS,
    status: XSS,
    teamLabel: XSS,
    schoolName: XSS,
    opponent: XSS,
    ourScore: XSS,
    oppScore: XSS,
    friendlyDate: XSS,
    time: XSS,
    locationType: XSS,
    venueName: `Gym" onmouseover="steal()`,
    venueAddress: XSS,
    parkingInfo: XSS,
    highlights: XSS
  }));

  assert.equal(doc.querySelectorAll('script, img').length, 0);
  assert.equal(doc.querySelectorAll('[onmouseover], [onerror]').length, 0);
  const mapBtn = doc.querySelector('[data-modal-venue]');
  assert.ok(mapBtn, 'venue button present');
  assert.equal(mapBtn.getAttribute('data-modal-venue'), `Gym" onmouseover="steal()`);
});

test('selectedEvent escapes and uses data-* handlers', { skip }, () => {
  const doc = render(GameDayRender.selectedEvent({
    sport: XSS,
    gender: XSS,
    level: XSS,
    timeStr: XSS,
    status: XSS,
    currentSchoolName: XSS,
    isHome: false,
    ourScore: XSS,
    oppScore: XSS,
    opponentStr: XSS,
    venueName: XSS,
    venueAddress: XSS,
    highlights: XSS,
    gcalLink: 'https://calendar.google.com/calendar/render?text=ok',
    sportColor: 'red',
    id: XSS
  }));

  assert.equal(doc.querySelectorAll('script, img').length, 0);
  assert.equal(doc.querySelectorAll('[onclick], [onerror]').length, 0);
  assert.equal(doc.querySelector('[data-cal-venue]').getAttribute('data-cal-venue'), XSS);
  assert.equal(doc.querySelector('[data-cal-ics]').getAttribute('data-cal-ics'), XSS);
});

test('venueDetail escapes parking/free text', { skip }, () => {
  const doc = render(GameDayRender.venueDetail({
    name: XSS,
    address: XSS,
    isHome: false,
    parking: XSS,
    games: [{ sport: XSS, opponent: XSS, date: XSS, time: XSS }]
  }));

  assert.equal(doc.querySelectorAll('script, img').length, 0);
  assert.equal(doc.querySelectorAll('[onerror], [onmouseover]').length, 0);
});

test('boxScoreCard escapes attacker-controlled stats objects', { skip }, () => {
  const doc = render(GameDayRender.boxScoreCard(
    { date: XSS, sport: XSS, opponent: XSS, ourScore: 1, oppScore: 2, stats: null },
    {
      periods: [{ name: XSS, us: XSS, them: XSS }],
      playerOfTheGame: { name: XSS, stat: XSS, avatar: XSS },
      teamStats: { [XSS]: XSS }
    },
    XSS
  ));

  assert.equal(doc.querySelectorAll('script, img').length, 0);
  assert.equal(doc.querySelectorAll('[onerror], [onmouseover], [onclick]').length, 0);
});

test('schoolListItem escapes school name/mascot', { skip }, () => {
  const doc = render(GameDayRender.schoolListItem({ id: XSS, name: XSS, mascot: XSS }));
  assert.equal(doc.querySelectorAll('script, img').length, 0);
  assert.equal(doc.querySelector('button').getAttribute('data-school-id'), XSS);
});

// These assertions do not need jsdom and guard the core guarantee directly on
// the emitted HTML string.
test('renderers escape XSS payloads at the string level', () => {
  const fields = {
    id: XSS,
    isHome: true,
    sportColor: 'red',
    sportIcon: 'fa-trophy',
    hasScores: false,
    isWin: false,
    time: XSS,
    status: XSS,
    relativeDate: XSS,
    eventTitle: XSS,
    schoolName: XSS,
    opponent: XSS,
    locationType: XSS,
    venueName: XSS
  };

  const card = GameDayRender.eventCard(fields);
  assert.ok(!card.includes('<script'), 'no raw <script>');
  assert.ok(!card.includes('<img'), 'no raw <img>');
  assert.ok(card.includes('&lt;script&gt;'), 'payload appears escaped');

  const modal = GameDayRender.gameModal({
    hasScores: false,
    sportIcon: 'fa-trophy',
    sport: 'Soccer',
    status: 'Scheduled',
    teamLabel: 'Varsity',
    schoolName: 'Sugar-Salem',
    opponent: 'Rigby',
    friendlyDate: 'Fri',
    time: '7:00 PM',
    locationType: 'Home',
    venueName: `Gym" onmouseover="steal()`,
    venueAddress: 'x'
  });
  assert.ok(!modal.includes('onmouseover="'), 'no usable onmouseover handler');
  assert.ok(modal.includes('data-modal-venue="Gym&quot; onmouseover=&quot;steal()"'));
});

test('safeIcon rejects arbitrary/unsafe icon classes', () => {
  assert.equal(GameDayRender.safeIcon('fa-trophy'), 'fa-trophy');
  assert.equal(GameDayRender.safeIcon('<script>'), 'fa-trophy');
  assert.equal(GameDayRender.safeIcon('fa-trophy" onload="x'), 'fa-trophy');
});

test('safeColor rejects values that could break out of a style attribute', () => {
  assert.equal(GameDayRender.safeColor('#1769aa'), '#1769aa');
  assert.equal(GameDayRender.safeColor('var(--primary)'), 'var(--primary)');
  assert.ok(!GameDayRender.safeColor('red;background:url(x)').includes(';'));
  assert.ok(!GameDayRender.safeColor('"><script>').includes('<'));
});
