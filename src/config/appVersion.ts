/**
 * App version & update notes.
 *
 * 👉 To trigger the "Update Available" popup on the login page for ALL users:
 *    1. Bump APP_VERSION (e.g. "1.0.1" → "1.0.2").
 *    2. Update SHOW_UPDATE_POPUP to true.
 *    3. (Optional) Edit UPDATE_NOTES_KEY for what's new.
 *
 * The popup will show on every login until the user clicks "Done".
 * Each user sees it once per version.
 */

export const APP_VERSION = "1.0.1";

// Set to false if you DO NOT want the popup to appear (e.g. silent release)
export const SHOW_UPDATE_POPUP = true;

// i18n key for the update notes shown inside the popup
export const UPDATE_NOTES_KEY = "update.default_notes";

// localStorage key to remember which version a user has acknowledged
export const ACK_STORAGE_KEY = "edulinker-update-ack";
