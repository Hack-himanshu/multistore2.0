export function resolveStorePath(target, storeSlug) {
  if (!target || !storeSlug) return target || '/';

  if (/^https?:\/\//i.test(target) || /^(mailto|tel):/i.test(target) || target.startsWith('#')) {
    return target;
  }

  if (target.startsWith('/store/')) {
    return target;
  }

  if (target === '/') {
    return `/store/${storeSlug}`;
  }

  const normalized = target.startsWith('/') ? target : `/${target}`;
  return `/store/${storeSlug}${normalized}`;
}
