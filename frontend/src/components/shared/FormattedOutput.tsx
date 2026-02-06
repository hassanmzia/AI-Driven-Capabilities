import React from 'react';

function formatKey(key: string): string {
  return key
    .replace(/[_-]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function JsonValue({ value, depth = 0 }: { value: any; depth?: number }): React.ReactElement {
  if (value === null || value === undefined) {
    return <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>N/A</span>;
  }
  if (typeof value === 'boolean') {
    return (
      <span className={`badge ${value ? 'badge-success' : 'badge-error'}`}>
        {value ? 'Yes' : 'No'}
      </span>
    );
  }
  if (typeof value === 'number') {
    return <strong>{value}</strong>;
  }
  if (typeof value === 'string') {
    if (value.includes('\n')) {
      return <span style={{ whiteSpace: 'pre-wrap' }}>{value}</span>;
    }
    return <span>{value}</span>;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return <span style={{ color: 'var(--text-muted)' }}>None</span>;
    if (value.every((v) => typeof v === 'string' || typeof v === 'number')) {
      return (
        <ul style={{ margin: '0.25rem 0', paddingLeft: '1.25rem', listStyle: 'disc' }}>
          {value.map((item, i) => (
            <li key={i} style={{ marginBottom: '0.15rem', fontSize: '0.82rem' }}>{String(item)}</li>
          ))}
        </ul>
      );
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
        {value.map((item, i) => (
          <div key={i} style={{ padding: '0.5rem 0.75rem', background: 'rgba(99, 102, 241, 0.03)', borderRadius: '0.375rem', borderLeft: '2px solid var(--border)' }}>
            <JsonValue value={item} depth={depth + 1} />
          </div>
        ))}
      </div>
    );
  }
  if (typeof value === 'object') {
    return <JsonSection data={value} depth={depth + 1} />;
  }
  return <span>{String(value)}</span>;
}

function JsonSection({ data, depth = 0 }: { data: Record<string, any>; depth?: number }): React.ReactElement {
  const entries = Object.entries(data);
  const isTopLevel = depth === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isTopLevel ? '0.75rem' : '0.4rem' }}>
      {entries.map(([key, value]) => {
        const isComplex = typeof value === 'object' && value !== null;
        const label = formatKey(key);

        if (isTopLevel && isComplex) {
          return (
            <div key={key} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                {label}
              </div>
              <div style={{ paddingLeft: '0.5rem' }}>
                <JsonValue value={value} depth={depth} />
              </div>
            </div>
          );
        }

        return (
          <div key={key} style={{ display: isComplex ? 'block' : 'flex', gap: '0.5rem', lineHeight: '1.6' }}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.82rem', minWidth: isComplex ? undefined : '140px', flexShrink: 0 }}>
              {label}:
            </span>
            {isComplex ? (
              <div style={{ paddingLeft: '0.75rem', marginTop: '0.2rem' }}>
                <JsonValue value={value} depth={depth} />
              </div>
            ) : (
              <span style={{ fontSize: '0.82rem' }}><JsonValue value={value} depth={depth} /></span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function renderTextLine(line: string, key: number): React.ReactElement {
  const parts: React.ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let lastIdx = 0;
  let match;
  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIdx) parts.push(line.slice(lastIdx, match.index));
    parts.push(<strong key={`b${key}-${match.index}`}>{match[1]}</strong>);
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < line.length) parts.push(line.slice(lastIdx));
  if (parts.length === 0) parts.push(line);
  return <React.Fragment key={key}>{parts}</React.Fragment>;
}

function TextOutput({ text }: { text: string }): React.ReactElement {
  const lines = text.split('\n');
  const elements: React.ReactElement[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === '') {
      elements.push(<div key={i} style={{ height: '0.5rem' }} />);
      i++;
      continue;
    }

    const h1Match = trimmed.match(/^#{1}\s+(.+)/);
    if (h1Match) {
      elements.push(
        <div key={i} style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.75rem', marginBottom: '0.35rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.35rem' }}>
          {renderTextLine(h1Match[1], i)}
        </div>
      );
      i++;
      continue;
    }

    const h2Match = trimmed.match(/^#{2}\s+(.+)/);
    if (h2Match) {
      elements.push(
        <div key={i} style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--accent)', marginTop: '0.6rem', marginBottom: '0.25rem' }}>
          {renderTextLine(h2Match[1], i)}
        </div>
      );
      i++;
      continue;
    }

    const h3Match = trimmed.match(/^#{3,}\s+(.+)/);
    if (h3Match) {
      elements.push(
        <div key={i} style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.5rem', marginBottom: '0.2rem' }}>
          {renderTextLine(h3Match[1], i)}
        </div>
      );
      i++;
      continue;
    }

    const bulletMatch = trimmed.match(/^[-*•]\s+(.+)/);
    if (bulletMatch) {
      const items: React.ReactElement[] = [];
      while (i < lines.length) {
        const bm = lines[i].trim().match(/^[-*•]\s+(.+)/);
        if (!bm) break;
        items.push(<li key={i} style={{ marginBottom: '0.2rem' }}>{renderTextLine(bm[1], i)}</li>);
        i++;
      }
      elements.push(
        <ul key={`ul${i}`} style={{ paddingLeft: '1.25rem', margin: '0.25rem 0', listStyle: 'disc' }}>
          {items}
        </ul>
      );
      continue;
    }

    const numMatch = trimmed.match(/^(\d+)[.)]\s+(.+)/);
    if (numMatch) {
      const items: React.ReactElement[] = [];
      while (i < lines.length) {
        const nm = lines[i].trim().match(/^(\d+)[.)]\s+(.+)/);
        if (!nm) break;
        items.push(<li key={i} style={{ marginBottom: '0.2rem' }}>{renderTextLine(nm[2], i)}</li>);
        i++;
      }
      elements.push(
        <ol key={`ol${i}`} style={{ paddingLeft: '1.25rem', margin: '0.25rem 0' }}>
          {items}
        </ol>
      );
      continue;
    }

    elements.push(
      <div key={i} style={{ marginBottom: '0.15rem', lineHeight: '1.7' }}>
        {renderTextLine(trimmed, i)}
      </div>
    );
    i++;
  }

  return <div>{elements}</div>;
}

function extractJSON(text: string): { parsed: any; before: string; after: string } | null {
  const trimmed = text.trim();

  // Direct JSON
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      return { parsed: JSON.parse(trimmed), before: '', after: '' };
    } catch { /* fall through */ }
  }

  // JSON inside markdown code blocks: ```json\n...\n``` or ```\n...\n```
  const codeBlockRegex = /```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/;
  const cbMatch = trimmed.match(codeBlockRegex);
  if (cbMatch) {
    const jsonStr = cbMatch[1].trim();
    try {
      const parsed = JSON.parse(jsonStr);
      const idx = trimmed.indexOf(cbMatch[0]);
      const before = trimmed.slice(0, idx).trim();
      const after = trimmed.slice(idx + cbMatch[0].length).trim();
      return { parsed, before, after };
    } catch { /* fall through */ }
  }

  // JSON embedded in text — find first { or [ and match to last } or ]
  const firstBrace = trimmed.search(/[{[]/);
  if (firstBrace > 0) {
    const opener = trimmed[firstBrace];
    const closer = opener === '{' ? '}' : ']';
    const lastClose = trimmed.lastIndexOf(closer);
    if (lastClose > firstBrace) {
      const candidate = trimmed.slice(firstBrace, lastClose + 1);
      try {
        const parsed = JSON.parse(candidate);
        const before = trimmed.slice(0, firstBrace).trim();
        const after = trimmed.slice(lastClose + 1).trim();
        return { parsed, before, after };
      } catch { /* fall through */ }
    }
  }

  return null;
}

export const FormattedOutput: React.FC<{ text: string }> = ({ text }) => {
  const extracted = extractJSON(text);
  if (extracted && typeof extracted.parsed === 'object') {
    return (
      <div style={{ padding: '0.25rem 0' }}>
        {extracted.before && (
          <div style={{ marginBottom: '0.75rem' }}>
            <TextOutput text={extracted.before} />
          </div>
        )}
        {Array.isArray(extracted.parsed) ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {extracted.parsed.map((item, i) => (
              <div key={i} style={{ padding: '0.75rem', background: 'rgba(99, 102, 241, 0.03)', borderRadius: '0.5rem', borderLeft: '3px solid var(--accent)' }}>
                {typeof item === 'object' && item !== null ? (
                  <JsonSection data={item} />
                ) : (
                  <span>{String(item)}</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <JsonSection data={extracted.parsed} />
        )}
        {extracted.after && (
          <div style={{ marginTop: '0.75rem' }}>
            <TextOutput text={extracted.after} />
          </div>
        )}
      </div>
    );
  }

  return <TextOutput text={text} />;
};
