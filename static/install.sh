#!/usr/bin/env bash
# Spaci installer
# Usage: curl -fsSL https://spaci.kentom.co.ke/install.sh | bash
set -euo pipefail

FEED="https://spaci.kentom.co.ke/updates"
SITE="https://spaci.kentom.co.ke"
APP_NAME="Spaci"

# ── palette (256-colour) + glyphs ───────────────────────────────────────────
RESET=$'\033[0m'; BOLD=$'\033[1m'; DIM=$'\033[2m'
ACCENT=$'\033[38;5;33m'    # royal blue
GREEN=$'\033[38;5;42m'
YELLOW=$'\033[38;5;220m'
RED=$'\033[38;5;203m'
GREY=$'\033[38;5;245m'

G_RING="◌"; G_ARR="❯"; G_OK="✓"; G_WARN="⚠"; G_ERR="✗"
SPIN=(⠋ ⠙ ⠹ ⠸ ⠼ ⠴ ⠦ ⠧ ⠇ ⠏)

step() { printf "\n  ${ACCENT}${G_ARR}${RESET} ${BOLD}%s${RESET}\n" "$*"; }
ok()   { printf "    ${GREEN}${G_OK}${RESET} %s\n" "$*"; }
warn() { printf "    ${YELLOW}${G_WARN}${RESET} %s\n" "$*"; }
die()  { printf "\n    ${RED}${G_ERR}${RESET} %s\n\n" "$*" >&2; exit 1; }

# ── smooth eighth-block progress bar ─────────────────────────────────────────
PARTS=("" ▏ ▎ ▍ ▌ ▋ ▊ ▉)
DL_START=0
draw_bar() {
  local current=$1 total=$2 width=30
  local pct=0 filled8=0
  if [[ $total -gt 0 ]]; then
    pct=$(( current * 100 / total ))
    filled8=$(( current * width * 8 / total ))
  fi
  local full=$(( filled8 / 8 )) part=$(( filled8 % 8 ))
  local fill="" empty="" i used=$full
  for ((i = 0; i < full; i++)); do fill+="█"; done
  if [[ $part -gt 0 && $full -lt $width ]]; then fill+="${PARTS[$part]}"; used=$((full + 1)); fi
  for ((i = used; i < width; i++)); do empty+="░"; done
  local cur_mb=$(( current / 1048576 )) tot_mb=$(( total / 1048576 ))
  local elapsed=$(( SECONDS - DL_START )); [[ $elapsed -lt 1 ]] && elapsed=1
  local mbps=$(( cur_mb / elapsed ))
  printf "\r    ${ACCENT}%s${DIM}%s${RESET}  ${BOLD}%3d%%${RESET}  ${GREY}%d/%d MB · %d MB/s${RESET}   " \
    "$fill" "$empty" "$pct" "$cur_mb" "$tot_mb" "$mbps"
}
finish_bar() {
  local width=30 bar="" i
  for ((i = 0; i < width; i++)); do bar+="█"; done
  printf "\r    ${GREEN}%s${RESET}  ${BOLD}100%%${RESET}  ${GREY}done${RESET}                      \n" "$bar"
}

download() {
  local url="$1" dest="$2" total pid cur
  total="$(curl -sIL "$url" | grep -i '^content-length' | tail -1 | awk '{print $2}' | tr -d '\r\n')"
  total="${total:-0}"
  DL_START=$SECONDS
  curl -fsSL "$url" -o "$dest" & pid=$!
  while kill -0 "$pid" 2>/dev/null; do
    cur=0; [[ -f "$dest" ]] && cur="$(stat -f%z "$dest" 2>/dev/null || stat -c%s "$dest" 2>/dev/null || echo 0)"
    draw_bar "$cur" "$total"; sleep 0.12
  done
  wait "$pid" || die "Download failed. Get it manually at ${SITE}/download"
  finish_bar
}

# ── braille spinner around a background job ──────────────────────────────────
spin() {
  local label="$1"; shift
  ( "$@" ) & local pid=$! i=0
  while kill -0 "$pid" 2>/dev/null; do
    printf "\r    ${ACCENT}%s${RESET} ${GREY}%s${RESET}" "${SPIN[i++ % ${#SPIN[@]}]}" "$label"
    sleep 0.08
  done
  if wait "$pid"; then
    printf "\r    ${GREEN}${G_OK}${RESET} %s                         \n" "$label"
  else
    printf "\r    ${RED}${G_ERR}${RESET} %s\n" "$label"; return 1
  fi
}

read_version() {
  curl -fsSL "$1" 2>/dev/null | grep '^version:' | awk '{print $2}' | tr -d '\r'
}

# ── header ───────────────────────────────────────────────────────────────────
printf "\n  ${ACCENT}${BOLD}%s spaci${RESET}\n" "$G_RING"
printf "  ${GREY}reclaim your disk · %s${RESET}\n" "$SITE"

OS="$(uname -s)"; ARCH="$(uname -m)"

if [[ "$OS" == "Darwin" ]]; then
  step "Checking the latest version"
  VERSION="$(read_version "${FEED}/latest-mac.yml")"
  [[ -n "$VERSION" ]] || die "Could not reach ${SITE}. Check your connection."

  DEST="/Applications/${APP_NAME}.app"
  INSTALLED=""
  [[ -d "$DEST" ]] && INSTALLED="$(defaults read "${DEST}/Contents/Info" CFBundleShortVersionString 2>/dev/null || true)"
  if [[ "$INSTALLED" == "$VERSION" ]]; then
    ok "Already on v${VERSION}"; open "$DEST" 2>/dev/null || true; printf "\n"; exit 0
  fi
  [[ -n "$INSTALLED" ]] && warn "Updating v${INSTALLED} to v${VERSION}" || ok "Latest is v${VERSION}"

  if [[ "$ARCH" == "arm64" ]]; then
    ZIP="Spaci-${VERSION}-arm64-mac.zip"; LABEL="Apple Silicon"
  else
    ZIP="Spaci-${VERSION}-mac.zip"; LABEL="Intel"
  fi
  TMPDIR_DL="$(mktemp -d)"; TMP="${TMPDIR_DL}/${ZIP}"
  step "Downloading ${APP_NAME} v${VERSION} ${GREY}(${LABEL})${RESET}"
  download "${FEED}/${ZIP}" "$TMP"

  step "Installing to /Applications"
  EXTRACT="$(mktemp -d)"
  spin "Unpacking" ditto -x -k "$TMP" "$EXTRACT" || die "Could not unpack the download."
  APP="$(find "$EXTRACT" -maxdepth 2 -name '*.app' | head -1)"
  [[ -n "$APP" ]] || die "No app found inside the download."
  [[ -d "$DEST" ]] && rm -rf "$DEST"
  spin "Copying ${APP_NAME}.app" ditto "$APP" "$DEST" || die "Could not copy the app."
  rm -rf "$EXTRACT" "$TMPDIR_DL"
  # Spaci is not notarized yet, so clear the quarantine flag so it opens cleanly.
  xattr -cr "$DEST" 2>/dev/null || true
  ok "Quarantine cleared"

  printf "\n  ${GREEN}${BOLD}%s Spaci v%s is ready.${RESET}  ${GREY}Opening…${RESET}\n\n" "$G_OK" "$VERSION"
  open "$DEST" 2>/dev/null || true

elif [[ "$OS" == "Linux" ]]; then
  step "Checking the latest version"
  VERSION="$(read_version "${FEED}/latest-linux.yml")"
  [[ -n "$VERSION" ]] || die "Could not reach ${SITE}. Check your connection."
  ok "Latest is v${VERSION}"

  BIN_DIR="${HOME}/.local/bin"; mkdir -p "$BIN_DIR"
  DEST="${BIN_DIR}/Spaci.AppImage"
  step "Downloading ${APP_NAME} v${VERSION} ${GREY}(AppImage)${RESET}"
  download "${FEED}/Spaci-${VERSION}.AppImage" "$DEST"
  chmod +x "$DEST"
  ok "Installed to ${DEST}"

  APPS="${HOME}/.local/share/applications"; mkdir -p "$APPS"
  cat > "${APPS}/spaci.desktop" <<EOF
[Desktop Entry]
Name=Spaci
Comment=Reclaim your disk from build artifacts
Exec=${DEST}
Type=Application
Categories=Development;Utility;
Terminal=false
EOF
  ok "Added Spaci to your application menu"
  case ":${PATH}:" in
    *":${BIN_DIR}:"*) ;;
    *) warn "Add ${BIN_DIR} to your PATH to launch 'Spaci.AppImage' from a terminal." ;;
  esac

  printf "\n  ${GREEN}${BOLD}%s Spaci v%s is ready.${RESET}  ${GREY}Run: %s${RESET}\n\n" "$G_OK" "$VERSION" "$DEST"

else
  die "Unsupported OS: ${OS}. Download manually at ${SITE}/download"
fi
