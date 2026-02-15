#!/usr/bin/env bash
set -euo pipefail

source .devcontainer/scripts/util.sh

log blue "Updating owner for packages volume..."

# Fix permissions
sudo chown -R $USER:$USER /home/${USER}/.local

pip install --upgrade pip

log blue "Installing python packages..."

# Install required packages
pip install -r .devcontainer/others/requirements.txt

# Add python alias
echo "alias py='python'" >> ~/.bashrc

log blue "Installing node packages..."

# Install angular
npm i -g @angular/cli@20
npm i

echo "source <(ng completion script)" >> ~/.bashrc

source ~/.bashrc

log green "✅ Devcontainer successfully started!"
