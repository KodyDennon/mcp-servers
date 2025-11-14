import { Navbar } from "../../components/Navbar";
import { Footer } from "../../components/Footer";
import { ServerCard } from "../../components/ServerCard";
import { servers } from "../../lib/servers";

export const metadata = {
  title: "MCP Servers | All Servers",
};

export default function ServersPage() {
  return (
    <>
      <Navbar />
      <main className="page">
        <section className="section">
          <div className="section__inner">
            <p className="section__kicker">Directory</p>
            <h1>Server catalog</h1>
            <p className="hero__lede">
              Each MCP server ships with batteries included docs. Pick one to
              view install, configuration, and release notes.
            </p>
            <div className="grid">
              {servers.map((server) => (
                <ServerCard key={server.slug} server={server} />
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
