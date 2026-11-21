import { UAParser } from 'ua-parser-js';

export interface UaInfo {
  browser: string;
  engine: string;
  os: string;
  device: string;
  cpu: string;
  bot: string | null;
}

const BOTS: [RegExp, string][] = [
  [/googlebot/i, 'Googlebot'],
  [/bingbot/i, 'Bingbot'],
  [/duckduckbot/i, 'DuckDuckBot'],
  [/yandex(bot|images)/i, 'YandexBot'],
  [/baiduspider/i, 'Baiduspider'],
  [/GPTBot/i, 'OpenAI GPTBot'],
  [/OAI-SearchBot/i, 'OpenAI SearchBot'],
  [/ChatGPT-User/i, 'ChatGPT-User'],
  [/ClaudeBot/i, 'Anthropic ClaudeBot'],
  [/Claude-User/i, 'Anthropic Claude-User'],
  [/Claude-SearchBot/i, 'Anthropic Claude-SearchBot'],
  [/PerplexityBot/i, 'PerplexityBot'],
  [/Google-Extended/i, 'Google-Extended'],
  [/CCBot/i, 'Common Crawl CCBot'],
  [/facebookexternalhit/i, 'Facebook link preview'],
  [/Twitterbot/i, 'Twitterbot'],
  [/Slackbot/i, 'Slackbot'],
  [/Discordbot/i, 'Discordbot'],
  [/curl\//i, 'curl'],
  [/python-requests/i, 'python-requests'],
  [/(bot|crawler|spider|crawling)/i, 'Generic bot'],
];

const join = (...p: (string | undefined)[]) => p.filter(Boolean).join(' ') || 'Unknown';

export function parseUa(ua: string): UaInfo {
  // an empty string would make UAParser fall back to the current browser's UA
  if (!ua.trim()) return { browser: 'Unknown', engine: 'Unknown', os: 'Unknown', device: 'Unknown', cpu: 'Unknown', bot: null };
  const r = new UAParser(ua.trim()).getResult();
  const bot = BOTS.find(([re]) => re.test(ua))?.[1] ?? null;
  const type = r.device.type ?? (r.os.name && /android|ios/i.test(r.os.name) ? 'mobile' : 'desktop');
  return {
    browser: join(r.browser.name, r.browser.version),
    engine: join(r.engine.name, r.engine.version),
    os: join(r.os.name, r.os.version),
    device: [type, join(r.device.vendor, r.device.model)].filter((x) => x && x !== 'Unknown').join(' · ') || 'Unknown',
    cpu: r.cpu.architecture ?? 'Unknown',
    bot,
  };
}
