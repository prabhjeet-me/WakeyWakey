#!/usr/bin/env bash
set -euo pipefail

source .devcontainer/scripts/util.sh

# Fix permissions
sudo chown -R $USER:$USER /home/${USER}/.local

log blue "Installing python packages..."

# Install required packages
pip install -r .devcontainer/others/requirements.txt

log green "✅ Devcontainer successfully started!"
