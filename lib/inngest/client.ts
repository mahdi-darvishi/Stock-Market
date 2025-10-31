import { Inngest } from "inngest";

console.log("INNGEST_EVENT_KEY loaded:", process.env.INNGEST_EVENT_KEY);
export const inngest = new Inngest({
  id: "signalist",
  eventKey: process.env.INNGEST_EVENT_KEY!,
  ai: { gemini: { apiKey: process.env.GEMINI_API_KEY! } },
});
