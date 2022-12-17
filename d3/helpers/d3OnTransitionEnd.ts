import { Transition } from 'd3';

export const D3OnTransitionEnd = <T extends Transition<any, any, any, any>>(
  ...transitions: T[]
) => {
  const ts = transitions
    .filter((t) => t.size());
  return ({
    onResolve = () => {},
    onReject = () => {},
    onEmpty = () => {},
  }: {
    onResolve?: () => void,
    onReject?: () => void,
    onEmpty?: () => void
  }) => {
    if (!ts.length) {
      onEmpty();
      return;
    }
    Promise.all(ts.map((t) => t.end()))
      .then(onResolve)
      .catch(onReject);
  };
};

