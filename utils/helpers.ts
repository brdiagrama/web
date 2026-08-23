export const downloadFile = (content: BlobPart, fileName: string, mimeType: string): void => {
  if (typeof window === 'undefined') return;
  const a = document.createElement("a");
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  a.setAttribute("href", url);
  a.setAttribute("download", fileName);
  a.click();
  URL.revokeObjectURL(url);
};
