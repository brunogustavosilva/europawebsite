import { useEffect, useLayoutEffect, useRef, useState } from 'react';

function PresenceItem({ present, as: Element, className, children, onExited, animationKey }) {
  const elementRef = useRef(null);
  useLayoutEffect(() => {
    if (
      animationKey === undefined ||
      !present ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return;
    const animation = elementRef.current.animate(
      [
        { opacity: 0, transform: 'translateY(16px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ],
      { duration: 480, easing: 'ease-in-out' },
    );
    return () => animation.cancel();
  }, [animationKey, present]);
  useEffect(() => {
    if (present) return;

    // Aguarda a saída antes de remover o item do DOM.
    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 240;
    const timeout = window.setTimeout(onExited, duration);
    return () => window.clearTimeout(timeout);
  }, [present, onExited]);

  return (
    <Element
      ref={elementRef}
      className={`presence-item ${className}`}
      data-present={present}
      data-filter-motion={animationKey !== undefined ? true : undefined}
      inert={!present ? true : undefined}
      aria-hidden={!present ? true : undefined}
    >
      {children}
    </Element>
  );
}

export function PresenceList({
  items,
  getKey,
  children,
  as = 'div',
  className = '',
  animationKey,
}) {
  const [previousItems, setPreviousItems] = useState(items);
  const [renderedItems, setRenderedItems] = useState(items);

  if (previousItems !== items) {
    const keys = new Set(items.map(getKey));
    const exiting = renderedItems.filter((item) => !keys.has(getKey(item)));

    setPreviousItems(items);
    setRenderedItems([...items, ...exiting]);
  }

  const activeKeys = new Set(items.map(getKey));

  return renderedItems.map((item) => {
    const key = getKey(item);

    return (
      <PresenceItem
        key={key}
        as={as}
        className={className}
        present={activeKeys.has(key)}
        animationKey={animationKey}
        onExited={() =>
          setRenderedItems((current) => current.filter((entry) => getKey(entry) !== key))
        }
      >
        {children(item)}
      </PresenceItem>
    );
  });
}
