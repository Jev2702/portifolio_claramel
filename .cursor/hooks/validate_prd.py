#!/usr/bin/env python3
"""
PRD format validator for the Discovery Cursor kit.

Modes:
  1) Cursor hook (postToolUse / afterFileEdit): JSON on stdin → JSON on stdout
  2) CLI: python validate_prd.py <path-to-prd.md> → exit 0/1, messages on stderr

Schema (case-insensitive headings):
  - Top heading: # PRD: <Title>
  - Required H2: Introduction, Goals, User Stories, Functional Requirements,
                 Non-Goals, Open Questions
  - >= 1 user story: ### US-NNN: <title>
  - Each story has **Acceptance Criteria:** with a final verifier among:
    Typecheck passes | Tests pass | Documentation complete | Verify in browser

No third-party deps (stdlib only).
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

REQUIRED_SECTIONS = [
    "Introduction",
    "Goals",
    "User Stories",
    "Functional Requirements",
    "Non-Goals",
    "Open Questions",
]
ACCEPTABLE_FINAL_CRITERIA = [
    "typecheck passes",
    "tests pass",
    "documentation complete",
    "verify in browser",
]


def _is_prd_path(path_str: str) -> bool:
    if not path_str:
        return False
    p = Path(path_str)
    return p.name.startswith("prd-") and p.suffix == ".md" and "tasks" in p.parts


def _heading_re(level: int, name: str) -> re.Pattern[str]:
    return re.compile(rf"^{'#' * level}\s+{re.escape(name)}\b", re.IGNORECASE | re.MULTILINE)


def validate(content: str) -> list[str]:
    """Return a list of error strings; empty list means OK."""
    errors: list[str] = []
    if not content.strip():
        return ["file is empty"]

    if not re.search(r"^# PRD\b", content, re.MULTILINE):
        errors.append("missing top-level `# PRD: <Title>` heading")

    missing = []
    for section in REQUIRED_SECTIONS:
        if section == "Non-Goals":
            patt = re.compile(r"^##\s+Non-Goals\b", re.IGNORECASE | re.MULTILINE)
        else:
            patt = _heading_re(2, section)
        if not patt.search(content):
            missing.append(section)
    if missing:
        errors.append(f"missing required H2 sections: {', '.join(missing)}")

    us_blocks = re.findall(r"^###\s+US-\d{3}\s*:", content, re.MULTILINE)
    if not us_blocks:
        errors.append("no user stories found (expected `### US-NNN: <title>`)")

    us_split = re.split(r"^(###\s+US-\d{3}\s*:.*)$", content, flags=re.MULTILINE)
    for i in range(1, len(us_split), 2):
        heading = us_split[i].strip()
        body = us_split[i + 1] if i + 1 < len(us_split) else ""
        if "**Acceptance Criteria:**" not in body and "## Acceptance Criteria" not in body:
            errors.append(f"{heading} has no `**Acceptance Criteria:**` block")
            continue
        body_lower = body.lower()
        if not any(crit in body_lower for crit in ACCEPTABLE_FINAL_CRITERIA):
            errors.append(
                f"{heading} acceptance criteria missing final verifier "
                f"(one of: {', '.join(ACCEPTABLE_FINAL_CRITERIA)})"
            )
    return errors


def _format_reject(errors: list[str]) -> str:
    lines = [
        "PRD validator: REJECTED",
        "",
        "Reasons:",
        *[f"  - {e}" for e in errors],
        "",
        "Fix the PRD to match .cursor/skills/prd/SKILL.md, then rewrite the file.",
    ]
    return "\n".join(lines)


def _path_from_tool_input(tool_input: dict) -> str:
    for key in ("path", "file_path", "filePath", "target_notebook"):
        val = tool_input.get(key)
        if isinstance(val, str) and val:
            return val
    return ""


def _content_from_payload(payload: dict, file_path: str) -> str:
    tool_name = payload.get("tool_name") or payload.get("toolName") or ""
    tool_input = payload.get("tool_input") or payload.get("toolInput") or {}
    if not isinstance(tool_input, dict):
        tool_input = {}

    if tool_name in ("Write", "write"):
        content = tool_input.get("contents") or tool_input.get("content") or ""
        if isinstance(content, str) and content:
            return content

    if file_path:
        try:
            return Path(file_path).read_text(encoding="utf-8")
        except OSError:
            return ""
    return ""


def run_hook(payload: dict) -> dict:
    """Cursor hook handler. Returns stdout JSON object."""
    hook_event = payload.get("hook_event_name") or payload.get("hookEventName") or ""
    tool_name = payload.get("tool_name") or payload.get("toolName") or ""
    tool_input = payload.get("tool_input") or payload.get("toolInput") or {}
    if not isinstance(tool_input, dict):
        tool_input = {}

    file_path = payload.get("file_path") or payload.get("filePath") or ""
    if not file_path:
        file_path = _path_from_tool_input(tool_input)

    if hook_event == "afterFileEdit" or (not tool_name and file_path):
        if not _is_prd_path(file_path):
            return {}
    elif tool_name in ("Write", "Edit", "StrReplace", "write", "edit"):
        if not _is_prd_path(file_path):
            return {}
    else:
        # Unknown / unrelated tool — no-op
        if not _is_prd_path(file_path):
            return {}

    content = _content_from_payload(payload, file_path)
    if not content and file_path:
        try:
            content = Path(file_path).read_text(encoding="utf-8")
        except OSError as exc:
            return {
                "additional_context": f"PRD validator: could not read {file_path}: {exc}"
            }

    errors = validate(content)
    if not errors:
        return {}
    return {"additional_context": _format_reject(errors)}


def run_cli(path: str) -> int:
    p = Path(path)
    if not p.is_file():
        print(f"PRD validator: file not found: {path}", file=sys.stderr)
        return 1
    try:
        content = p.read_text(encoding="utf-8")
    except OSError as exc:
        print(f"PRD validator: could not read {path}: {exc}", file=sys.stderr)
        return 1
    errors = validate(content)
    if errors:
        print(_format_reject(errors), file=sys.stderr)
        return 1
    print("PRD validator: OK")
    return 0


def main() -> int:
    if len(sys.argv) > 1 and not sys.argv[1].startswith("-"):
        return run_cli(sys.argv[1])

    raw = sys.stdin.read()
    if not raw.strip():
        # No stdin and no argv — nothing to do
        return 0
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError:
        return 0

    if not isinstance(payload, dict):
        return 0

    result = run_hook(payload)
    # Always emit JSON object for Cursor hooks (even empty)
    sys.stdout.write(json.dumps(result))
    return 0


if __name__ == "__main__":
    sys.exit(main())
