import { getLatest } from '$lib/server/releases-source';
import type { LayoutServerLoad } from './$types';

// A release counts as "new" (worth announcing on the strip above the nav) when
// it is flagged major, or shipped within the last 45 days. Computed on the
// server so there is no hydration flash: the strip is either rendered or not.
const FRESH_WINDOW_DAYS = 45;

export const load: LayoutServerLoad = async () => {
  const latest = await getLatest();
  const ageDays = (Date.now() - Date.parse(latest.date)) / 86_400_000;
  const isNew = latest.major || ageDays <= FRESH_WINDOW_DAYS;
  return { latest, isNew };
};
