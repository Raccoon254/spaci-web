// Decides whether a request is for the Basic-auth protected /admin area.
//
// The router matches on the DECODED pathname, so a raw prefix check on
// url.pathname is not enough: /%61dmin/notices routes to /admin/notices while
// its raw pathname does not start with /admin. We therefore check the matched
// route id (what will actually run, including form actions and __data.json)
// and, as a second line, the decoded and slash-collapsed pathname. A pathname
// that cannot be decoded is treated as admin (fail closed).
// Pure, no SvelteKit imports, so it is unit tested.

export function isAdminRequest(pathname: string, routeId: string | null | undefined): boolean {
  if (routeId && /^\/admin(\/|$)/.test(routeId)) return true;
  let p: string;
  try {
    p = decodeURIComponent(pathname);
  } catch {
    return true;
  }
  p = p.replace(/[\\/]+/g, '/').toLowerCase();
  return p.startsWith('/admin');
}
