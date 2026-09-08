#!/usr/bin/env python3
"""Check the Apiary document boundary and standalone HTML structure."""

import importlib.util
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("apiary_guide_builder", ROOT / ".scripts/build-architecture-guide.py")
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)
checks = []


def check(name, assertion):
    assert assertion, name
    checks.append(name)
    print("PASS " + name)


class OuterHTML(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = []
        self.scripts = []
        self.remote_active = []
        self.event_attributes = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get("id"):
            self.ids.append(attrs["id"])
        if tag == "script":
            self.scripts.append(attrs)
        for name, value in attrs.items():
            if name.lower().startswith("on"):
                self.event_attributes.append((tag, name))
            if tag in {"script", "link", "iframe", "img", "object"} and name in {"src", "href", "data"}:
                if value and not value.startswith("data:"):
                    self.remote_active.append((tag, value))


html = (ROOT / "dist/index.html").read_text()
outer = OuterHTML()
outer.feed(html)
check("outer HTML has unique static IDs", len(outer.ids) == len(set(outer.ids)))
check("all application controls have their required static anchors", {
    "navigation", "main", "reader", "reader-title", "reader-body", "reader-toc",
    "menu-toggle", "menu-shade", "reader-close", "reader-back", "diagram-zoom", "zoom-value",
}.issubset(outer.ids))
check("only data and the hashed application script are present", len(outer.scripts) == 2 and all("src" not in script for script in outer.scripts))
check("no remote active assets or event-handler attributes are emitted", not outer.remote_active and not outer.event_attributes)
check("the network and embedding boundary is explicit", "connect-src 'none'" in html and "object-src 'none'" in html and "form-action 'none'" in html)

fixtures = {
    "docs/source.md": {"kind": "md", "title": "Source"},
    "docs/target.md": {"kind": "md", "title": "Target"},
    "diagrams/view.svg": {"kind": "svg", "title": "Diagram", "data_uri": "data:image/svg+xml;base64,PHN2Zy8+"},
}
parser = builder.SafeDocument("docs/source.md", fixtures)
parser.feed('''<h2 id="kept">Title</h2><a href="target.md#section">Target</a>
<script>window.bad=1</script><iframe src="https://bad.example">hidden</iframe>
<img src="../diagrams/view.svg" onerror="bad()" alt="Diagram">
<a href="javascript:bad()" onclick="bad()" data-route="scenarios">Bad</a>
<a href="https://example.org/paper" onclick="bad()">External</a>''')
clean = "".join(parser.output)
check("document content cannot execute scripts or embed frames", "<script" not in clean and "<iframe" not in clean and "window.bad" not in clean)
check("source-supplied event and application control attributes are removed", "onclick" not in clean and "onerror" not in clean and "data-route" not in clean)
check("script URLs cannot survive the document boundary", "javascript:" not in clean)
check("local links preserve document and fragment identity", 'data-doc="docs/target.md"' in clean and 'data-anchor="section"' in clean)
check("diagrams are embedded inertly as data images", 'src="data:image/svg+xml;base64,' in clean and 'data-doc="diagrams/view.svg"' in clean)
check("external evidence links retain an isolated browsing target", 'target="_blank"' in clean and 'rel="noopener noreferrer"' in clean)
check("explicit source anchors are retained", "kept" in parser.ids)
check("slash and fragment resolution stays inside the document model", builder.resolve("docs/apiary/kernel.md", "../../protocol/runtime.md#scope") == ("protocol/runtime.md", "scope"))

source = json.loads((ROOT / "site/content.json").read_text())["source_ref"]
protected = [
    ".spec", ".research", "protocol", "schemas", "decisions", "docs/apiary",
    "diagrams/apiary", "diagrams/research",
]
delta = subprocess.check_output(["git", "diff", "--name-only", source, "--", *protected], cwd=ROOT, text=True)
check("accepted source architecture and research remain unchanged", not delta.strip())
css = (ROOT / "site/styles.css").read_text()
check("responsive layouts and reduced-motion behavior are provided", all(value in css for value in ["max-width:800px", "max-width:450px", "prefers-reduced-motion"]))
check("visible text does not use sub-12px sizes", not re.search(r"font-size:\s*(?:[0-9]|1[01])px", css))
result = {"checks": len(checks), "failures": 0, "browser_tests": 0, "runtime_conformance_probes": 0}
(ROOT / ".temp/interactive-guide/static-checks.json").write_text(json.dumps(result, indent=2) + "\n")
print(json.dumps(result))
