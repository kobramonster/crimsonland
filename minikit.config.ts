const ROOT_URL =
  process.env.NEXT_PUBLIC_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000');

/**
 * MiniApp configuration object. Must follow the Farcaster MiniApp specification.
 *
 * @see {@link https://miniapps.farcaster.xyz/docs/guides/publishing}
 */
export const minikitConfig = {
  accountAssociation: {
    header: "",
    payload: "",
    signature: ""
  },
  miniapp: {
    version: "1",
    name: "Crimsonland Base Arena",
    subtitle: "Аркадный шутер с волнами",
    description: "Выживайте против волн врагов, собирайте золото и улучшения, укрепляйте серию ежедневных чекинов.",
    screenshotUrls: [`${ROOT_URL}/screenshot-portrait.png`, `${ROOT_URL}/screenshot.png`],
    iconUrl: `${ROOT_URL}/icon.png`,
    splashImageUrl: `${ROOT_URL}/splash.png`,
    splashBackgroundColor: "#05070a",
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "games",
    tags: ["game", "shooter", "arcade", "leaderboard", "checkin"],
    heroImageUrl: `${ROOT_URL}/hero.png`,
    tagline: "Выживайте как можно дольше и накапливайте бонусы.",
    ogTitle: "Crimsonland Base Arena",
    ogDescription: "Аркадный шутер с волнами врагов, лидербордом и бонусами за ежедневный чекин.",
    ogImageUrl: `${ROOT_URL}/screenshot.png`,
  },
} as const;

