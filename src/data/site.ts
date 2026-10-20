// Everything the page says, and the route the flight takes through it.
// Career facts follow the 2026 CV. Project copy follows the design canvas.

export type Status = 'live' | 'rel' | 'prog' | 'proto' | 'thesis' | 'arch';
export type Tag = 'rel' | 'prog' | 'proto' | 'ai' | 'game' | 'acad' | 'legacy';

export interface Link { label: string; href: string }

export interface Project {
  id: string;
  name: string;
  years: string;
  pitch: string;
  stack: string[];
  status: string;
  st: Status;
  tags: Tag[];
  icon?: string;
  /** Monogram colour for projects without an icon. */
  tint?: string;
  links?: Link[];
  /** Rank among the eight picks, 1 is the top. */
  pick?: number;
  plate?: {
    bg: string;
    ink: string;
    glow: string;
    shot: string;
    shotKind: 'phone' | 'wide';
    shotAlt: string;
    pill: string;
  };
}

export interface Job {
  id: string;
  when: string;
  org: string;
  role: string;
  desc: string;
  kind: 'work' | 'study';
  current?: boolean;
}

const I = (n: string) => `/img/icons/${n}.webp`;
const S = (n: string) => `/img/shots/${n}.webp`;

export const projects: Project[] = [
  {
    id: 'arcana', name: 'Arcana', years: '2024 → now', pick: 1, icon: I('arcana'),
    pitch: 'An AI platform for talking to LLM-driven characters who have their own city, schedule and voice. They text, send photos and voice notes, and call in real time. I built and run all of it, including the moderation pipelines and cost-aware rate limiting.',
    stack: ['Flutter', 'Google Cloud', 'Gemini Live', 'Vertex AI', 'Cloud Run'],
    status: 'Live', st: 'live', tags: ['rel', 'ai'],
    links: [
      { label: 'App Store', href: 'https://apps.apple.com/us/app/arcanaai-ai-roleplay/id6698897929' },
      { label: 'Google Play', href: 'https://play.google.com/store/apps/details?id=com.mythicai.app' },
    ],
    plate: { bg: '#22102E', ink: '#FFEDE4', glow: '#FF7A59', shot: S('arcana'), shotKind: 'phone', shotAlt: 'Arcana chat screen', pill: 'Live on iOS and Android' },
  },
  {
    id: 'dimmed', name: 'Dimmed', years: '2023 → now', pick: 2, icon: I('dimmed'),
    pitch: 'A dating app for the LGBTQ+ community built around safety, with AI-reviewed admission, selfie verification and a nearby grid. It has charted in Portugal’s App Store top downloads several times, peaking at #8.',
    stack: ['Flutter', 'Supabase', 'PostgreSQL', 'Edge Functions', 'GPS'],
    status: 'Live', st: 'live', tags: ['rel', 'ai'],
    links: [
      { label: 'App Store', href: 'https://apps.apple.com/us/app/dimmed-gay-chat/id6444031282' },
      { label: 'Google Play', href: 'https://play.google.com/store/apps/details?id=com.dimmed.app' },
    ],
    plate: { bg: '#18151A', ink: '#F7ECF7', glow: '#E44CD9', shot: S('dimmed'), shotKind: 'phone', shotAlt: 'Dimmed promo screen', pill: '#8 on the App Store in Portugal' },
  },
  {
    id: 'the-feed', name: 'The Feed', years: '2026', pick: 3, icon: I('the-feed'),
    pitch: 'A social network where every follower is an AI you own. They post, comment and DM on their own schedule.',
    stack: ['Flutter', 'Gemini', 'Cloud Functions', 'Live Activities'],
    status: 'Live', st: 'live', tags: ['rel', 'ai'],
    links: [
      { label: 'App Store', href: 'https://apps.apple.com/us/app/the-feed-ai-social-network/id6766583546' },
      { label: 'Google Play', href: 'https://play.google.com/store/apps/details?id=com.felix.thefeed' },
    ],
    plate: { bg: '#CDEFA0', ink: '#142409', glow: '#6FCB3A', shot: S('the-feed'), shotKind: 'phone', shotAlt: 'The Feed home screen', pill: 'Live on iOS and Android' },
  },
  {
    id: 'sims', name: 'The Sims Mod Manager', years: '2026', pick: 4, icon: I('sims'),
    pitch: 'A free desktop mod manager for The Sims 1–4, Medieval and SimCity, with eight hand-built skins that match each game’s own UI.',
    stack: ['Flutter Desktop', 'Firebase', 'GitHub Actions', '19★ on GitHub'],
    status: 'Live', st: 'live', tags: ['rel', 'game'],
    links: [
      { label: 'Website', href: 'https://thesimsmodmanager.web.app/' },
      { label: 'GitHub', href: 'https://github.com/rodrifelix99/TheSimsModManager' },
    ],
    plate: { bg: '#D9F1E4', ink: '#0D2B1D', glow: '#3FBF7F', shot: S('sims'), shotKind: 'wide', shotAlt: 'Mod library in The Sims 4 skin', pill: 'Free for Windows, macOS and Linux' },
  },
  {
    id: 'hoot', name: 'Hoot', years: '2023 → now', pick: 5, icon: I('hoot'),
    pitch: 'The good old social network, rebuilt: subscribe to themed feeds instead of people, plus Hoot Radio. No ads, no tracking.',
    stack: ['Flutter', 'Firebase', 'Gemini', 'Source-available'],
    status: 'Live', st: 'live', tags: ['rel', 'ai'],
    links: [
      { label: 'App Store', href: 'https://apps.apple.com/us/app/hoot-social-feeds-reimagined/id6450933398' },
      { label: 'hootsocial.me', href: 'https://hootsocial.me' },
    ],
    plate: { bg: '#E8DAF4', ink: '#26133A', glow: '#B57BE0', shot: S('hoot'), shotKind: 'phone', shotAlt: 'Hoot feed screen', pill: 'Live on iOS and Android' },
  },
  {
    id: 'nonic', name: 'NONIC Network', years: '2021 → 2023', pick: 6, tint: '#A9A5E6',
    pitch: 'Ask the people around you anything, publicly or anonymously. It reached #1 in Portugal’s App Store top downloads at launch. Retired in 2023 for a rebuild in Flutter.',
    stack: ['Ionic', 'Angular', 'Firebase Auth', 'PHP'],
    status: 'Retired', st: 'arch', tags: ['rel', 'legacy'],
    plate: { bg: '#A9A5E6', ink: '#16123A', glow: '#8C86F0', shot: S('nonic'), shotKind: 'wide', shotAlt: 'NONIC Network welcome and sign-in screens on two phones', pill: '#1 on the App Store in Portugal' },
  },
  {
    id: 'app4shm', name: 'App4SHM', years: '2023 → now', pick: 7, icon: I('app4shm'),
    pitch: 'Checks the health of bridges with a phone: it records vibration, extracts natural frequencies and flags damage over time. A team research project I build with the research team at Universidade Lusófona.',
    stack: ['Flutter', 'Signal processing', 'Multi-device sync'],
    status: 'Research', st: 'thesis', tags: ['acad'],
    links: [{ label: 'Watch the demo', href: 'https://www.youtube.com/watch?v=l7dSopnTRJ0' }],
    plate: { bg: '#12C995', ink: '#052A1F', glow: '#12C995', shot: S('app4shm'), shotKind: 'phone', shotAlt: 'App4SHM start screen', pill: 'Research at Universidade Lusófona' },
  },
  {
    id: 'worldwink', name: 'Worldwink', years: '2026', pick: 8, icon: I('worldwink'),
    pitch: 'Roll the dice, travel the world and build resorts, with Pip the penguin. A casual mobile game on a server-side economy.',
    stack: ['Unity 6', 'C#', 'Firebase', '6 languages'],
    status: 'In testing', st: 'prog', tags: ['prog', 'game'],
    links: [{ label: 'Website', href: 'https://worldwink.web.app' }],
    plate: { bg: '#CFEAFB', ink: '#08243C', glow: '#4FA8E8', shot: S('worldwink'), shotKind: 'wide', shotAlt: 'Worldwink key art with Pip the penguin', pill: 'In testing, built in Unity' },
  },

  // Everything else
  { id: 'backloot', name: 'Backloot', years: '2026', icon: I('backloot'), pitch: 'Social tracker for your game backlog. Import from Steam, Xbox or PlayStation, then rate, review and follow friends.', stack: ['Flutter Web', 'IGDB', 'Gemini'], status: 'Live on the web', st: 'live', tags: ['rel', 'ai'], links: [{ label: 'backloot.web.app', href: 'https://backloot.web.app' }] },
  { id: 'staysync', name: 'StaySync', years: '2026', icon: I('staysync'), pitch: 'One calendar for short-term rental hosts, merging Airbnb and Booking.com feeds.', stack: ['Flutter', 'iCal', 'Firebase'], status: 'Released', st: 'rel', tags: ['rel'] },
  { id: 'pioneer', name: 'PIONEER Toolbox', years: '2026', icon: I('pioneer'), pitch: 'MSc thesis at ISCTE: an AI partner for designing Challenge-Based Learning around UN SDG 11.', stack: ['Flutter', 'Vertex AI', '11 locales'], status: 'Thesis', st: 'thesis', tags: ['acad', 'ai'] },
  { id: 'joura', name: 'Joura', years: '2026', icon: I('joura'), pitch: 'Group trip planning with a shared itinerary and expenses split to the cent.', stack: ['Flutter', 'Riverpod', 'Maps', 'Gemini'], status: 'Store-ready', st: 'prog', tags: ['prog', 'ai'] },
  { id: 'trovra', name: 'Trovra', years: '2026', icon: I('trovra'), pitch: 'Purchase intelligence: the best way to buy something, before you spend.', stack: ['Flutter', 'Gemini', 'Eval benchmarks'], status: 'TestFlight', st: 'prog', tags: ['prog', 'ai'] },
  { id: 'reprise', name: 'Reprise', years: '2026', icon: I('reprise'), pitch: 'Last.fm scrobbler and music stats. Your Wrapped, all year round.', stack: ['Flutter', 'Firebase', 'Last.fm API'], status: 'In review', st: 'prog', tags: ['prog'] },
  { id: 'kaleido', name: 'Kaleido', years: '2026', icon: I('kaleido'), pitch: 'One post, many makers. Friends fill tiles of a shared Mosaic from a link, no account needed.', stack: ['Flutter', 'Cloud Vision', 'BigQuery'], status: 'Alpha', st: 'prog', tags: ['prog'] },
  { id: 'metrowright', name: 'Metrowright', years: '2026', tint: '#9DB67E', pitch: 'A PC city-builder in a realistic-miniature style, built on a deterministic simulation.', stack: ['Unity 6', 'URP', 'C#'], status: 'Vertical slice', st: 'prog', tags: ['prog', 'game'] },
  { id: 'citybound', name: 'Citybound', years: '2026', icon: I('citybound'), pitch: 'Isometric idle city tycoon, hand-rendered in Flutter with no game engine.', stack: ['Flutter', 'CustomPainter', 'Game Center'], status: 'In progress', st: 'prog', tags: ['prog', 'game'] },
  { id: 'clip', name: 'Clip', years: '2026', icon: I('clip'), pitch: 'Describe a mini web app in chat; AI writes it, hosts it and lets others remix it.', stack: ['Flutter', 'Cloud Run', 'Qwen3-Coder'], status: 'Prototype', st: 'proto', tags: ['proto', 'ai'] },
  { id: 'collective-alibi', name: 'Collective Alibi', years: '2026', icon: I('collective-alibi'), pitch: 'A party game for 4–10 players where AI players fill the empty seats.', stack: ['Flutter Web', 'Gemini'], status: 'Prototype', st: 'proto', tags: ['proto', 'game', 'ai'] },
  { id: 'capsule', name: 'Capsule', years: '2026', tint: '#F4C76B', pitch: 'Time-locked gift capsules of photos, voice notes and handwriting, with an 80s/90s soul.', stack: ['Flutter', 'Riverpod', 'Firebase'], status: 'Prototype', st: 'proto', tags: ['proto'] },
  { id: 'second-opinion', name: 'Second Opinion', years: '2025', icon: I('second-opinion'), pitch: 'Ask a yes/no question or run a poll and get answers from real people in minutes.', stack: ['Flutter', 'Firebase', 'Vertex AI'], status: 'Released', st: 'rel', tags: ['rel', 'ai'] },
  { id: 'innerhalo', name: 'InnerHalo', years: '2025', icon: I('innerhalo'), pitch: 'AI mood journal and wellness companion for daily check-ins.', stack: ['Flutter', 'Firebase AI', 'RevenueCat'], status: 'Released', st: 'rel', tags: ['rel', 'ai'] },
  { id: 'wanderly', name: 'Wanderly', years: '2024', icon: I('wanderly'), pitch: 'Turns your city into a treasure hunt. AI suggests real places; you visit and snap them for your passport.', stack: ['Flutter', 'Gemini', 'Maps'], status: 'Released', st: 'rel', tags: ['rel', 'ai'] },
  { id: 'otaku', name: 'Otaku', years: '2023', icon: I('otaku'), pitch: 'Anime and manga tracker built on MyAnimeList data: millions of titles, episode and chapter progress, and an offline library.', stack: ['Flutter', 'MAL API', 'ObjectBox'], status: 'Released', st: 'rel', tags: ['rel'] },
  { id: 'skyvee', name: 'Skyvee', years: '2020', tint: '#8FC3FF', pitch: 'A lightweight cloud desktop where web apps run like native ones.', stack: ['Electron', 'JavaScript'], status: 'Archived', st: 'arch', tags: ['legacy'] },
  { id: 'getcool', name: 'GetCool', years: '2020', tint: '#C9F27A', pitch: 'Anonymous mobile web app for sharing thoughts, with no names or pictures.', stack: ['PHP', 'MySQL'], status: 'Archived', st: 'arch', tags: ['legacy'] },
  { id: 'skyvee24', name: 'Skyvee24', years: 'Earlier', tint: '#D9B8FF', pitch: 'A social network built around interests and virtual rooms.', stack: ['PHP', 'MySQL'], status: 'Archived', st: 'arch', tags: ['legacy'] },
  { id: 'buddy', name: 'Buddy', years: 'Earlier', tint: '#FFD38A', pitch: 'A network connecting people from different cultures.', stack: ['PHP', 'MySQL'], status: 'Archived', st: 'arch', tags: ['legacy'] },
];

export const jobs: Job[] = [
  { id: 'lyzer', kind: 'work', current: true, when: 'Sep 2025 → now', org: 'Lyzer', role: 'Mid-level Software Developer, Lisbon (remote)', desc: 'I develop and maintain a production Flutter app: Firebase Analytics for usage insight, Remote Config feature flags that change behaviour without a redeploy, and integration with backend services on Microsoft Azure. I work with backend and product to keep data flowing reliably between client and server.' },
  { id: 'iscte', kind: 'study', when: '2024 → 2026', org: 'ISCTE', role: 'MSc in Computer Engineering, University Institute of Lisbon', desc: 'My thesis is PIONEER Toolbox, an AI partner that helps educators design Challenge-Based Learning activities around UN SDG 11.' },
  { id: 'endlessloop', kind: 'work', when: 'Aug 2023 → Sep 2025', org: 'Endlessloop', role: 'Junior Software Developer, Lisbon (remote)', desc: 'I built and maintained production applications with a focus on clean architecture, scalability, and integration with backend and cloud services, working with cross-functional teams from requirements to delivery.' },
  { id: 'teacher', kind: 'work', when: 'Sep 2021 → Aug 2023', org: 'Escola Profissional de Tecnologia Digital', role: 'Basic Programming Teacher, Lisbon', desc: 'I taught programming fundamentals to vocational students.' },
  { id: 'lusofona', kind: 'study', when: '2020 → 2023', org: 'Universidade Lusófona', role: 'BSc in Computer Engineering', desc: 'This is where App4SHM started: a structural-health-monitoring app I still build with the university’s research team.' },
  { id: 'siemens', kind: 'work', when: 'Aug 2019 → Oct 2020', org: 'Siemens', role: 'Junior Software Developer (intern), Lisbon', desc: 'Software development internship.' },
];

export const contact = {
  email: 'rodrifelix99@gmail.com',
  social: [
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/rodrifelix99/' },
    { label: 'GitHub', href: 'https://github.com/rodrifelix99' },
    { label: 'Instagram', href: 'https://www.instagram.com/rodrifelix99/' },
  ],
};

export const skills = [
  { group: 'Apps', items: ['Flutter', 'Dart', 'Riverpod', 'GetX', 'UI/UX'] },
  { group: 'Backend and cloud', items: ['Google Cloud', 'Firebase', 'Supabase', 'PostgreSQL', 'Cloud Functions', 'REST APIs'] },
  { group: 'AI and data', items: ['LLM systems', 'Gemini', 'Vertex AI', 'Data pipelines', 'Python'] },
  { group: 'Shipping', items: ['Git and GitHub', 'Fastlane', 'RevenueCat', 'Unity'] },
];

// ---------------------------------------------------------------- route --
// The flight runs from now back in time. Every stop owns a slot of scroll,
// measured in viewport-heights. Eras group stops for the map, and each era is
// one engine leg, so the leg weights are the sums of their stops' slots.

export type Side = 'lead' | 'trail';

export interface Stop {
  id: string;
  kind: 'hero' | 'pick' | 'log' | 'origin' | 'silence' | 'finale';
  w: number;
  side?: Side;
  title?: string;
  projects?: string[];
  jobs?: string[];
}

export interface Era { id: string; label: string; ground?: string; stops: Stop[] }

export const eras: Era[] = [
  { id: 'y2026', label: '2026', ground: '2026', stops: [
    { id: 'hero', kind: 'hero', w: 0.8, side: 'lead' },
    { id: 'the-feed', kind: 'pick', w: 0.9, side: 'lead', projects: ['the-feed'] },
    { id: 'sims', kind: 'pick', w: 0.9, side: 'trail', projects: ['sims'] },
    { id: 'worldwink', kind: 'pick', w: 0.9, side: 'lead', projects: ['worldwink'] },
    { id: 'log-2026a', kind: 'log', w: 0.7, side: 'trail', title: 'Also shipped in 2026', projects: ['backloot', 'staysync', 'pioneer', 'joura', 'trovra', 'reprise'] },
    { id: 'log-2026b', kind: 'log', w: 0.7, side: 'lead', title: 'On the bench in 2026', projects: ['kaleido', 'metrowright', 'citybound', 'clip', 'collective-alibi', 'capsule'] },
  ] },
  { id: 'y2025', label: '2025', ground: '2025', stops: [
    { id: 'log-2025', kind: 'log', w: 0.8, side: 'trail', title: '2025', jobs: ['lyzer'], projects: ['second-opinion', 'innerhalo'] },
  ] },
  { id: 'y2024', label: '2024', ground: '2024', stops: [
    { id: 'arcana', kind: 'pick', w: 1.0, side: 'lead', projects: ['arcana'] },
    { id: 'log-2024', kind: 'log', w: 0.7, side: 'trail', title: '2024', jobs: ['iscte'], projects: ['wanderly'] },
  ] },
  { id: 'y2023', label: '2023', ground: '2023', stops: [
    { id: 'dimmed', kind: 'pick', w: 0.9, side: 'lead', projects: ['dimmed'] },
    { id: 'hoot', kind: 'pick', w: 0.9, side: 'trail', projects: ['hoot'] },
    { id: 'app4shm', kind: 'pick', w: 0.9, side: 'lead', projects: ['app4shm'] },
    { id: 'log-2023', kind: 'log', w: 0.7, side: 'trail', title: '2023', jobs: ['endlessloop'], projects: ['otaku'] },
  ] },
  { id: 'y2021', label: '2021', ground: '2021', stops: [
    { id: 'nonic', kind: 'pick', w: 0.9, side: 'lead', projects: ['nonic'] },
    { id: 'log-2021', kind: 'log', w: 0.65, side: 'trail', title: '2021', jobs: ['teacher'] },
  ] },
  { id: 'y2019', label: '2019', ground: '2019', stops: [
    { id: 'log-2019', kind: 'log', w: 0.7, side: 'lead', title: '2019 and 2020', jobs: ['lusofona', 'siemens'], projects: ['skyvee', 'getcool'] },
  ] },
  { id: 'start', label: '2014', ground: '2014', stops: [
    { id: 'origin', kind: 'origin', w: 0.7, side: 'trail', projects: ['skyvee24', 'buddy'] },
    { id: 'silence', kind: 'silence', w: 0.3 },
  ] },
  { id: 'contact', label: 'Get in touch', stops: [
    { id: 'finale', kind: 'finale', w: 2.4 },
  ] },
];

export interface PlacedStop extends Stop {
  era: string;
  /** Slot start and end along the track, in viewport-heights. */
  t0: number;
  t1: number;
  /** Where the camera settles for this stop. */
  t: number;
}

export function route() {
  const stops: PlacedStop[] = [];
  let run = 0;
  const legs = eras.map((era) => {
    const c0 = run;
    for (const s of era.stops) {
      const t0 = run;
      run += s.w;
      // The hero settles at the very top: the camera is already there.
      const t = s.kind === 'hero' ? 0 : t0 + s.w / 2;
      stops.push({ ...s, era: era.id, t0, t1: run, t });
    }
    return { id: era.id, label: era.label, ground: era.ground, c0, w: run - c0 };
  });
  return { stops, legs, total: run };
}

/** A plateau window for a stop's copy, as fractions of the whole track. */
export function windowFor(s: PlacedStop, total: number) {
  const pad = s.w * 0.04;
  const from = Math.max(0, s.t0 + pad) / total;
  const to = Math.min(total, s.t1 - pad) / total;
  return `${from.toFixed(4)} ${to.toFixed(4)} 0.3 0.3`;
}

export const byId = Object.fromEntries(projects.map((p) => [p.id, p])) as Record<string, Project>;
export const jobById = Object.fromEntries(jobs.map((j) => [j.id, j])) as Record<string, Job>;
export const picks = projects.filter((p) => p.pick).sort((a, b) => (a.pick ?? 0) - (b.pick ?? 0));
export const rest = projects.filter((p) => !p.pick);
