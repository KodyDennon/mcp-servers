export function Footer() {
  return (
    <footer className="footer">
      <div>
        © {new Date().getFullYear()} MCP Servers. Built for the Model Context
        Protocol community.
      </div>
      <a
        href="https://github.com/KodyDennon/mcp-servers"
        target="_blank"
        rel="noreferrer"
      >
        View on GitHub
      </a>
    </footer>
  );
}
