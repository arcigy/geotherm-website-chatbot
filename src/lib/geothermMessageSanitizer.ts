export function stripMarkdownImagesFromMessage(value: string) {
  return value
    .replace(/!\[[^\]]*]\(([^)]+)\)/g, "")
    .replace(/^\s*\*?Obr[áa]z(?:ok|ky):.*$/gim, "")
    .replace(/^\s*https?:\/\/\S+\.(?:jpe?g|png|webp|gif)(?:\?\S*)?\s*$/gim, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
