import { memo } from 'react';

export const typedMemo: <T extends ValueOf<Propsable>>(
  c: T,
  propsAreEqual?: ((
    prevProps: Readonly<PropsOf<T>>,
    nextProps: Readonly<PropsOf<T>>
  ) => boolean) | undefined
) => T = memo;
