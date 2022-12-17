import { Fragment } from 'react';
import {
  ID3TooltipDataMulti,
  ID3TooltipDataSingle,
} from '../../../../d3/types';
import classes from '../css/Tooltip.module.css';
import {
  D3TooltipColorKey,
  getTooltipColor,
} from './helpers/tooltip';

const isMulti = <D extends Record<string, unknown>>(
  data: ID3TooltipDataMulti<D> | ID3TooltipDataSingle<D>,
): data is ID3TooltipDataMulti<D> => {
  const attrVals = Object.values(data.attrs);
  if (attrVals.some((v) => typeof v === 'object' && v !== null)) return true;
  return false;
};

const getLabelAndOmitFromD = <D extends Record<string, unknown>>(
  data: D,
  keyLabel: keyof D,
): {dt: D, lbl?: string} => {
  const dt = { ...data };
  if (keyLabel in data) {
    const lbl = String(dt[keyLabel]);
    delete dt[keyLabel];
    return { lbl, dt };
  }
  return { dt: data };
};

const getMultiValueTable = <D extends Record<string, unknown>>({
  data,
  colorKey,
  label,
  keyLabel,
  labelFormatter = (label) => label,
  valueFormatter = (value) => String(value),
}: {
  data: ID3TooltipDataMulti<D>,
  colorKey?: D3TooltipColorKey,
  label: string | undefined,
  keyLabel: keyof D | undefined
  labelFormatter?: (label: string) => string,
  valueFormatter?: (value: unknown) => unknown,
}) => {
  const xKeys = Array.from(new Set(Object.values(data.attrs).map((a) => a?.xKey)))
    .filter((k) => k) as string[];

  const { dt, lbl } = keyLabel
    ? getLabelAndOmitFromD(data.data, keyLabel)
    : {
      dt: data.data,
      lbl: label,
    };
  const formattedLabel = lbl
    ? labelFormatter(lbl)
    : xKeys.map((k) => labelFormatter(String(data.data[k]))).join(', ');

  return (
    <>
      <div className={classes.TooltipLabel}>
        {formattedLabel}
      </div>
      <div className={classes.TooltipContent}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'max-content max-content',
        }}>
          {
            Object.entries(dt)
              .reduce((vals, [key, value]) => {
                if (xKeys.includes(key)) return vals;
                if (String(value) === 'null') return vals;
                return ([
                  ...vals,
                  <Fragment key={key}>
                    <div style={{ color: getTooltipColor(data?.attrs?.[key], colorKey), paddingRight: '1em' }}>
                      {`${data?.attrs?.[key]?.name || key}: `}
                    </div>
                    <div>
                      {String(valueFormatter(value))}
                    </div>
                  </Fragment>,
                ]);
              }, [] as JSX.Element[])
          }
        </div>
      </div>
    </>
  );
};

const getSingleValueTable = <D extends Record<string, unknown>>({
  data,
  colorKey,
  label,
  keyLabel,
  labelFormatter = (label) => label,
  valueFormatter = (value) => String(value),
}: {
  data: ID3TooltipDataSingle<D>,
  colorKey?: D3TooltipColorKey,
  label: string | undefined,
  keyLabel: keyof D | undefined,
  labelFormatter?: (label: string) => string,
  valueFormatter?: (value: unknown) => unknown,
}) => {
  const { dt, lbl } = keyLabel
    ? getLabelAndOmitFromD(data.data, keyLabel)
    : {
      dt: data.data,
      lbl: label,
    };

  const formattedLabel = lbl
    ? labelFormatter(lbl)
    : undefined;

  return (
    <>
      {
        formattedLabel
          ? (
            <div className={classes.TooltipLabel} style={{ color: getTooltipColor(data?.attrs, colorKey) }}>
              {formattedLabel}
            </div>
          )
          : null
      }
      <div className={classes.TooltipContent}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'max-content max-content',
        }}>
          {
            Object.entries(dt)
              .reduce((vals, [key, value]) => {
                if (String(value) === 'null') return vals;
                return ([
                  ...vals,
                  <Fragment key={key}>
                    <div style={{ paddingRight: '1em' }}>
                      {`${data?.attrs?.name || key}: `}
                    </div>
                    <div>
                      {String(valueFormatter(value))}
                    </div>
                  </Fragment>,
                ]);
              }, [] as JSX.Element[])
          }
        </div>
      </div>
    </>
  );
};

function TooltipTabledKeyValuePair<D extends Record<string, unknown>>({
  data,
  colorKey,
  label,
  keyLabel,
  labelFormatter = (label) => label,
  valueFormatter = (value) => String(value),
}: {
  data: ID3TooltipDataMulti<D> | ID3TooltipDataSingle<D>,
  colorKey?: D3TooltipColorKey,
  labelFormatter?: (label: string) => string,
  valueFormatter?: (value: unknown) => unknown,
  label?: string,
  keyLabel?: keyof D
}) {
  if (isMulti(data)) {
    return getMultiValueTable({
      data,
      colorKey,
      label,
      keyLabel,
      labelFormatter,
      valueFormatter,
    });
  }

  return getSingleValueTable({
    data,
    colorKey,
    label,
    keyLabel,
    labelFormatter,
    valueFormatter,
  });
}

export default TooltipTabledKeyValuePair;

