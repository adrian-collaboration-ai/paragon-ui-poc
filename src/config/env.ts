/**
 * Environment configuration for the Google Drive Paragon integration
 * All environment variables are prefixed with VITE_ to be accessible in the browser
 */

export const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
export const PARAGON_PROJECT_KEY = import.meta.env.VITE_PARAGON_PROJECT_KEY;

// Normalize PARAGON_HOST to ensure it doesn't include protocol
const rawParagonHost = import.meta.env.VITE_PARAGON_HOST;
export const PARAGON_HOST = rawParagonHost?.replace(/^https?:\/\//, '') || '';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Validation function to ensure all required environment variables are set
export const validateEnvironment = (): string[] => {
  const missing: string[] = [];
  
  if (!GOOGLE_API_KEY) missing.push('VITE_GOOGLE_API_KEY');
  if (!GOOGLE_CLIENT_ID) missing.push('VITE_GOOGLE_CLIENT_ID');
  if (!PARAGON_PROJECT_KEY) missing.push('VITE_PARAGON_PROJECT_KEY');
  if (!PARAGON_HOST) missing.push('VITE_PARAGON_HOST');
  
  return missing;
};

// Google Drive API scopes required for the integration
export const GOOGLE_DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.file',
].join(' ');
