#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
MING Version Manager — Snapshot & Rollback CLI
Usage: python tools/version_mgr.py <action> [args]
"""

import argparse
import json
import os
import shutil
import hashlib
import datetime
import sys
import difflib
from pathlib import Path

# ── Compatibility ──────────────────────────────────────────────────────────────
ENCODING = "utf-8"
os.environ["PYTHONIOENCODING"] = ENCODING

# ── Windows UTF-8 ─────────────────────────────────────────────────────────────
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

# ── ANSI Colors ───────────────────────────────────────────────────────────────
C_RESET  = "\033[0m"
C_RED    = "\033[91m"
C_GREEN  = "\033[92m"
C_YELLOW = "\033[93m"
C_BLUE   = "\033[94m"
C_MAGENTA= "\033[95m"
C_CYAN   = "\033[96m"
C_GRAY   = "\033[90m"
C_BOLD   = "\033[1m"


def c(text: str, color: str) -> str:
    return f"{color}{text}{C_RESET}"


def eprint(msg: str, color: str = C_RED):
    print(c(msg, color), file=sys.stderr)


# ── Path Resolution ───────────────────────────────────────────────────────────
_overridden_root: Path | None = None


def set_profile_root(path: Path | None) -> None:
    """Override: treat path as the profiles/ directory root (not profiles/slug/)."""
    global _overridden_root
    _overridden_root = path


def get_profile_root() -> Path | None:
    return _overridden_root


def project_root() -> Path:
    """Return E:\desktop\hecker\MING\ as absolute Path."""
    return Path(__file__).parent.parent.resolve()


def profiles_root(slug: str | None = None) -> Path:
    if _overridden_root:
        return _overridden_root
    base = project_root() / "profiles"
    if slug:
        return base / slug
    return base


def history_root(slug: str) -> Path:
    if _overridden_root:
        return _overridden_root / "history"
    return project_root() / "profiles" / slug / "history"

SOUL_FILES = [
    "soul.md",
    "memory.md",
    "interaction.md",
    "corrections.md",
    "conflicts.md",
    "SKILL.md",
    "manifest.json",
    "meta.json",
]


def existing_soul_files(slug: str) -> list[str]:
    """Return soul files that actually exist on disk for the given slug."""
    if _overridden_root:
        root = _overridden_root
    else:
        root = profiles_root(slug)
    return [f for f in SOUL_FILES if (root / f).exists()]


def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def sha256_of(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


def iso_now() -> str:
    return datetime.datetime.now(datetime.timezone.utc).isoformat(
        timespec="seconds"
    ).replace("+00:00", "Z")


def slug_from_manifest(slug_hint: str | None = None) -> str | None:
    """Read slug from profiles/<slug>/meta.json. If slug_hint given, use it directly."""
    if slug_hint:
        meta_path = profiles_root(slug_hint) / "meta.json"
        if meta_path.exists():
            try:
                data = json.loads(meta_path.read_text(encoding=ENCODING))
                return data.get("slug") or data.get("name") or data.get("id")
            except Exception:
                pass
    # Fallback: look for any slug dir in profiles/ that has a meta.json
    for sub in profiles_root().iterdir():
        if sub.is_dir() and (sub / "meta.json").exists():
            try:
                data = json.loads((sub / "meta.json").read_text(encoding=ENCODING))
                return data.get("slug") or sub.name
            except Exception:
                pass
    return slug_hint


# ── Snapshot Action ───────────────────────────────────────────────────────────
def action_snapshot(args: argparse.Namespace) -> None:
    slug = args.slug or slug_from_manifest()
    if not slug:
        eprint("Error: cannot determine profile slug. Provide --slug or ensure meta.json exists.")
        sys.exit(1)

    note = args.note or ""
    existing = existing_soul_files(slug)
    if not existing:
        eprint(f"Error: no soul files found in profiles/{slug}/. Nothing to snapshot.")
        sys.exit(1)

    # Build snapshot directory name
    ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    short_ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    snap_dir = history_root(slug) / f"v{args.version}_{ts}"
    ensure_dir(snap_dir)

    # Copy files and compute hashes
    hashes: dict[str, str] = {}
    for fname in existing:
        src = profiles_root(slug) / fname
        dst = snap_dir / fname
        shutil.copy2(src, dst)
        hashes[fname] = sha256_of(dst)

    # Write snapshot manifest
    n_corrections = 0
    corrections_path = profiles_root(slug) / "corrections.md"
    if corrections_path.exists():
        n_corrections = sum(
            1 for line in corrections_path.read_text(encoding=ENCODING).splitlines()
            if line.strip().startswith("- [ ]") or line.strip().startswith("- [x]")
        )

    manifest = {
        "version": args.version,
        "timestamp": iso_now(),
        "note": note,
        "files": list(existing),
        "file_hashes": hashes,
        "stats": {
            "corrections_pending": n_corrections,
        },
    }
    Path(snap_dir, "snapshot.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2), encoding=ENCODING
    )

    print(c(f"[snapshot created]  {snap_dir.relative_to(project_root())}", C_GREEN))
    print(c(f"  version : v{args.version}", C_GRAY))
    print(c(f"  note    : {note or '(none)'}", C_GRAY))
    print(c(f"  files   : {len(existing)}", C_GRAY))
    print(c(f"  saved at: {short_ts}", C_GRAY))

    # Enforce max-snapshots limit
    _enforce_max_snapshots(slug)


# ── Rollback Action ──────────────────────────────────────────────────────────
def action_rollback(args: argparse.Namespace) -> None:
    slug = args.slug or slug_from_manifest()
    if not slug:
        eprint("Error: cannot determine profile slug.")
        sys.exit(1)

    snap_dir = _resolve_snapshot(slug, args.snapshot)
    existing = existing_soul_files(slug)

    # ── Safety: always snapshot current state first ──
    safety_note = f"[pre-rollback safety] backing up before rolling back to v{args.snapshot}"
    safety_ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    safety_dir = history_root(slug) / f"vPRE_{safety_ts}"
    ensure_dir(safety_dir)

    for fname in existing:
        src = profiles_root(slug) / fname
        dst = safety_dir / fname
        if src.exists():
            shutil.copy2(src, dst)

    safety_manifest = {
        "version": f"PRE_{safety_ts}",
        "timestamp": iso_now(),
        "note": safety_note,
        "files": list(existing),
        "file_hashes": {f: sha256_of(safety_dir / f) for f in existing if (safety_dir / f).exists()},
        "stats": {"note": "auto-generated pre-rollback safety backup"},
    }
    Path(safety_dir, "snapshot.json").write_text(
        json.dumps(safety_manifest, ensure_ascii=False, indent=2), encoding=ENCODING
    )
    print(c(f"[safety backup]  {safety_dir.relative_to(project_root())}", C_YELLOW))

    # ── Restore files from target snapshot ──
    restored: list[str] = []
    for fname in existing:
        src = snap_dir / fname
        dst = profiles_root(slug) / fname
        if src.exists():
            shutil.copy2(src, dst)
            restored.append(fname)

    # Update manifest.json updated_at if it exists
    manifest_path = profiles_root(slug) / "manifest.json"
    if manifest_path.exists():
        try:
            m = json.loads(manifest_path.read_text(encoding=ENCODING))
            m["updated_at"] = iso_now()
            m["rolled_back_to"] = str(snap_dir.name)
            manifest_path.write_text(json.dumps(m, ensure_ascii=False, indent=2), encoding=ENCODING)
        except Exception as e:
            print(c(f"[warning] could not update manifest.json: {e}", C_YELLOW))

    print(c(f"[rollback complete]  restored {len(restored)} files from {snap_dir.name}", C_GREEN))
    print(c(f"  target snapshot: v{args.snapshot}", C_GRAY))
    print(c(f"  safety backup  : vPRE_{safety_ts}  (rollback here if needed)", C_GRAY))


def _resolve_snapshot(slug: str, version_label: str) -> Path:
    """Find a snapshot directory matching version_label (exact or partial)."""
    base = history_root(slug)
    if not base.exists():
        eprint(f"Error: no history found for slug '{slug}'.")
        sys.exit(1)

    candidates = [p for p in base.iterdir() if p.is_dir()]
    # Exact match on full dir name
    for c in candidates:
        if c.name == version_label or c.name == f"v{version_label}":
            return c

    # Partial match: match the version number suffix
    # e.g. version_label="3" or "v3" matches "v3_20240101_120000"
    # Strip leading 'v' from both for comparison
    search = version_label.lstrip("v")
    for c in candidates:
        parts = c.name.split("_", 1)
        v_part = parts[0].lstrip("v")
        if v_part == search:
            return c

    eprint(f"Error: snapshot 'v{version_label}' not found in '{slug}'.")
    eprint(f"Run `list` to see available snapshots.")
    sys.exit(1)


# ── List Action ──────────────────────────────────────────────────────────────
def action_list(args: argparse.Namespace) -> None:
    slug = args.slug or slug_from_manifest()
    if not slug:
        eprint("Error: cannot determine profile slug.")
        sys.exit(1)

    base = history_root(slug)
    if not base.exists():
        print(c("No snapshots found.", C_GRAY))
        return

    snapshots = sorted(
        [p for p in base.iterdir() if p.is_dir()],
        key=lambda p: p.name,
        reverse=True,  # newest first
    )

    if not snapshots:
        print(c("No snapshots found.", C_GRAY))
        return

    print(c(f"\n{'MING'} Snapshot History — {slug}", C_BOLD + C_CYAN))
    print(c("─" * 72, C_GRAY))
    print(
        f"{c('VERSION', C_BOLD):<22} "
        f"{c('DATE', C_BOLD):<20} "
        f"{c('NOTE', C_BOLD):<28} "
        f"{c('CORR', C_BOLD)}"
    )
    print(c("─" * 72, C_GRAY))

    for snap in snapshots:
        meta_path = snap / "snapshot.json"
        version_label = snap.name
        date_str = "unknown"
        note = ""
        n_corr = "-"

        if meta_path.exists():
            try:
                m = json.loads(meta_path.read_text(encoding=ENCODING))
                ts = m.get("timestamp", "")
                try:
                    dt = datetime.datetime.fromisoformat(ts.replace("Z", "+00:00"))
                    date_str = dt.strftime("%Y-%m-%d %H:%M")
                except Exception:
                    date_str = ts[:16] if ts else "unknown"
                note = m.get("note", "")
                n_corr = str(m.get("stats", {}).get("corrections_pending", "-"))
            except Exception:
                pass

        note_short = note[:26] + ".." if len(note) > 28 else note
        print(
            f"{version_label:<22} "
            f"{date_str:<20} "
            f"{note_short:<28} "
            f"{n_corr}"
        )

    print(c("─" * 72, C_GRAY))
    print(c(f"  {len(snapshots)} snapshot(s) total", C_GRAY))


# ── Diff Action ───────────────────────────────────────────────────────────────
def action_diff(args: argparse.Namespace) -> None:
    slug = args.slug or slug_from_manifest()
    if not slug:
        eprint("Error: cannot determine profile slug.")
        sys.exit(1)

    snap_a = _resolve_snapshot(slug, args.from_version)
    snap_b = _resolve_snapshot(slug, args.to_version)

    files_a = {p.name: p for p in snap_a.iterdir() if p.suffix != ".json"}
    files_b = {p.name: p for p in snap_b.iterdir() if p.suffix != ".json"}

    all_files = sorted(set(files_a) | set(files_b))

    changed_dims: set[str] = set()

    print(c(f"\nDiff: {snap_a.name}  →  {snap_b.name}", C_BOLD + C_MAGENTA))
    print(c("=" * 72, C_GRAY))

    for fname in all_files:
        pa = files_a.get(fname)
        pb = files_b.get(fname)

        if pa and pb:
            content_a = pa.read_text(encoding=ENCODING).splitlines()
            content_b = pb.read_text(encoding=ENCODING).splitlines()
            diff = list(difflib.unified_diff(
                content_a, content_b,
                fromfile=f"v{args.from_version}/{fname}",
                tofile=f"v{args.to_version}/{fname}",
                lineterm="",
            ))
        elif pa:
            diff = [c(f"--- v{args.from_version}/{fname}", C_RED),
                    c(f"+++ [deleted]", C_RED)]
            content_a = pa.read_text(encoding=ENCODING).splitlines()
            diff += [f"- {l}" for l in content_a[:20]]
        else:
            diff = [c(f"--- [new file]", C_GREEN),
                    c(f"+++ v{args.to_version}/{fname}", C_GREEN)]
            content_b = pb.read_text(encoding=ENCODING).splitlines()
            diff += [f"+ {l}" for l in content_b[:20]]

        if diff:
            # Infer which dimension changed
            dim = _infer_dimension(fname)
            if dim:
                changed_dims.add(dim)
            print()
            print(c(f"  {fname}", C_CYAN + C_BOLD))
            print(c("  " + "─" * 40, C_GRAY))
            for line in diff[:60]:
                if line.startswith("+") and not line.startswith("+++"):
                    print(c("  " + line, C_GREEN))
                elif line.startswith("-") and not line.startswith("---"):
                    print(c("  " + line, C_RED))
                elif line.startswith("@@"):
                    print(c("  " + line, C_MAGENTA))
                else:
                    print("  " + line)

    print()
    print(c("=" * 72, C_GRAY))
    changed = ", ".join(sorted(changed_dims)) if changed_dims else "unknown"
    print(c(f"  Dimensions with changes: {changed}", C_YELLOW))


def _infer_dimension(fname: str) -> str:
    mapping = {
        "soul.md":         "identity",
        "memory.md":       "memory",
        "interaction.md":  "expression / behavior",
        "corrections.md":  "corrections",
        "conflicts.md":    "conflicts",
        "manifest.json":   "meta",
        "meta.json":       "meta",
        "SKILL.md":        "meta",
    }
    return mapping.get(fname, "unknown")


# ── Clean Action ──────────────────────────────────────────────────────────────
def action_clean(args: argparse.Namespace) -> None:
    slug = args.slug or slug_from_manifest()
    if not slug:
        eprint("Error: cannot determine profile slug.")
        sys.exit(1)

    base = history_root(slug)
    if not base.exists():
        print(c("Nothing to clean.", C_GRAY))
        return

    snapshots = sorted(
        [p for p in base.iterdir() if p.is_dir()],
        key=lambda p: p.name,
    )

    max_keep = args.max
    if len(snapshots) <= max_keep:
        print(c(f"  {len(snapshots)} snapshots (within limit of {max_keep}). Nothing to clean.", C_GRAY))
        return

    to_delete = snapshots[: len(snapshots) - max_keep]
    print(c(f"\n[clean] Removing {len(to_delete)} old snapshot(s), keeping {max_keep} newest.", C_YELLOW))
    for snap in to_delete:
        shutil.rmtree(snap)
        print(c(f"  removed: {snap.name}", C_RED))

    print(c(f"\n[clean] Done. {len(snapshots) - len(to_delete)} snapshot(s) retained.", C_GREEN))


def _enforce_max_snapshots(slug: str, max_keep: int = 20) -> None:
    base = history_root(slug)
    if not base.exists():
        return
    snapshots = sorted(
        [p for p in base.iterdir() if p.is_dir()],
        key=lambda p: p.name,
    )
    if len(snapshots) > max_keep:
        to_delete = snapshots[: len(snapshots) - max_keep]
        for snap in to_delete:
            shutil.rmtree(snap)


# ── CLI ───────────────────────────────────────────────────────────────────────
def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="MING Version Manager — Snapshot, Rollback, Diff, Clean",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--slug", default=None,
        help="Profile slug (defaults to meta.json slug or parent dir name)",
    )
    parser.add_argument(
        "--path", default=None,
        help="Override profile root path (e.g. examples/demo_me). "
             "When set, slug is used for snapshot subdir naming only.",
    )

    sub = parser.add_subparsers(dest="action", required=True)

    # snapshot
    snap = sub.add_parser("snapshot", help="Create a timestamped snapshot")
    snap.add_argument(
        "-v", "--version", required=True,
        help="Version label (integer, e.g. 3)",
    )
    snap.add_argument(
        "-n", "--note", default="",
        help="Snapshot note (e.g. 'after corrections batch')",
    )

    # rollback
    rb = sub.add_parser("rollback", help="Rollback to a specific snapshot")
    rb.add_argument(
        "-v", "--snapshot", required=True,
        help="Snapshot version to rollback to (integer or full dir name)",
    )

    # list
    lst = sub.add_parser("list", help="List all snapshots for a profile")

    # diff
    diff = sub.add_parser("diff", help="Show changes between two snapshots")
    diff.add_argument(
        "--from", dest="from_version", required=True,
        help="Source snapshot version",
    )
    diff.add_argument(
        "--to", dest="to_version", required=True,
        help="Target snapshot version",
    )

    # clean
    cln = sub.add_parser("clean", help="Remove old snapshots beyond max limit")
    cln.add_argument(
        "--max", type=int, default=20,
        help="Max snapshots to keep (default: 20)",
    )

    return parser


# ── Main ──────────────────────────────────────────────────────────────────────
def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    # Apply --path override if provided
    if args.path:
        resolved = project_root() / args.path
        if not resolved.exists():
            eprint(f"Error: path does not exist: {resolved}")
            sys.exit(1)
        set_profile_root(resolved)

    root = project_root()
    override_info = f" | profile_root: {get_profile_root()}" if get_profile_root() else ""
    print(c(f"[MING version_mgr]  root: {root}{override_info}", C_GRAY))
    print()

    try:
        {
            "snapshot": action_snapshot,
            "rollback": action_rollback,
            "list":     action_list,
            "diff":     action_diff,
            "clean":    action_clean,
        }[args.action](args)
    except Exception as exc:
        eprint(f"Error: {exc}")
        sys.exit(1)


if __name__ == "__main__":
    main()
