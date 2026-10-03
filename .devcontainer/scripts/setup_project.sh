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

# kubectl completion for bash. Guarded on the marker comment (not `command -v kubectl`,
# which isn't on PATH yet this early in provisioning) so it's only appended once,
# making this safe to rerun.
if ! grep -q '# kubectl completion' ~/.bashrc 2>/dev/null; then
  cat << 'EOF' >> ~/.bashrc

# kubectl completion
if command -v kubectl >/dev/null 2>&1; then
    source <(kubectl completion bash)
    alias k=kubectl
    complete -o default -F __start_kubectl k
fi

EOF
fi
