import { Attachment } from '../types';

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function processFile(file: File): Promise<Attachment> {
  const isImage = file.type.startsWith('image/');
  const isPdf = file.type === 'application/pdf';

  // Text-based types
  const textExtensions = ['.txt', '.md', '.markdown', '.json', '.csv', '.tsv', '.js', '.jsx', '.ts', '.tsx', '.py', '.html', '.css', '.scss', '.yaml', '.yml', '.xml', '.sql', '.sh', '.rs', '.go', '.java', '.c', '.cpp', '.h'];
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  const isTextDoc = !isImage && !isPdf && (file.type.startsWith('text/') || textExtensions.includes(ext) || file.type.includes('json') || file.type.includes('xml'));

  const id = `att_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  if (isImage) {
    const dataUrl = await readFileAsDataUrl(file);
    const base64 = dataUrl.split(',')[1] || '';
    return {
      id,
      name: file.name,
      type: 'image',
      size: file.size,
      mimeType: file.type || 'image/jpeg',
      dataUrl,
      base64,
    };
  }

  if (isPdf) {
    const dataUrl = await readFileAsDataUrl(file);
    const base64 = dataUrl.split(',')[1] || '';
    return {
      id,
      name: file.name,
      type: 'file',
      size: file.size,
      mimeType: 'application/pdf',
      base64,
    };
  }

  // Treat as text/code document
  if (isTextDoc) {
    const text = await readFileAsText(file);
    return {
      id,
      name: file.name,
      type: 'file',
      size: file.size,
      mimeType: file.type || 'text/plain',
      text,
    };
  }

  // Fallback: try reading as text, if fails read as dataUrl
  try {
    const text = await readFileAsText(file);
    return {
      id,
      name: file.name,
      type: 'file',
      size: file.size,
      mimeType: file.type || 'application/octet-stream',
      text,
    };
  } catch {
    const dataUrl = await readFileAsDataUrl(file);
    const base64 = dataUrl.split(',')[1] || '';
    return {
      id,
      name: file.name,
      type: 'file',
      size: file.size,
      mimeType: file.type || 'application/octet-stream',
      base64,
    };
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}
