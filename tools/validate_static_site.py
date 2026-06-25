#!/usr/bin/env python3
"""Minimal validation for the normalized static RICG website."""
from __future__ import annotations

import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse


PAGES = (
    "index.html",
    "news/index.html",
    "publications/index.html",
    "recruitment/index.html",
    "team/index.html",
)
STYLESHEET = "/assets/css/site.css"
SCRIPT = "/assets/js/site.js"


class SiteParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.tags: list[tuple[str, dict[str, str]]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self.tags.append((tag, {key: value or "" for key, value in attrs}))


def local_path(site_root: Path, value: str) -> Path | None:
    if not value or value.startswith("#"):
        return None
    parsed = urlparse(value)
    if parsed.scheme or parsed.netloc:
        return None
    path = parsed.path
    if path.startswith("/"):
        return site_root / path.lstrip("/")
    return site_root / path


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: python3 validate_static_site.py <site-root>", file=sys.stderr)
        return 2

    site_root = Path(sys.argv[1]).expanduser().resolve()
    errors: list[str] = []
    warnings: list[str] = []

    for page_name in PAGES:
        page_path = site_root / page_name
        if not page_path.is_file():
            errors.append(f"Missing route: {page_name}")
            continue

        parser = SiteParser()
        parser.feed(page_path.read_text(encoding="utf-8"))

        stylesheets = [
            attrs.get("href", "")
            for tag, attrs in parser.tags
            if tag == "link" and "stylesheet" in attrs.get("rel", "")
        ]
        if stylesheets != [STYLESHEET]:
            errors.append(
                f"{page_name}: expected exactly [{STYLESHEET}], found {stylesheets}"
            )

        for tag, attrs in parser.tags:
            if tag == "a":
                href = attrs.get("href", "")
                if href == "#":
                    errors.append(f"{page_name}: active placeholder href=\"#\" remains")
                if attrs.get("target") == "_blank":
                    rel = set(attrs.get("rel", "").split())
                    if not {"noopener", "noreferrer"}.issubset(rel):
                        errors.append(
                            f"{page_name}: new-tab link lacks noopener noreferrer: {href}"
                        )

            if tag in {"link", "script"}:
                value = attrs.get("href", "") if tag == "link" else attrs.get("src", "")
                candidate = local_path(site_root, value)
                if candidate and not candidate.is_file():
                    errors.append(f"{page_name}: missing local {tag} asset: {value}")

            if tag == "img":
                candidate = local_path(site_root, attrs.get("src", ""))
                if candidate and not candidate.exists() and "onerror" not in attrs:
                    warnings.append(
                        f"{page_name}: image has no fallback and is absent: {attrs.get('src')}"
                    )

    if errors:
        print("Validation failed:")
        for item in errors:
            print(f"  ERROR: {item}")
    else:
        print("Validation passed: all normalized static routes and asset references are consistent.")

    if warnings:
        print("\nWarnings:")
        for item in warnings:
            print(f"  WARN: {item}")

    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
