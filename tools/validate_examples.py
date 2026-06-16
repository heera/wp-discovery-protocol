#!/usr/bin/env python3
"""Validate the repository's example documents against the wire-format JSON Schema.

Used by CI and runnable locally:  python tools/validate_examples.py
Requires:  pip install jsonschema
"""
import json
import pathlib
import sys

from jsonschema import Draft202012Validator

ROOT = pathlib.Path(__file__).resolve().parents[1]
SCHEMA = ROOT / "schemas" / "discovery" / "1.0" / "discovery.schema.json"

# Discovery documents to validate (extend as more examples are added).
TARGETS = [ROOT / "examples" / "discovery.json"]


def main() -> int:
    schema = json.loads(SCHEMA.read_text())
    Draft202012Validator.check_schema(schema)
    validator = Draft202012Validator(schema)

    failed = False
    for target in TARGETS:
        doc = json.loads(target.read_text())
        errors = sorted(validator.iter_errors(doc), key=lambda e: list(e.path))
        rel = target.relative_to(ROOT)
        if errors:
            failed = True
            print(f"FAIL  {rel}")
            for e in errors:
                where = "/".join(str(p) for p in e.path) or "(root)"
                print(f"  - {where}: {e.message}")
        else:
            print(f"OK    {rel}")

    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
