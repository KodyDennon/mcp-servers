import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "../../../components/Navbar";
import { Footer } from "../../../components/Footer";
import { Section } from "../../../components/Section";
import { CodeBlock } from "../../../components/CodeBlock";
import { getServer, servers } from "../../../lib/servers";

type Params = { slug: string };

export function generateStaticParams() {
  return servers.map((server) => ({ slug: server.slug }));
}

export function generateMetadata({ params }: { params: Params }) {
  const server = getServer(params.slug);
  if (!server) return {};
  return {
    title: `${server.name} | MCP Docs`,
    description: server.tagline,
  };
}

export default function ServerPage({ params }: { params: Params }) {
  const server = getServer(params.slug);
  if (!server) {
    notFound();
  }

  return (
    <>
      <Navbar />
      <main className="page">
        <section className="section section--hero">
          <div className="section__inner">
            <p className="section__kicker">MCP Server</p>
            <h1>{server.name}</h1>
            <p className="hero__lede">{server.description}</p>
            <div className="hero__cta">
              <a
                className="button primary"
                href={server.npm}
                target="_blank"
                rel="noreferrer"
              >
                View on npm
              </a>
              <a
                className="button ghost"
                href={`https://github.com/KodyDennon/mcp-servers/tree/main/${server.repoPath}`}
                target="_blank"
                rel="noreferrer"
              >
                View package source
              </a>
            </div>
            <div className="hero__stats">
              {server.heroStats.map((stat) => (
                <div key={stat.label}>
                  <p className="stat__value">{stat.value}</p>
                  <p className="stat__label">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Section title="Requirements" kicker="Environment">
          <ul className="list">
            {server.requirements.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Section>

        <Section title="Install" kicker="Get started">
          <div className="grid grid--two">
            {server.install.map((block) => (
              <div key={block.title} className="card">
                <p className="card__kicker">{block.title}</p>
                {block.description ? <p>{block.description}</p> : null}
                <CodeBlock lines={block.lines} />
              </div>
            ))}
          </div>
        </Section>

        <Section title="Configuration" kicker="Secrets & environment">
          <p>{server.configuration.intro}</p>
          <div className="env-table">
            {server.configuration.env.map((env) => (
              <div key={env.key} className="env-table__row">
                <code>{env.key}</code>
                <p>{env.description}</p>
              </div>
            ))}
          </div>
          {server.configuration.notes ? (
            <ul className="list">
              {server.configuration.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          ) : null}
        </Section>

        <Section title="Execution modes" kicker="Operate">
          <div className="grid grid--two">
            {server.modes.map((mode) => (
              <div key={mode.name} className="card card--mode">
                <h3>{mode.name}</h3>
                <p>{mode.description}</p>
                {mode.env ? <CodeBlock lines={[mode.env]} /> : null}
              </div>
            ))}
          </div>
        </Section>

        <Section title="Testing & QA" kicker="Quality gates">
          <p>
            Run these commands inside `{server.repoPath}` before publishing:
          </p>
          <CodeBlock lines={server.testing} />
        </Section>

        <Section title="Capabilities" kicker="Highlights">
          <ul className="list list--grid">
            {server.features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
        </Section>

        <Section title="Resources" kicker="Links">
          <ul className="list">
            {server.resources.map((resource) => (
              <li key={resource.href}>
                <Link href={resource.href} target="_blank">
                  {resource.label}
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      </main>
      <Footer />
    </>
  );
}
