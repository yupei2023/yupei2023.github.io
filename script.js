document.documentElement.classList.add("js");
const isChinese = document.documentElement.lang.toLowerCase().startsWith("zh");
const chineseUI = {
  "Open navigation": "打开导航", "Close navigation": "关闭导航",
  "Explore the website": "浏览网站", "Search Yupei Duan’s work": "查找段玉佩的工作",
  "Close search": "关闭搜索", "Search this website": "搜索本站",
  "Search research, publications, teaching…": "搜索研究、论文、教学……",
  "Start typing to search across the website.": "输入关键词，查找本站内容。",
  "Search runs entirely in your browser. No query data is collected.": "搜索在你的浏览器中完成，不收集搜索内容。",
  "Search website": "搜索本站", "Search": "搜索",
  "Search could not load. Please use the main navigation to explore the site.": "搜索暂时无法加载，请通过主导航浏览。",
  "Enter at least two characters.": "请至少输入两个字或字符。", "Searching…": "正在查找……",
  "Try a broader term": "试试更宽泛的词",
  "For example: AI literacy, VirtualGeo, teaching, publications, or coursework.": "例如：AI 素养、VirtualGeo、教学、论文或科普。"
};
const ui = text => isChinese ? (chineseUI[text] || text) : text;

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
  if (menuLabel) menuLabel.textContent = isOpen ? ui("Open navigation") : ui("Close navigation");
  if (!isOpen) navigation?.querySelector("a")?.focus();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && navigation?.classList.contains("is-open")) {
    navigation.classList.remove("is-open");
    menuButton?.setAttribute("aria-expanded", "false");
    if (menuLabel) menuLabel.textContent = ui("Open navigation");
    menuButton?.focus();
  }
});

navigation?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navigation.classList.remove("is-open");
    menuButton?.setAttribute("aria-expanded", "false");
    if (menuLabel) menuLabel.textContent = ui("Open navigation");
  });
});

const desktopNavigation = window.matchMedia("(min-width: 901px)");
const resetMobileNavigation = (event) => {
  if (!event.matches) return;
  navigation?.classList.remove("is-open");
  menuButton?.setAttribute("aria-expanded", "false");
  if (menuLabel) menuLabel.textContent = ui("Open navigation");
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
const searchPages = isChinese ? [
  { path: "research/zh/", label: "研究" },
  { path: "scholarship/zh/", label: "学术成果" },
  { path: "teaching/zh/", label: "教学" },
  { path: "engagement/zh/", label: "科普与服务" },
  { path: "pulse/zh/", label: "研究动态" },
  { path: "about/zh/", label: "关于我" }
] : [
  { path: "", label: "Home" },
  { path: "research/", label: "Research" },
  { path: "p-facet/", label: "P-FACET" },
  { path: "gritbuilder/", label: "GritBuilder" },
  { path: "scholarship/", label: "Scholarship" },
  { path: "teaching/", label: "Teaching" },
  { path: "engagement/", label: "Engagement" },
  { path: "pulse/", label: "Pulse" },
  { path: "about/", label: "About" }
];

const scriptUrl = new URL(document.currentScript.src, window.location.href);
const siteRoot = new URL("./", scriptUrl);
let searchIndexPromise;
let searchReturnFocus;

const normalizeSearchText = (value) => {
  const normalized = value.toLocaleLowerCase().normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  // Match common mixed queries such as AI素养 against prose written as AI 素养.
  return isChinese ? normalized
    .replace(/([\p{Script=Han}])([\p{Script=Latin}\p{N}])/gu, "$1 $2")
    .replace(/([\p{Script=Latin}\p{N}])([\p{Script=Han}])/gu, "$1 $2") : normalized;
};

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
        <p>${ui("Explore the website")}</p>
        <h2 id="site-search-title">${ui("Search Yupei Duan’s work")}</h2>
      </div>
      <button class="site-search__close" type="button" data-search-close aria-label="${ui("Close search")}">×</button>
    </div>
    <form class="site-search__form" role="search">
      <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"></circle><path d="m16 16 4 4"></path></svg>
      <label class="sr-only" for="site-search-input">${ui("Search this website")}</label>
      <input id="site-search-input" type="search" inputmode="search" autocomplete="off" spellcheck="false" placeholder="${ui("Search research, publications, teaching…")}">
      <span class="site-search__shortcut" aria-hidden="true">ESC</span>
    </form>
    <p class="site-search__status" role="status" aria-live="polite">${ui("Start typing to search across the website.")}</p>
    <div class="site-search__results" tabindex="-1"></div>
    <p class="site-search__privacy">${ui("Search runs entirely in your browser. No query data is collected.")}</p>
  </section>`;
document.body.append(searchShell);

const searchInput = searchShell.querySelector("#site-search-input");
const searchResults = searchShell.querySelector(".site-search__results");
const searchStatus = searchShell.querySelector(".site-search__status");

const searchButton = document.createElement("button");
searchButton.className = "nav-search";
searchButton.type = "button";
searchButton.setAttribute("aria-label", ui("Search website"));
searchButton.setAttribute("aria-haspopup", "dialog");
searchButton.innerHTML = `
  <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="5.75"></circle><path d="m15 15 4.5 4.5"></path></svg>
  <span>${ui("Search")}</span><kbd>⌘K</kbd>`;
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
  if (menuLabel) menuLabel.textContent = ui("Open navigation");
  window.requestAnimationFrame(() => searchInput.focus());
  getSearchIndex().catch(() => {
    searchStatus.textContent = ui("Search could not load. Please use the main navigation to explore the site.");
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
    searchStatus.textContent = query ? ui("Enter at least two characters.") : ui("Start typing to search across the website.");
    return;
  }

  searchStatus.textContent = ui("Searching…");
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
      ? (isChinese ? `找到 ${matches.length} 条与“${searchInput.value.trim()}”相关的结果` : `${matches.length} ${matches.length === 1 ? "result" : "results"} for “${searchInput.value.trim()}”`)
      : (isChinese ? `没有找到与“${searchInput.value.trim()}”相关的结果` : `No results for “${searchInput.value.trim()}”`);
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
      : `<div class="site-search__empty"><strong>${ui("Try a broader term")}</strong><p>${ui("For example: AI literacy, VirtualGeo, teaching, publications, or coursework.")}</p></div>`;
  } catch {
    searchResults.replaceChildren();
    searchStatus.textContent = ui("Search could not load. Please use the main navigation to explore the site.");
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
