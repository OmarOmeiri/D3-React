import {
  Axis,
  AxisDomain,
  AxisScale,
  ScaleLogarithmic,
  Selection,
} from 'd3';
import { D3Classes } from '../consts/classes';
import {
  d3AppendIfNotExists,
  d3ReplaceIfExists,
} from '../helpers/d3Exists';
import { D3IsScaleBand } from '../helpers/isScaleBand';
import {
  D3GetAxis,
  D3GetAxisTickSize,
  D3GetAxisTransforms,
} from './helpers/axisHelpers';
import { D3AxisTypes } from './types';

import type { D3Dimensions } from '../Dimensions';
import type D3Chart from '../Chart';

export interface ID3Axis {
  id: string,
  chart: D3Chart,
  scale: AxisScale<any>
  type: D3AxisTypes,
  label?: string,
  tickValues?: Iterable<any>,
  ticks?: number,
  tickFormat?: (value: any, index: number) => string
}

const getLabelPosition = (type: D3AxisTypes, dims: D3Dimensions) => {
  switch (type) {
    case 'bottom':
      return `translate(${dims.innerDims.width / 2},${dims.innerDims.height + 40})`;
    case 'top':
      return `translate(${dims.innerDims.width / 2},${-40})`;
    case 'left':
      return `translate(${-40},${dims.innerDims.height / 2}) rotate(-90)`;
    case 'right':
      return `translate(${dims.innerDims.width + 40},${dims.innerDims.height / 2}) rotate(-90)`;
    default:
      throw new Error(`Unknown axis type ${type}`);
  }
};

const omitOverflowingBandScaleTickLines = (scale: ID3Axis['scale'], chart: D3Chart, type: D3AxisTypes) => {
  if (D3IsScaleBand(scale) && type === 'bottom') {
    chart.chart
      .select(`.${D3Classes.axis.group[type]}`)
      .selectAll('g .d3-tick')
      .attr('class', function () {
        const g = (this as SVGGElement | null);
        if (g) {
          const classes = Array.from(g.classList);
          const transform = g.getAttribute('transform');
          if (!transform) return classes.join(' ');
          const [translate] = transform.match(/translate\(([^)]+)\)/gi) || [null];
          if (!translate) return classes.join(' ');
          const translateX = Number((translate.split(',')[0] || '').replace(/[^0-9-.]/g, ''));
          if (translateX < 0 || translateX > (chart.dims.innerDims.width)) {
            classes.push('hidden');
            return Array.from(new Set(classes)).join(' ');
          }
          return classes.filter((c) => c !== 'hidden').join(' ');
        }
        return 'd3-tick';
      });
  }
};

class D3Axis {
  public axisG!: Selection<SVGGElement, unknown, null, undefined>;
  public axis!: Axis<any>;
  private chart: D3Chart;
  public axisGenerator:(<Domain extends AxisDomain>(scale: AxisScale<Domain>) => Axis<Domain>);
  public type: D3AxisTypes;
  public id: string;
  private ticks?: number;
  private label?: string;
  private tickValues?: Iterable<any>;
  private tickFormat: (value: any, index: number) => string;

  constructor({
    id,
    chart,
    scale,
    type,
    label,
    tickValues,
    ticks,
    tickFormat = (v: any) => v,
  }: ID3Axis) {
    this.type = type;
    this.id = id;
    this.label = label;
    this.chart = chart;
    this.ticks = ticks;
    this.tickValues = tickValues;
    this.tickFormat = tickFormat;

    this.axisGenerator = D3GetAxis(type);
    this.scaleAxis(scale);

    const hasAxis = chart.chart
      .selectAll(`#${this.id}`).size();

    if (hasAxis) {
      this.axisG = this.chart.chart
        .select(`#${this.id}`);
    } else {
      this.axisG = this.chart.chart
        .append('g')
        .attr('id', this.id)
        .attr('class', D3Classes.axis.group[type]);
    }

    this.appendLabel();

    const axisTransform = D3GetAxisTransforms(this.type, this.chart.dims);
    if (axisTransform) {
      this.axisG
        .attr(...axisTransform);
    }

    this.axisG
      .call(this.axisGenerator(scale));

    this.axisG
      .selectAll('.tick')
      .classed('d3-tick', true);

    this.axisG
      .selectAll('.tick text')
      .attr('class', D3Classes.axis.ticks[type]);

    this.axisG
      .selectAll('.tick line')
      .attr('class', D3Classes.axis.gridLines[type]);

    this.axisG
      .selectAll('path')
      .attr('clip-path', `url(#${this.chart.chartAreaClipId})`);
  }

  appendLabel() {
    const labelGroup = d3AppendIfNotExists(
      this.chart.chart
        .select<SVGGElement>(`.${D3Classes.axis.labels.group[this.type]}`),
      () => (
        this.chart.chart
          .append('g')
          .attr('class', D3Classes.axis.labels.group[this.type])
          .attr('text-anchor', 'middle')
          .attr('transform', getLabelPosition(this.type, this.chart.dims))
      ),
    );

    d3ReplaceIfExists(
      labelGroup
        .select(`.${D3Classes.axis.labels.text[this.type]}`),
      () => (
        labelGroup
          .append('text')
          .attr('class', D3Classes.axis.labels.text[this.type])
          .text(this.label || '')
      ),
      { createIfNotExist: true },
    );
  }

  private scaleAxis(scale: ID3Axis['scale']) {
    this.axis = this.axisGenerator(scale);

    if (this.ticks && 'ticks' in scale) {
      this.axis.tickValues((scale.ticks as any)(this.ticks));
    }

    if (this.tickValues) {
      this.axis.tickValues(this.tickValues);
    }
    this.axis
      .tickSize(D3GetAxisTickSize(this.type, this.chart.dims))
      .tickFormat(this.tickFormat);
  }

  private updateLabel(label?: string) {
    if (label) this.label = label;
    if (this.label) {
      const labelGroup = this.chart.chart
        .select(`.${D3Classes.axis.labels.group[this.type]}`)
        .attr('text-anchor', 'middle')
        .attr('transform', getLabelPosition(this.type, this.chart.dims));

      labelGroup
        .select(`.${D3Classes.axis.labels.text[this.type]}`)
        .text(this.label);
    }
  }

  updateAxis({
    scale,
    chart,
    label,
    transition = 100,
    delay = 0,
  }:{scale: ID3Axis['scale'], chart: D3Chart, label?: string, transition?: number, delay?: number}) {
    this.chart = chart;
    this.scaleAxis(scale);
    const axisTransform = D3GetAxisTransforms(this.type, this.chart.dims);
    if (axisTransform) {
      this.axisG
        .attr(...axisTransform);
    }

    this.axisG
      .selectAll('.tick')
      .classed('d3-tick', true);

    this.axisG
      .transition()
      .delay(delay)
      .duration(transition)
      .call(this.axis)
      .on('end', () => {
        omitOverflowingBandScaleTickLines(scale, this.chart, this.type);
      });

    this.axisG
      .selectAll('.tick text')
      .attr('class', D3Classes.axis.ticks[this.type]);

    this.axisG
      .selectAll('.tick line')
      .attr('class', D3Classes.axis.gridLines[this.type]);

    this.updateLabel(label);
  }
}
export default D3Axis;
