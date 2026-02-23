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

function hasChinese(text: string): boolean {
  const chineseRegex = /[\u4e00-\u9fff]/;
  return chineseRegex.test(text);
}

function hasEnglish(text: string): boolean {
  const englishRegex = /[a-zA-Z]{10,}/;
  return englishRegex.test(text);
}

interface ParsedContent {
  en: string | null;
  zh: string | null;
}

function parseBilingualContent(content: string): ParsedContent {
  const lines = content.split('\n');
  
  const englishLines: string[] = [];
  const chineseLines: string[] = [];
  let currentLang: 'en' | 'zh' | null = null;
  
  for (const line of lines) {
    if (hasChinese(line)) {
      if (currentLang !== 'zh') {
        currentLang = 'zh';
      }
      chineseLines.push(line);
    } else if (hasEnglish(line)) {
      if (currentLang !== 'en') {
        currentLang = 'en';
      }
      englishLines.push(line);
    } else {
      if (currentLang === 'zh') {
        chineseLines.push(line);
      } else {
        englishLines.push(line);
      }
    }
  }
  
  const en = englishLines.length > 5 ? englishLines.join('\n') : null;
  const zh = chineseLines.length > 5 ? chineseLines.join('\n') : null;
  
  if (!en && !zh) {
    return { en: content, zh: null };
  }
  
  return { en, zh };
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
    
    const content = await response.text();
    
    const lines = content.split('\n');
    let title: string | null = null;
    const contentLines: string[] = [];
    let inFrontmatter = false;
    
    for (const line of lines) {
      if (line.trim() === '---') {
        inFrontmatter = !inFrontmatter;
        continue;
      }
      if (inFrontmatter) continue;
      
      if (!title && line.trim().startsWith('# ')) {
        title = line.trim().substring(2).trim();
      } else if (line.trim().startsWith('# ')) {
        contentLines.push(line);
      } else if (title) {
        contentLines.push(line);
      }
    }
    
    const bodyContent = contentLines.join('\n');
    const parsed = parseBilingualContent(bodyContent);
    
    return { title, content: parsed };
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
