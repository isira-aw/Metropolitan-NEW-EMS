'use client';

import { useEffect, useState } from 'react';
import { User as UserIcon } from 'lucide-react';
import { profilePictureService } from '@/lib/services/admin.service';

interface AvatarProps {
  // Numeric user id to fetch the photo for. Omit (and pass `self`) to fetch
  // the logged-in user's own photo via GET /users/me/photo instead - used by
  // the sidebar, which only has the JWT identity client-side, not an id.
  userId?: number;
  self?: boolean;
  hasProfilePicture?: boolean;
  fullName?: string;
  size?: number;
  className?: string;
}

// Simple in-memory cache keyed by "id" or "me" so switching between rows/pages
// in the same session doesn't refetch a photo that was already loaded once.
const photoCache = new Map<string, string | null>();

// Call after an admin uploads/replaces/deletes a user's photo so the next
// Avatar mount for that user re-fetches instead of serving a stale cached
// image. Pass the numeric user id, or 'me' for the logged-in user's own photo.
export function invalidateAvatarCache(key: number | 'me') {
  photoCache.delete(String(key));
}

function getInitials(fullName?: string): string {
  if (!fullName) return '';
  const parts = fullName.trim().split(/\s+/);
  const initials = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('');
  return initials;
}

/**
 * Square (2x2 aspect ratio) avatar. Lazily fetches the photo only when
 * `hasProfilePicture` is true (or when `self` is set, since the sidebar has
 * no cheap flag for its own user) - never fetches for users known to have no
 * picture. Falls back to initials (or a generic user icon) while loading or
 * when there's no picture set. Caches the fetched image in module-level
 * state so re-renders / re-mounts within the session don't refetch.
 */
export default function Avatar({
  userId,
  self = false,
  hasProfilePicture = false,
  fullName,
  size = 40,
  className = '',
}: AvatarProps) {
  const cacheKey = self ? 'me' : userId != null ? String(userId) : null;
  const [image, setImage] = useState<string | null>(cacheKey ? photoCache.get(cacheKey) ?? null : null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!cacheKey) return;
    if (photoCache.has(cacheKey)) {
      setImage(photoCache.get(cacheKey) ?? null);
      return;
    }
    if (!self && !hasProfilePicture) {
      // Known to have no picture - don't bother hitting the network.
      return;
    }

    let cancelled = false;
    setLoading(true);

    const fetchPhoto = self
      ? profilePictureService.getMyPhoto()
      : profilePictureService.getPhoto(userId as number);

    fetchPhoto
      .then((res) => {
        if (cancelled) return;
        photoCache.set(cacheKey, res.imageBase64 ?? null);
        setImage(res.imageBase64 ?? null);
      })
      .catch(() => {
        if (cancelled) return;
        // Don't cache failures - a transient network error shouldn't
        // permanently pin this avatar to the fallback for the session.
        setImage(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, self, hasProfilePicture, userId]);

  const initials = getInitials(fullName);

  return (
    <div
      className={`rounded-lg bg-brand/15 border border-brand/20 flex items-center justify-center overflow-hidden flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {image ? (
        <img
          src={image}
          alt={fullName ? `${fullName}'s profile picture` : 'Profile picture'}
          className="w-full h-full object-cover"
        />
      ) : initials ? (
        <span
          className="font-black text-brand"
          style={{ fontSize: Math.max(10, size * 0.35) }}
        >
          {initials}
        </span>
      ) : (
        <UserIcon size={Math.max(14, size * 0.55)} className={loading ? 'text-brand/40 animate-pulse' : 'text-brand/60'} />
      )}
    </div>
  );
}
