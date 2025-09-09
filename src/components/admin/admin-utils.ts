import type { FileImport } from '../../services/APIService'

// Production-safe logger utility
export const logger = {
  info: (message: string, ...args: unknown[]) => {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log(`[AdminPage] ${message}`, ...args);
    }
  },
  warn: (message: string, ...args: unknown[]) => {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn(`[AdminPage] ${message}`, ...args);
    }
  },
  error: (message: string, ...args: unknown[]) => {
    // eslint-disable-next-line no-console
    console.error(`[AdminPage] ${message}`, ...args);
  }
};

// Constants for duplicate strings
export const MUTED_BACKGROUND_STYLE = { backgroundColor: 'hsl(var(--muted) / 0.5)' };
export const GRADE_A_VARIANT = 'grade-a';
export const GRADE_B_VARIANT = 'grade-b';
export const GRADE_C_VARIANT = 'grade-c';
export const GRADE_F_VARIANT = 'grade-f';
export const DESTRUCTIVE_VARIANT = 'destructive';
export const SECONDARY_VARIANT = 'secondary';

// Helper function to calculate statistics
export function calculateStats(fileImportData: FileImport[]) {
  const completedImports = fileImportData.filter(imp => imp.status === 'completed').length;
  const totalRecords = fileImportData.reduce((sum, imp) => sum + imp.records_count, 0);
  const totalErrors = fileImportData.reduce((sum, imp) => sum + imp.errors_count, 0);

  return {
    notifications: { unread: totalErrors > 0 ? 1 : 0 },
    chat: { totalUnread: 0 },
    totalRecords: totalRecords,
    processedFiles: completedImports,
    activeUsers: 1, // Current user
    systemHealth: 'good' as const
  };
}

// Helper function to get current user profile
export function getCurrentProfile() {
  const storedProfile = localStorage.getItem('currentProfile');
  return storedProfile ? JSON.parse(storedProfile) : {
    id: 1,
    name: 'Administrator',
    role: 'admin',
    avatar: null,
    preferences: {
      professionalStatus: 'Administrator'
    }
  };
}