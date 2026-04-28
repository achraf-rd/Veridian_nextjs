export async function parseMarkdown(buffer: Buffer): Promise<string[]> {
  const text = buffer.toString('utf-8')
  return text
    .split('\n')
    .map((line) => line.replace(/^[-*+]\s+/, '').replace(/^\d+\.\s+/, '').trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'))
}
