#!/usr/bin/env bash
set -euo pipefail

source .devcontainer/scripts/util.sh

log blue "Updating npm..."

npm install -g npm@11.6.2

log blue "Installing node packages..."

# Install angular
npm i -g @angular/cli@20
npm i

echo "source <(ng completion script)" >> ~/.bashrc
echo "alias nr='npm run'" >> ~/.bashrc

source ~/.bashrc

log green "✅ Devcontainer successfully started!"
