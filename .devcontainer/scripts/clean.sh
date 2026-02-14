#!/usr/bin/env bash
set -euo pipefail

source .devcontainer/scripts/util.sh

if [ "$#" -eq 0 ]; then
  log red "Usage: $0 <folder1> [folder2 ...]"
  exit 1
fi

for dir in "$@"; do
  if [ ! -d "$dir" ]; then
    log yellow "Skipping '$dir' (not a directory)"
    continue
  fi

  log blue "Cleaning folder: $dir"

  # Delete everything except .gitkeep
  find "$dir" -mindepth 1 ! -name '.gitkeep' -exec rm -rf {} +

done

log green "✅ Done"
