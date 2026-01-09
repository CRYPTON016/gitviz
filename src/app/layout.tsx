import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GitViz - Repository Branch Visualizer",
  description: "Interactive GitHub repository branch visualization tool. Visualize git branches, commits, and repository history with an intuitive interface.",
  keywords: ["git", "visualization", "branches", "commits", "repository", "github"],
  authors: [{ name: "GitViz Team" }],
  openGraph: {
    title: "GitViz - Repository Branch Visualizer",
    description: "Interactive GitHub repository branch visualization tool",
    type: "website",
    locale: "en_US",
    siteName: "GitViz",
  },
  twitter: {
    card: "summary_large_image",
    title: "GitViz - Repository Branch Visualizer",
    description: "Interactive GitHub repository branch visualization tool",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0a0a0a" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <main id="main-content">
          {children}
        </main>
      </body>
    </html>
  );
}
