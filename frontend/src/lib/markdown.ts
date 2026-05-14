// Tiny, deliberately-limited markdown → HTML pipeline. Just enough for
// blog posts: headings, paragraphs, lists, blockquotes, inline links, bold,
// italic, inline code, fenced code blocks, and images.
//
// Output is HTML-escaped first, then markdown tokens are replaced with
// safe HTML — there is no path through this function that lets writers
// inject raw HTML or scripts.

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function inline(s: string): string {
  // Order matters. Inline code first so its contents survive verbatim.
  let out = s.replace(/`([^`\n]+)`/g, (_, code) => `<code>${code}</code>`);
  // Images: ![alt](url)
  out = out.replace(
    /!\[([^\]]*)\]\(([^) ]+)(?:\s+&quot;([^&]+)&quot;)?\)/g,
    (_, alt, src, title) => {
      const t = title ? ` title="${title}"` : "";
      return `<img src="${src}" alt="${alt}" loading="lazy"${t} />`;
    },
  );
  // Links: [text](url)
  out = out.replace(
    /\[([^\]]+)\]\(([^) ]+)\)/g,
    (_, text, href) =>
      `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`,
  );
  // Bold then italic
  out = out.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/\*([^*\n]+)\*/g, "<em>$1</em>");
  out = out.replace(/_([^_\n]+)_/g, "<em>$1</em>");
  return out;
}

export function markdownToHtml(input: string): string {
  if (!input) return "";
  const escaped = escapeHtml(input);
  const lines = escaped.split(/\r?\n/);

  const out: string[] = [];
  let i = 0;

  type ListKind = "ul" | "ol" | null;
  let listKind: ListKind = null;
  let inBlockquote = false;
  let paragraph: string[] = [];

  const closeList = () => {
    if (listKind) {
      out.push(`</${listKind}>`);
      listKind = null;
    }
  };
  const closeBlockquote = () => {
    if (inBlockquote) {
      out.push(`</blockquote>`);
      inBlockquote = false;
    }
  };
  const flushParagraph = () => {
    if (paragraph.length) {
      out.push(`<p>${inline(paragraph.join(" "))}</p>`);
      paragraph = [];
    }
  };

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trimEnd();

    // Fenced code block: ``` … ```
    const fenceMatch = line.match(/^```\s*([\w+-]*)\s*$/);
    if (fenceMatch) {
      flushParagraph();
      closeList();
      closeBlockquote();
      const lang = fenceMatch[1] || "";
      const codeLines: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].match(/^```\s*$/)) {
        codeLines.push(lines[i]);
        i += 1;
      }
      const cls = lang ? ` class="language-${lang}"` : "";
      out.push(`<pre><code${cls}>${codeLines.join("\n")}</code></pre>`);
      i += 1;
      continue;
    }

    // Blank line ends paragraph / list / blockquote
    if (line.trim() === "") {
      flushParagraph();
      closeList();
      closeBlockquote();
      i += 1;
      continue;
    }

    // ATX headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      closeList();
      closeBlockquote();
      const level = headingMatch[1].length;
      out.push(`<h${level}>${inline(headingMatch[2])}</h${level}>`);
      i += 1;
      continue;
    }

    // Horizontal rule
    if (/^(---|\*\*\*|___)$/.test(line.trim())) {
      flushParagraph();
      closeList();
      closeBlockquote();
      out.push("<hr />");
      i += 1;
      continue;
    }

    // Blockquote
    const bqMatch = line.match(/^&gt;\s?(.*)$/);
    if (bqMatch) {
      flushParagraph();
      closeList();
      if (!inBlockquote) {
        out.push("<blockquote>");
        inBlockquote = true;
      }
      out.push(`<p>${inline(bqMatch[1])}</p>`);
      i += 1;
      continue;
    }

    // Unordered list
    const ulMatch = line.match(/^[-*+]\s+(.+)$/);
    if (ulMatch) {
      flushParagraph();
      closeBlockquote();
      if (listKind !== "ul") {
        closeList();
        out.push("<ul>");
        listKind = "ul";
      }
      out.push(`<li>${inline(ulMatch[1])}</li>`);
      i += 1;
      continue;
    }

    // Ordered list
    const olMatch = line.match(/^\d+\.\s+(.+)$/);
    if (olMatch) {
      flushParagraph();
      closeBlockquote();
      if (listKind !== "ol") {
        closeList();
        out.push("<ol>");
        listKind = "ol";
      }
      out.push(`<li>${inline(olMatch[1])}</li>`);
      i += 1;
      continue;
    }

    // Default: paragraph line (joins consecutive lines with spaces)
    closeList();
    closeBlockquote();
    paragraph.push(line.trim());
    i += 1;
  }

  flushParagraph();
  closeList();
  closeBlockquote();

  return out.join("\n");
}
