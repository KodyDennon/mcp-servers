import Link from "next/link";

export function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar__brand">
        <Link href="/">
          <span className="navbar__logo">MCP Servers</span>
        </Link>
        <span className="navbar__tag">Monorepo</span>
      </div>
      <nav className="navbar__links">
        <Link href="/servers">Servers</Link>
        <a
          href="https://github.com/KodyDennon/mcp-servers"
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>
      </nav>
    </header>
  );
}
