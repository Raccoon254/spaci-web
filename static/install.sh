#!/usr/bin/env bash
# Spaci installer
# Usage: curl -fsSL https://spaci.kentom.co.ke/install.sh | bash
set -euo pipefail

FEED="https://spaci.kentom.co.ke/updates"
SITE="https://spaci.kentom.co.ke"
APP_NAME="Spaci"

BOLD='\033[1m'; RESET='\033[0m'; DIM='\033[2m'
GREEN='\033[0;32m'; BLUE='\033[0;34m'; RED='\033[0;31m'; YELLOW='\033[1;33m'
step() { echo -e "\n${BLUE}==>${RESET} ${BOLD}$*${RESET}"; }
ok()   { echo -e "  ${GREEN}done${RESET}  $*"; }
warn() { echo -e "  ${YELLOW}!${RESET}  $*"; }
die()  { echo -e "\n  ${RED}x${RESET}  $*" >&2; exit 1; }

draw_bar() {
  local current=$1 total=$2 width=36 pct=0 filled empty bar="" i
  [[ $total -gt 0 ]] && pct=$(( current * 100 / total ))
  filled=$(( pct * width / 100 )); empty=$(( width - filled ))
  for ((i=0; i<filled; i++)); do bar+="#"; done
  for ((i=0; i<empty; i++)); do bar+="-"; done
  printf "\r  ${DIM}[${RESET}%s${DIM}]${RESET} %3d%%  ${DIM}%d / %d MB${RESET}   " \
    "$bar" "$pct" "$(( current / 1048576 ))" "$(( total / 1048576 ))"
}
finish_bar() {
  printf "\r  ${DIM}[${RESET}"; local i; for ((i=0; i<36; i++)); do printf "#"; done
  printf "${DIM}]${RESET} 100%%  done                    \n"
}
download() {
  local url="$1" dest="$2" total pid cur
  total="$(curl -sIL "$url" | grep -i '^content-length' | tail -1 | awk '{print $2}' | tr -d '\r\n')"
  total="${total:-0}"
  curl -fsSL "$url" -o "$dest" & pid=$!
  while kill -0 "$pid" 2>/dev/null; do
    cur=0; [[ -f "$dest" ]] && cur="$(stat -f%z "$dest" 2>/dev/null || stat -c%s "$dest" 2>/dev/null || echo 0)"
    draw_bar "$cur" "$total"; sleep 0.2
  done
  wait "$pid" || die "Download failed. Get it manually at ${SITE}/download"
  finish_bar
}
read_version() {
  curl -fsSL "$1" 2>/dev/null | grep '^version:' | awk '{print $2}' | tr -d '\r'
}

echo ""
echo -e "${BOLD}  Spaci${RESET}  ${DIM}${SITE}${RESET}"

OS="$(uname -s)"; ARCH="$(uname -m)"

if [[ "$OS" == "Darwin" ]]; then
  step "Checking the latest version"
  VERSION="$(read_version "${FEED}/latest-mac.yml")"
  [[ -n "$VERSION" ]] || die "Could not reach ${SITE}. Check your connection."

  DEST="/Applications/${APP_NAME}.app"
  INSTALLED=""
  [[ -d "$DEST" ]] && INSTALLED="$(defaults read "${DEST}/Contents/Info" CFBundleShortVersionString 2>/dev/null || true)"
  if [[ "$INSTALLED" == "$VERSION" ]]; then
    ok "Already on v${VERSION}."; open "$DEST" 2>/dev/null || true; echo ""; exit 0
  fi
  [[ -n "$INSTALLED" ]] && warn "Updating v${INSTALLED} to v${VERSION}" || ok "Latest is v${VERSION}"

  if [[ "$ARCH" == "arm64" ]]; then
    ZIP="Spaci-${VERSION}-arm64-mac.zip"; LABEL="Apple Silicon"
  else
    ZIP="Spaci-${VERSION}-mac.zip"; LABEL="Intel"
  fi
  TMP="$(mktemp -d)/${ZIP}"
  step "Downloading ${APP_NAME} v${VERSION} (${LABEL})"
  download "${FEED}/${ZIP}" "$TMP"

  step "Installing to /Applications"
  EXTRACT="$(mktemp -d)"
  ditto -x -k "$TMP" "$EXTRACT" 2>/dev/null || die "Could not unpack the download."
  APP="$(find "$EXTRACT" -maxdepth 2 -name '*.app' | head -1)"
  [[ -n "$APP" ]] || die "No app found inside the download."
  [[ -d "$DEST" ]] && rm -rf "$DEST"
  ditto "$APP" "$DEST"
  rm -rf "$EXTRACT" "$(dirname "$TMP")"
  # Spaci is not notarized yet, so clear the quarantine flag so it opens cleanly.
  xattr -cr "$DEST" 2>/dev/null || true
  ok "Installed to ${DEST}"

  echo ""; echo -e "${GREEN}${BOLD}  Spaci v${VERSION} is ready.${RESET}"; echo ""
  open "$DEST" 2>/dev/null || true

elif [[ "$OS" == "Linux" ]]; then
  step "Checking the latest version"
  VERSION="$(read_version "${FEED}/latest-linux.yml")"
  [[ -n "$VERSION" ]] || die "Could not reach ${SITE}. Check your connection."
  ok "Latest is v${VERSION}"

  BIN_DIR="${HOME}/.local/bin"; mkdir -p "$BIN_DIR"
  DEST="${BIN_DIR}/Spaci.AppImage"
  step "Downloading ${APP_NAME} v${VERSION} (AppImage)"
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

  echo ""; echo -e "${GREEN}${BOLD}  Spaci v${VERSION} is ready.${RESET}  Run: ${DEST}"; echo ""

else
  die "Unsupported OS: ${OS}. Download manually at ${SITE}/download"
fi
