#!/bin/bash

# Run the full release process. This means...
# - Bumping the version in package.json
# - Updating the changelog
# - Commiting and tagging the release
# - Pushing to Github
# - Publishing a new version to npm
# - Deploying the website
# - Create a new release in Github with the zip-file standalone version

set -euox pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <minor | patch | version>"
  echo "e.g. $0 patch"
  exit 1
fi
version_arg="$1"

# Bump versions in package.json and package-lock.json, but don't commit or make tags yet
version=$(npm version "$version_arg" --no-git-tag-version --no-commit-hooks | sed 's/^v//g')
tagname="v$version"

script_dir=$(dirname "$0")

# Prepend the changelog update to CHANGELOG.md
changelog_update=$("$script_dir/print-changelog-update.sh" "$version")

echo -e "$changelog_update\n" > CHANGELOG.md.new
cat CHANGELOG.md >> CHANGELOG.md.new
mv CHANGELOG.md.new CHANGELOG.md

# Commit and tag the release
git add CHANGELOG.md package.json package-lock.json
git commit -m "$version"
git tag "$tagname"

# Push to Github
git push
git push --tags

# Publish to npm
npm publish

# Create a new release on Github
"$script_dir/prepare-zip-file.sh"
gh release create "$tagname" --title "$tagname" --notes "$changelog_update" --attach "dist/release/speedscope-$version.zip"

# Deploy the website
npm run deploy