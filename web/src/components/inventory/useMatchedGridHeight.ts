import { MutableRefObject, useEffect, useLayoutEffect, useRef } from 'react';

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const parseLengthPx = (value: string): number => {
  const v = value.trim();
  if (!v) return 0;
  if (v.endsWith('vh')) return (parseFloat(v) / 100) * window.innerHeight;
  if (v.endsWith('vw')) return (parseFloat(v) / 100) * window.innerWidth;
  if (v.endsWith('rem')) {
    const rootFs = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    return parseFloat(v) * rootFs;
  }
  if (v.endsWith('em')) return parseFloat(v) * 16;
  return parseFloat(v) || 0; // px or unitless
};

/**
 * Sizes the right-side grid container so the right panel's bottom matches the left panel's
 * bottom. Subtracts the height of every sibling on the right side (section header, plus any
 * extras like a shopping cart) so the grid takes only what's left. Snaps to whole rows so no
 * partial slot is ever cut off. Floors at 5 rows so the grid is never shorter than the left.
 */
export function useMatchedGridHeight(deps: React.DependencyList = []): MutableRefObject<HTMLDivElement | null> {
  const ref = useRef<HTMLDivElement | null>(null);

  useIsoLayoutEffect(() => {
    const grid = ref.current;
    if (!grid) return;

    const left = document.querySelector('.inventory-side--left') as HTMLElement | null;
    const rightSide = grid.closest('.inventory-side') as HTMLElement | null;
    const gridWrapper = grid.closest('.inventory-grid-wrapper') as HTMLElement | null;
    if (!left || !rightSide) return;

    const update = () => {
      const sideStyle = getComputedStyle(rightSide);
      const sideGap = parseLengthPx(sideStyle.gap || '0');

      const children = Array.from(rightSide.children) as HTMLElement[];
      let siblingsHeight = 0;
      let renderedCount = 0;
      children.forEach((child) => {
        const h = child.getBoundingClientRect().height;
        if (h <= 0) return;
        renderedCount += 1;
        if (child !== gridWrapper) siblingsHeight += h;
      });
      const gapsTotal = Math.max(0, renderedCount - 1) * sideGap;

      const leftHeight = left.getBoundingClientRect().height;
      const available = leftHeight - siblingsHeight - gapsTotal;

      const rootStyle = getComputedStyle(document.documentElement);
      const sizePx = parseLengthPx(rootStyle.getPropertyValue('--grid-size') || '8.4vh');
      const gapPx = parseLengthPx(rootStyle.getPropertyValue('--grid-gap') || '0.4rem');
      const rowStep = sizePx + gapPx;

      const rows = Math.max(5, Math.floor((available + gapPx) / rowStep));
      const newHeight = rows * sizePx + (rows - 1) * gapPx;
      grid.style.height = `${newHeight}px`;
    };

    update();

    const ro = new ResizeObserver(update);
    ro.observe(left);
    (Array.from(rightSide.children) as HTMLElement[]).forEach((child) => {
      if (child !== gridWrapper) ro.observe(child);
    });
    window.addEventListener('resize', update);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}

/**
 * Sizes the shopping cart so its total height matches the left-side hotbar's total height.
 * Combined with a fixed 5-row right grid, this makes the right side perfectly mirror the
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
