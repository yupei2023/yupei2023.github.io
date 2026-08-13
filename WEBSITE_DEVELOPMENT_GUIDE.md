# Yupei Duan Academic Website: Development and Maintenance Guide

## 1. Purpose of This Document

This guide records how the academic website was developed, where its files are stored, how the website is organized, and how to continue improving and publishing it.

The website is designed to serve as the main online home for Yupei Duan’s academic identity. It connects research, doctoral development, scholarship, teaching, science communication, leadership, and professional information in one coherent structure.

## 2. Where to Find the Website

### Live website

<https://yupei2023.github.io/>

### GitHub repository

<https://github.com/yupei2023/yupei2023.github.io>

### Local source folder

```text
/Users/future/github/future/myprojects/Website
```

The local folder is the working copy used to revise and test the website. The GitHub repository stores the published source and its version history. GitHub Pages converts the repository into the public website.

## 3. Current Website Structure

```text
github-site/
├── index.html                  # Main homepage
├── styles.css                 # Shared visual design and responsive layout
├── script.js                  # Navigation and interactive behavior
├── Yupei_Duan_CV_2026.pdf     # Public downloadable CV
├── about/
│   └── index.html             # Biography, identity, and contact information
├── research/
│   └── index.html             # Research agenda and projects
├── portfolio/
│   └── index.html             # Ph.D. portfolio and program of study
├── scholarship/
│   └── index.html             # Publications and presentations
├── teaching/
│   └── index.html             # Teaching philosophy and experience
├── engagement/
│   └── index.html             # Science communication, service, and leadership
├── assets/                    # Images, fonts, documents, and supporting media
├── sitemap.xml                # Search-engine page map
├── robots.txt                 # Search-engine instructions
├── .nojekyll                  # GitHub Pages configuration
└── README.md                  # Repository overview
```

## 4. Development Process

### Phase 1: Planning the website

The project began by identifying the website’s purposes and audiences. The primary audiences include:

- Faculty members and doctoral committee members
- Academic researchers and potential collaborators
- Conference participants
- Students and educators
- Employers, grant reviewers, and professional organizations
- Readers interested in science communication

The site was organized so visitors can begin on the homepage and move directly to the area most relevant to them.

### Phase 2: Preparing source materials

Private source folders and Markdown drafts were created for:

- Professional identity
- Short, medium, and full biographies
- Research statement
- Teaching philosophy
- Program of study
- Coursework inventory
- Integrative reflection
- Research-project descriptions
- Publications and presentations
- Science communication and service

Course records, papers, the CV, conference information, and project materials were reviewed to make the website accurate and evidence based.

### Phase 3: Developing the content

The content was revised for:

- Clear professional language
- Correct spelling and grammar
- Consistent terminology
- Accurate publication and conference status
- Appropriate descriptions of individual and collaborative contributions
- Separation of public information from private working materials
- Connections among research, teaching, design, and professional experience

### Phase 4: Designing the website

The original web-development project was transformed into a responsive multipage academic website.

The design includes:

- A consistent header and navigation system
- A central homepage introducing the academic identity
- Responsive layouts for desktop, tablet, and mobile screens
- Project panels and research visuals
- A circular professional headshot
- A teaching-philosophy diagram
- A doctoral-development journey diagram
- An AI-literacy concept diagram
- Coursework tables
- Highlighted competency-evidence cards
- Accessible headings, alternative image text, and keyboard navigation

### Phase 5: Reviewing project evidence

Research papers and project files were used to develop the project descriptions for:

- VirtualGeo
- iVRLab
- AI-Enhanced Virtual Patient
- AI Literacy
- Time2Reflect
- WeatherAR and tornado learning

Research methods, technologies, publication status, authorship, and Yupei’s contributions were represented carefully.

Time2Reflect is included within the AI Literacy research area, but Time2Reflect images are not displayed.

### Phase 6: Building the Ph.D. portfolio

The Portfolio page was developed from the program-of-study and course-history records.

Courses are organized as:

- SISLT Doctoral Seminar Coursework
- Supporting Field Coursework
- Research Methodologies Coursework
- Other Courses During the Doctoral Period
- Master Degree Program Coursework

The public table currently includes term, course code, course title, credit hours, and grade.

The Portfolio also includes:

- A doctoral-development journey
- An integrative reflection
- Four competency-evidence pathways

### Phase 7: Validation and publication

Before publication, the website was checked for:

- Valid HTML
- Missing local links
- Missing image and document files
- Table consistency
- Responsive behavior
- Git formatting problems
- Accidental inclusion of local working files

The completed website was committed to Git and pushed to the `main` branch of:

```text
https://github.com/yupei2023/yupei2023.github.io
```

GitHub Pages then built and published the website. The first complete publication was recorded in commit:

```text
297943c — Publish complete academic portfolio website
```

## 5. How to Continue Working With Codex

After reopening Codex, open this folder:

```text
/Users/future/github/future/myprojects/Website
```

Then use a request such as:

> Continue improving my academic website. Inspect the current files and Git history before making changes.

For a focused revision, identify the page and desired outcome:

> On the Portfolio page, simplify the coursework presentation.

> Add my new publication to the Scholarship page and homepage.

> Review the Research page for accuracy and professional wording.

> Improve the website’s mobile layout and accessibility.

> Update the website with these materials, test it, and publish it.

It is helpful to state whether the change should remain local or be published:

- **“Make the changes, but do not publish.”**
- **“Make the changes and publish after I review them.”**
- **“Make, test, and publish the changes.”**

## 6. Recommended Improvement Workflow

Use the following workflow for major updates:

1. Place new source materials in an appropriate private source folder.
2. Tell Codex which materials are new or revised.
3. Ask Codex to review the materials before editing the website.
4. Confirm factual details such as author order, contribution, date, and publication status.
5. Revise the relevant website page.
6. Review the wording and layout locally.
7. Validate links, images, HTML, and mobile presentation.
8. Commit the approved changes to Git.
9. Push the commit to GitHub.
10. Confirm that GitHub Pages completed the deployment.
11. Check the live pages.

## 7. How to Make Simple Manual Changes

The website uses plain HTML, CSS, and JavaScript, so it does not require a complex build system.

### Change page content

Open the relevant `index.html` file in a text editor.

Examples:

- Homepage: `index.html`
- Research: `research/index.html`
- Portfolio: `portfolio/index.html`
- Scholarship: `scholarship/index.html`
- Teaching: `teaching/index.html`
- Engagement: `engagement/index.html`
- About: `about/index.html`

### Change colors, spacing, or layout

Edit:

```text
styles.css
```

### Change navigation behavior

Edit:

```text
script.js
```

### Replace the public CV

Export the revised CV as a PDF and replace:

```text
Yupei_Duan_CV_2026.pdf
```

Keep the same filename unless all links to the CV are updated.

### Add an image

1. Place the image in a suitable folder under `assets/`.
2. Use a descriptive filename.
3. Add it to the appropriate HTML page.
4. Write meaningful alternative text.
5. Check its cropping and readability on both desktop and mobile screens.

Do not publish images containing identifiable research participants, student information, restricted interfaces, or collaborators’ unpublished work unless their public use has been confirmed.

## 8. Local Preview

From Terminal:

```bash
cd "/Users/future/github/future/myprojects/Website"
ruby -run -e httpd . -p 8000
```

Then open:

```text
http://localhost:8000
```

Stop the preview server by pressing `Control+C` in Terminal.

## 9. Git and Publication Commands

### Review changes

```bash
git status
git diff
```

### Stage approved changes

```bash
git add -A
```

### Create a version-history record

```bash
git commit -m "Describe the website update"
```

### Publish to GitHub

```bash
git push origin main
```

The live website normally updates after GitHub Pages finishes building.

Do not use destructive Git commands unless you understand their effect. Ask Codex to inspect the repository before restoring or removing previous work.

## 10. Regular Maintenance Schedule

### After every publication or conference update

- Add the publication or presentation.
- Confirm author order.
- Confirm status: submitted, under review, accepted, or published.
- Add a DOI or official link when available.
- Update the CV.
- Update related project descriptions.

### At the end of each semester

- Add completed courses and grades.
- Update courses that were previously in progress.
- Add meaningful coursework evidence.
- Revise the integrative reflection if doctoral development has changed.
- Update teaching, service, awards, and conference activity.

### Every three to six months

- Test all external links.
- Review the homepage for outdated “current” information.
- Check the website on a phone and computer.
- Compress oversized images.
- Review accessibility and alternative text.
- Remove repeated or outdated wording.
- Confirm that the public CV is current.

### Annually

- Update copyright years if necessary.
- Review the biography and research statement.
- Reassess the site’s audiences and priorities.
- Archive outdated project descriptions.
- Review GitHub Pages and repository settings.

## 11. Recommended Future Improvements

Potential next stages include:

1. Add dedicated detail pages for major research projects.
2. Add a filterable publication and presentation record.
3. Develop carefully selected coursework artifact pages.
4. Add project timelines and research-method diagrams.
5. Add accessible image galleries for approved project visuals.
6. Improve search-engine metadata and social-media previews.
7. Add structured publication data for search engines.
8. Conduct a full accessibility audit.
9. Test the site with multiple browsers and screen sizes.
10. Connect a custom academic domain if desired.

## 12. Important Content Principles

When improving the website:

- Keep claims accurate and supported by evidence.
- Clearly distinguish first authorship, coauthorship, and individual contributions.
- Update publication status as soon as it changes.
- Prefer concise, audience-centered language.
- Avoid repeating the same information across many pages.
- Use visuals only when they improve understanding.
- Maintain consistent project names and terminology.
- Protect participant, student, collaborator, and unpublished-study information.
- Keep private source materials separate from public website files.
- Review the live website after every publication.

## 13. Recovery and Version History

Git records each published version. If a future change introduces a problem, previous versions can be inspected and restored.

Useful commands include:

```bash
git log --oneline
git status
git diff
```

Before restoring an older version, ask Codex to inspect the current files and identify which changes would be affected. This helps preserve newer work.

## 14. Quick Restart Prompt

Copy and use the following prompt when returning to the project:

> Open `/Users/future/github/future/myprojects/Website` and continue improving my academic website. Read `WEBSITE_DEVELOPMENT_GUIDE.md`, inspect the current Git status and latest commit, and review the relevant source files before making changes. Preserve existing work. Do not publish unless I explicitly approve publication.
