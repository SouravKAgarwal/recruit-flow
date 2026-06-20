# RecruitsFlow

![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)

RecruitsFlow is a modern, responsive, server-driven email outreach platform designed to streamline the management of recruiter contacts, facilitate the creation of HTML email templates, securely store sensitive credentials, and trigger automated bulk campaigns. Built with a Next.js architecture, it focuses on performance and enterprise-grade security.

---

## Key Features

*   **Contacts CRM**: Manage large volumes of recruiters efficiently. Features include CSV imports, pasteboard parsing, inline editing, and Kanban-style CRM boards.
*   **Visual Template Editor**: A split-pane HTML editor with syntax highlighting and live previews to design and refine outreach emails.
*   **Campaign Engine**: Launch and track automated, staggered email campaigns. Monitor delivery statuses (Sent, Failed) in real-time.
*   **Encrypted SMTP Management**: Connect multiple sending accounts (Gmail, Outlook, Zoho, Custom). SMTP passwords are transparently encrypted via custom Prisma Client Extensions prior to database storage.
*   **Resume Hub**: A centralized drag-and-drop repository to upload, manage, and dynamically attach multiple resumes to campaigns.
*   **Hardened Security**: 
    *   **Rate Limiting**: Integrated Upstash Redis prevents abuse across all mutation vectors.
    *   **Authentication**: Passwordless OTP and secure credential handling via Better Auth.
    *   **Data Isolation**: Row Level Security (RLS) policies injected natively into the Prisma Client.
*   **Responsive Architecture**: Designed with Tailwind CSS v4, featuring a glassmorphic dark mode, fluid data tables, and fully mobile-optimized interfaces.

---

## Technology Stack

*   **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Server Components, React 19 `useActionState`)
*   **Authentication**: [Better Auth](https://better-auth.com/) (Email OTP, Credential Provider, Social Logins)
*   **Database**: PostgreSQL (recommended via [Neon](https://neon.tech/)) + [Prisma ORM](https://www.prisma.io/)
*   **Caching & Session**: [Upstash Redis](https://upstash.com/)
*   **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
*   **UI Components**: [Radix UI](https://www.radix-ui.com/) and [Lucide Icons](https://lucide.dev/)
*   **Email Engine**: [Nodemailer](https://nodemailer.com/)

---

## Getting Started

Follow these steps to configure your local development environment.

### 1. Prerequisites
Ensure you have the following installed and configured:
*   **Node.js**: Version 18 or higher
*   **Package Manager**: `npm`, `yarn`, or `pnpm` (`pnpm` is recommended)
*   **Database**: A PostgreSQL connection string (e.g., from [Neon](https://neon.tech/))
*   **Redis**: An Upstash Redis URL and Token

### 2. Installation

Clone the repository and install the required dependencies:

```bash
git clone https://github.com/your-username/recruit-flow.git
cd recruit-flow
pnpm install
```

### 3. Environment Variables

Create a `.env` file in the root directory and configure the following required variables. Refer to `.env.example` if available.

```env
# --- Database ---
DATABASE_URL="postgresql://user:password@host/db?sslmode=require"

# --- Authentication (Better Auth) ---
# Generate a random string: `openssl rand -base64 32`
BETTER_AUTH_SECRET="your_random_secure_secret"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"

# --- Session & Rate Limiting (Upstash Redis) ---
REDIS_URL="https://your-upstash-url.upstash.io"
REDIS_TOKEN="your_upstash_token"

# --- Field Encryption (RSA Keys) ---
# Used to encrypt sensitive SMTP passwords in the database.
# Generate via: `openssl genrsa -out private.pem 2048` and `openssl rsa -in private.pem -outform PEM -pubout -out public.pem`
ENCRYPTION_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----\n"
ENCRYPTION_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# --- Platform Email Sender (Nodemailer) ---
# Used by Better Auth to send OTPs, Verifications, and Password Resets
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM='"RecruitsFlow" <noreply@recruitsflow.com>'
```

### 4. Database Initialization

Push the Prisma schema to your PostgreSQL database and generate the Prisma Client:

```bash
pnpm prisma generate
pnpm prisma db push
```

### 5. Start Development Server

Run the Next.js development server:

```bash
pnpm run dev
```

Navigate to [http://localhost:3000](http://localhost:3000) in your browser to access the application.

---

## Project Architecture

The codebase is organized following Next.js App Router conventions:

*   **`src/app/`**: Contains all pages, layouts, and API routes.
*   **`src/app/(auth)/`**: Handles authentication routes (Login, Register, OTP Verification, Password Reset).
*   **`src/app/actions/`**: Next.js Server Actions handling database mutations, protected by session checks (`requireAuth`) and rate limiting.
*   **`src/components/`**: Reusable React components organized by feature domain (e.g., `campaigns`, `recruiters`, `ui`).
*   **`src/lib/`**: Core utilities including Prisma client initialization, Redis connection, Better Auth configuration, and custom email templates.
*   **`prisma/`**: Contains the `schema.prisma` file defining the database models.

## Development Workflows

*   **Server-First Data Fetching**: Initial data is fetched directly inside Server Components to eliminate client-side waterfalls, passing clean props down to interactive Client Components.
*   **React 19 Server Actions**: Forms heavily utilize `useActionState` for progressive enhancement, allowing for interactive UI with immediate server-side validation.
*   **Memoized Auth**: Session checks are wrapped in React's `cache()` to deduplicate database lookups across the component tree, ensuring optimal rendering performance.

---

## License

This project is licensed under the MIT License.
