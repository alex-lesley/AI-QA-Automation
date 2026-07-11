#!/usr/bin/env python3
"""afterFileEdit guard: block constitution WON'T violations in tests/** and pages/**.

Exit 0 = allow, 2 = block, other non-zero = hook error (failClosed blocks).

Matcher in hooks.json is tool type "Write" — path filtering happens here via file_path.
"""

from __future__ import annotations

import json
import re
import sys
from typing import Any


def matches_scoped_path(file_path: str) -> bool:
    normalized = file_path.replace("\\", "/")
    return bool(re.search(r"(?:^|/)(?:tests|pages)/", normalized))


def strip_comments(content: str) -> str:
    """Strip // and /* comments without touching // inside strings (xpath locators)."""
    out: list[str] = []
    i = 0
    state = "code"  # code | line | block | sq | dq | bt
    length = len(content)

    while i < length:
        ch = content[i]
        next_ch = content[i + 1] if i + 1 < length else ""

        if state == "line":
            if ch == "\n":
                state = "code"
                out.append(ch)
            i += 1
            continue

        if state == "block":
            if ch == "*" and next_ch == "/":
                state = "code"
                i += 2
                continue
            out.append("\n" if ch == "\n" else " ")
            i += 1
            continue

        if state in ("sq", "dq", "bt"):
            out.append(ch)
            if ch == "\\" and i + 1 < length:
                out.append(content[i + 1])
                i += 2
                continue
            if (
                (state == "sq" and ch == "'")
                or (state == "dq" and ch == '"')
                or (state == "bt" and ch == "`")
            ):
                state = "code"
            i += 1
            continue

        # code
        if ch == "/" and next_ch == "/":
            state = "line"
            i += 2
            continue
        if ch == "/" and next_ch == "*":
            state = "block"
            i += 2
            continue
        if ch == "'":
            state = "sq"
            out.append(ch)
            i += 1
            continue
        if ch == '"':
            state = "dq"
            out.append(ch)
            i += 1
            continue
        if ch == "`":
            state = "bt"
            out.append(ch)
            i += 1
            continue
        out.append(ch)
        i += 1

    return "".join(out)


def count_matches(content: str, pattern: re.Pattern[str]) -> int:
    return len(pattern.findall(strip_comments(content)))


def reconstruct_before(after: str, edits: list[Any]) -> str:
    """Reconstruct pre-edit content by reversing the edit replacements."""
    content = after
    for edit in reversed(edits):
        if not isinstance(edit, dict):
            continue
        old_string = edit.get("old_string")
        new_string = edit.get("new_string")
        if not isinstance(old_string, str) or not isinstance(new_string, str):
            continue
        index = content.find(new_string)
        if index == -1:
            content = content.replace(new_string, old_string)
        else:
            content = content[:index] + old_string + content[index + len(new_string) :]
    return content


# Patterns that are WON'T when newly introduced (count after > count before).
# Order is report priority.
INTRODUCED_CHECKS: list[dict[str, Any]] = [
    {
        "id": "waitForTimeout",
        "message": "page.waitForTimeout / .waitForTimeout() is banned — use web-first expect()",
        "pattern": re.compile(r"\.waitForTimeout\s*\("),
    },
    {
        "id": "xpath",
        "message": "XPath locator is banned — use getByRole / getByLabel / getByText / getByTestId",
        "pattern": re.compile(
            r"(?:\.locator\s*\(\s*[`'\"]\/\/|\.locator\s*\(\s*[`'\"]xpath=|[`'\"]xpath=|\.\$x\s*\()",
            re.IGNORECASE,
        ),
    },
    {
        "id": "any",
        "message": "TypeScript `any` is banned — use a proper type, unknown + narrowing, or generics",
        "pattern": re.compile(r"(?::\s*any\b|\bas\s+any\b|<\s*any\s*>)"),
    },
    {
        "id": "hardcoded-credential",
        "message": (
            "Hardcoded credential/secret is banned — use process.env and storageState auth setup"
        ),
        "pattern": re.compile(
            r"(?:password|passwd|secret|api[_-]?key|access[_-]?token|auth[_-]?token|bearer(?:[_-]?token)?)"
            r"\s*[:=]\s*(?!process\.env)[`'\"][^`'\"]+[`'\"]",
            re.IGNORECASE,
        ),
    },
    {
        "id": "describe-tag",
        "message": "Tags on test.describe() are banned — put exactly one tag on each test()",
        "pattern": re.compile(
            r"test\.describe(?:\.\w+)?\s*\(\s*(?:`[^`]*`|'[^']*'|\"[^\"]*\")\s*,\s*\{[\s\S]*?\btags?\s*:",
        ),
    },
]


def find_introduced_violations(before: str, after: str) -> list[str]:
    violations: list[str] = []
    for check in INTRODUCED_CHECKS:
        pattern: re.Pattern[str] = check["pattern"]
        before_count = count_matches(before, pattern)
        after_count = count_matches(after, pattern)
        if after_count > before_count:
            violations.append(check["message"])
    return violations


def main() -> None:
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError:
        print("block-wont-violations: invalid JSON on stdin", file=sys.stderr)
        sys.exit(1)

    file_path = payload.get("file_path")
    if not file_path or not matches_scoped_path(file_path):
        sys.exit(0)

    try:
        with open(file_path, encoding="utf-8") as handle:
            after = handle.read()
    except OSError as error:
        print(f"block-wont-violations: cannot read {file_path}: {error}", file=sys.stderr)
        sys.exit(1)

    edits = payload.get("edits") or []
    if not isinstance(edits, list):
        edits = []

    before = reconstruct_before(after, edits)
    violations = find_introduced_violations(before, after)

    if violations:
        joined = "\n- ".join(violations)
        print(
            f"block-wont-violations: BLOCKED — constitution WON'T in {file_path}:\n- {joined}",
            file=sys.stderr,
        )
        sys.exit(2)

    sys.exit(0)


if __name__ == "__main__":
    main()
