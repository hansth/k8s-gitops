#!/bin/bash
# A bootstrap block provisions commitizen and commit hooks on first run. 
# It checks if the `cz` command exists; if so, it skips, making it safe to rerun.
# If `cz` is missing, it configures git for upstream branches and directory trust,
# installs pipx, uses pipx to install commitizen, and sets up pre-commit hooks
# for checks and message validation against Conventional Commits.
if ! command -v cz >/dev/null; then
  git config --global user.name "Hans ter Horst"
  git config --global user.email "hans@hansterhorst.com"
  git config --global push.autoSetupRemote true
  git config --global --add safe.directory "$PWD"
  pip install --user pipx
  pipx install commitizen
  pre-commit install
  pre-commit install --hook-type commit-msg
fi