import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MCP Servers | Docs",
  description:
    "Documentation hub for the MCP Servers monorepo. Explore Supabase DB and future Model Context Protocol servers with install, config, and deployment guides.",
  openGraph: {
    title: "MCP Servers",
    description:
      "Production-ready Model Context Protocol servers. Install, configure, and deploy from one monorepo.",
    url: "https://mcpservers.kodydennon.com",
    siteName: "MCP Servers",
  },
  metadataBase: new URL("https://mcpservers.kodydennon.com"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
