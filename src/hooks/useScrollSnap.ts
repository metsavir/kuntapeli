import { useRef, useCallback } from 'react';

export function useScrollSnap<T extends string>(
  items: readonly T[],
  onItemChange: (item: T) => void,
) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const isProgScroll = useRef(false);
  const scrollCleanup = useRef<(() => void) | null>(null);

  const scrollTo = useCallback(
    (item: T) => {
      const el = scrollerRef.current;
      if (!el) return;
      isProgScroll.current = true;
      const idx = items.indexOf(item);
      el.scrollTo({ left: idx * el.offsetWidth, behavior: 'smooth' });
    },
    [items],
  );

  const initRef = useCallback(
    (el: HTMLDivElement | null) => {
      scrollCleanup.current?.();
      scrollCleanup.current = null;
      scrollerRef.current = el;
      if (!el) return;

      // Start at first item
      el.scrollLeft = 0;

      let scrollTimer: ReturnType<typeof setTimeout>;
      const onScroll = () => {
        if (isProgScroll.current) {
          clearTimeout(scrollTimer);
          scrollTimer = setTimeout(() => {
            isProgScroll.current = false;
          }, 100);
          return;
        }
        const idx = Math.round(el.scrollLeft / el.offsetWidth);
        const item = items[idx];
        if (item) onItemChange(item);
      };

      el.addEventListener('scroll', onScroll, { passive: true });
      scrollCleanup.current = () => el.removeEventListener('scroll', onScroll);
    },
    [items, onItemChange],
  );

  return { initRef, scrollTo };
}
