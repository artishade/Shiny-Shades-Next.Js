import type { NextPage } from 'next';
import type { AppProps } from 'next/app';
import type { ReactElement, ReactNode } from 'react';
import type { ContentData } from '@/store/contentStore';
import type { Category, Product } from '@/types';

/**
 * Data a page can prerender via getStaticProps for _app to push into the
 * zustand stores before any child renders. getLayout also receives it as
 * its second argument so layouts (e.g. the announcement bar in
 * CustomerLayout) can render ISR content in the server HTML.
 */
export interface PageInitialData {
  initialContent?: ContentData | null;
  initialCategories?: Category[];
  initialProducts?: Product[];
}

export type NextPageWithLayout<P = Record<string, unknown>, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement, pageProps?: PageInitialData) => ReactNode;
};

export type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

declare module 'react' {
  interface FunctionComponent<P = {}> {
    getLayout?: (page: ReactElement, pageProps?: PageInitialData) => ReactNode;
  }
}
