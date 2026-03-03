export function extractProposalId(url: string, fallbackUrl: string): string {
  try {
    const fullUrl = url || fallbackUrl;
    const parts = fullUrl.split('/');
    const filename = parts[parts.length - 1];
    return filename.replace('.md', '');
  } catch {
    return fallbackUrl;
  }
}

const EAST_ASIAN_SCRIPT_REGEX = /[\u4e00-\u9fff\u3400-\u4dbf\u3040-\u30ff\uac00-\ud7af]/;

function normalizeMarkdown(markdown: string): string {
  return markdown.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

export function stripFrontmatter(markdown: string): string {
  const normalized = normalizeMarkdown(markdown);
  const lines = normalized.split('\n');

  if (lines[0]?.trim() !== '---') {
    return normalized;
  }

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      return lines.slice(i + 1).join('\n');
    }
  }

  return normalized;
}

export function splitMarkdownTitleAndBody(markdown: string): { title: string | null; body: string } {
  const withoutFrontmatter = stripFrontmatter(markdown);
  const lines = withoutFrontmatter.split('\n');

  let title: string | null = null;
  let titleLineIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (/^#\s+/.test(line)) {
      title = line.replace(/^#\s+/, '').trim();
      titleLineIndex = i;
      break;
    }
  }

  const bodyLines = titleLineIndex >= 0 ? lines.slice(titleLineIndex + 1) : lines;
  const body = bodyLines.join('\n').replace(/^\s+/, '').trim();

  return { title, body };
}

export function filterEnglishMarkdownBody(body: string): string {
  const lines = normalizeMarkdown(body).split('\n');
  const filteredLines = lines.filter((line) => !EAST_ASIAN_SCRIPT_REGEX.test(line));

  return filteredLines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function ensureMarkdownTitle(title: string, markdown: string): string {
  const safeTitle = (title || 'Qubic Proposal').trim();
  const cleanedBody = normalizeMarkdown(markdown || '')
    .replace(/^\s*#\s+.*\n+/, '')
    .trim();

  if (!cleanedBody) {
    return `# ${safeTitle}`;
  }

  return `# ${safeTitle}\n\n${cleanedBody}`;
}

export async function extractTitleAndContentFromMarkdown(url: string): Promise<{ title: string | null; content: { en: string | null; zh: string | null } }> {
  if (!url || !url.includes('github.com')) {
    return { title: null, content: { en: null, zh: null } };
  }
  
  try {
    const rawUrl = url
      .replace('github.com', 'raw.githubusercontent.com')
      .replace('/blob/', '/');
    
    const response = await fetch(rawUrl, { next: { revalidate: 3600 } });
    if (!response.ok) return { title: null, content: { en: null, zh: null } };
    
    const markdown = await response.text();
    const { title, body } = splitMarkdownTitleAndBody(markdown);
    const englishBody = filterEnglishMarkdownBody(body);

    return {
      title,
      content: {
        en: englishBody || null,
        zh: null
      }
    };
  } catch {
    return { title: null, content: { en: null, zh: null } };
  }
}

export async function extractTitleFromMarkdown(url: string): Promise<string | null> {
  if (!url || !url.includes('github.com')) return null;
  
  try {
    const rawUrl = url
      .replace('github.com', 'raw.githubusercontent.com')
      .replace('/blob/', '/');
    
    const response = await fetch(rawUrl, { next: { revalidate: 3600 } });
    if (!response.ok) return null;
    
    const content = await response.text();
    
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('# ')) {
        return trimmed.substring(2).trim();
      }
    }
    return null;
  } catch {
    return null;
  }
}

export function extractTitleFromUrl(url: string): string {
  if (!url) return '';
  
  try {
    const parts = url.split('/');
    let filename = parts[parts.length - 1] || parts[parts.length - 2];
    
    if (filename.includes('.md')) {
      filename = filename.replace('.md', '');
    }
    
    if (filename.includes(' at ')) {
      filename = filename.split(' at ')[0];
    }
    
    filename = filename
      .replace(/[-_]/g, ' ')
      .replace(/(\d{2}\.\d{2}\.\d{2}_)/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (filename.length > 3) {
      return filename.charAt(0).toUpperCase() + filename.slice(1);
    }
    
    return '';
  } catch {
    return '';
  }
}

export function createProposalSlug(title: string, id: string): string {
  if (!title) return encodeURIComponent(id);
  
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50);
  
  return slug || encodeURIComponent(id);
}
