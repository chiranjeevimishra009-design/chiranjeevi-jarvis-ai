# CHIRANJEEVI JARVIS AI

A secure personal AI assistant built with Next.js, Prisma, and SQLite. This project delivers a small but functional MVP that includes:

- secure authentication with hashed passwords and session cookies
- AI chat powered by server-side OpenAI, with graceful fallback when no API key is present
- multilingual input support for English and Hindi
- browser voice input and spoken responses
- persistent notes
- searchable conversation history
- long-term memory entries stored in SQLite
- responsive design for mobile and desktop

## Features implemented

- Login and registration flows
- JWT-backed server session handling
- SQLite database with Prisma
- Chat API route with fallbacks
- Fast history and note search
- Local voice input via Web Speech API
- Speech synthesis for spoken responses
- Mobile-first futuristic dashboard UI

## Features not yet implemented

- Real-time collaborative multi-user chat
- Push notifications or background reminders
- Full voice activity detection for all browsers
- Advanced semantic memory retrieval and vector search
- Production-grade deployment automation to cloud providers

## Tech stack

- Frontend: Next.js 14 + React 18 + Tailwind CSS
- Backend: Next.js API routes
- Database: SQLite via Prisma
- Authentication: bcrypt + JWT in secure HTTP-only cookies
- AI: OpenAI API, server-only keys

## Required external services and API keys

1. OpenAI API key (required for real AI responses)
   - Create a key at: https://platform.openai.com/api-keys
   - Add it to `.env.local` as `OPENAI_API_KEY`

2. Optional production hosting provider
   - Vercel, Railway, Render, or any Node-compatible host

3. Optional domain / SSL certificate
   - For HTTPS production deployment

## Local setup

1. Clone the project repository.
2. Copy `.env.example` to `.env.local`.
3. Update the values in `.env.local`.
4. Install dependencies:

```bash
npm install
```

5. Create the SQLite database schema:

```bash
npm run db:push
```

6. Start the development server:

```bash
npm run dev
```

7. Open the app in your browser at:

```text
http://localhost:3000
```

## Deployment instructions

### Local development

Use the commands above to run the app locally.

### Production deployment (Vercel example)

1. Create a GitHub repository and push this code.
2. Create a new Vercel project and import the repository.
3. Add environment variables in Vercel:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `OPENAI_API_KEY`
   - `NEXT_PUBLIC_APP_NAME`
   - `NEXT_PUBLIC_APP_URL`
4. Deploy.

### Backups

- Database backup: copy the SQLite file produced by Prisma (for example `prisma/dev.db`) to a secure storage system.
- Application backup: keep Git history and push regularly to GitHub.
- Environment backup: store `.env.local` values in a secure secrets manager (1Password, Bitwarden, AWS Secrets Manager, etc.).

### Data recovery

1. Restore the SQLite database file to the original path.
2. Re-run migrations or schema sync:

```bash
npm run db:push
```

3. Restart the app and verify login, notes, and chat history.

## Security notes

- Keep the `JWT_SECRET` and `OPENAI_API_KEY` server-side only.
- Never expose API keys in browser code or public front-end bundles.
- Use HTTPS in production and restrict database file permissions.

## Notes

This is a functional MVP and should be considered a starter version of the assistant. It works as a personal AI dashboard, but advanced functionality like production-grade memory retrieval, teamwork, and automation is intentionally left for future iterations.
