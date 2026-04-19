#!/bin/bash
# Wrapper to run cipher without PATH issues
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
node "$SCRIPT_DIR/dist/index.cjs" "$@"