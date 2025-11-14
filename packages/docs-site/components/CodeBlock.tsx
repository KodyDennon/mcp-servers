export function CodeBlock({
  lines,
  language = "bash",
}: {
  lines: string[];
  language?: string;
}) {
  return (
    <pre className="code-block" data-language={language}>
      <code>
        {lines.map((line, index) => (
          <span key={index}>{line + "\n"}</span>
        ))}
      </code>
    </pre>
  );
}
