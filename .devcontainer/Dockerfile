FROM mcr.microsoft.com/devcontainers/base:ubuntu-24.04

COPY --from=jdxcode/mise /usr/local/bin/mise /usr/local/bin/

# python3-pip/pipx for scripts/setup_project.sh (installs commitizen); pre-commit for its git hooks.
RUN apt-get update && apt-get install -y --no-install-recommends \
      python3-pip \
      pipx \
      pre-commit \
    && rm -rf /var/lib/apt/lists/*

ENV PATH="/home/vscode/.local/bin:${PATH}"

# Make sure mise is activated in both zsh and bash.
# Might be overridden by a user's dotfiles.
RUN echo 'eval "$(mise activate bash)"' >> /home/vscode/.bashrc && \
  echo 'eval "$(mise activate zsh)"' >> /home/vscode/.zshrc