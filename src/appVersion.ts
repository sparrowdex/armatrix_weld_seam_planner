import pkg from '../package.json';

/** App release version, read from package.json so the export and the changelog never drift apart. */
export const APP_VERSION: string = pkg.version;

/** Shown in the export's `generator` field. */
export const APP_NAME = 'Armatrix Weld Seam Planner';
