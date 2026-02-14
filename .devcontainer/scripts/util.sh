#!/usr/bin/env bash
set -euo pipefail

# Detect if terminal supports color
if [[ -t 1 ]]; then
  RED="\033[1;31m"
  GREEN="\033[1;32m"
  YELLOW="\033[1;33m"
  BLUE="\033[1;34m"
  MAGENTA="\033[1;35m"
  CYAN="\033[1;36m"
  NC="\033[0m"
else
  RED=""
  GREEN=""
  YELLOW=""
  BLUE=""
  MAGENTA=""
  CYAN=""
  NC=""
fi

log() {
  local color="$1"
  shift
  local message="$*"

  case "$color" in
    red)     printf "${RED}%s${NC}\n" "$message" ;;
    green)   printf "${GREEN}%s${NC}\n" "$message" ;;
    yellow)  printf "${YELLOW}%s${NC}\n" "$message" ;;
    blue)    printf "${BLUE}%s${NC}\n" "$message" ;;
    magenta) printf "${MAGENTA}%s${NC}\n" "$message" ;;
    cyan)    printf "${CYAN}%s${NC}\n" "$message" ;;
    *)       printf "%s\n" "$message" ;;
  esac
}