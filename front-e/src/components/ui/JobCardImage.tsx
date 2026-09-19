'use client';

import { useEffect, useState } from 'react';
import { ImageOff, Loader2 } from 'lucide-react';

/**
 * Lazily loads a mini job card's photo.
 *
 * Job card payloads no longer embed the base64 blob - it was repeated once per row
 * in every list response, which made the approvals screen download tens of megabytes
 * at a time. Rows now carry only `hasImage`, and this component fetches the bytes for
 * the cards that are actually rendered.
 *
 * Fetched images are cached in module state for the session, so re-opening the same
 * card (or re-rendering a list) doesn't refetch. The cache is keyed by scope + id
 * because the admin and employee endpoints are separate.
 */
const imageCache = new Map<string, string | null>();

/** Call after a job card's photo is replaced so the next render refetches it. */
export function invalidateJobCardImageCache(miniJobCardId: number) {
  imageCache.delete(`admin:${miniJobCardId}`);
  imageCache.delete(`employee:${miniJobCardId}`);
}

type Fetcher = (id: number) => Promise<{ imageBase64: string | null }>;

interface JobCardImageProps {
  miniJobCardId: number;
  /** From MiniJobCard.hasImage - when false, no request is made at all. */
  hasImage: boolean;
  /** Which endpoint to use; also scopes the cache key. */
  scope: 'admin' | 'employee';
  fetcher: Fetcher;
  className?: string;
  alt?: string;
  /** Rendered instead of the image when the card has no photo. */
  fallback?: React.ReactNode;
  onClick?: () => void;
}

export default function JobCardImage({
  miniJobCardId,
  hasImage,
  scope,
  fetcher,
  className = '',
  alt = 'Job card photo',
  fallback = null,
  onClick,
}: JobCardImageProps) {
  const cacheKey = `${scope}:${miniJobCardId}`;
  const [image, setImage] = useState<string | null>(imageCache.get(cacheKey) ?? null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!hasImage) return;
    if (imageCache.has(cacheKey)) {
      setImage(imageCache.get(cacheKey) ?? null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetcher(miniJobCardId)
      .then((res) => {
        if (cancelled) return;
        imageCache.set(cacheKey, res.imageBase64);
        setImage(res.imageBase64);
      })
      .catch(() => {
        // Don't cache failures - a transient error shouldn't pin this card to the
        // fallback for the rest of the session.
        if (!cancelled) setImage(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, hasImage, miniJobCardId]);

  if (!hasImage) return <>{fallback}</>;

  if (loading || !image) {
    return (
      <div className={`flex items-center justify-center bg-brand/5 ${className}`}>
        {loading ? (
          <Loader2 size={18} className="animate-spin text-brand/50" />
        ) : (
          <ImageOff size={18} className="text-brand/30" />
        )}
      </div>
    );
  }

  return <img src={image} alt={alt} className={className} onClick={onClick} />;
}
