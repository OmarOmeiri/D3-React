import {
  useEffect,
  useRef,
} from 'react';

/**
 * Helps tracking the props changes made in a react functional component.
 *
 * Prints the name of the properties/states variables causing a render (or re-render).
 * For debugging purposes only.
 *
 * @usage You can simply track the props of the components like this:
 *  useRenderingTrace('MyComponent', props);
 *
 * @usage You can also track additional state like this:
 *  const [someState] = useState(null);
 *  useRenderingTrace('MyComponent', { ...props, someState });
 *
 * @param componentName Name of the component to display
 * @param propsAndStates
 * @param level
 *
 * @see https://stackoverflow.com/a/51082563/2391795
 */
const useRenderTrace = (
  componentName: string,
  propsAndStates: any,
  level: 'debug' | 'info' | 'log' = 'debug',
) => {
  const prev = useRef(process.env.NODE_ENV !== 'production' ? propsAndStates : null);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      const changedProps: { [key: string]: { old: any, new: any } } = Object.entries(propsAndStates).reduce((property: any, [key, value]: [string, any]) => {
        if (prev.current[key] !== value) {
          property[key] = {
            old: prev.current[key],
            new: value,
          };
        }
        return property;
      }, {});

      if (Object.keys(changedProps).length > 0) {
        // eslint-disable-next-line no-console
        console[level](`[${componentName}] Changed props:`, changedProps);
      }

      prev.current = propsAndStates;
    }
  });
};

export default useRenderTrace;
