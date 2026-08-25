#!/usr/bin/env python3
"""CLI/legacy entrypoint — delegates to .cursor/hooks/validate_prd.py."""
from __future__ import annotations

import runpy
import sys
from pathlib import Path

TARGET = Path(__file__).resolve().parent.parent / "hooks" / "validate_prd.py"
if not TARGET.is_file():
    print(f"Missing validator at {TARGET}", file=sys.stderr)
    sys.exit(1)
runpy.run_path(str(TARGET), run_name="__main__")
