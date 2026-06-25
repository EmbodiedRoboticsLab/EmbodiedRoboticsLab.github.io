# RICG Static Website

A root-static website for the Robot Intelligent Control Group (RICG).

## Active source structure

```text
index.html
news/index.html
publications/index.html
recruitment/index.html
team/index.html
assets/css/site.css
assets/js/site.js
images/branding/
images/lab/
```

The public site is rendered directly from these static files. `.nojekyll` keeps
GitHub Pages from invoking Jekyll.

## Preview locally

```bash
cd ~/websites/EmbodiedRoboticsLab.github.io
python3 -m http.server 4010 --bind 127.0.0.1
```

Open `http://127.0.0.1:4010/`.

## Validate before committing

```bash
python3 tools/validate_static_site.py .
```

## Images and media

```text
images/branding/              Shared institutional mark
images/lab/hero/              Home hero media
images/lab/projects/          Featured Projects media
images/lab/research/          Research Focus media
images/lab/news/              Home and News thumbnails
images/lab/publications/      Publication and patent thumbnails
images/lab/people/            Faculty and student images
assets/videos/                Optional MP4 media
```

## Local-only paths

`_backup/`, `_site/`, Python caches, and local patch archives are excluded from
Git. They are not part of the deployed website.
