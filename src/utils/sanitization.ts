
// HTML sanitization utility
export const sanitizeHtml = (input: string): string => {
  // Create a temporary element to decode HTML entities
  const temp = document.createElement('div');
  temp.textContent = input;
  return temp.innerHTML;
};

// Safe text content extraction (prevents XSS)
export const extractTextContent = (html: string): string => {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || '';
};

// Sanitize user input for display
export const sanitizeUserInput = (input: string): string => {
  if (!input) return '';
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// Sanitize video metadata
export const sanitizeVideoData = (data: any) => {
  return {
    ...data,
    title: sanitizeUserInput(data.title || ''),
    description: sanitizeUserInput(data.description || ''),
  };
};

// Validate file types for uploads
export const isValidVideoFile = (file: File): boolean => {
  const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg'];
  return allowedTypes.includes(file.type);
};

// Validate file size (max 100MB)
export const isValidFileSize = (file: File, maxSizeMB: number = 100): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};
