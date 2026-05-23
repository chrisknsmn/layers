import type {
  AppMetadata,
  Audit,
  Competitor,
  ListingScrape,
} from "../schemas";

export type MockFixture = {
  name: string;
  candidate: AppMetadata;
  listing: ListingScrape;
  competitors: Competitor[];
  audit: Audit;
};

const spotify: MockFixture = {
  name: "spotify",
  candidate: {
    trackId: 324684580,
    trackName: "Spotify: Music and Podcasts",
    artistName: "Spotify",
    bundleId: "com.spotify.client",
    primaryGenreName: "Music",
    primaryGenreId: 6011,
    genres: ["Music", "Entertainment"],
    artworkUrl:
      "https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/26/53/7b/26537b47-88c8-845a-fb1b-a65702602a10/AppIcon-0-0-1x_U007epad-0-1-0-0-sRGB-85-220.png/512x512bb.jpg",
    averageUserRating: 4.78,
    userRatingCount: 39_959_935,
    trackViewUrl:
      "https://apps.apple.com/us/app/spotify-music-and-podcasts/id324684580",
    country: "us",
    description:
      "With the Spotify app, you can explore an extensive library of music and podcasts for free…",
    sellerName: "Spotify USA, Inc.",
    formattedPrice: "Free",
    version: "8.9.0",
    screenshotUrls: [],
    ipadScreenshotUrls: [],
    languageCodesISO2A: ["EN", "ES", "DE"],
  },
  listing: {
    url: "https://apps.apple.com/us/app/spotify-music-and-podcasts/id324684580",
    subtitle: "Songs & Playlists For You",
    promotionalText:
      "Discover music and podcasts you'll love. Listen offline with Premium.",
    whatsNew:
      "Bug fixes and performance improvements. Tap into a more responsive Now Playing screen.",
    hasAppPreviewVideo: false,
    screenshots: [],
    averageRating: 4.78,
    ratingCount: 39_959_935,
  },
  competitors: [
    {
      trackId: 1108187390,
      trackName: "Apple Music",
      artistName: "Apple",
      averageUserRating: 4.85,
      userRatingCount: 2_757_075,
      primaryGenreName: "Music",
      artworkUrl:
        "https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/3a/8e/6a/3a8e6acd-1a86-3c87-7b30-2cce4e7a36bb/AppIcon-0-0-1x_U007emarketing-0-7-0-85-220.png/100x100bb.jpg",
    },
    {
      trackId: 1017492454,
      trackName: "YouTube Music",
      artistName: "Google LLC",
      averageUserRating: 4.77,
      userRatingCount: 1_513_436,
      primaryGenreName: "Music",
      artworkUrl:
        "https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/05/9c/d4/059cd4c4-ab66-cf5b-89f4-66bc7b58e83e/logo_youtube_music_2024.lsr/100x100bb.jpg",
    },
    {
      trackId: 1234567890,
      trackName: "Pandora: Music & Podcasts",
      artistName: "Pandora Media",
      averageUserRating: 4.61,
      userRatingCount: 1_950_400,
      primaryGenreName: "Music",
      artworkUrl:
        "https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/e3/4c/aa/e34caa84-ed10-3a23-7a3f-7cd5c4f2e83d/AppIcon-0-0-1x_U007emarketing-0-0-0-7-0-85-220.png/100x100bb.jpg",
    },
  ],
  audit: {
    overallScore: 82,
    summary:
      "Spotify's ASO is strong overall. Title and description are well-optimized; the biggest gaps are a missing app preview video and underutilized subtitle real estate.",
    dimensions: [
      {
        name: "Title",
        weight: 20,
        score: 8,
        reasoning: "Clear branded title with the right primary keyword.",
        evidence: "Spotify: Music and Podcasts (28/30 chars)",
      },
      {
        name: "Subtitle",
        weight: 15,
        score: 7,
        reasoning:
          "Benefit-driven but leaves five characters on the table and misses a high-volume keyword.",
        evidence: "Songs & Playlists For You (25/30 chars)",
      },
      {
        name: "Keyword field",
        weight: 15,
        score: 6,
        reasoning:
          "Inferred from competitive rank — likely strong on 'music' / 'podcasts' but weak on long-tail and niche moods.",
        evidence: "Not directly observable; inferred from listing.",
      },
      {
        name: "Description",
        weight: 10,
        score: 9,
        reasoning:
          "First three lines hook hard; benefit framing throughout; clear CTA to Premium.",
        evidence:
          "Opens with 'explore an extensive library of music and podcasts for free'.",
      },
      {
        name: "Screenshots",
        weight: 15,
        score: 5,
        reasoning:
          "Only 8 of 10 slots used; on-image text on early screens leans brand over benefit.",
        evidence: "8 screenshots, no captions extracted.",
      },
      {
        name: "App preview video",
        weight: 5,
        score: 0,
        reasoning: "No video present — a missed conversion lever for a category leader.",
        evidence: "hasAppPreviewVideo: false",
      },
      {
        name: "Ratings & reviews",
        weight: 15,
        score: 10,
        reasoning: "Best-in-class — 40M ratings at 4.78 average is exceptional.",
        evidence: "4.78 ★ (39,959,935 ratings)",
      },
      {
        name: "Icon",
        weight: 5,
        score: 9,
        reasoning:
          "Iconic, instantly recognizable, reads clearly at search-result sizes.",
        evidence: "Solid green circle with three sound waves.",
      },
      {
        name: "Conversion signals",
        weight: 5,
        score: 6,
        reasoning:
          "Promotional text used but generic; 'What's New' reads as a release note rather than a feature beat.",
        evidence:
          "'Bug fixes and performance improvements' — wasted real estate.",
      },
      {
        name: "Competitive position",
        weight: 5,
        score: 8,
        reasoning:
          "Rating volume eclipses Apple Music; rating average is competitive.",
        evidence: "40M ratings vs Apple Music's 2.7M; 4.78 vs 4.85.",
      },
    ],
    quickWins: [
      {
        title: "Rewrite subtitle to add a discoverability keyword",
        rationale:
          "Subtitle is benefit-driven but doesn't help with search. Adding 'audiobooks' or 'audio' picks up a strong adjacent category Apple now indexes.",
        evidence: "Current subtitle uses 25 of 30 available characters.",
        before: "Songs & Playlists For You",
        after: "Music, Podcasts & Audiobooks",
      },
      {
        title: "Rewrite 'What's New' as a feature beat",
        rationale:
          "Apple OCR-indexes 'What's New' content for ranking signals and conversion. The current text is a generic release note.",
        evidence: "'Bug fixes and performance improvements…'",
        before:
          "Bug fixes and performance improvements. Tap into a more responsive Now Playing screen.",
        after:
          "NEW: Daily Mixes refreshed every morning. Plus: smarter search, faster Now Playing.",
      },
      {
        title: "Fill remaining 2 screenshot slots",
        rationale:
          "Apple weights screenshot count and freshness. Two empty slots is leaving conversion on the table.",
        evidence: "8/10 screenshot slots used.",
      },
    ],
    highImpactChanges: [
      {
        title: "Ship an App Preview video",
        rationale:
          "Category leaders without a video lose ~5–7% conversion at the listing. A 20s spot showing Daily Mix → playback → offline download is enough.",
        evidence: "hasAppPreviewVideo: false",
      },
      {
        title: "Redesign first three screenshots around benefits, not brand",
        rationale:
          "The first three screenshots account for ~80% of viewers' attention. Lead with the benefit (Daily Mix, Discover Weekly, Offline) instead of brand panels.",
        evidence: "First-screen text is brand-focused per listing scrape.",
      },
    ],
    strategicRecommendations: [
      {
        title: "Custom Product Pages per acquisition channel",
        rationale:
          "Different paid campaigns (Premium upsell, audiobooks, podcasts) deserve different first-screen messaging.",
        evidence: "Single product page across all channels currently.",
      },
      {
        title: "Localize 'What's New' for top five non-EN markets",
        rationale:
          "App Store localization compounds: Apple weights localized listings higher in country-specific search.",
        evidence: "App lists 3 languages; top markets include DE, BR, MX.",
      },
    ],
    competitorComparison: [
      {
        name: "Apple Music",
        rating: "4.85 ★ (2.7M)",
        notes:
          "Higher rating average but ~15× fewer reviews. Stronger first-screenshot benefit framing.",
      },
      {
        name: "YouTube Music",
        rating: "4.77 ★ (1.5M)",
        notes:
          "Comparable rating; differentiated on video-music crossover messaging in screenshots.",
      },
      {
        name: "Pandora",
        rating: "4.61 ★ (1.9M)",
        notes:
          "Lower rating and weaker title — opportunity to outflank in 'radio'-style searches.",
      },
    ],
  },
};

const headspace: MockFixture = {
  name: "headspace",
  candidate: {
    trackId: 493145008,
    trackName: "Headspace: Sleep & Meditation",
    artistName: "Headspace, Inc.",
    bundleId: "com.getsomeheadspace.android",
    primaryGenreName: "Health & Fitness",
    primaryGenreId: 6013,
    genres: ["Health & Fitness", "Lifestyle"],
    artworkUrl:
      "https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/a4/04/35/a4043566-ed3f-aafd-d23e-cb33ba79b8c1/AppIcon-0-0-1x_U007emarketing-0-7-0-0-sRGB-85-220.png/512x512bb.jpg",
    averageUserRating: 4.85,
    userRatingCount: 851_207,
    country: "us",
    sellerName: "Headspace Inc.",
    formattedPrice: "Free",
    screenshotUrls: [],
    ipadScreenshotUrls: [],
    languageCodesISO2A: ["EN", "DE", "FR", "ES", "PT"],
  },
  listing: {
    url: "https://apps.apple.com/us/app/headspace-sleep-meditation/id493145008",
    subtitle: "Mindfulness for everyday life",
    promotionalText: "Try Headspace free — meditation, sleep stories, mindful workouts.",
    whatsNew:
      "New sleep cast: 'Slow Train Through the Highlands'. Bug fixes and small improvements.",
    hasAppPreviewVideo: true,
    screenshots: [],
    averageRating: 4.85,
    ratingCount: 851_207,
  },
  competitors: [
    {
      trackId: 1259818500,
      trackName: "Calm",
      artistName: "Calm.com, Inc.",
      averageUserRating: 4.78,
      userRatingCount: 1_657_300,
      primaryGenreName: "Health & Fitness",
    },
    {
      trackId: 1099771240,
      trackName: "Insight Timer - Meditation App",
      artistName: "Insight Network Inc.",
      averageUserRating: 4.95,
      userRatingCount: 698_400,
      primaryGenreName: "Health & Fitness",
    },
    {
      trackId: 1494421014,
      trackName: "Balance: Meditation & Sleep",
      artistName: "Balance Meditation",
      averageUserRating: 4.92,
      userRatingCount: 142_900,
      primaryGenreName: "Health & Fitness",
    },
  ],
  audit: {
    overallScore: 74,
    summary:
      "Headspace's listing is well-crafted but trails Calm on keyword breadth and Insight Timer on rating quality. Biggest wins are subtitle keyword stuffing relief and a sharper conversion CTA.",
    dimensions: [
      {
        name: "Title",
        weight: 20,
        score: 7,
        reasoning:
          "Branded title with both 'Sleep' and 'Meditation' — but 'Headspace' eats a third of the budget.",
        evidence: "Headspace: Sleep & Meditation (30/30 chars)",
      },
      {
        name: "Subtitle",
        weight: 15,
        score: 6,
        reasoning:
          "Mindfulness positioning is on-brand but lacks search-active keywords like 'anxiety' or 'sleep'.",
        evidence: "Mindfulness for everyday life (28/30 chars)",
      },
      {
        name: "Keyword field",
        weight: 15,
        score: 7,
        reasoning:
          "Strong on 'meditation' and 'sleep' but appears to repeat title terms (waste).",
        evidence: "Inferred from competing rank on 'mindfulness'/'breathwork'.",
      },
      {
        name: "Description",
        weight: 10,
        score: 8,
        reasoning:
          "Benefit-first opening, clear bullet structure, social proof present.",
        evidence: "Description opens with the value prop, not features.",
      },
      {
        name: "Screenshots",
        weight: 15,
        score: 8,
        reasoning:
          "Cohesive Andy-illustration design language across the first 5 screens.",
        evidence: "All 10 screenshot slots used (heuristic).",
      },
      {
        name: "App preview video",
        weight: 5,
        score: 8,
        reasoning:
          "Video exists and works without sound — but the hook in the first 3 seconds is soft.",
        evidence: "hasAppPreviewVideo: true",
      },
      {
        name: "Ratings & reviews",
        weight: 15,
        score: 9,
        reasoning: "Strong rating and recent uptick in volume.",
        evidence: "4.85 ★ (851,207 ratings)",
      },
      {
        name: "Icon",
        weight: 5,
        score: 9,
        reasoning: "Orange circle is unmistakable in search; reads at 60×60.",
        evidence: "Single-shape, single-color icon.",
      },
      {
        name: "Conversion signals",
        weight: 5,
        score: 6,
        reasoning:
          "Promo text uses 'Try free' (good) but 'What's New' wastes a beat on bug fixes.",
        evidence: "Promo text + 'What's New' content.",
      },
      {
        name: "Competitive position",
        weight: 5,
        score: 6,
        reasoning:
          "Calm has 2× rating volume; Insight Timer has a higher average — Headspace sits in the middle.",
        evidence: "Three direct competitors in the same genre.",
      },
    ],
    quickWins: [
      {
        title: "Subtitle: trade 'Mindfulness' for a search-active term",
        rationale:
          "'Mindfulness' is brand-aligned but low-volume. 'Anxiety & Stress' targets the actual jobs-to-be-done.",
        evidence: "Subtitle currently at 28/30 chars with no search terms.",
        before: "Mindfulness for everyday life",
        after: "Sleep, Anxiety & Stress Relief",
      },
      {
        title: "Rewrite 'What's New' to lead with a feature drop",
        rationale: "Apple uses 'What's New' as a freshness signal.",
        evidence: "Current text leads with sleep cast then 'Bug fixes'.",
        before:
          "New sleep cast: 'Slow Train Through the Highlands'. Bug fixes and small improvements.",
        after:
          "NEW sleep cast 'Slow Train' • Updated focus playlists • Faster downloads.",
      },
      {
        title: "Tighten the promo text CTA",
        rationale:
          "Promo text is the only field updateable without resubmission. Use it like an ad headline.",
        evidence: "Current promo text reads as a feature list.",
        before:
          "Try Headspace free — meditation, sleep stories, mindful workouts.",
        after:
          "Sleep better tonight. Start your free 14-day Headspace trial.",
      },
    ],
    highImpactChanges: [
      {
        title: "Tighten the video's first 3 seconds",
        rationale:
          "Current open is a brand frame. Lead with the outcome (a person falling asleep) within the first second.",
        evidence: "App preview video exists but hook is brand-led.",
      },
      {
        title: "Add a 'For Anxiety' Custom Product Page",
        rationale:
          "Anxiety is a top-3 search intent for the category and deserves its own first screen.",
        evidence: "Single product page currently.",
      },
    ],
    strategicRecommendations: [
      {
        title: "Localize screenshots for DE and FR markets",
        rationale:
          "App lists 5 languages but screenshots ship English — leaves localized rank on the table.",
        evidence: "languageCodesISO2A includes DE, FR, ES, PT.",
      },
      {
        title: "Run In-App Events for sleep / Sunday Scaries cycles",
        rationale:
          "In-App Events surface on the App Store homepage and the product page; a weekly sleep-themed event compounds.",
        evidence: "No active In-App Events visible.",
      },
    ],
    competitorComparison: [
      {
        name: "Calm",
        rating: "4.78 ★ (1.6M)",
        notes:
          "Higher rating volume, stronger sleep-story branding in screenshots.",
      },
      {
        name: "Insight Timer",
        rating: "4.95 ★ (698K)",
        notes:
          "Best-in-class rating; free model is the differentiator they lead with.",
      },
      {
        name: "Balance",
        rating: "4.92 ★ (142K)",
        notes:
          "Smaller but laser-focused on 'personalized' — Headspace can counter with breadth.",
      },
    ],
  },
};

const duolingo: MockFixture = {
  name: "duolingo",
  candidate: {
    trackId: 570060128,
    trackName: "Duolingo - Language Lessons",
    artistName: "Duolingo",
    bundleId: "com.duolingo.DuolingoMobile",
    primaryGenreName: "Education",
    primaryGenreId: 6017,
    genres: ["Education", "Reference"],
    artworkUrl:
      "https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/c8/c2/a8/c8c2a823-9ea3-3f31-1b3a-3f88e64bf6df/AppIcon-0-0-1x_U007emarketing-0-7-0-85-220.png/512x512bb.jpg",
    averageUserRating: 4.74,
    userRatingCount: 2_184_530,
    country: "us",
    formattedPrice: "Free",
    screenshotUrls: [],
    ipadScreenshotUrls: [],
    languageCodesISO2A: ["EN", "ES", "PT", "FR", "DE", "IT", "JA", "KO", "ZH"],
  },
  listing: {
    url: "https://apps.apple.com/us/app/duolingo-language-lessons/id570060128",
    subtitle: "Learn languages free",
    promotionalText:
      "Learn Spanish, French, Japanese — free, fun, and effective.",
    whatsNew: "Bug fixes and improvements.",
    hasAppPreviewVideo: false,
    screenshots: [],
    averageRating: 4.74,
    ratingCount: 2_184_530,
  },
  competitors: [
    {
      trackId: 1287230927,
      trackName: "Babbel - Language Learning",
      artistName: "Babbel",
      averageUserRating: 4.61,
      userRatingCount: 312_400,
      primaryGenreName: "Education",
    },
    {
      trackId: 919087726,
      trackName: "Rosetta Stone: Learn Languages",
      artistName: "Rosetta Stone Ltd.",
      averageUserRating: 4.71,
      userRatingCount: 145_800,
      primaryGenreName: "Education",
    },
    {
      trackId: 1456052149,
      trackName: "Memrise: Speak a New Language",
      artistName: "Memrise",
      averageUserRating: 4.66,
      userRatingCount: 89_600,
      primaryGenreName: "Education",
    },
  ],
  audit: {
    overallScore: 68,
    summary:
      "Duolingo dominates on ratings and brand recognition but underuses every text field. The biggest wins are obvious: a real subtitle and a video that shows the streak loop.",
    dimensions: [
      {
        name: "Title",
        weight: 20,
        score: 6,
        reasoning:
          "Brand + generic descriptor. Wastes the 30-char budget on a 'Language Lessons' tail that adds little search value.",
        evidence: "Duolingo - Language Lessons (27/30 chars)",
      },
      {
        name: "Subtitle",
        weight: 15,
        score: 4,
        reasoning:
          "'Learn languages free' is only 21 chars and skips the actual high-intent search terms.",
        evidence: "Subtitle uses 21/30 chars.",
      },
      {
        name: "Keyword field",
        weight: 15,
        score: 7,
        reasoning:
          "Strong rank on 'language' but likely repeating title terms.",
        evidence: "Inferred from category rank.",
      },
      {
        name: "Description",
        weight: 10,
        score: 7,
        reasoning:
          "Engaging tone but the opening lines bury the value prop.",
        evidence:
          "First three lines describe the company rather than the benefit.",
      },
      {
        name: "Screenshots",
        weight: 15,
        score: 7,
        reasoning:
          "Mascot-led design is recognizable but feels brand-led, not benefit-led.",
        evidence: "Most screenshots feature Duo the owl prominently.",
      },
      {
        name: "App preview video",
        weight: 5,
        score: 0,
        reasoning: "No video — astonishing for a category-defining app.",
        evidence: "hasAppPreviewVideo: false",
      },
      {
        name: "Ratings & reviews",
        weight: 15,
        score: 9,
        reasoning: "Massive volume, healthy average.",
        evidence: "4.74 ★ (2,184,530 ratings)",
      },
      {
        name: "Icon",
        weight: 5,
        score: 10,
        reasoning:
          "Duo the owl is one of the most recognizable icons on the App Store.",
        evidence: "Green owl mascot, single read at any size.",
      },
      {
        name: "Conversion signals",
        weight: 5,
        score: 4,
        reasoning: "'Bug fixes and improvements.' is the entirety of 'What's New'.",
        evidence: "'What's New': 'Bug fixes and improvements.'",
      },
      {
        name: "Competitive position",
        weight: 5,
        score: 9,
        reasoning:
          "Dwarfs all direct competitors on rating volume.",
        evidence: "2.1M vs Babbel's 312K, Rosetta's 145K.",
      },
    ],
    quickWins: [
      {
        title: "Subtitle: pack in the languages",
        rationale:
          "Top language searches are 'spanish', 'french', 'japanese' — naming them in the subtitle is the highest-leverage edit you can make.",
        evidence: "Subtitle only uses 21 of 30 available characters.",
        before: "Learn languages free",
        after: "Spanish, French, Japanese",
      },
      {
        title: "Real 'What's New' content",
        rationale:
          "Apple ranks freshness; 'Bug fixes' is the lowest-effort possible signal.",
        evidence: "'What's New': 'Bug fixes and improvements.'",
        before: "Bug fixes and improvements.",
        after:
          "NEW: AI roleplay practice for Spanish & French. Plus: faster streak recovery.",
      },
      {
        title: "Promo text → CTA-first",
        rationale: "Promo text should sell, not list.",
        evidence: "Current promo text lists languages.",
        before: "Learn Spanish, French, Japanese — free, fun, and effective.",
        after: "Start your streak today — 5 minutes a day is all it takes.",
      },
    ],
    highImpactChanges: [
      {
        title: "Ship an App Preview video showing the streak loop",
        rationale:
          "The streak is Duolingo's most addictive mechanic; the listing doesn't communicate it.",
        evidence: "hasAppPreviewVideo: false",
      },
      {
        title: "Test a benefit-first first screenshot",
        rationale:
          "Replace the mascot-first opener with a 'Learn 40+ languages, 5 mins a day' panel.",
        evidence: "Mascot-led first screenshot per listing scrape.",
      },
    ],
    strategicRecommendations: [
      {
        title: "Custom Product Pages per language vertical",
        rationale:
          "'Learn Spanish' deserves a different first screen than 'Learn Japanese'.",
        evidence: "Single product page across nine listed languages.",
      },
      {
        title: "Run 'New language unlock' In-App Events",
        rationale:
          "Each new language launch is an event-worthy moment; surfaces on the App Store homepage.",
        evidence: "No In-App Events visible.",
      },
    ],
    competitorComparison: [
      {
        name: "Babbel",
        rating: "4.61 ★ (312K)",
        notes:
          "Paid model lets them lead with conversation outcomes — Duolingo can counter with 'free'.",
      },
      {
        name: "Rosetta Stone",
        rating: "4.71 ★ (146K)",
        notes:
          "Heritage brand; lacks the daily-streak loop messaging that drives Duolingo retention.",
      },
      {
        name: "Memrise",
        rating: "4.66 ★ (90K)",
        notes:
          "Video-led teaching is their differentiator; Duolingo's lack of video is conspicuous next to them.",
      },
    ],
  },
};

export const mockFixtures: MockFixture[] = [spotify, headspace, duolingo];

let cursor = 0;
export function nextMockFixture(): { fixture: MockFixture; index: number } {
  const index = cursor % mockFixtures.length;
  cursor = (cursor + 1) % mockFixtures.length;
  return { fixture: mockFixtures[index], index };
}

export function getMockFixtureByRunId(runId: string): MockFixture | null {
  const match = runId.match(/^mock-(\w+)$/);
  if (!match) return null;
  return mockFixtures.find((f) => f.name === match[1]) ?? null;
}
