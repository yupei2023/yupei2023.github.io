document.documentElement.classList.add("js");

// Local design comparison: append ?theme=dark to preview the archived navy palette.
if (new URLSearchParams(window.location.search).get("theme") === "dark") {
  const activeStylesheet = document.querySelector('link[rel="stylesheet"][href$="styles.css"]');
  if (activeStylesheet) {
    activeStylesheet.href = activeStylesheet.href.replace(/styles\.css$/, "styles-dark-navy-archive.css");
  }
}

const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#site-nav");
const menuLabel = menuButton?.querySelector(".sr-only");

menuButton?.addEventListener("click", () => {
  const isOpen = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!isOpen));
  navigation.classList.toggle("is-open", !isOpen);
  if (menuLabel) menuLabel.textContent = isOpen ? "Open navigation" : "Close navigation";
  if (!isOpen) navigation?.querySelector("a")?.focus();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && navigation?.classList.contains("is-open")) {
    navigation.classList.remove("is-open");
    menuButton?.setAttribute("aria-expanded", "false");
    menuButton?.focus();
  }
});

navigation?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navigation.classList.remove("is-open");
    menuButton?.setAttribute("aria-expanded", "false");
    if (menuLabel) menuLabel.textContent = "Open navigation";
  });
});

const desktopNavigation = window.matchMedia("(min-width: 901px)");
const resetMobileNavigation = (event) => {
  if (!event.matches) return;
  navigation?.classList.remove("is-open");
  menuButton?.setAttribute("aria-expanded", "false");
  if (menuLabel) menuLabel.textContent = "Open navigation";
};
desktopNavigation.addEventListener?.("change", resetMobileNavigation);

const year = document.querySelector("#year");
if (year) year.textContent = new Date().getFullYear();

const revealTargets = document.querySelectorAll(
  ".section-heading, .focus-grid article, .project, .publication-list article, .timeline article, .about-copy"
);

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  revealTargets.forEach((target) => {
    target.classList.add("reveal");
    observer.observe(target);
  });
}

// Site-wide search is built in the browser from the public HTML pages. This
// keeps the GitHub Pages site dependency-free and avoids collecting queries.
const searchPages = [
  { path: "", label: "Home" },
  { path: "research/", label: "Research" },
  { path: "p-facet/", label: "P-FACET" },
  { path: "scholarship/", label: "Scholarship" },
  { path: "teaching/", label: "Teaching" },
  { path: "engagement/", label: "Engagement" },
  { path: "pulse/", label: "Pulse" },
  { path: "portfolio/", label: "Ph.D. Portfolio" },
  { path: "about/", label: "About" }
];

const scriptUrl = new URL(document.currentScript.src, window.location.href);
const siteRoot = new URL("./", scriptUrl);
let searchIndexPromise;
let searchReturnFocus;

const normalizeSearchText = (value) =>
  value
    .toLocaleLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const buildSearchIndex = async () => {
  const pageDocuments = await Promise.all(
    searchPages.map(async (page) => {
      const pageUrl = new URL(page.path, siteRoot);
      const response = await fetch(pageUrl);
      if (!response.ok) throw new Error(`Could not load ${page.label}`);
      const html = await response.text();
      return { ...page, pageUrl, document: new DOMParser().parseFromString(html, "text/html") };
    })
  );

  return pageDocuments.flatMap(({ label, pageUrl, document: pageDocument }) => {
    const entries = [];
    const description = pageDocument.querySelector('meta[name="description"]')?.content || "";
    const pageHeading = pageDocument.querySelector("main h1")?.textContent.trim() || label;
    entries.push({ label, title: pageHeading, text: description, url: pageUrl.href, level: 1 });

    pageDocument.querySelectorAll("main h2, main h3").forEach((heading) => {
      const container = heading.closest("article, section") || heading.parentElement;
      const fullText = container?.textContent.replace(/\s+/g, " ").trim() || "";
      const headingText = heading.textContent.replace(/\s+/g, " ").trim();
      const summary = fullText.replace(headingText, "").trim().slice(0, 700);
      const anchor = heading.id || heading.closest("[id]")?.id;
      const resultUrl = new URL(pageUrl.href);
      if (anchor) resultUrl.hash = anchor;
      entries.push({
        label,
        title: headingText,
        text: summary,
        url: resultUrl.href,
        level: Number(heading.tagName.slice(1))
      });
    });

    return entries;
  });
};

const getSearchIndex = () => {
  searchIndexPromise ||= buildSearchIndex();
  return searchIndexPromise;
};

const searchShell = document.createElement("div");
searchShell.className = "site-search";
searchShell.hidden = true;
searchShell.innerHTML = `
  <div class="site-search__backdrop" data-search-close></div>
  <section class="site-search__panel" role="dialog" aria-modal="true" aria-labelledby="site-search-title">
    <div class="site-search__heading">
      <div>
        <p>Explore the website</p>
        <h2 id="site-search-title">Search Yupei Duan’s work</h2>
      </div>
      <button class="site-search__close" type="button" data-search-close aria-label="Close search">×</button>
    </div>
    <form class="site-search__form" role="search">
      <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"></circle><path d="m16 16 4 4"></path></svg>
      <label class="sr-only" for="site-search-input">Search this website</label>
      <input id="site-search-input" type="search" inputmode="search" autocomplete="off" spellcheck="false" placeholder="Search research, publications, teaching…">
      <span class="site-search__shortcut" aria-hidden="true">ESC</span>
    </form>
    <p class="site-search__status" role="status" aria-live="polite">Start typing to search across the website.</p>
    <div class="site-search__results" tabindex="-1"></div>
    <p class="site-search__privacy">Search runs entirely in your browser. No query data is collected.</p>
  </section>`;
document.body.append(searchShell);

const searchInput = searchShell.querySelector("#site-search-input");
const searchResults = searchShell.querySelector(".site-search__results");
const searchStatus = searchShell.querySelector(".site-search__status");

const searchButton = document.createElement("button");
searchButton.className = "nav-search";
searchButton.type = "button";
searchButton.setAttribute("aria-label", "Search website");
searchButton.setAttribute("aria-haspopup", "dialog");
searchButton.innerHTML = `
  <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="5.75"></circle><path d="m15 15 4.5 4.5"></path></svg>
  <span>Search</span><kbd>⌘K</kbd>`;
navigation?.append(searchButton);

const openSearch = () => {
  if (!searchShell.hidden) {
    searchInput.focus();
    return;
  }
  searchReturnFocus = document.activeElement;
  searchShell.hidden = false;
  document.body.classList.add("search-open");
  navigation?.classList.remove("is-open");
  menuButton?.setAttribute("aria-expanded", "false");
  window.requestAnimationFrame(() => searchInput.focus());
  getSearchIndex().catch(() => {
    searchStatus.textContent = "Search could not load. Please use the main navigation to explore the site.";
  });
};

const closeSearch = () => {
  searchShell.hidden = true;
  document.body.classList.remove("search-open");
  searchReturnFocus?.focus?.();
};

const escapeHtml = (value) => {
  const holder = document.createElement("span");
  holder.textContent = value;
  return holder.innerHTML;
};

const renderSearchResults = async () => {
  const query = normalizeSearchText(searchInput.value);
  if (query.length < 2) {
    searchResults.replaceChildren();
    searchStatus.textContent = query ? "Enter at least two characters." : "Start typing to search across the website.";
    return;
  }

  searchStatus.textContent = "Searching…";
  try {
    const index = await getSearchIndex();
    const terms = query.split(" ").filter(Boolean);
    const matches = index
      .map((entry) => {
        const title = normalizeSearchText(entry.title);
        const text = normalizeSearchText(entry.text);
        if (!terms.every((term) => title.includes(term) || text.includes(term))) return null;
        const score = terms.reduce(
          (total, term) => total + (title === term ? 18 : title.startsWith(term) ? 12 : title.includes(term) ? 8 : 2),
          entry.level === 1 ? 3 : 0
        );
        return { ...entry, score };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
      .slice(0, 12);

    searchStatus.textContent = matches.length
      ? `${matches.length} ${matches.length === 1 ? "result" : "results"} for “${searchInput.value.trim()}”`
      : `No results for “${searchInput.value.trim()}”`;
    searchResults.innerHTML = matches.length
      ? matches
          .map(
            (match) => `<a class="site-search__result" href="${match.url}">
              <span>${escapeHtml(match.label)}</span>
              <strong>${escapeHtml(match.title)}</strong>
              <p>${escapeHtml(match.text.slice(0, 190))}${match.text.length > 190 ? "…" : ""}</p>
              <i aria-hidden="true">→</i>
            </a>`
          )
          .join("")
      : `<div class="site-search__empty"><strong>Try a broader term</strong><p>For example: AI literacy, VirtualGeo, teaching, publications, or coursework.</p></div>`;
  } catch {
    searchResults.replaceChildren();
    searchStatus.textContent = "Search could not load. Please use the main navigation to explore the site.";
  }
};

let searchTimer;
searchInput.addEventListener("input", () => {
  window.clearTimeout(searchTimer);
  searchTimer = window.setTimeout(renderSearchResults, 120);
});
searchShell.querySelectorAll("[data-search-close]").forEach((button) => button.addEventListener("click", closeSearch));
searchButton.addEventListener("click", openSearch);
searchShell.querySelector("form").addEventListener("submit", (event) => event.preventDefault());

document.addEventListener("keydown", (event) => {
  const shortcut = (event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === "k";
  const slash = event.key === "/" && !/input|textarea|select/i.test(document.activeElement?.tagName);
  if (shortcut || slash) {
    event.preventDefault();
    openSearch();
  } else if (event.key === "Escape" && !searchShell.hidden) {
    closeSearch();
  } else if (event.key === "Tab" && !searchShell.hidden) {
    const focusable = [...searchShell.querySelectorAll('button, input, a[href], [tabindex]:not([tabindex="-1"])')];
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});
