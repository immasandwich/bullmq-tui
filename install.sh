#!/bin/sh
set -e

# bullmq-tui installer
# Usage: curl -fsSL https://raw.githubusercontent.com/immasandwich/bullmq-tui/main/install.sh | sh

REPO="immasandwich/bullmq-tui"
INSTALL_DIR="${INSTALL_DIR:-/usr/local/bin}"
BINARY_NAME="bullmq-tui"

# Detect OS
detect_os() {
  case "$(uname -s)" in
    Darwin) echo "darwin" ;;
    Linux) echo "linux" ;;
    *) echo "Unsupported OS: $(uname -s)" >&2; exit 1 ;;
  esac
}

# Detect architecture
detect_arch() {
  case "$(uname -m)" in
    x86_64|amd64) echo "x64" ;;
    arm64|aarch64) echo "arm64" ;;
    *) echo "Unsupported architecture: $(uname -m)" >&2; exit 1 ;;
  esac
}

# Get latest release tag
get_latest_version() {
  curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest" | 
    grep '"tag_name":' | 
    sed -E 's/.*"([^"]+)".*/\1/'
}

main() {
  OS=$(detect_os)
  ARCH=$(detect_arch)
  
  echo "Detected: ${OS}-${ARCH}"
  
  # Get latest version
  VERSION=$(get_latest_version)
  if [ -z "$VERSION" ]; then
    echo "Error: Could not determine latest version" >&2
    exit 1
  fi
  
  echo "Latest version: ${VERSION}"
  
  # Construct download URL
  BINARY="bullmq-tui-${OS}-${ARCH}"
  URL="https://github.com/${REPO}/releases/download/${VERSION}/${BINARY}"
  
  echo "Downloading ${URL}..."
  
  # Create temp directory
  TMP_DIR=$(mktemp -d)
  trap "rm -rf ${TMP_DIR}" EXIT
  
  # Download binary
  curl -fsSL "${URL}" -o "${TMP_DIR}/${BINARY_NAME}"
  
  # Make executable
  chmod +x "${TMP_DIR}/${BINARY_NAME}"
  
  # Install
  if [ -w "${INSTALL_DIR}" ]; then
    mv "${TMP_DIR}/${BINARY_NAME}" "${INSTALL_DIR}/${BINARY_NAME}"
  else
    echo "Installing to ${INSTALL_DIR} (requires sudo)..."
    sudo mv "${TMP_DIR}/${BINARY_NAME}" "${INSTALL_DIR}/${BINARY_NAME}"
  fi
  
  echo ""
  echo "Successfully installed ${BINARY_NAME} to ${INSTALL_DIR}/${BINARY_NAME}"
  echo ""
  echo "Run 'bullmq-tui --help' to get started"
}

main
