export const scrollTo = (
  target: string | HTMLDivElement,
  offset: number = 0,
) => {
  let el: HTMLDivElement | null = null;

  if (typeof target === 'string') {
    el = window.document.querySelector(target);
  } else {
    el = target;
  }

  if (!el) return;

  const rect = el.getBoundingClientRect();

  const scrollTop =
    window.pageYOffset || document.documentElement.scrollTop || 0;

  const offsetTop = rect.top + scrollTop - offset;

  window.scrollTo({
    top: offsetTop,
    behavior: 'smooth',
  });
};
