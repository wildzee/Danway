/**
 * Project Management Utility
 * Handle project-related operations
 * NOTE: Currently supports single site (D657) only
 */

export interface ProjectInfo {
    code: string;      // e.g., "D657"
    name: string;      // e.g., "Site Daralhai"
    fullName: string;  // e.g., "DANWAY D657"
}

// Single site configuration
const CURRENT_SITE: ProjectInfo = {
    code: 'D657',
    name: 'Site Daralhai',
    fullName: 'DANWAY D657',
};

/**
 * Extract project code from project string
 * Examples:
 * "DANWAY D657" → "D657"
 * "D657 - Site Daralhai" → "D657"
 * "D657" → "D657"
 */
export function extractProjectCode(projectString: string): string {
    if (!projectString) return CURRENT_SITE.code;

    // Match D followed by digits (D657, D656, etc.)
    const match = projectString.match(/D\d{3,4}/i);
    return match ? match[0].toUpperCase() : CURRENT_SITE.code;
}

/**
 * Get current project info
 */
export function getCurrentProject(): ProjectInfo {
    return CURRENT_SITE;
}

/**
 * Get project info (always returns current site for now)
 */
export function getProjectInfo(code?: string): ProjectInfo {
    return CURRENT_SITE;
}
