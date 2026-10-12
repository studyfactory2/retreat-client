#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'HELP'
Usage: bash deploy.sh COMMAND

Run from your EC2 checkout as its owner. Each command is a separate step:
  pull      Fast-forward the clean develop checkout from origin/develop
  prepare   Validate configuration and build the frontend image
  up        Start/update only the matching prepared frontend image
  status    Show frontend container status
  logs      Show the last 100 frontend log lines
  help      Show this help without accessing Docker or configuration

Prepare never starts services. Changing deployment configuration requires another build.
See deployment/README.md for server setup and the remaining HTTPS step.
HELP
}

fail() {
  printf 'Error: %s\n' "$*" >&2
  exit 1
}

require_clean_checkout() {
  [[ "$(git branch --show-current)" == develop ]] ||
    fail 'Switch to develop before preparing or deploying a release.'
  [[ -z "$(git status --porcelain --untracked-files=normal)" ]] ||
    fail 'Commit or move local changes first. This script never resets or stashes files.'
}

docker_access() {
  if [[ "$use_sudo" == true ]]; then
    sudo "$@"
  else
    "$@"
  fi
}

compose() {
  # Parse .env with Compose, never source it. Set release identity after sudo,
  # and clear inherited values so the server file controls public configuration.
  docker_access env -u VITE_FRONTEND_URL -u VITE_API_BASE_URL \
    -u ORIGIN_BIND_IP -u COMPOSE_PROFILES \
    RELEASE_TAG="$release_tag" GIT_COMMIT="$git_commit" docker compose \
    --project-name retreat-client --env-file "$repo_dir/.env" \
    --file "$repo_dir/compose.production.yml" "$@"
}

main() {
  [[ $# -le 1 ]] || fail 'Pass exactly one command. Run bash deploy.sh help.'
  local action="${1:-help}"
  case "$action" in
    help|-h|--help) usage; return ;;
    pull|prepare|up|status|logs) ;;
    *) fail "Unknown command: $action. Run bash deploy.sh help." ;;
  esac

  [[ $EUID -ne 0 ]] || fail 'Run bash deploy.sh as the checkout owner, without sudo. Docker sudo is handled internally.'
  repo_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
  cd -- "$repo_dir"
  command -v git >/dev/null || fail 'Git is required.'
  git rev-parse --is-inside-work-tree >/dev/null 2>&1 || fail 'Run from a Git checkout.'
  case "$action" in
    pull|prepare|up) require_clean_checkout ;;
  esac
  if [[ "$action" == pull ]]; then
    # A pull may replace this script; run the next command in a fresh process.
    exec git pull --ff-only origin develop
  fi

  [[ -f .env ]] || fail 'Create the server .env first; see deployment/README.md.'
  [[ -f compose.production.yml ]] || fail 'compose.production.yml is missing.'
  git_commit="$(git rev-parse --verify HEAD)"
  release_tag="$git_commit"
  command -v docker >/dev/null || fail 'Install Docker and the Compose plugin first.'
  use_sudo=false
  if ! docker info >/dev/null 2>&1; then
    command -v sudo >/dev/null || fail 'Docker is unavailable and sudo is not installed.'
    use_sudo=true
    sudo docker info >/dev/null || fail 'Cannot access the Docker daemon.'
  fi
  docker_access docker compose version >/dev/null
  compose config --quiet

  case "$action" in
    prepare|up)
      # Hash the resolved configuration with the initial commit-only tag. This
      # includes the public build URLs without parsing JSON or executing .env.
      local config_hash
      if command -v sha256sum >/dev/null; then
        config_hash="$(compose config --format json | sha256sum)"
      elif command -v shasum >/dev/null; then
        config_hash="$(compose config --format json | shasum -a 256)"
      else
        fail 'sha256sum or shasum is required.'
      fi
      config_hash="${config_hash%% *}"
      [[ "$config_hash" =~ ^[0-9a-f]{64}$ ]] || fail 'Could not fingerprint the Compose configuration.'
      release_tag="$git_commit-${config_hash:0:16}"
      ;;
  esac

  case "$action" in
    prepare)
      printf 'Building frontend release %s; services will not start.\n' "$release_tag"
      compose --parallel 1 build frontend
      ;;
    up)
      docker_access docker image inspect "retreat-client:$release_tag" >/dev/null 2>&1 ||
        fail 'No prepared image matches this commit and this configuration. Run bash deploy.sh prepare first.'
      compose up -d --no-deps --no-build --pull never --wait --wait-timeout 120 frontend
      printf 'Frontend health check passed. Public HTTPS and login acceptance are separate steps.\n'
      ;;
    status) compose ps --all ;;
    logs) compose logs --tail=100 frontend ;;
  esac
}

main "$@"
