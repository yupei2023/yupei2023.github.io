const languageButton = document.querySelector("#language-toggle");
const languageKey = "pfacet-language";

const setLanguage = (language) => {
  const isChinese = language === "zh";
  document.documentElement.lang = isChinese ? "zh-Hans" : "en";
  document.documentElement.dataset.language = isChinese ? "zh" : "en";
  languageButton?.setAttribute("aria-pressed", String(isChinese));
  languageButton?.setAttribute("aria-label", isChinese ? "Switch to English" : "切换至中文");
  document.querySelectorAll("[data-localized-tool]").forEach((link) => {
    const tool = link.dataset.localizedTool;
    link.href = `${tool}/${isChinese ? "zh/" : ""}`;
  });
  try {
    localStorage.setItem(languageKey, isChinese ? "zh" : "en");
  } catch (_) {
    // The language switch still works when storage is unavailable.
  }
};

let savedLanguage = "en";
try {
  savedLanguage = localStorage.getItem(languageKey) || "en";
} catch (_) {
  savedLanguage = "en";
}
setLanguage(languageButton?.hidden ? "en" : savedLanguage);

languageButton?.addEventListener("click", () => {
  setLanguage(document.documentElement.dataset.language === "zh" ? "en" : "zh");
});
