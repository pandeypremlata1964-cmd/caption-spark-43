import { z } from "zod";

// Input sanitization schemas
export const captionInputSchema = z.object({
  niche: z.string()
    .trim()
    .min(1, "Niche is required")
    .max(100, "Niche must be less than 100 characters")
    .regex(/^[a-zA-Z0-9\s\-_,.!&]+$/, "Niche contains invalid characters"),
  
  website: z.string()
    .trim()
    .max(255, "Website must be less than 255 characters")
    .regex(/^[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=]*$/, "Website contains invalid characters")
    .optional()
    .or(z.literal("")),
  
  topic: z.string()
    .trim()
    .max(1000, "Topic must be less than 1000 characters")
    .optional()
    .or(z.literal("")),
  
  mood: z.enum([
    "playful",
    "professional",
    "inspirational",
    "casual",
    "energetic",
    "motivational",
    "educational",
    "celebratory"
  ]),
  
  language: z.string()
    .trim()
    .length(2, "Invalid language code"),
});

export type CaptionInput = z.infer<typeof captionInputSchema>;

// Sanitize HTML to prevent XSS
export const sanitizeHTML = (input: string): string => {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
};

// Sanitize for URL encoding
export const sanitizeForURL = (input: string): string => {
  return encodeURIComponent(input.trim());
};

// Validate file upload
export const validateFile = (file: File): { valid: boolean; error?: string } => {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime'];
  const maxSize = 20 * 1024 * 1024; // 20MB

  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: "Invalid file type. Please upload an image (JPG, PNG, GIF, WEBP) or video (MP4, MOV)"
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: "File too large. Please upload a file smaller than 20MB"
    };
  }

  return { valid: true };
};

// Debounce function for input validation
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};
