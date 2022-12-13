import D3Dimensions, { ID3Dimensions } from '../Dimensions/Dimensions';

export interface ID3Pattern<D extends Record<string, unknown>> {
  dims: D3Dimensions;
  init(dims: ID3Dimensions): void;
  updateData(data: D[]): void;
  updateAxes(): void;
  updateDims(dims: DOMRectReadOnly): void;
}
