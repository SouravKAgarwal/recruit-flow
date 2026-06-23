import type { NextConfig } from "next";

// ---------------------------------------------------------------------------
// Security headers applied to every response
// ---------------------------------------------------------------------------
const isProd = process.env.NODE_ENV === "production";

const securityHeaders = [
  // Prevent browsers from MIME-sniffing the Content-Type
  { key: "X-Content-Type-Options", value: "nosniff" },

  // Block the page from being embedded in an iframe (clickjacking)
  { key: "X-Frame-Options", value: "DENY" },

  // Disable legacy XSS auditor (replaced by CSP; keeping header avoids quirks)
  { key: "X-XSS-Protection", value: "1; mode=block" },

  // Strict referrer — only send origin on same-origin, nothing cross-origin
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

  // Disable browser features that aren't needed by this app
  {
    key: "Permissions-Policy",
    value: [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "interest-cohort=()",
      "payment=()",
    ].join(", "),
  },

  // Force HTTPS for 2 years in production; include subdomains
  ...(isProd
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),

  // Content-Security-Policy
  // Tuned for Next.js + Google Fonts + Cloudinary images
  {
    key: "Content-Security-Policy",
    value: [
      // Only load scripts from our own origin; Next.js inlines are handled via nonces in RSC
      "default-src 'self'",
      // Scripts: self + unsafe-inline is required for Next.js hydration chunks in dev;
      // in prod you would ideally use nonces — left as unsafe-inline for compatibility.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      // Styles: self + Google Fonts + unsafe-inline (Tailwind / CSS-in-JS)
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Fonts: self + Google Fonts CDN
      "font-src 'self' https://fonts.gstatic.com",
      // Images: self + known avatar CDNs + Cloudinary (user uploads)
      [
        "img-src 'self' data: blob:",
        "https://lh3.googleusercontent.com",   // Google avatars
        "https://avatars.githubusercontent.com", // GitHub avatars
        "https://res.cloudinary.com",            // Cloudinary uploads
      ].join(" "),
      // Fetch / XHR: self only (auth API + internal)
      "connect-src 'self'",
      // Disallow all object/embed/applet tags
      "object-src 'none'",
      // Disallow <base> tag hijacking
      "base-uri 'self'",
      // Restrict form POST targets
      "form-action 'self'",
      // Block all framing
      "frame-ancestors 'none'",
      // Upgrade mixed content in production
      ...(isProd ? ["upgrade-insecure-requests"] : []),
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  reactCompiler: true,

  // -------------------------------------------------------------------------
  // HTTP security headers on every route
  // -------------------------------------------------------------------------
  headers: async () => [
    {
      // Apply to all routes
      source: "/(.*)",
      headers: securityHeaders,
    },
    {
      // Tell crawlers not to index auth pages
      source: "/(login|register|forgot-password|reset-password|verify-email)(.*)",
      headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
    },
  ],

  // -------------------------------------------------------------------------
  // Images — whitelist only the exact CDN hostnames we actually use
  // Wildcards (*) let attackers proxy arbitrary external images through our
  // Next.js image optimizer, burning bandwidth and potentially serving malware.
  // -------------------------------------------------------------------------
  images: {
    remotePatterns: [
      // Google OAuth avatars
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      // GitHub OAuth avatars
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      // Cloudinary (user-uploaded resumes / profile images)
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },

  cacheComponents: true,
  devIndicators: false,

  experimental: {
    serverActions: {
      // 10 MB is appropriate only for file upload actions; auth actions need
      // far less. The limit applies globally here — individual upload routes
      // can enforce their own size checks server-side.
      bodySizeLimit: "10mb",
    },
    optimizeCss: true,
    inlineCss: true,
  },
};

export default nextConfig;
