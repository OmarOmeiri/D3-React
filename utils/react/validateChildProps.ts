import React from 'react';

export function validateChildProps<
P extends object,
T extends React.ReactElement<P>,
K extends string
>(
  children: T | T[],
  props: K | K[],
) {
  const propArray = [props].flat();
  React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) {
      throw new Error(`Invalid child type: ${child}`);
    }
    propArray.forEach((p) => {
      if (!(p in child.props)) {
        throw new Error(`Child element: "${child.type}" must have a "${p}" prop.`);
      }
    });
  });
  return true;
}
