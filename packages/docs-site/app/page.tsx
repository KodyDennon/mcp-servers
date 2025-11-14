import Link from "next/link";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { ServerCard } from "../components/ServerCard";
import { servers } from "../lib/servers";

export default function HomePage() {
  const featured = servers[0];

  return (
    <>
      <Navbar />
      <main className="page">
        <section className="hero">
          <p className="hero__eyebrow">Model Context Protocol</p>
          <h1>One monorepo. Multiple production-ready MCP servers.</h1>
          <p className="hero__lede">
            Install supabase-db today and plug it into Claude Code, Cursor,
            Gemini CLI, Cline, Windsurf, or any MCP-compatible agent. More
            servers land here soon.
          </p>
          <div className="hero__cta">
            <Link href={`/servers/${featured.slug}`} className="button primary">
              View Supabase DB docs
            </Link>
            <a
              href="https://github.com/KodyDennon/mcp-servers"
              className="button ghost"
              target="_blank"
              rel="noreferrer"
            >
              GitHub repository
            </a>
          </div>
          <div className="hero__stats">
            {featured.heroStats.map((stat) => (
              <div key={stat.label}>
                <p className="stat__value">{stat.value}</p>
                <p className="stat__label">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="section">
          <div className="section__inner">
            <p className="section__kicker">Servers</p>
            <h2>Shipping &amp; in-progress MCP servers</h2>
            <div className="grid">
              {servers.map((server) => (
                <ServerCard key={server.slug} server={server} />
              ))}
              <div className="server-card server-card--ghost">
                <p className="server-card__label">Coming soon</p>
                <h3>Your integration?</h3>
                <p className="server-card__description">
                  We’re actively building additional MCP servers. Have a service
                  you want to expose? Open a PR or file an issue.
                </p>
                <a
                  className="button ghost"
                  href="https://github.com/KodyDennon/mcp-servers/issues/new"
                  target="_blank"
                  rel="noreferrer"
                >
                  Propose a server
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
