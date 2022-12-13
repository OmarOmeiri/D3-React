import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import D3Chart from '../../../d3/Chart';
import { D3Margins } from '../../../d3/Dimensions/types';
import { D3Scales } from '../../../d3/Scales/types';
import { useDebouncedState } from '../../../hooks/useDebouncedState';
import useResize from '../../../hooks/useResize';

import type D3Axis from '../../../d3/Axes/Axis';

export type D3ContextGetScales = {
  (params: {id: string | undefined, type?: 'x' | 'y', mightNotExist: true}): D3Scales<any> | undefined;
  (params: {id: string | undefined, type?: 'x' | 'y', mightNotExist?: false}): D3Scales<any>;
  (params: {id: string | undefined, type?: 'x' | 'y', mightNotExist?: boolean}): D3Scales<any> | undefined;
};

type D3Context = {
  ref: React.MutableRefObject<HTMLDivElement | null>
  refInit: boolean
  chart: D3Chart | null;
  scales: D3Scales<any>[],
  dims: DOMRectReadOnly | null,
  margin: Partial<D3Margins>
  setMargin: SetState<Partial<D3Margins>>
  getScale: D3ContextGetScales
  addScale: (scale: D3Scales<any>) => void;
  setRef: (node: HTMLDivElement | null) => void
}

const D3Ctx = React.createContext<D3Context | undefined>(undefined);

export const D3ContextProvider = ({ children }: {
  children: React.ReactNode
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const dims = useResize(ref);
  const debouncedDims = useDebouncedState(dims, 100);
  const [margin, setMargin] = useState<Partial<D3Margins>>({});
  const [refInit, setRefInit] = useState(false);
  const [chart, setChart] = useState<D3Chart | null>(null);
  const [scales, setScales] = useState<D3Scales<any>[]>([]);

  const setRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      ref.current = node;
      setRefInit(true);
    }
  }, []);

  useEffect(() => {
    const chartAreaRef = ref.current;
    if (refInit && chartAreaRef && dims) {
      setChart((oldChart) => {
        if (oldChart) return oldChart;
        return new D3Chart({
          ref: chartAreaRef,
          dims: { dims },
        });
      });
    }
  }, [refInit, ref, dims]);

  useEffect(() => {
    if (chart && dims) {
      chart.updateDims({
        dims,
        margin,
      });
    }
  }, [dims, chart, margin]);

  const addScale = useCallback((scale: D3Scales<any>) => {
    setScales((s) => {
      const copy = [...s];
      const ix = copy.findIndex((s) => s.id === scale.id);
      if (ix > -1) copy.splice(ix, 1, scale);
      else copy.push(scale);
      return copy;
    });
  }, []);

  const getFirstScale = useCallback((type: 'x' | 'y', mightNotExist?: boolean) => {
    const axis = scales.find((s) => {
      if (!('axis' in s)) return false;
      return (
        type === 'x'
          ? s.axis.type === 'bottom' || s.axis.type === 'top'
          : s.axis.type === 'left' || s.axis.type === 'right'
      );
    });
    let scale: D3Scales<any> | undefined;
    let id: string | undefined;
    if (axis) {
      id = axis.id;
      scale = scales.find((s) => s.id === id);
    }

    if (scale) return scale;
    if (mightNotExist) return undefined;
    if (!axis) throw new Error(`No ${type}-axis was found.`);
    throw new Error(`No scale found with params: "{id: ${id}, type: ${type}}.`);
  }, [scales]);

  const getScale: D3ContextGetScales = useCallback((params) => {
    if (!params.id && params.type) return getFirstScale(params.type);
    const scale = scales.find((s) => s.id === params.id);
    if (
      scale
    ) {
      return scale;
    }
    if (params.mightNotExist) return undefined;
    throw new Error(`No scale found with params: "{id: ${params.id}, type: ${params.type}}.`);
  }, [scales, getFirstScale]) as D3ContextGetScales;

  const ctxValue: D3Context = useMemo(() => ({
    ref,
    refInit,
    chart,
    scales,
    dims: debouncedDims,
    margin,
    setMargin,
    getScale,
    addScale,
    setRef,
  }), [
    ref,
    refInit,
    chart,
    scales,
    debouncedDims,
    margin,
    setMargin,
    getScale,
    addScale,
    setRef,
  ]);

  return (
    <D3Ctx.Provider value={ctxValue}>
      {children}
    </D3Ctx.Provider>
  );
};

export const useD3Context = () => {
  const ctx = useContext(D3Ctx);
  if (!ctx) {
    throw new Error('No provider found for D3Context. Make sure you warp your chart with the "ReactD3Chart" component.');
  }
  return ctx;
};
