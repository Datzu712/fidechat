#!/bin/sh
# PreToolUse hook: blocks edits to files of this repo while their checkout is
# on main, so work starts on a branch instead of being moved there afterwards.
path=$(jq -r '.tool_input.file_path // .tool_input.notebook_path // empty')
[ -n "$path" ] || exit 0

dir=$(dirname "$path")
while [ ! -d "$dir" ]; do dir=$(dirname "$dir"); done

# Only this repository (any of its worktrees), not other files on disk.
target=$(git -C "$dir" rev-parse --path-format=absolute --git-common-dir 2>/dev/null) || exit 0
repo=$(git -C "$CLAUDE_PROJECT_DIR" rev-parse --path-format=absolute --git-common-dir 2>/dev/null)
[ "$target" = "$repo" ] || exit 0

if [ "$(git -C "$dir" branch --show-current)" = "main" ]; then
    echo "This checkout is on main. Create a branch before editing: git switch -c <type>/<topic>" >&2
    exit 2
fi

# todo: create a branch protection rule too