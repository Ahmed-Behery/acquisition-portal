import { currentUser } from './auth';
import { buildState } from './state';
import { isoDate } from '@/utils/dates';

/**
 * getServerSideProps wrapper for every signed-in page.
 *
 * Two things happen here:
 *
 *  1. **Auth gate** — an unauthenticated request is redirected to /login on the
 *     server, so a protected screen never flashes before a client-side check.
 *
 *  2. **Initial data** — on a real document request the full state snapshot is sent
 *     with the page, so the first paint is server-rendered with real content. On an
 *     in-app navigation (Next asks for the page's data with `x-nextjs-data`) the
 *     payload is skipped: the client store is already the live copy of the shared
 *     state and may hold changes that have not been flushed yet, so re-seeding it
 *     would throw them away — and it would ship the whole dataset on every click.
 */
export function withProtectedPage(getExtraProps) {
  return async (ctx) => {
    const user = currentUser(ctx.req);
    if (!user) {
      return { redirect: { destination: '/login', permanent: false } };
    }

    const props = {
      initialToday: isoDate(new Date()),
      initialState: isClientTransition(ctx.req) ? null : buildState(user),
    };

    if (getExtraProps) {
      const extra = await getExtraProps(ctx, user);
      if (extra?.redirect || extra?.notFound) return extra;
      Object.assign(props, extra?.props || {});
    }

    return { props };
  };
}

/**
 * True when Next is fetching a page's props for an in-app navigation rather than
 * rendering a document. Those requests go to `/_next/data/<buildId>/<route>.json`,
 * which is the dependable signal in the Pages Router.
 */
function isClientTransition(req) {
  return Boolean(req.url && req.url.startsWith('/_next/data/'));
}

/** getServerSideProps for the login page — sends a signed-in user straight through. */
export async function loginPageProps(ctx) {
  if (currentUser(ctx.req)) {
    return { redirect: { destination: '/', permanent: false } };
  }
  return { props: { initialToday: isoDate(new Date()), initialState: null } };
}
