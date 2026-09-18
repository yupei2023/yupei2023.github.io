(() => {
  'use strict';

  let icebergIndex = 0;
  const number = value => Math.round(value * 10) / 10;

  document.querySelectorAll('.research-iceberg').forEach(root => {
    const field = root.querySelector('.ice-field');
    const drawing = root.querySelector('.ice-drawing');
    const rows = Array.from(root.querySelectorAll('.ice-layer'));
    if (!field || !drawing || rows.length !== 4 || root.dataset.icebergReady) return;

    const headings = rows.map(row => row.querySelector('h3'));
    if (headings.some(heading => !heading)) return;

    root.dataset.icebergReady = 'true';
    const outlineId = `research-iceberg-outline-${++icebergIndex}`;
    let pendingFrame = 0;

    function draw() {
      pendingFrame = 0;
      const bounds = field.getBoundingClientRect();
      const w = bounds.width;
      const h = bounds.height;
      if (!w || !h) return;

      const start = parseFloat(getComputedStyle(rows[0]).paddingLeft);
      const g = Math.max(start - 20, 1);
      const rowTops = rows.map(row => row.getBoundingClientRect().top - bounds.top);
      const [, y1, y2, y3] = rowTops;
      const tipX = g * .52;
      const points = [
        [tipX, 9], [g * .71, 45], [g * .74, 67],
        [g * .86, y1 - 29], [g * .82, y1],
        [g * .98, y1 + 51], [g, y2 - 22],
        [g * .9, y2 + 36], [g * .93, y3 + 9],
        [g * .81, h - 47], [g * .46, h - 6],
        [g * .16, h - 51], [g * .11, y3 - 12],
        [g * .02, y2 - 9], [g * .05, y1 + 64],
        [g * .2, y1], [g * .28, y1 - 42],
        [g * .39, 64], [g * .39, 44]
      ];
      const outline = 'M' + points.map(point => point.map(number).join(',')).join('L') + 'Z';
      const layerBounds = [0, y1, y2, y3, h];
      const layerColors = ['tip', 'research', 'theory', 'values'];
      const bands = layerColors.map((color, index) =>
        `<rect x="0" y="${number(layerBounds[index])}" width="${number(g + 2)}" height="${number(layerBounds[index + 1] - layerBounds[index])}" fill="var(--ice-${color})"/>`
      ).join('');
      const facets = `<g class="ice-facets">
        <path d="M${number(tipX)},9 L${number(g * .48)},${number(y1)} L${number(g * .2)},${number(y1)} Z" fill="var(--ice-facet)" opacity=".36"/>
        <path d="M${number(tipX)},9 L${number(g * .48)},${number(y1)} L${number(g * .82)},${number(y1)} Z" fill="var(--ice-shadow)" opacity=".1"/>
        <path d="M${number(g * .48)},${number(y1)} L${number(g * .27)},${number(y2 + 23)} L${number(g * .02)},${number(y2 - 9)} L${number(g * .2)},${number(y1)} Z" fill="var(--ice-facet)" opacity=".2"/>
        <path d="M${number(g * .48)},${number(y1)} L${number(g)},${number(y2 - 22)} L${number(g * .6)},${number(y3 + 28)} Z" fill="var(--ice-shadow)" opacity=".12"/>
        <path d="M${number(g * .27)},${number(y2 + 23)} L${number(g * .6)},${number(y3 + 28)} L${number(g * .46)},${number(h - 6)} L${number(g * .16)},${number(h - 51)} Z" fill="var(--ice-facet)" opacity=".14"/>
        <path d="M${number(g * .6)},${number(y3 + 28)} L${number(g * .93)},${number(y3 + 9)} L${number(g * .81)},${number(h - 47)} L${number(g * .46)},${number(h - 6)} Z" fill="var(--ice-shadow)" opacity=".18"/>
      </g>`;
      const boundaries = [y2, y3].map(y =>
        `<path d="M0,${number(y)} H${number(g)}" stroke="var(--ice-surface)" stroke-width="2" opacity=".65"/>`
      ).join('');
      const connectors = headings.map((heading, index) => {
        const headingBounds = heading.getBoundingClientRect();
        const y = headingBounds.top - bounds.top + headingBounds.height * .55;
        const x = g * (index === 0 || index === 3 ? .58 : .64);
        return `<path d="M${number(x)},${number(y)} H${number(start - 10)}" fill="none" stroke="var(--ice-line)" stroke-width="1" opacity=".75"/><circle cx="${number(x)}" cy="${number(y)}" r="3" fill="var(--ice-surface)" stroke="var(--ice-tip)" stroke-width="1"/>`;
      }).join('');
      const wave = `M0,${number(y1)} C${number(w * .17)},${number(y1 - 5)} ${number(w * .26)},${number(y1 + 5)} ${number(w * .41)},${number(y1)} S${number(w * .72)},${number(y1 - 4)} ${number(w)},${number(y1)}`;

      drawing.setAttribute('viewBox', `0 0 ${number(w)} ${number(h)}`);
      drawing.innerHTML = `<defs><clipPath id="${outlineId}"><path d="${outline}"/></clipPath></defs>
        <path d="${wave} V${number(h)} H0 Z" fill="var(--ice-sea)"/>
        <g clip-path="url(#${outlineId})">${bands}${facets}${boundaries}</g>
        <path d="${wave}" fill="none" stroke="var(--ice-line)" stroke-width="1" opacity=".8"/>
        ${connectors}`;
    }

    function requestDraw() {
      if (!pendingFrame) pendingFrame = window.requestAnimationFrame(draw);
    }

    draw();
    if (typeof ResizeObserver === 'function') {
      const observer = new ResizeObserver(requestDraw);
      observer.observe(field);
    } else {
      window.addEventListener('resize', requestDraw, { passive: true });
    }
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(requestDraw);
    }
  });
})();
