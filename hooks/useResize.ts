import React from 'react';
import ResizeObserver from 'resize-observer-polyfill';

/**
 * Use ResizeObserver to listen for the changes to the dimensions of an element
 * @params ref - React ref
 * @returns {object} - { width, height, top, left }
 */
const useResize = (ref: React.MutableRefObject<HTMLElement | null>) => {
  const [dimensions, setDimensions] = React.useState<DOMRectReadOnly | null>(null);
  React.useEffect(() => {
    const element = ref.current;
    if (element) {
      const resizeObserver = new ResizeObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.target === ref.current) {
            setDimensions(entry.contentRect);
          }
        });
      });
      resizeObserver.observe(element);
      return () => {
        resizeObserver.unobserve(element);
      };
    }
  }, [ref]);
  return dimensions;
};

export default useResize;
