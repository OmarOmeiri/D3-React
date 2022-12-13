import React, { useEffect } from 'react';
import { D3Margins } from '../../../d3/Dimensions/types';
import useRenderTrace from '../../../hooks/useRenderTrace';
import {
  D3ContextProvider,
  useD3Context,
} from '../context/D3Context';

const styles: React.CSSProperties = {
  height: '100%',
  display: 'flex',
  justifyContent: 'center',
  position: 'relative',
};

interface Props {
  children: React.ReactNode,
  margin?: Partial<D3Margins>
}

export function withD3Context(Component: React.ElementType) {
  return function D3Component(props: Props) {
    return (
      <D3ContextProvider>
        <Component {...props}/>
      </D3ContextProvider>
    );
  };
}

const ReactD3Chart = withD3Context(({
  children,
  margin,
}: Props) => {
  const {
    setRef,
    setMargin,
  } = useD3Context();

  useEffect(() => {
    if (margin) {
      setMargin(margin);
    }
  }, [margin, setMargin]);

  // useRenderTrace('chart', {
  //   children,
  //   margin,
  //   setRef,
  //   setMargin,
  // });

  return (
    <div style={styles}>
      <div ref={setRef} style={{ height: '100%', flexGrow: '1' }}/>
      {children}
    </div>
  );
});

export default ReactD3Chart;
