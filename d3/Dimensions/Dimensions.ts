import { D3Margins } from './types';

const DEFAULT_MARGINS: D3Margins = {
  top: 30,
  left: 40,
  bottom: 40,
  right: 40,
};

const INIT_RECT: DOMRectReadOnly = {
  bottom: 0,
  height: 0,
  left: 0,
  right: 0,
  top: 0,
  width: 0,
  x: 0,
  y: 0,
  toJSON: () => (this),
};

// const check

export interface ID3Dimensions {
  dims: DOMRectReadOnly
  margin?: Partial<D3Margins>
}

class D3Dimensions {
  public margin: D3Margins;
  public height: number;
  public width: number;
  public top: number;
  public left: number;
  public innerDims: {width: number, height: number, top: number, left: number} = {
    width: INIT_RECT.width,
    height: INIT_RECT.height,
    top: INIT_RECT.top,
    left: INIT_RECT.left,
  };

  constructor({
    dims,
    margin,
  }: ID3Dimensions) {
    const {
      width,
      height,
      top,
      left,
    } = dims;

    this.margin = margin
      ? {
        ...DEFAULT_MARGINS,
        ...margin,
      }
      : DEFAULT_MARGINS;
    this.width = width;
    this.height = height;
    this.top = top;
    this.left = left;

    this.innerDims = {
      height: this.height - (this.margin.top + this.margin.bottom),
      width: this.width - (this.margin.left + this.margin.right),
      top: this.top + this.margin.top,
      left: this.left + this.margin.left,
    };
  }

  setDims(dims: ID3Dimensions) {
    const {
      width,
      height,
    } = dims.dims;
    this.margin = {
      ...DEFAULT_MARGINS,
      ...dims.margin,
    };
    this.width = width;
    this.height = height;
    this.setInnerDims();
  }

  setInnerDims() {
    this.innerDims = {
      height: this.height - (this.margin.top + this.margin.bottom),
      width: this.width - (this.margin.left + this.margin.right),
      top: this.top + this.margin.top,
      left: this.left + this.margin.left,
    };
  }
} export default D3Dimensions;
