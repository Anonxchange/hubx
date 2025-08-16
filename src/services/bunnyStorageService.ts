
const BUNNY_STORAGE_API_KEY = 'b21ef96d-bb4c-4e4a-8ab9b2339ad3-f66d-4916';
const BUNNY_STORAGE_ZONE = 'hubx';
const BUNNY_STORAGE_URL = `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}`;
const BUNNY_CDN_URL = `https://${BUNNY_STORAGE_ZONE}.b-cdn.net`;

export interface UploadResponse {
  success: boolean;
  url?: string;
  error?: string;
}

// Upload file to Bunny CDN storage
export const uploadToBunnyStorage = async (
  file: File,
  path: string
): Promise<UploadResponse> => {
  try {
    // Ensure path starts with /
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    
    const response = await fetch(`${BUNNY_STORAGE_URL}${normalizedPath}`, {
      method: 'PUT',
      headers: {
        'AccessKey': BUNNY_STORAGE_API_KEY,
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: file,
    });

    if (response.ok) {
      const publicUrl = `${BUNNY_CDN_URL}${normalizedPath}`;
      return {
        success: true,
        url: publicUrl,
      };
    } else {
      const errorText = await response.text();
      console.error('Bunny storage upload failed:', errorText);
      return {
        success: false,
        error: `Upload failed: ${response.status} ${response.statusText}`,
      };
    }
  } catch (error) {
    console.error('Error uploading to Bunny storage:', error);
    return {
      success: false,
      error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
};

// Delete file from Bunny CDN storage
export const deleteFromBunnyStorage = async (path: string): Promise<boolean> => {
  try {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    
    const response = await fetch(`${BUNNY_STORAGE_URL}${normalizedPath}`, {
      method: 'DELETE',
      headers: {
        'AccessKey': BUNNY_STORAGE_API_KEY,
      },
    });

    return response.ok;
  } catch (error) {
    console.error('Error deleting from Bunny storage:', error);
    return false;
  }
};

// Generate unique filename
export const generateUniqueFilename = (originalName: string, userId: string, type: 'profile' | 'cover' | 'post'): string => {
  const timestamp = Date.now();
  const extension = originalName.split('.').pop() || 'jpg';
  const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
  
  return `${type}/${userId}/${timestamp}_${sanitizedName}`;
};

// Upload profile picture
export const uploadProfilePicture = async (file: File, userId: string): Promise<UploadResponse> => {
  const filename = generateUniqueFilename(file.name, userId, 'profile');
  return uploadToBunnyStorage(file, filename);
};

// Upload cover photo
export const uploadCoverPhoto = async (file: File, userId: string): Promise<UploadResponse> => {
  const filename = generateUniqueFilename(file.name, userId, 'cover');
  return uploadToBunnyStorage(file, filename);
};

// Upload post media
export const uploadPostMedia = async (file: File, userId: string): Promise<UploadResponse> => {
  const filename = generateUniqueFilename(file.name, userId, 'post');
  return uploadToBunnyStorage(file, filename);
};

// Extract path from CDN URL for deletion
export const extractPathFromUrl = (url: string): string | null => {
  try {
    if (url.includes(BUNNY_CDN_URL)) {
      return url.replace(BUNNY_CDN_URL, '');
    }
    return null;
  } catch (error) {
    console.error('Error extracting path from URL:', error);
    return null;
  }
};
