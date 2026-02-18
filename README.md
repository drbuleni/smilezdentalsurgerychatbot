# Smilez Dental Surgery — AI Chatbot

An AI-powered customer support chatbot for Smilez Dental Surgery, embedded on the Wix website. Uses Retrieval-Augmented Generation (RAG) to answer patient questions from a knowledge base of PDF documents, and captures appointment requests with email notifications.

---

## Features

- **RAG Knowledge Base** — Answers questions from indexed PDF documents (services, pricing, policies, FAQs)
- **Appointment Booking** — Collects patient details and emails the practice; receptionist calls to confirm
- **Streaming Chat** — GPT-4o-mini responses stream in real-time
- **Source Citations** — Answers cite which document they came from
- **Admin Dashboard** — Upload/delete PDF documents at `/admin`
- **Wix Embedding** — Two embed options: iframe or JavaScript snippet
- **Mobile Responsive** — Works on all screen sizes
- **Rate Limited** — Prevents abuse (20 messages/minute per IP)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + Tailwind CSS |
| Backend | Next.js API routes (Node.js serverless) |
| AI | OpenAI GPT-4o-mini + text-embedding-3-small |
| Database | Supabase (PostgreSQL + pgvector) |
| Email | Nodemailer (Gmail SMTP) |
| Deployment | Vercel |

---

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/YOUR-USERNAME/smilez-dental-chatbot.git
cd smilez-dental-chatbot
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in all values (see [Environment Variables](#environment-variables) below).

### 3. Set Up Supabase Database

1. Go to [supabase.com](https://supabase.com) and open your project
2. Navigate to **SQL Editor**
3. Paste the contents of `supabase/migrations/001_initial_schema.sql` and click **Run**
4. Verify the tables appear in **Table Editor**: `documents`, `document_chunks`, `appointment_requests`, `chat_sessions`

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

- **Widget preview:** `/widget`
- **Admin dashboard:** `/admin`

---

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (from Settings → API) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (keep secret!) |
| `OPENAI_API_KEY` | OpenAI API key |
| `GMAIL_USER` | Gmail address used to send emails |
| `GMAIL_APP_PASSWORD` | Gmail App Password (not your regular password — see below) |
| `APPOINTMENT_EMAIL` | Email address to receive appointment requests (dr.buleni@gmail.com) |
| `ADMIN_PASSWORD` | Password for the `/admin` dashboard |
| `NEXT_PUBLIC_APP_URL` | Your Vercel deployment URL (no trailing slash) |

### Setting Up Gmail App Password

1. Go to your Google Account → **Security**
2. Enable **2-Step Verification** if not already done
3. Go to **App Passwords** (search for it in the security settings)
4. Create a new App Password for "Mail"
5. Use the 16-character code as `GMAIL_APP_PASSWORD`

---

## Adding PDF Documents

### Option A: Admin Dashboard (Recommended)

1. Deploy the app or run it locally
2. Go to `/admin` and log in with your `ADMIN_PASSWORD`
3. Drag and drop PDF files into the upload area
4. Each PDF is processed, chunked, and embedded automatically

### Option B: CLI Script (Bulk Upload)

```bash
# Install dotenv for local .env.local loading
npm install -D dotenv

# Upload a single PDF
npx ts-node scripts/process-pdfs.ts ./path/to/document.pdf

# Upload all PDFs in a folder
npx ts-node scripts/process-pdfs.ts ./pdfs/
```

### Best Practices for PDFs

- Use **text-based PDFs** (not scanned images — OCR is not included)
- Give files descriptive names (e.g. `services-and-pricing.pdf`, `practice-policies.pdf`)
- Keep individual files under 10 MB
- Re-upload updated versions: delete the old document in admin, then upload the new one
- Typical chunk count: 5–50 chunks per document depending on length

---

## Embedding in Wix

### Option 1: iframe (Simplest — Recommended)

1. In Wix Editor, add an **HTML Embed** element
2. Paste the following code:

```html
<iframe
  src="https://YOUR-APP.vercel.app/widget"
  style="position:fixed; bottom:0; right:0; width:420px; height:680px; border:none; z-index:9999;"
  allow="clipboard-write"
  title="Smilez Dental Assistant">
</iframe>
```

3. Replace `YOUR-APP.vercel.app` with your actual Vercel URL
4. Publish your Wix site

**Note:** The iframe must be in an HTML element that is set to full-page or fixed position in Wix.

### Option 2: JavaScript Snippet (More Flexible)

1. In Wix Editor → **Settings** → **Custom Code** → **Add Custom Code** → **Body - End**
2. Paste:

```html
<script
  src="https://YOUR-APP.vercel.app/embed.js"
  data-widget-url="https://YOUR-APP.vercel.app/widget">
</script>
```

3. Replace `YOUR-APP.vercel.app` with your actual Vercel URL

**Customisation options:**
```html
<script
  src="https://YOUR-APP.vercel.app/embed.js"
  data-widget-url="https://YOUR-APP.vercel.app/widget"
  data-width="400px"
  data-height="650px"
  data-bottom="20px"
  data-right="20px">
</script>
```

---

## Deploying to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: Smilez Dental chatbot"
git remote add origin https://github.com/YOUR-USERNAME/smilez-dental-chatbot.git
git push -u origin main
```

### 2. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and click **Add New Project**
2. Import your GitHub repository
3. In **Environment Variables**, add all variables from `.env.example` with their real values
4. Click **Deploy**

### 3. After Deployment

1. Copy your Vercel URL (e.g. `https://smilez-dental-chatbot.vercel.app`)
2. Update `NEXT_PUBLIC_APP_URL` in Vercel environment variables
3. Redeploy (Vercel → Deployments → Redeploy)

---

## Project Structure

```
smilez-dental-chatbot/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat/route.ts              # Chat endpoint (SSE streaming)
│   │   │   ├── appointment/route.ts       # Appointment booking + email
│   │   │   └── admin/
│   │   │       ├── documents/route.ts     # List / delete documents
│   │   │       └── upload/route.ts        # PDF upload + processing
│   │   ├── widget/page.tsx                # Standalone widget (iframe target)
│   │   ├── admin/page.tsx                 # Admin dashboard
│   │   └── page.tsx                       # Home/landing page
│   ├── components/
│   │   ├── ChatWidget/
│   │   │   ├── index.tsx                  # Main widget component
│   │   │   ├── ChatMessage.tsx            # Message bubbles
│   │   │   ├── AppointmentForm.tsx        # Booking form
│   │   │   └── TypingIndicator.tsx        # Animated dots
│   │   └── Admin/
│   │       ├── DocumentList.tsx           # Documents table
│   │       └── UploadForm.tsx             # PDF upload UI
│   └── lib/
│       ├── supabase.ts                    # Supabase clients
│       ├── openai.ts                      # OpenAI singleton
│       ├── rag.ts                         # RAG retrieval + prompts
│       ├── email.ts                       # Nodemailer email
│       ├── pdf-processor.ts               # PDF to chunks to embeddings
│       └── rate-limiter.ts                # In-memory rate limiting
├── scripts/
│   └── process-pdfs.ts                    # CLI bulk PDF ingestion
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql         # Database schema
├── public/
│   └── embed.js                           # JS widget loader
├── .env.example                           # Environment variables template
└── README.md
```

---

## How It Works

1. **User asks a question** in the chat widget
2. The question is **embedded** using OpenAI `text-embedding-3-small`
3. **Cosine similarity search** finds the most relevant chunks from the knowledge base
4. Retrieved chunks + the question are sent to **GPT-4o-mini** as context
5. The response **streams** back to the widget in real-time
6. **Sources** are shown (collapsed) under each response

---

## Troubleshooting

### Chat returns "No relevant information found"

- Ensure PDFs are uploaded and indexed (check Admin dashboard)
- Check that `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are correct
- Verify the `match_document_chunks` function was created (SQL Editor → Functions in Supabase)

### Email not sending

- Confirm `GMAIL_APP_PASSWORD` is a Google App Password (not your login password)
- Ensure 2-Step Verification is enabled on the Gmail account
- Check Vercel function logs for detailed error messages

### Widget not appearing in Wix

- Ensure the HTML embed element has sufficient height/width in Wix
- For the iframe option, the iframe needs fixed positioning to break out of Wix layout
- Check browser console for Content Security Policy errors

### PDF upload fails

- Ensure the PDF contains selectable text (not a scanned image)
- Check file size is under 10 MB
- Verify `SUPABASE_SERVICE_ROLE_KEY` and `OPENAI_API_KEY` are set correctly

### "pgvector extension not found" error

- In Supabase Dashboard → **Extensions**, search for "vector" and enable it
- Then re-run the migration SQL

---

## Maintenance

### Updating the Knowledge Base

1. Go to `/admin` on your deployed app
2. Delete the old document if updating existing content
3. Upload the new PDF version
4. Test by asking relevant questions in the widget preview

### Viewing Appointment Requests

All requests are saved in `appointment_requests` table in Supabase:
- **Supabase Dashboard** → **Table Editor** → `appointment_requests`

### Monitoring Costs

- **OpenAI:** GPT-4o-mini is very cost-effective (~$0.15/1M input tokens). Embedding costs are negligible.
- **Supabase:** Free tier supports up to 500 MB — more than sufficient for a dental practice knowledge base
- **Vercel:** Free tier supports 100 GB bandwidth and serverless functions

---

## Security Notes

- `SUPABASE_SERVICE_ROLE_KEY` is only used server-side and never exposed to the browser
- All tables have Row Level Security (RLS) enabled
- Admin dashboard is protected by `ADMIN_PASSWORD`
- Never commit `.env.local` to Git (it is listed in `.gitignore` by default)
