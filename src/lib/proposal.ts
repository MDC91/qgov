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
