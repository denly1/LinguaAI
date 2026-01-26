#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/rexab-bot"
SERVICE_NAME="rexab-bot"
SRC_TARBALL="/tmp/rexab-bot-src.tar.gz"

export DEBIAN_FRONTEND=noninteractive

read_env_var() {
  local key="$1"
  local file="$2"
  awk -F= -v k="$key" 'BEGIN{v=""} $1==k{ $1=""; sub(/^=/,"",$0); v=$0 } END{print v}' "$file"
}

ensure_db() {
  local env_file="$APP_DIR/.env"
  if [ ! -f "$env_file" ]; then
    echo "ERROR: $env_file not found. Create it on the server before first deploy." >&2
    exit 1
  fi

  local db_name db_user db_password
  db_name="$(read_env_var DB_NAME "$env_file")"
  db_user="$(read_env_var DB_USER "$env_file")"
  db_password="$(read_env_var DB_PASSWORD "$env_file")"

  if [ -z "$db_name" ] || [ -z "$db_user" ] || [ -z "$db_password" ]; then
    echo "ERROR: DB_NAME/DB_USER/DB_PASSWORD must be set in $env_file" >&2
    exit 1
  fi

  systemctl enable --now postgresql

  runuser -u postgres -- psql -v ON_ERROR_STOP=1 \
    -v "db_user=$db_user" \
    -v "db_password=$db_password" \
    -v "db_name=$db_name" <<'SQL'
DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'db_user') THEN
    EXECUTE format('CREATE ROLE %I LOGIN PASSWORD %L', :'db_user', :'db_password');
  ELSE
    EXECUTE format('ALTER ROLE %I WITH LOGIN PASSWORD %L', :'db_user', :'db_password');
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = :'db_name') THEN
    EXECUTE format('CREATE DATABASE %I OWNER %I', :'db_name', :'db_user');
  END IF;
END
$do$;
SQL
}

ensure_packages() {
  apt-get update -y
  apt-get install -y --no-install-recommends \
    git \
    python3 \
    python3-venv \
    python3-pip \
    ca-certificates \
    rsync \
    postgresql \
    postgresql-contrib
}

ensure_repo() {
  mkdir -p "$APP_DIR"
  if [ ! -f "$SRC_TARBALL" ]; then
    echo "ERROR: $SRC_TARBALL not found. CI must upload source tarball before running deploy." >&2
    exit 1
  fi

  local tmp_dir
  tmp_dir="$(mktemp -d /tmp/rexab-bot-src.XXXXXX)"
  tar -xzf "$SRC_TARBALL" -C "$tmp_dir"

  rsync -a --delete \
    --exclude ".env" \
    --exclude ".venv" \
    --exclude "__pycache__/" \
    "$tmp_dir/" "$APP_DIR/"

  rm -rf "$tmp_dir"
}

ensure_venv() {
  cd "$APP_DIR"
  if [ ! -d ".venv" ]; then
    python3 -m venv .venv
  fi
  . .venv/bin/activate
  pip install --upgrade pip
  pip install -r requirements.txt
}

run_checks() {
  cd "$APP_DIR"
  . .venv/bin/activate
  python -m compileall -q .
}

run_migrations() {
  cd "$APP_DIR"
  . .venv/bin/activate
  python migrate.py
}

install_systemd() {
  cd "$APP_DIR"
  install -m 0644 systemd/rexab-bot.service /etc/systemd/system/rexab-bot.service
  systemctl daemon-reload
  systemctl enable "$SERVICE_NAME".service
}

restart_service() {
  systemctl restart "$SERVICE_NAME".service
  systemctl status "$SERVICE_NAME".service --no-pager || true
}

main() {
  ensure_packages
  ensure_repo
  ensure_venv
  run_checks
  ensure_db
  run_migrations
  install_systemd
  restart_service
}

main "$@"
