import type { Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { basicOk } from '$lib/server/analytics';

// HTTP Basic auth for /admin/*. The password is STATS_SECRET (any username).
// When STATS_SECRET is unset the area is closed, never open.
export const handle: Handle = async ({ event, resolve }) => {
  if (event.url.pathname.startsWith('/admin')) {
    if (!(await basicOk(event.request.headers.get('authorization'), env.STATS_SECRET))) {
      return new Response('Authentication required', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Spaci stats", charset="UTF-8"',
          'Cache-Control': 'no-store'
        }
      });
    }
  }
  const res = await resolve(event);
  if (event.url.pathname.startsWith('/admin')) {
    res.headers.set('Cache-Control', 'no-store');
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }
  return res;
};
