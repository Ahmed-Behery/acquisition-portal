import Document, { Html, Head, Main, NextScript } from 'next/document';
import createEmotionServer from '@emotion/server/create-instance';
import createEmotionCache from '@/theme/emotionCache';
import { FONT_PRECONNECT, GOOGLE_FONTS_HREF } from '@/theme/fonts';
import { cssVariablesBlock } from '@/theme/tokens';

export default class AppDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          <meta charSet="utf-8" />
          <meta name="theme-color" content="#1e3a8a" />
          {/* Declaring an icon stops the browser probing /favicon.ico on every load. */}
          <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
          {FONT_PRECONNECT.map((link) => (
            <link key={link.href} rel="preconnect" href={link.href} crossOrigin={link.crossOrigin} />
          ))}
          <link rel="stylesheet" href={GOOGLE_FONTS_HREF} />
          {/* Design tokens, emitted from src/theme/tokens.js so CSS and JS share one source. */}
          <style dangerouslySetInnerHTML={{ __html: cssVariablesBlock() }} />
          {this.props.emotionStyleTags}
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

// Collects the styles MUI rendered on the server so the first paint is already
// styled — the standard Emotion + Pages Router setup.
AppDocument.getInitialProps = async (ctx) => {
  const originalRenderPage = ctx.renderPage;
  const cache = createEmotionCache();
  const { extractCriticalToChunks } = createEmotionServer(cache);

  ctx.renderPage = () =>
    originalRenderPage({
      enhanceApp: (App) =>
        function EnhanceApp(props) {
          return <App emotionCache={cache} {...props} />;
        },
    });

  const initialProps = await Document.getInitialProps(ctx);
  const emotionStyles = extractCriticalToChunks(initialProps.html);
  const emotionStyleTags = emotionStyles.styles.map((style) => (
    <style
      data-emotion={`${style.key} ${style.ids.join(' ')}`}
      key={style.key}
      dangerouslySetInnerHTML={{ __html: style.css }}
    />
  ));

  return { ...initialProps, emotionStyleTags };
};
