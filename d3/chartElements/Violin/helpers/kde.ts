import { mean } from 'd3';

const kernelDensityEstimator = (kernel: (v: number) => number, X: number[]) => (
  (V: number[]): [number, number][] => (
    X.map((x) => [
      x,
      mean(V, (v) => kernel(x - v)) as number,
    ])
  )
);

const kernelEpanechnikov = (k: number) => (
  function (v: number) {
    const u = v / k;
    return Math.abs(u) <= 1 ? (0.75 * (1 - u * u)) / k : 0;
  }
);

const KDE = (k: number, X: number[]) => {
  const kr = kernelEpanechnikov(k);
  return kernelDensityEstimator(kr, X);
};

export default KDE;
