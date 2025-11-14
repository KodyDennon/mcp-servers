import Link from "next/link";
import type { ServerDoc } from "../lib/servers";

export function ServerCard({ server }: { server: ServerDoc }) {
  return (
    <Link href={`/servers/${server.slug}`} className="server-card">
      <div className="server-card__header">
        <div>
          <p className="server-card__label">MCP Server</p>
          <h3>{server.name}</h3>
        </div>
        <span className="server-card__status">{server.status}</span>
      </div>
      <p className="server-card__description">{server.tagline}</p>
      <div className="server-card__stats">
        {server.heroStats.map((stat) => (
          <div key={stat.label}>
            <p className="server-card__stat-value">{stat.value}</p>
            <p className="server-card__stat-label">{stat.label}</p>
          </div>
        ))}
      </div>
    </Link>
  );
}
