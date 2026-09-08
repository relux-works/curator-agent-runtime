#!/usr/bin/env python3
"""Build the standalone Apiary atlas from its pinned, reviewed document set."""

from __future__ import annotations

import base64
from concurrent.futures import ThreadPoolExecutor
import hashlib
from html import escape
from html.parser import HTMLParser
import json
from pathlib import Path, PurePosixPath
import posixpath
import re
import subprocess
from urllib.parse import quote, unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
CONTENT = json.loads((ROOT / "site/content.json").read_text())
REF = CONTENT["source_ref"]
REPO = CONTENT["repository_url"]
CATEGORIES = [
    "Архитектура Apiary",
    "Исследования",
    "Протокол v0.1",
    "Диаграммы",
    "Контекст проекта",
]


def git(*args: str) -> bytes:
    return subprocess.check_output(["git", *args], cwd=ROOT)


def category(path: str) -> str:
    if path.startswith((".spec/", "docs/apiary/")):
        return CATEGORIES[0]
    if path.startswith(".research/"):
        return CATEGORIES[1]
    if path.startswith(("protocol/", "schemas/", "decisions/")) or path in {
        "docs/architecture.md", "docs/threat-model.md"
    }:
        return CATEGORIES[2]
    if path.startswith("diagrams/"):
        return CATEGORIES[3]
    return CATEGORIES[4]


def title(path: str, text: str) -> str:
    match = re.search(r"^#\s+(.+)$", text, re.MULTILINE)
    return match.group(1).strip() if match else PurePosixPath(path).name


def resolve(source: str, href: str) -> tuple[str, str]:
    parsed = urlsplit(href)
    target = unquote(parsed.path)
    if not target:
        target = source
    else:
        target = posixpath.normpath(posixpath.join(posixpath.dirname(source), target))
        if parsed.path.endswith("/"):
            target += "/"
    return target, unquote(parsed.fragment)


class SafeDocument(HTMLParser):
    """Keep document markup, rewriting local navigation without executing it."""

    allowed = {
        "a", "p", "div", "span", "section", "article", "aside",
        "h1", "h2", "h3", "h4", "h5", "h6", "blockquote",
        "strong", "em", "b", "i", "u", "s", "del", "ins",
        "ul", "ol", "li", "dl", "dt", "dd", "pre", "code",
        "table", "caption", "thead", "tbody", "tfoot", "tr", "th", "td",
        "sup", "sub", "small", "kbd", "samp", "var", "q",
        "figure", "figcaption", "details", "summary", "br", "hr", "img",
    }
    voids = {"br", "hr", "img"}
    blocked = {"script", "style", "iframe", "object", "embed", "form"}

    def __init__(self, path: str, documents: dict):
        super().__init__(convert_charrefs=True)
        self.path = path
        self.documents = documents
        self.output: list[str] = []
        self.stack: list[tuple[str, bool]] = []
        self.suppress = 0
        self.ids: set[str] = set()
        self.references: list[dict] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in self.blocked:
            self.suppress += 1
            self.stack.append((tag, False))
            return
        if self.suppress:
            if tag not in self.voids:
                self.stack.append((tag, False))
            return
        if tag not in self.allowed:
            return
        raw = dict(attrs)
        clean = {}
        for name in ("id", "class", "title", "colspan", "rowspan", "start", "scope"):
            if raw.get(name):
                clean[name] = raw[name]
        if raw.get("id"):
            self.ids.add(raw["id"])
        if tag == "a" and raw.get("name"):
            clean["id"] = raw["name"]
            self.ids.add(raw["name"])
        if tag == "a":
            href = raw.get("href", "")
            parsed = urlsplit(href)
            if parsed.scheme in ("https", "http"):
                clean.update(href=href, target="_blank", rel="noopener noreferrer")
            elif not parsed.scheme and not parsed.netloc:
                target, anchor = resolve(self.path, href)
                if target in self.documents:
                    clean["href"] = "#"
                    clean["data-doc"] = target
                    if anchor:
                        clean["data-anchor"] = anchor
                    self.references.append({"source": self.path, "target": target, "anchor": anchor})
                elif not target.startswith(("../", "/")):
                    clean.update(
                        href=REPO + "/blob/" + REF + "/" + quote(target, safe="/") + (
                            "#" + quote(anchor) if anchor else ""
                        ),
                        target="_blank", rel="noopener noreferrer",
                    )
        if tag == "img":
            target, _ = resolve(self.path, raw.get("src", ""))
            image = self.documents.get(target)
            if image and image["kind"] == "svg":
                clean.update(src=image["data_uri"], alt=raw.get("alt", image["title"]), loading="lazy")
                clean["data-doc"] = target
            else:
                self.output.append('<span class="section-note">' + escape(raw.get("alt", "Изображение")) + "</span>")
                return
        rendered = "".join(" " + key + '="' + escape(str(value), quote=True) + '"' for key, value in clean.items())
        self.output.append("<" + tag + rendered + ">")
        if tag not in self.voids:
            self.stack.append((tag, True))

    def handle_endtag(self, tag: str) -> None:
        if tag in self.blocked:
            self.suppress = max(0, self.suppress - 1)
        if self.stack and self.stack[-1][0] == tag:
            _, emitted = self.stack.pop()
            if emitted:
                self.output.append("</" + tag + ">")

    def handle_data(self, data: str) -> None:
        if not self.suppress:
            self.output.append(escape(data))


def pandoc(record: tuple[str, dict]) -> tuple[str, str]:
    path, document = record
    if document["kind"] != "md":
        return path, "<pre><code>" + escape(document["text"]) + "</code></pre>"
    result = subprocess.run(
        ["pandoc", "--from=gfm", "--to=html5", "--wrap=none"],
        input=document["text"], capture_output=True, text=True,
    )
    if result.returncode:
        raise RuntimeError("Pandoc failed for " + path + ": " + result.stderr)
    return path, result.stdout


def main() -> None:
    resolved = git("rev-parse", "--verify", REF + "^{commit}").decode().strip()
    if resolved != REF:
        raise RuntimeError("The source snapshot must be an exact full commit ID")
    paths = [
        p for p in git("ls-tree", "-r", "--name-only", REF).decode().splitlines()
        if not p.startswith(".task-board/")
        and (PurePosixPath(p).suffix in {".md", ".json", ".svg", ".puml"} or p in {"LICENSE", "NOTICE"})
    ]
    documents = {}
    for path in paths:
        raw = git("show", REF + ":" + path)
        text = raw.decode("utf-8")
        kind = PurePosixPath(path).suffix.lstrip(".") or "txt"
        documents[path] = {
            "path": path, "title": title(path, text), "kind": kind,
            "category": category(path), "text": text,
            "sha256": hashlib.sha256(raw).hexdigest(),
            "url": REPO + "/blob/" + REF + "/" + quote(path, safe="/"),
        }
        if kind == "svg":
            documents[path]["data_uri"] = "data:image/svg+xml;base64," + base64.b64encode(raw).decode()
        elif kind == "json":
            json.loads(text)

    directories = ["decisions/", "schemas/v1/"]
    for path in directories:
        documents[path] = {
            "path": path, "title": "Решения v0.1" if path == "decisions/" else "JSON Schema v1",
            "kind": "dir", "category": CATEGORIES[2], "text": "",
            "url": REPO + "/tree/" + REF + "/" + path,
        }

    with ThreadPoolExecutor(max_workers=4) as pool:
        rendered = dict(pool.map(pandoc, [(path, doc) for path, doc in documents.items() if doc["kind"] not in {"svg", "dir"}]))
    references = []
    for path, html in rendered.items():
        parser = SafeDocument(path, documents)
        parser.feed(html)
        parser.close()
        documents[path]["html"] = "".join(parser.output)
        documents[path]["anchors"] = sorted(parser.ids)
        references.extend(parser.references)
    for path in directories:
        documents[path]["html"] = "<h1>" + escape(documents[path]["title"]) + "</h1><ul>" + "".join(
            '<li><a href="#" data-doc="' + escape(key, quote=True) + '">' + escape(doc["title"]) + "</a></li>"
            for key, doc in documents.items() if key.startswith(path) and key != path
        ) + "</ul>"
        documents[path]["anchors"] = []

    broken = [
        ref for ref in references
        if ref["anchor"] and ref["anchor"] not in documents[ref["target"]].get("anchors", [])
    ]
    if broken:
        raise RuntimeError("Unresolved embedded document anchors: " + json.dumps(broken, ensure_ascii=False))

    diagrams = []
    for name, name_ru, description in CONTENT["diagram_meta"]:
        path = "diagrams/apiary/" + name + ".svg"
        documents[path]["title"] = name_ru
        diagrams.append({"path": path, "title": name_ru, "description": description, "data_uri": documents[path]["data_uri"], "research": False})
    for name, name_ru, description in [
        ("kernel", "Codex/Pi: ядро и расширения", "Исследовательская модель. Не все предложения приняты."),
        ("recovery", "Codex/Pi: состояние и recovery", "Сравнение истории, projection и внешнего эффекта."),
    ]:
        path = "diagrams/research/codex-pi/" + name + ".svg"
        documents[path]["title"] = name_ru
        diagrams.append({"path": path, "title": name_ru, "description": description, "data_uri": documents[path]["data_uri"], "research": True})

    vectors = []
    for line in documents["docs/apiary/migration-conformance.md"]["text"].splitlines():
        if not re.match(r"\| V\d{2} ", line):
            continue
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        if len(cells) != 4:
            raise RuntimeError("Unexpected conformance row: " + line)
        identity, entry, required, mutation = cells
        match = re.match(r"(V\d{2})\s+(.+)", identity)
        if not match:
            raise RuntimeError("Invalid vector identity")
        vectors.append({"id": match[1], "title": match[2], "entry": entry, "required": required, "mutation": mutation})
    if len(vectors) != 21:
        raise RuntimeError("The guide must retain all 21 conformance scenarios")

    catalog = json.loads(documents[".research/260908_source-catalog.json"]["text"])
    current_inputs = json.loads(documents["docs/apiary/current-inputs.json"]["text"])
    data = dict(CONTENT)
    data.update(
        documents=documents, diagrams=diagrams, vectors=vectors,
        overview=json.loads((ROOT / "diagrams/interactive/overview.json").read_text()),
        systems=catalog["systems"], closed_environments=catalog["closed_environments"],
        categories=CATEGORIES, coverage=catalog["coverage"],
    )
    for node in data["overview"]["nodes"]:
        if node["source"] not in documents:
            raise RuntimeError("Unknown module source: " + node["source"])
    for scenario in data["scenarios"]:
        if scenario["source"] not in documents or scenario["diagram"] not in documents:
            raise RuntimeError("Unknown scenario source: " + scenario["id"])

    app = (ROOT / "site/app.js").read_text()
    css = (ROOT / "site/styles.css").read_text()
    serialized = json.dumps(data, ensure_ascii=False, separators=(",", ":")).replace("<", "\\u003c").replace("\u2028", "\\u2028").replace("\u2029", "\\u2029")
    script_hash = base64.b64encode(hashlib.sha256(app.encode()).digest()).decode()
    html = (ROOT / "site/template.html").read_text()
    for token, value in {
        "@@STYLES@@": css, "@@DATA@@": serialized, "@@SCRIPT@@": app, "@@SCRIPT_HASH@@": script_hash
    }.items():
        html = html.replace(token, value)
    if re.search(r"@@[A-Z_]+@@", html):
        raise RuntimeError("Unresolved template marker")
    output = ROOT / "dist"
    artifact = ROOT / "docs/interactive/apiary.html"
    output.mkdir(exist_ok=True)
    artifact.parent.mkdir(parents=True, exist_ok=True)
    for path in (output / "index.html", output / "apiary.html", artifact):
        path.write_text(html)
    manifest = {
        "source_ref": REF, "documents": len(documents), "source_files": len(paths),
        "markdown_documents": sum(doc["kind"] == "md" for doc in documents.values()),
        "json_documents": sum(doc["kind"] == "json" for doc in documents.values()),
        "diagram_pairs": len(diagrams), "local_document_links": len(references),
        "vectors": len(vectors), "scenarios": len(data["scenarios"]),
        "systems": len(catalog["systems"]), "html_bytes": len(html.encode()),
        "html_sha256": hashlib.sha256(html.encode()).hexdigest(),
        "source_sha256": {path: doc["sha256"] for path, doc in documents.items() if "sha256" in doc},
        "runtime_probes": 0,
    }
    scratch = ROOT / ".temp/interactive-guide"
    scratch.mkdir(parents=True, exist_ok=True)
    (scratch / "build-manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({key: value for key, value in manifest.items() if key != "source_sha256"}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
