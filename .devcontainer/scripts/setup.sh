#!/bin/bash
# Trusts the `mise.toml` in the current directory,
# then installs all tools and versions defined there.
# The `&&` ensures each step runs only if the previous one succeeds.
# Full paths are used so it works without relying on `PATH`.
#
# setup_project.sh is invoked here directly (not just via mise's `[hooks]
# enter` in mise.toml) so the commitizen/pre-commit bootstrap is guaranteed
# to run once during container creation, regardless of whether an
# interactive shell's `mise activate` enter-hook fires it later.
/usr/local/bin/mise trust "$PWD/mise.toml" && /usr/local/bin/mise install && bash ./.devcontainer/scripts/setup_project.sh
echo "$PWD" # /workspaces/k8sgitops