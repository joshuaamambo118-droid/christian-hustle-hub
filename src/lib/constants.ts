export const ADMIN_EMAIL = "admin@christianhustlespace.com";
export const NGN_RATE = 1600;
export const HCAPTCHA_SITEKEY =
  (import.meta.env.VITE_HCAPTCHA_SITEKEY as string | undefined) ?? "72fc5a0c-5552-4e34-bd98-dce28f7cbd84";

export const BIBLE_VERSES = [
  { ref: "Philippians 4:13", text: "I can do all things through Christ who strengthens me." },
  { ref: "Jeremiah 29:11", text: "For I know the plans I have for you declares the LORD plans to prosper you." },
  { ref: "Proverbs 16:3", text: "Commit to the LORD whatever you do and He will establish your plans." },
  { ref: "Joshua 1:8", text: "Keep this Book of the Law always on your lips meditate on it day and night." },
  { ref: "Deuteronomy 8:18", text: "Remember the LORD your God for it is He who gives you ability to produce wealth." },
  { ref: "Psalm 128:2", text: "You will eat the fruit of your labor blessings and prosperity will be yours." },
  { ref: "Colossians 3:23", text: "Whatever you do work at it with all your heart as working for the LORD." },
  { ref: "Proverbs 14:23", text: "All hard work brings a profit but mere talk leads only to poverty." },
  { ref: "2 Thessalonians 3:10", text: "The one who is unwilling to work shall not eat." },
  { ref: "Isaiah 41:10", text: "Fear not for I am with you be not dismayed for I am your God." },
  { ref: "Matthew 6:33", text: "Seek first His kingdom and His righteousness and all these things will be added." },
  { ref: "Proverbs 10:4", text: "Lazy hands make for poverty but diligent hands bring wealth." },
];

export type PlanKey = "FREE" | "STARTER" | "PRO" | "LEGEND";
export const PLANS: Record<PlanKey, { price: number; tasks: number; base: number; bonus: number; monthly: number }> = {
  FREE: { price: 0, tasks: 50, base: 0.007, bonus: 0.003, monthly: 15 },
  STARTER: { price: 20, tasks: 100, base: 0.00466, bonus: 0.002, monthly: 20 },
  PRO: { price: 40, tasks: 150, base: 0.006, bonus: 0.00288, monthly: 40 },
  LEGEND: { price: 50, tasks: 200, base: 0.00583, bonus: 0.0025, monthly: 50 },
};

export const PAYMENT = {
  opay: { number: "8131913507", name: "Joshua Amambo" },
  arbitrum: "0xe97cd7780c899e093d88839f0d263ba832738581",
  aptos: "0x8a57479d4af236e991c8f554c1a3f36a6d0ba5d9316e4400e82a872709bff7af",
};

export const REWARD_LINKS = [
  "https://arwf.org/4/3de0aee910dace879b41c02c1075b687",
  "https://uplcm.com/4/11984736",
];
export const POPUNDER_SRC = "https://afders.org/1/54be4850af6bdf549420a2bebe0c2b35";
export const SOCIAL_BAR_SRC = "https://bicea.org/14/52f95671785c97e39fbfc2851a88161b";
export const WHATSAPP = "https://wa.me/2349122074348";
export const AFFILIATE_LINK = "https://Jomambo.blogspot.com";

export const WITHDRAW_LOCK_DAYS = 5;
export const MIN_TASKS_FIRST_WITHDRAWAL = 25;
export const MIN_NGN = 1000;
export const MIN_USDT = 5;
