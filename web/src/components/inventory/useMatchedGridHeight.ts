import { MutableRefObject, useEffect, useLayoutEffect, useRef } from 'react';

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * Sizes the shopping cart so its total height matches the left-side hotbar's total height.
 * Combined with the fixed 5-row right grid, this makes the right side perfectly mirror the
 * left: right grid ↔ left grid, cart ↔ hotbar.
 */
export function useMatchedCartHeight(deps: React.DependencyList = []): MutableRefObject<HTMLDivElement | null> {
  const ref = useRef<HTMLDivElement | null>(null);

  useIsoLayoutEffect(() => {
    const cart = ref.current;
    if (!cart) return;

    const update = () => {
      const hotbar = document.querySelector('.hotbar-section') as HTMLElement | null;
      if (!hotbar) return;
      const h = hotbar.getBoundingClientRect().height;
      if (h <= 0) return;
      cart.style.height = `${h}px`;
    };

    update();

    const ro = new ResizeObserver(update);
    const hotbar = document.querySelector('.hotbar-section');
    if (hotbar) ro.observe(hotbar);
    window.addEventListener('resize', update);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}
