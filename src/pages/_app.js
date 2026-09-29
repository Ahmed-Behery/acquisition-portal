import Head from 'next/head';
import { CacheProvider } from '@emotion/react';
import { ThemeProvider } from '@mui/material/styles';
import '@/styles/globals.css';
import createEmotionCache from '@/theme/emotionCache';
import { createAppTheme } from '@/theme/theme';
import { FONT_FAMILY } from '@/theme/fonts';
import AppDataProvider from '@/store/AppDataProvider';
import AppLayout from '@/layouts/AppLayout';

const clientSideEmotionCache = createEmotionCache();
const theme = createAppTheme(FONT_FAMILY);

export default function App({ Component, pageProps, emotionCache = clientSideEmotionCache }) {
  // Pages opt out of the signed-in chrome by exporting `getLayout` (the login page
  // renders standalone); everything else gets the sidebar + topbar shell.
  const getLayout = Component.getLayout || ((page) => <AppLayout>{page}</AppLayout>);
  const { initialState, initialToday, ...rest } = pageProps;

  return (
    <CacheProvider value={emotionCache}>
      <ThemeProvider theme={theme}>
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </Head>
        <AppDataProvider initialState={initialState} initialToday={initialToday}>
          {getLayout(<Component {...rest} />)}
        </AppDataProvider>
      </ThemeProvider>
    </CacheProvider>
  );
}
