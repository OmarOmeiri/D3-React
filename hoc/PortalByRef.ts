import { createPortal } from 'react-dom';

export const PortalByRef = ({
  container,
  children,
}: {
  container: Element | null,
  children: JSX.Element
}) => {
  if (!container) {
    return null;
  }

  return createPortal(
    children,
    container,
  );
};
