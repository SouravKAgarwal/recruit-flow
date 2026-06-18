# RecruitFlow Platform

RecruitFlow is a modern, responsive, server-driven email outreach platform designed to manage recruiter contacts, HTML email templates, resumes, and automated bulk email campaigns.

## Features

- **Contacts CRM**: Manage thousands of recruiters. Import via CSV, paste structured data directly from the clipboard, and manage records with inline editing and bulk actions.
- **Visual Template Editor**: A split-pane HTML editor with syntax highlighting and live preview for crafting the perfect outreach emails.
- **Campaign Engine**: Send automated, staggered email campaigns. Track delivery statuses (Sent, Failed) in real-time with an auto-refreshing dashboard.
- **SMTP Management**: Connect multiple sending accounts (Gmail, Outlook, Zoho, Custom) with built-in connection testing.
- **Resume Hub**: A centralized drag-and-drop repository to manage multiple resumes and assign a default active resume for automated attachments.
- **Responsive Architecture**: Fully responsive UI designed with Tailwind CSS v4, featuring a beautiful glassmorphic dark mode, fluid tables, and mobile-optimized layouts.

## Tech Stack

- **Framework**: [Next.js 16+](https://nextjs.org/) (App Router, Server Components, Server Actions)
- **Database**: [Prisma ORM](https://www.prisma.io/) with SQLite (local development)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Components**: Headless UI powered by [Radix UI](https://www.radix-ui.com/) and [Lucide Icons](https://lucide.dev/)
- **Email Sending**: [Nodemailer](https://nodemailer.com/)

## Getting Started

### Prerequisites
- Node.js (v18+)
- pnpm (recommended) or npm

### Installation

1. Clone the repository and install dependencies:
   ```bash
   pnpm install
   ```

2. Initialize the database:
   ```bash
   pnpm prisma generate
   pnpm prisma migrate dev
   ```

3. Start the development server:
   ```bash
   pnpm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

- `src/app`: Next.js App Router. Contains all server pages, layouts, and global CSS.
- `src/app/actions`: Next.js Server Actions handling all database mutations (CRUD) and external APIs.
- `src/components`: React client and server components, neatly organized by domain (`campaigns`, `recruiters`, `smtp`, `templates`, `ui`).
- `prisma/`: Database schema and migration history.

## Development Workflows

- **Server-First Data Fetching**: All initial data is fetched directly inside Server Components (e.g., `page.tsx`), passing static data payloads into Client Components to eliminate client-side loading spinners.
- **Form Actions**: Modals and inline editors utilize React 19's `useActionState` and Server Actions for progressive enhancement and form validation without manual API route building.

## License

MIT
