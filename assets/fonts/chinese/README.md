# Self-hosted Chinese fonts

Noto Sans SC and Noto Serif SC, normal variable weights 400–700, retrieved from official Google Fonts on October 21, 2026 (UTC). Each family has 101 original, unmodified WOFF2 Unicode subsets. The accompanying stylesheet is `assets/css/chinese-fonts.css`; `manifest.json` records the original asset URLs, byte sizes, and SHA-256 checksums.

CSS request:

https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400..700&family=Noto+Serif+SC:wght@400..700&display=swap

Request User-Agent: `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36`

The original `font-style`, weight range, `font-display: swap`, and `unicode-range` declarations are preserved. Browsers load the subsets needed for the characters and font families actually displayed; they do not download the entire collection for every page. All font URLs are local. Rendering has no runtime dependency on Google Fonts or another external font service.

The original SIL Open Font License files are included separately with each family, fetched without modification from:

- https://raw.githubusercontent.com/google/fonts/main/ofl/notosanssc/OFL.txt
- https://raw.githubusercontent.com/google/fonts/main/ofl/notoserifsc/OFL.txt

Keep each family's `OFL.txt` with these assets when redistributing them. The font binaries have not been renamed internally, edited, or further subsetted.
