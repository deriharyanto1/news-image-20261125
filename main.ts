// THE WORLD TODAY — 25 November 2026.
// A one-page newspaper drawn from scratch with a hand-built 5x7 vector font and
// a small PNG encoder (zlib deflate, CRC32). No network, no assets: the program
// draws every pixel itself, so two runs write byte-identical output.
//
// Usage: mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// ---------------------------------------------------------------- PNG encoder

const CRC_TABLE: number[] = (() => {
  const t: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t.push(c >>> 0);
  }
  return t;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td), 0);
  return Buffer.concat([len, td, crc]);
}

function encodePNG(w: number, h: number, rgb: Uint8Array): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type 2 = RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const raw = Buffer.alloc(h * (1 + w * 3));
  for (let y = 0; y < h; y++) {
    raw[y * (1 + w * 3)] = 0; // filter: none
    raw.set(rgb.subarray(y * w * 3, (y + 1) * w * 3), y * (1 + w * 3) + 1);
  }
  const idat = deflateSync(raw, { level: 9 });
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

// ---------------------------------------------------------------- 5x7 font
// Each glyph is 7 rows of 5 bits. Digits are drawn the way a newspaper sets
// them: '9' is a top bowl with a right stem running down, never two loops,
// so it can never be read as an '8'.

const FONT: Record<string, string[]> = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01110', '10001', '10000', '10111', '10001', '10001', '01111'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['01110', '00100', '00100', '00100', '00100', '00100', '01110'],
  J: ['00111', '00010', '00010', '00010', '00010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '11011', '10001'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  '3': ['11111', '00010', '00100', '00010', '00001', '10001', '01110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
  '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
  ',': ['00000', '00000', '00000', '00000', '01100', '00100', '01000'],
  ':': ['00000', '01100', '01100', '00000', '01100', '01100', '00000'],
  ';': ['00000', '01100', '01100', '00000', '01100', '00100', '01000'],
  "'": ['00100', '00100', '01000', '00000', '00000', '00000', '00000'],
  '-': ['00000', '00000', '00000', '01110', '00000', '00000', '00000'],
  '(': ['00010', '00100', '01000', '01000', '01000', '00100', '00010'],
  ')': ['01000', '00100', '00010', '00010', '00010', '00100', '01000'],
  '%': ['11001', '11010', '00010', '00100', '01000', '01011', '10011'],
  $: ['00100', '01111', '10100', '01110', '00101', '11110', '00100'],
  '/': ['00001', '00010', '00010', '00100', '01000', '01000', '10000'],
  '&': ['01100', '10010', '10100', '01000', '10101', '10010', '01101'],
  '!': ['00100', '00100', '00100', '00100', '00100', '00000', '00100'],
  '?': ['01110', '10001', '00001', '00110', '00100', '00000', '00100'],
  '+': ['00000', '00100', '00100', '01110', '00100', '00100', '00000'],
  '=': ['00000', '00000', '11111', '00000', '11111', '00000', '00000'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
};

// ---------------------------------------------------------------- canvas

const W = 1024;
const H = 1024;
const PAPER: [number, number, number] = [246, 241, 227];
const INK: [number, number, number] = [17, 17, 17];
const RED: [number, number, number] = [163, 22, 33];
const GREY: [number, number, number] = [120, 112, 96];

const px = new Uint8Array(W * H * 3);
for (let i = 0; i < W * H; i++) {
  px[i * 3] = PAPER[0];
  px[i * 3 + 1] = PAPER[1];
  px[i * 3 + 2] = PAPER[2];
}

function setPix(x: number, y: number, c: [number, number, number]): void {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  px[i] = c[0];
  px[i + 1] = c[1];
  px[i + 2] = c[2];
}

function rect(x: number, y: number, w: number, h: number, c: [number, number, number]): void {
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) setPix(xx, yy, c);
}

function hline(x: number, y: number, w: number, c: [number, number, number], t = 1): void {
  rect(x, y, w, t, c);
}

function box(x: number, y: number, w: number, h: number, c: [number, number, number]): void {
  hline(x, y, w, c);
  hline(x, y + h - 1, w, c);
  rect(x, y, 1, h, c);
  rect(x + w - 1, y, 1, h, c);
}

function textWidth(s: string, scale: number): number {
  return s.length * 6 * scale - scale;
}

function drawText(s: string, x: number, y: number, scale: number, c: [number, number, number]): void {
  let cx = x;
  for (const ch of s) {
    const g = FONT[ch] ?? FONT[' '];
    for (let r = 0; r < 7; r++) {
      for (let col = 0; col < 5; col++) {
        if (g[r][col] === '1') {
          for (let dy = 0; dy < scale; dy++) {
            for (let dx = 0; dx < scale; dx++) setPix(cx + col * scale + dx, y + r * scale + dy, c);
          }
        }
      }
    }
    cx += 6 * scale;
  }
}

function drawTextCentered(s: string, y: number, scale: number, c: [number, number, number]): void {
  drawText(s, Math.round((W - textWidth(s, scale)) / 2), y, scale, c);
}

// Greedy word wrap: returns lines that fit maxChars characters.
function wrap(s: string, maxChars: number): string[] {
  const words = s.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if (!cur) {
      cur = w;
    } else if (cur.length + 1 + w.length <= maxChars) {
      cur += ' ' + w;
    } else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

// Draw wrapped text, return the y just below the last line.
function drawBlock(s: string, x: number, y: number, maxChars: number, scale: number, lh: number, c: [number, number, number]): number {
  const lines = wrap(s, maxChars);
  for (const line of lines) {
    drawText(line, x, y, scale, c);
    y += lh;
  }
  return y;
}

// ---------------------------------------------------------------- content
// Every fact below was first reported on Wednesday 25 November 2026
// (Reuters / AP / Xinhua wires). No earlier-day story is used as a 25 Nov
// story: not the COP31 collapse, not the Libya warship, not the Kerch bridge.

const TOP_KICKER = 'SPACE - CHINA';
const TOP_HEADLINE = ["PAKISTAN'S FIRST ASTRONAUT", 'RIDES TO TIANGONG'];
const TOP_LINES = [
  'SHENZHOU-24 LIFTS OFF FROM JIUQUAN AT 00:18 UTC ON A LONG MARCH 2F',
  "CREW: TANG HONGBO, WU YI AND PAKISTAN'S MUHAMMAD ZEESHAN ALI, 40",
  'FIRST PAKISTANI IN ORBIT AND FIRST FOREIGN ASTRONAUT ABOARD TIANGONG',
  'CREW TO SPEND 5-10 DAYS ABOARD THE CHINESE SPACE STATION',
];

type Panel = { kicker: string; head: string; body: string };
const PANELS: Panel[] = [
  {
    kicker: 'UNITED STATES',
    head: 'TRUMP READIES NEW TARIFFS',
    body: 'WHITE HOUSE POISED TO RELEASE SECTION 301 FINDINGS ON EXCESS CAPACITY IN 16 TRADING PARTNERS, INCLUDING CHINA AND THE EU. NEW DUTIES EXPECTED WITHIN DAYS.',
  },
  {
    kicker: 'UKRAINE',
    head: 'STRIKES HIT ODESA AND KYIV',
    body: 'RUSSIAN STRIKE KILLS 2 IN ODESA, INCLUDING A 17-YEAR-OLD; 3 HURT. KYIV DRONE HITS A 16-STOREY BLOCK, 2 HURT. UKRAINE HITS 2 REFINERIES IN SAMARA.',
  },
  {
    kicker: 'MIDDLE EAST',
    head: 'DRONE HITS RIYADH TOWER',
    body: "HOUTHI DRONE STRIKES THE 385-M, 80-STOREY PIF TOWER IN RIYADH'S FINANCIAL DISTRICT. SECOND HIT IN UNDER A WEEK; 11 PEOPLE INJURED.",
  },
  {
    kicker: 'CHINA',
    head: 'TOP OFFICIAL UNDER PROBE',
    body: 'POLITBURO MEMBER CHEN JINING, SHANGHAI PARTY CHIEF, IS UNDER INVESTIGATION. THE FOURTH MEMBER OF THE TOP BODY PROBED SINCE 2025.',
  },
  {
    kicker: 'INDONESIA',
    head: '30 MINERS TRAPPED IN BOGOR',
    body: 'RESCUERS SEARCH FOR ABOUT 30 WORKERS TRAPPED 100 M DEEP IN A GOLD MINE IN PONGKOR SINCE MONDAY AS RAIN FLOODS THE SHAFT. THE MINE IS UNAUTHORISED.',
  },
  {
    kicker: 'MARKETS',
    head: 'ASIAN STOCKS TUMBLE',
    body: 'MSCI ASIA EX-JAPAN -2.3%; SOUTH KOREA -5.3%, TAIWAN -5.1%, NIKKEI -2.9% AS TARIFF FEARS SPREAD. BRENT $90.97; BITCOIN $59,257; NVIDIA -5.9%.',
  },
  {
    kicker: 'AFRICA',
    head: 'WHO PULLS STAFF FROM CONGO',
    body: 'WHO EVACUATES STAFF FROM A HOSPITAL IN ITURI, DR CONGO, AS FIGHTING NEARS. EBOLA OUTBREAK: 11,613 CASES, 5,678 DEATHS; 400-500 NEW CASES A WEEK.',
  },
  {
    kicker: 'EUROPE',
    head: 'FRANCE REJECTS EU BUDGET',
    body: 'PARIS REJECTS THE 1.78 TRILLION EURO EU BUDGET AS LEADERS MEET ON 26-27 NOV. GERMANY PMI 55.0, BEST SINCE MARCH 2022; FRANCE 46.2 IN CONTRACTION.',
  },
  {
    kicker: 'SPORT',
    head: 'TEEN, 15, SMASHES 204 OFF 53',
    body: 'VAIBHAV SOORYAVANSHI HITS THE FASTEST LIST A CENTURY IN 28 BALLS FOR INDIA A VS UAE. ENGLAND BEAT AUSTRALIA BY 8 WICKETS; PANT 128 IN WELLINGTON DRAW.',
  },
];

const QUOTE = "I'M NOT FLYING FOR MYSELF. I CARRY THE NAME OF PAKISTAN ON MY SHOULDER.";
const QUOTE_ATTR = '- MUHAMMAD ZEESHAN ALI, SHENZHOU-24';

// 39 one-line briefs, 13 per column, across all 10 regions.
const BRIEFS: string[] = [
  // North America
  'US PCE AND Q3 GDP DATA DUE WEDNESDAY',
  'FED SEEN 97% LIKELY TO HIKE RATES IN DECEMBER',
  'NVIDIA SLIDES 5.9% AS HUANG BOUNCE FADES',
  'BITCOIN FALLS TO $59,257 AS CRYPTO SLIDES',
  'ORACLE BONDS SLUMP AS CREDIT FEARS SPREAD',
  // South America
  'ARGENTINA 2027 BUDGET GOES TO FLOOR VOTE',
  'COLOMBIAN PESO BIGGEST DECLINER, -3%',
  // Western Europe
  'FRANCE REJECTS 1.78 TRILLION EURO EU BUDGET',
  'EU LEADERS MEET 26-27 NOVEMBER',
  'GERMANY PMI 55.0, STRONGEST SINCE MAR 2022',
  'FRANCE PMI 46.2 AS FACTORIES CONTRACT',
  'DUTCH COURT BANS BYD TI7 ACROSS THE EU',
  'SPAIN HEADS TO SNAP ELECTION ON 29 NOV',
  'LEGO TO BUILD 1 BILLION EURO PLANT IN PORTUGAL',
  'EU READIES 22ND SANCTIONS PACKAGE VS RUSSIA',
  // Eastern Europe
  'RUSSIA EXTRADITES CHINESE IN $2.25BN CASE',
  'CZECHIA REACH FIRST DAVIS CUP SEMI-FINAL',
  'UKRAINE DRONES HIT 2 REFINERIES IN SAMARA',
  'GERMANY GRANTS INTEL AGENCIES NEW POWERS',
  'KYIV DRONE FIRE IN 16-STOREY BLOCK, 2 HURT',
  // Middle East
  'HOUTHI DRONE HITS 385-M RIYADH PIF TOWER',
  'SECOND RIYADH STRIKE IN UNDER A WEEK',
  // Africa
  'WHO EVACUATES STAFF FROM ITURI HOSPITAL',
  'EBOLA: 11,613 CASES AND 5,678 DEATHS',
  '400-500 NEW EBOLA CASES EACH WEEK',
  // South Asia
  'SOORYAVANSHI, 15, SMASHES 204 OFF 53 BALLS',
  'FASTEST LIST A CENTURY IN JUST 28 BALLS',
  'PANT HITS 128 IN WELLINGTON TEST DRAW',
  "PAKISTAN'S ALI, 40, FIRST PAKISTANI IN ORBIT",
  'BEN STOKES ENTERS IPL AUCTION AT TOP PRICE',
  // East Asia
  'CHEN JINING PROBED, 4TH SINCE 2025',
  'SHENZHOU-24 CREW: TANG, WU AND ALI',
  'SOUTH KOREA SHARES -5.3% ON TARIFF FEAR',
  'NIKKEI -2.9% AS CHIP STOCKS SLIDE',
  'MSCI ASIA EX-JAPAN DOWN 2.3% WEDNESDAY',
  // Southeast Asia
  '30 MINERS TRAPPED 100 M DEEP IN BOGOR',
  'PONGKOR MINE UNAUTHORISED, ANTAM SAYS',
  // Oceania
  'AUSTRALIA CPI TRIMMED MEAN AT 3.8%',
  'ENGLAND BEAT AUSTRALIA BY 8 WICKETS',
];

// ---------------------------------------------------------------- layout

const MX = 28; // left margin
const CW = W - MX * 2; // 968 content width

// Masthead
drawTextCentered('THE WORLD TODAY', 18, 7, INK);
hline(MX, 78, CW, INK, 3);
hline(MX, 83, CW, INK, 1);
// Dateline row
drawText('WEDNESDAY 25 NOVEMBER 2026', MX, 94, 2, INK);
const ed = 'WORLD EDITION';
drawText(ed, W - MX - textWidth(ed, 2), 94, 2, RED);
hline(MX, 118, CW, INK, 1);

// Top story
drawText(TOP_KICKER, MX, 132, 2, RED);
let ty = 150;
for (const line of TOP_HEADLINE) {
  drawText(line, MX, ty, 3, INK);
  ty += 24;
}
ty += 2;
for (const line of TOP_LINES) {
  drawText(line, MX, ty, 2, INK);
  ty += 15;
}
hline(MX, 268, CW, INK, 2);

// Nine panels: 3 columns x 3 rows
const PW = 312;
const PGAP = 16;
const PH = 112;
const panelX = [MX, MX + PW + PGAP, MX + 2 * (PW + PGAP)];
const panelY = [280, 400, 520];
for (let i = 0; i < PANELS.length; i++) {
  const p = PANELS[i];
  const x = panelX[i % 3];
  const y = panelY[Math.floor(i / 3)];
  box(x, y, PW, PH, INK);
  drawText(p.kicker, x + 10, y + 8, 1, RED);
  let py = y + 22;
  const headLines = wrap(p.head, 25);
  for (const line of headLines) {
    drawText(line, x + 10, py, 2, INK);
    py += 15;
  }
  hline(x + 10, py + 1, PW - 20, RED, 1);
  py += 6;
  const bodyLines = wrap(p.body, 50);
  for (const line of bodyLines.slice(0, 4)) {
    drawText(line, x + 10, py, 1, INK);
    py += 11;
  }
}

// Quote box
box(MX, 644, CW, 46, RED);
drawTextCentered(QUOTE, 654, 2, INK);
drawTextCentered(QUOTE_ATTR, 674, 1, GREY);

// Briefs
drawText('THE DAY IN BRIEF', MX, 706, 2, INK);
hline(MX, 726, CW, INK, 1);
const colX = [MX, MX + PW + PGAP, MX + 2 * (PW + PGAP)];
const perCol = 13;
for (let c = 0; c < 3; c++) {
  let by = 740;
  for (let r = 0; r < perCol; r++) {
    const b = BRIEFS[c * perCol + r];
    rect(colX[c], by + 2, 5, 5, RED);
    const lines = wrap(b, 48);
    for (const line of lines.slice(0, 2)) {
      drawText(line, colX[c] + 11, by, 1, INK);
      by += 11;
    }
    by += 4;
  }
}

// Footer
hline(MX, 986, CW, INK, 2);
drawTextCentered('50 STORIES FROM 10 REGIONS', 996, 2, INK);

// ---------------------------------------------------------------- write out

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'entry.png'), encodePNG(W, H, px));
