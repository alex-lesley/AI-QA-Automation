#!/usr/bin/env python3
"""afterFileEdit guard: block edits that weaken Playwright tests.

Exit 0 = allow, 2 = block (weakened assertion), other non-zero = hook error (failClosed blocks).
"""

from __future__ import annotations

import json
import re
import sys
from typing import Any


def count_active_expects(content: str) -> int:
    """Count expect( on lines that are not line-commented out."""
    count = 0
    for line in re.split(r"\r?\n", content):
        if line.lstrip().startswith("//"):
            continue
        without_inline_comment = re.sub(r"//.*$", "", line)
        matches = re.findall(r"expect\s*\(", without_inline_comment)
        count += len(matches)
    return count


def has_commented_out_expect(before: str, after: str) -> bool:
    """True when an active expect( in before is commented out on the same line index in after."""
    before_lines = re.split(r"\r?\n", before)
    after_lines = re.split(r"\r?\n", after)

    for i, after_line in enumerate(after_lines):
        trimmed_after = after_line.lstrip()
        if not trimmed_after.startswith("//") or not re.search(r"expect\s*\(", after_line):
            continue

        before_line = before_lines[i] if i < len(before_lines) else ""
        if before_line.lstrip().startswith("//"):
            continue
        if re.search(r"expect\s*\(", before_line):
            return True

    return False


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


def matches_tests_glob(file_path: str) -> bool:
    normalized = file_path.replace("\\", "/")
    return bool(re.search(r"(?:^|/)tests/", normalized))


def main() -> None:
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError:
        print("block-weakened-test: invalid JSON on stdin", file=sys.stderr)
        sys.exit(1)

    file_path = payload.get("file_path")
    if not file_path or not matches_tests_glob(file_path):
        sys.exit(0)

    try:
        with open(file_path, encoding="utf-8") as handle:
            after = handle.read()
    except OSError as error:
        print(f"block-weakened-test: cannot read {file_path}: {error}", file=sys.stderr)
        sys.exit(1)

    edits = payload.get("edits") or []
    if not isinstance(edits, list):
        edits = []

    before = reconstruct_before(after, edits)
    before_count = count_active_expects(before)
    after_count = count_active_expects(after)

    if after_count < before_count:
        print(
            f"block-weakened-test: BLOCKED — active expect() count dropped from "
            f"{before_count} to {after_count} in {file_path}",
            file=sys.stderr,
        )
        sys.exit(2)

    if has_commented_out_expect(before, after):
        print(
            f"block-weakened-test: BLOCKED — an expect() was commented out in {file_path}",
            file=sys.stderr,
        )
        sys.exit(2)

    sys.exit(0)


if __name__ == "__main__":
    main()
