/**
 * Per-tenant published content with a monotonic version. "Publishing an update"
 * bumps the version and replaces the snapshot with a NEW object (never mutates the
 * old one) — that immutability is what lets a stale cache hold on to an old version
 * and prove the cache-regression incident.
 */

export interface ContentSnapshot {
  version: number;
  headline: string;
  publishedAt: string;
}

const content = new Map<string, ContentSnapshot>();

function freshSnapshot(subdomain: string, version: number): ContentSnapshot {
  return {
    version,
    headline: `${subdomain} content — revision ${version}`,
    publishedAt: new Date().toISOString(),
  };
}

/** Current published content for a tenant (auto-seeds v1 on first access). */
export function getCurrentContent(subdomain: string): ContentSnapshot {
  let snapshot = content.get(subdomain);
  if (!snapshot) {
    snapshot = freshSnapshot(subdomain, 1);
    content.set(subdomain, snapshot);
  }
  return snapshot;
}

/** Publish a new revision: increments the version with a brand-new snapshot object. */
export function publishUpdate(subdomain: string): ContentSnapshot {
  const current = getCurrentContent(subdomain);
  const next = freshSnapshot(subdomain, current.version + 1);
  content.set(subdomain, next);
  return next;
}
