export function stripMarkdownFrontmatter(markdown: string) {
  return normalizeMarkdownNewlines(markdown)
    .replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, '')
    .trim();
}

export function renderMarkdown(markdown: string) {
  const escaped = normalizeMarkdownNewlines(markdown)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return escaped
    .replace(
      /!\[([^\]]*)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)/g,
      '<img src="$2" alt="$1" loading="lazy" decoding="async" />',
    )
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^(?:\*|-) (.+)$/gm, '<li>$1</li>')
    .replace(/(?:<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(
      /\|(.+)\|\n\|[-| :]+\|\n((?:\|.*\|\n?)*)/g,
      (_match, head, body) => {
        const row = (value: string, tag: string) =>
          `<tr>${value
            .split('|')
            .filter(Boolean)
            .map((cell) => `<${tag}>${cell.trim()}</${tag}>`)
            .join('')}</tr>`;
        return `<table><thead>${row(head, 'th')}</thead><tbody>${body
          .trim()
          .split('\n')
          .map((line: string) => row(line.slice(1, -1), 'td'))
          .join('')}</tbody></table>`;
      },
    )
    .split(/\n{2,}/)
    .map((block) =>
      /^<(?:h\d|ul|table|img)/.test(block)
        ? block
        : `<p>${block.replace(/\n/g, ' ')}</p>`,
    )
    .join('\n');
}

function normalizeMarkdownNewlines(markdown: string) {
  return markdown.replace(/\r\n?/g, '\n').replace(/\\r\\n|\\n|\\r/g, '\n');
}
