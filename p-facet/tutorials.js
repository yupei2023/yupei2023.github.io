(() => {
  const units = [...document.querySelectorAll('.tutorial-unit')];
  const select = document.querySelector('#tutorial-jump');
  if (!select || !units.length) return;
  document.querySelector('.tutorial-nav').hidden = false;
  const go = (id) => {
    const unit = document.getElementById(id);
    if (!unit) return;
    select.value = id;
    unit.focus({preventScroll:true});
    unit.scrollIntoView({behavior:'auto',block:'start'});
  };
  select.addEventListener('change', () => { location.hash = select.value; go(select.value); });
  document.querySelectorAll('.tutorial-card').forEach(link => {
    link.addEventListener('click', () => go(link.hash.slice(1)));
  });
  window.addEventListener('hashchange', () => go(location.hash.slice(1)));
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) select.value = entry.target.id; });
    }, {rootMargin:'-15% 0px -60% 0px'});
    units.forEach(unit => observer.observe(unit));
  }
})();
