/// <reference types="@welldone-software/why-did-you-render" />
import '../styles/globals.css';

// import '../utils/wdyr';

import type { AppProps } from 'next/app';

export default function App({
  Component, pageProps,
}: AppProps) {
  return <Component {...pageProps} />;
}
