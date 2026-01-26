import argparse
import asyncio
import os
from pathlib import Path
from typing import List, Optional, Tuple

import asyncpg
from dotenv import load_dotenv


def _load_db_dsn() -> Tuple[str, int, str, str, str]:
    load_dotenv()
    host = os.getenv("DB_HOST", "localhost")
    port = int(os.getenv("DB_PORT", "5432"))
    name = os.getenv("DB_NAME", "Clinicapro")
    user = os.getenv("DB_USER", "postgres")
    password = os.getenv("DB_PASSWORD", "1")
    return host, port, name, user, password


def _list_migrations(migrations_dir: Path) -> List[Path]:
    if not migrations_dir.exists():
        return []
    return sorted([p for p in migrations_dir.iterdir() if p.is_file() and p.suffix.lower() == ".sql"])


async def _ensure_migrations_table(conn: asyncpg.Connection) -> None:
    await conn.execute(
        """
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version TEXT PRIMARY KEY,
            applied_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
        """
    )


async def _get_applied_versions(conn: asyncpg.Connection) -> set[str]:
    rows = await conn.fetch("SELECT version FROM schema_migrations")
    return {r["version"] for r in rows}


async def apply_migrations(migrations_dir: Path, dry_run: bool) -> None:
    host, port, name, user, password = _load_db_dsn()

    conn = await asyncpg.connect(host=host, port=port, database=name, user=user, password=password)
    try:
        await _ensure_migrations_table(conn)

        applied = await _get_applied_versions(conn)
        migrations = _list_migrations(migrations_dir)

        to_apply: List[Path] = []
        for m in migrations:
            if m.name not in applied:
                to_apply.append(m)

        if not to_apply:
            print("No migrations to apply")
            return

        for m in to_apply:
            sql = m.read_text(encoding="utf-8")
            print(f"Applying migration: {m.name}")
            if dry_run:
                continue

            async with conn.transaction():
                await conn.execute(sql)
                await conn.execute("INSERT INTO schema_migrations (version) VALUES ($1)", m.name)

        print(f"Applied {len(to_apply)} migration(s)")
    finally:
        await conn.close()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dir", default="migrations", help="Path to migrations directory")
    parser.add_argument("--dry-run", action="store_true", help="Only print what would be applied")
    args = parser.parse_args()

    migrations_dir = Path(args.dir).resolve()
    asyncio.run(apply_migrations(migrations_dir, dry_run=args.dry_run))


if __name__ == "__main__":
    main()
