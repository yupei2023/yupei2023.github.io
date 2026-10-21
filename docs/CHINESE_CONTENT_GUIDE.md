# Chinese pages

The Chinese homepage is `/zh/`. The six paired sections use `/research/zh/`, `/scholarship/zh/`, `/teaching/zh/`,
`/engagement/zh/`, `/pulse/zh/`, and `/about/zh/`. Each has its own static HTML,
canonical URL, reciprocal English/Chinese language links, and `lang="zh-Hans"`.
The homepage and all six sections have paired English and Chinese versions.
The portfolio remains available by direct URL and
is not added to either language's navigation or search index.

## Voice and evidence

The Chinese prose draws on Yupei's teaching essays “做厨师一样的教师” and
“做一盘好课”, alongside his youth science writing “为什么 AI 很好玩？” and
“AI 正在改变世界”. Use the adult teacher/researcher voice: begin with a concrete
question or experience, explain ideas with conceptual precision, and let curiosity
lead into the research. Develop the reasoning within each paragraph rather than
flattening it into a list or summary. Aim for graceful, varied cadence and memorable
phrasing that clarifies an idea. Use everyday metaphors sparingly; avoid decorative
lyricism, institutional jargon, and repeated formulaic questions. Do not transfer the children's
articles' exhortations or playful particles into academic claims.

Keep the scope of authorship, proposed evaluations, conceptual models, publication
status, dates, and numbers aligned with the English source. English paper titles,
authors, journals, book titles, DOIs, and project names can remain in their original
form for accurate retrieval. Use verified Chinese titles and author names from the PDFs for the five early
Chinese publications. Use documented original Chinese titles for Chinese
articles and programs; do not invent official Chinese names for institutions.
The Chinese About page uses the user's confirmed status, 博士候选人.

## Updating content

Edit paired pages together when facts or project descriptions change. Preserve
matching section IDs so incoming links still work. Chinese navigation links should
lead to the Chinese homepage and six Chinese sections. Links to untranslated
projects intentionally lead to English. PDF and external evidence URLs remain identical.

`assets/css/chinese.css` supplies Chinese font fallbacks and typography. Shared
navigation and localized search are in `script.js`; Chinese queries retain Unicode
letters, and Chinese pages search the Chinese homepage and six Chinese sections.

Pulse is generated in both languages by `scripts/update_pulse.py` from the same
`data/pulse.json`. Do not manually translate the weekly article feed. Titles,
authors, and journals retain their source form; dates, themes, access labels,
selection reasons, and controls are localized. The scheduled workflow commits
both editions. Preserve the `PULSE_FEED_START` and `PULSE_FEED_END` markers.

Run `python3 -m unittest discover -s tests -p 'test_pulse.py'`,
`python3 scripts/validate_pulse.py`, `node --check script.js`, and
`git diff --check` after maintenance. Review mobile and desktop layouts when a
browser is available.
