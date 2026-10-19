import { useCallback, useState, type SyntheticEvent } from 'react';

/**
 * Product cards used to hard-code a 3:4 frame and crop with `object-cover`, so
 * any upload with a different shape lost its edges. These hooks read the
 * intrinsic size from the loaded image so the frame can match the uploaded
 * photo instead.
 *
 * The fallback keeps first paint (and the no-image gradient) at the previous
 * card shape rather than collapsing to zero height while the file decodes.
 */
export const DEFAULT_IMAGE_ASPECT_RATIO = 3 / 4;

/**
 * Guard rails for pathological uploads: a panorama or a tall strip would
 * otherwise turn one grid cell into a 40px sliver and break the row.
 */
const MIN_IMAGE_ASPECT_RATIO = 0.5;
const MAX_IMAGE_ASPECT_RATIO = 1.8;

const normalizeRatio = (width: number, height: number) =>
  Math.min(MAX_IMAGE_ASPECT_RATIO, Math.max(MIN_IMAGE_ASPECT_RATIO, width / height));

/**
 * Single-image version (ProductCard, hero-style cards).
 */
export const useImageAspectRatio = (fallback = DEFAULT_IMAGE_ASPECT_RATIO) => {
  const [ratio, setRatio] = useState<number | null>(null);

  const onImageLoad = useCallback((event: SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    if (!img.naturalWidth || !img.naturalHeight) return;
    setRatio(normalizeRatio(img.naturalWidth, img.naturalHeight));
  }, []);

  return { aspectRatio: ratio ?? fallback, onImageLoad };
};

/**
 * Multi-image version for grids/carousels that render a list of products from
 * one component: ratios are keyed by image URL so each card keeps its own shape.
 */
export const useImageAspectRatios = (fallback = DEFAULT_IMAGE_ASPECT_RATIO) => {
  const [ratios, setRatios] = useState<Record<string, number>>({});

  const trackImageRatio = useCallback(
    (key: string | undefined | null, event: SyntheticEvent<HTMLImageElement>) => {
      const img = event.currentTarget;
      if (!key || !img.naturalWidth || !img.naturalHeight) return;

      const next = normalizeRatio(img.naturalWidth, img.naturalHeight);
      setRatios((prev) => (prev[key] === next ? prev : { ...prev, [key]: next }));
    },
    [],
  );

  const aspectRatioFor = useCallback(
    (key?: string | null) => (key && ratios[key]) || fallback,
    [ratios, fallback],
  );

  return { aspectRatioFor, trackImageRatio };
};
