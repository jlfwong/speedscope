#!/bin/bash

# Print changes since the last tagged release in a format to match CHANGELOG.md

set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <version>"
  echo "e.g. $0 1.15.2"
  exit 1
fi
version="$1"


# Get the most recent tagged commit that is an ancestor of HEAD
tagged_commit=$(git log --simplify-by-decoration --oneline --decorate | grep -E '^\w+ \(tag: .+\) .+$' | head -n1 | cut -d' ' -f 1)

gitlog=$(git log --graph --pretty=format:"%s" --abbrev-commit "$tagged_commit"..HEAD)

version="$1"

current_date=$(date +%Y-%m-%d)
echo "## [$version] - $current_date"
echo

while IFS= read line; do
  message=$(echo "$line" | sed 's/^* //g')
  message_without_pr_num=$(echo "$message" | sed 's/ (#[0-9][0-9]*)//g')

  pr_number=$(echo "$message" | grep -Eo '#[0-9]+' | grep -Eo '[0-9]+'; true)

  if [[ -n "$pr_number" ]]; then
    author=$(gh pr view $pr_number --json author -q ".author.login")
    pr_link="https://github.com/jlfwong/speedscope/pull/$pr_number"
    echo "- $message_without_pr_num [[#$pr_number]($pr_link)] (by @$author)"
  else
    echo "- $message_without_pr_num"
  fi
done <<< "$gitlog"