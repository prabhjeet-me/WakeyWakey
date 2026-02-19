#!/usr/bin/env bash
set -euo pipefail

source .devcontainer/scripts/util.sh

log blue "Updating npm"

npm install -g npm@11.10.0

log blue "Installing node packages..."

# Install angular
npm i -g @angular/cli@20
npm i

echo "source <(ng completion script)" >> ~/.bashrc

source ~/.bashrc

log green "✅ Devcontainer successfully started!"
