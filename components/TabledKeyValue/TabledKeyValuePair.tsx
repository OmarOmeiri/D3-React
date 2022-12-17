import React, { Fragment } from 'react';

const getLabel = <D extends Record<string, unknown>>(
  data: D,
  keyLabel: keyof D,
): {dt: Record<string, unknown>, lbl?: string} => {
  const dt = { ...data };
  if (keyLabel in data) {
    const lbl = String(dt[keyLabel]);
    delete dt[keyLabel];
    return { lbl, dt };
  }
  return { dt: data };
};

export const TabledkeyValuePair = <D extends Record<string, unknown>>({
  label,
  data,
  keyLabel,
}: {
  label?: string
  data: D
  keyLabel?: keyof D
}) => {
  const { dt, lbl } = keyLabel
    ? getLabel(data, keyLabel)
    : { dt: data, lbl: label };
  return (
    <>
      {
    lbl
      ? (
        <div>
          {String(lbl)}
        </div>
      )
      : null
    }
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'max-content max-content',
      }}>
        {
        Object.entries(dt)
          .map(([k, v]) => (
            <Fragment key={k}>
              <div>{k}:</div>
              <div>{String(v)}</div>
            </Fragment>
          ))
        }
      </div>
    </>
  );
};
