import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GitViz - Repository Branch Visualizer",
  description: "Interactive GitHub repository branch visualization tool",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
