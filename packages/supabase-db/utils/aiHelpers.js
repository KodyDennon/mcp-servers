// Simple text chunking function
export function chunkText(text, chunkSize = 500, overlap = 100) {
  const size = Math.max(1, chunkSize);
  const safeOverlap = Math.min(Math.max(0, overlap), size - 1);
  const step = Math.max(1, size - safeOverlap);
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    const end = Math.min(i + size, text.length);
    let chunk = text.substring(i, end);
    chunks.push(chunk);
    i += step;
    if (i >= text.length - overlap && i < text.length) {
      // Ensure the last chunk is not too small and overlaps correctly
      if (text.length - (i + safeOverlap) < size / 2) {
        break;
      }
    }
  }
  return chunks;
}
//# sourceMappingURL=aiHelpers.js.map
