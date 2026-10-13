# Persona AI (free-tier setup)

A responsive AI chat website with a chat-history sidebar, suggested prompts, Markdown responses, and a secure server-side connection to Google's Gemini API.

## What can be free?

- **Hosting:** Vercel's Hobby plan is free for personal projects, within its usage limits.
- **AI answers:** Google lists `gemini-2.5-flash-lite` with a free API tier, subject to rate limits and availability. Do not link a paid billing account if you want to avoid API charges.
- **Domain:** the free Vercel subdomain ends in `.vercel.app`; custom domains usually cost money unless you already own one.

Google AI Studio has an 18+ minimum age requirement. If you're under 18, ask a parent/guardian to set up and manage the AI provider account and keep the API key private. Do not fake your age or publish the key. Free-tier data-use terms may also differ from paid API terms; review the provider's terms before entering sensitive information.

## Publish it for free

1. Download this project ZIP and extract it.
2. Create a GitHub repository and upload the files from this folder, including `app/`, `public/`, `.gitignore`, `package.json`, `next.config.mjs`, and this README.
3. **Do not upload `.env.local` or any real API key.** The `.gitignore` file excludes local environment files.
4. With your parent/guardian if needed, open https://aistudio.google.com/app/apikey and create an API key under an eligible account/project on the Free Tier. Do not enable paid billing if your goal is $0.
5. Open https://vercel.com/new, import the GitHub repository, and deploy it using the free Hobby plan.
6. In Vercel, open the project **Settings → Environment Variables** and add:
   - Name: `GEMINI_API_KEY`
   - Value: your private Gemini API key
   - Optional name: `GEMINI_MODEL`
   - Optional value: `gemini-2.5-flash-lite`
7. Redeploy after adding the environment variable. Vercel will provide a public `*.vercel.app` URL.

## Run locally

Requires Node.js 20 or newer. Copy `.env.example` to `.env.local`, put the API key in `GEMINI_API_KEY`, then run:

```bash
npm install
npm run dev
```

Visit http://localhost:3000.

## Notes

- The API key is used by the server-side route, not sent to browser JavaScript.
- Free model quotas and hosting limits can change and may temporarily block requests after usage limits are reached.
- Chat history is stored in each visitor's own browser local storage. There's no user-account system or central chat database.
- Treat the public URL as public: anyone who can access it may be able to consume the app's free AI quota. For a public launch, add abuse protection and rate limits.
