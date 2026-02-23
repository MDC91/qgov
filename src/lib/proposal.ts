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
