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
