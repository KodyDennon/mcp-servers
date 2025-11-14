import { ReactNode } from "react";

export function Section({
  title,
  kicker,
  children,
}: {
  title: string;
  kicker?: string;
  children: ReactNode;
}) {
  return (
    <section className="section">
      <div className="section__inner">
        {kicker ? <p className="section__kicker">{kicker}</p> : null}
        <h2>{title}</h2>
        <div className="section__content">{children}</div>
      </div>
    </section>
  );
}
