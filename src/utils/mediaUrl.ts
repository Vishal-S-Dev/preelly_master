import { ENV } from '../constants/env';

/** Resolve relative upload paths to absolute URLs (same idea as olx `getMediaUrl`). */
export function resolveMediaUrl(path?: string | null): string {
  if (!path) {
    return '';
  }
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('file://') ||
    path.startsWith('content://')
  ) {
    return path;
  }
  const base = ENV.API_BASE_URL.replace(/\/api\/?$/i, '');
  const mediaPath = path.startsWith('/') ? path : `/uploads/${path}`;
  return `${base}${mediaPath}`;
}

export function getDisplayAvatarUri(
  avatar?: string | null,
  name?: string | null,
): string | null {
  if (avatar?.trim()) {
    return resolveMediaUrl(avatar);
  }
  if (name?.trim()) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name.trim())}&size=256&background=EEF2FF&color=1E40AF`;
  }
  return null;
}
