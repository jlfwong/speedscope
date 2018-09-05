This document describes processes needed by admins of this repository.

# Publishing

Publishing speedscope is a multi-step process:

1.  Test the release
2.  Prepare the release
3.  Publish to npm
4.  Deploy the website
5.  Upload a release to GitHub

At time of writing, deployment assumes you're running macOS. It probably
works if you're on a linux, and almost definitely does not work on Windows.

## Test the release

Speedscope is tested in CI, so all the automated tests should be passing. We'll
just be doing a few sanity checks to make sure the build & deployment machinery is working correctly.

Run `scripts/prepare-test-installation.sh`. This will do a mock publish &
installation to ensure that the version we're about to publish is going to
work. At the end of this command, it should echo a `cd` command to run in your shell
to switch to the installation directory. Something like this:

```
Run the following command to switch into the test directory
cd /var/folders/l0/qtd9z14973s2tw81vmzwkyp00000gp/T/speedscope-test-installation.9Ssdd2PZ/package
```

Run this command, to switch to the test directory.

Inside of here, run `bin/cli.js`. This should open a copy of speedscope in browser.
Try importing a profile from disk via the browse button and make sure it works.

Next, try running `bin/cli.js dist/release/perf-vertx*`. This should immediately open
speedscope in browser, and the perf-vertx file should load immediately.

If everything looks good, proceed to "Prepare the release".

## Prepare the release

1.  Update the version manually in package.json (we intentionally don't use the `npm version` command)
2.  Update CHANGELOG.md to indicate the changes that were made as part of this release
3.  Commit the changes with the version name as the commit message, e.g. `git commit -m 0.6.0`
4.  `git tag` the release. We use tags like `v0.6.0`, e.g. `git tag v0.6.0`
5.  `git push && git push --tags`

## Publish to npm

Assuming everything went well in the previous two phases, publishing should just be
a matter of running `npm publish`.

### Verifying the publish

To verify that the publish was successful, run `npm install -g speedscope`.
Try `speedscope`, which should open speedscope in browser.
Try `speedscope sample/profiles/stackcollapse/simple.txt`, which should immediately load the profile.

## Deploying the website

This step must follow the "Publish to npm" step, since it uses assets from
the npm publish.

https://www.speedscope.app/ is hosted on GitHub pages, and is published via pushing
to the `gh-pages` branch. The `gh-pages` branch has totally different contents than
other branches of this repository: https://github.com/jlfwong/speedscope/tree/gh-pages.

It's populated by a deploy script which is invoked by running `npm run deploy` script. This populate a directory with assets pulled from npm, and
boot a local server for you to test the compiled assets. Please do not skip
the manual testing in this step.

If everything looks good, you should be able to hit Ctrl+C, and you should see this prompt:

```
Commit release? [yes/no]:
```

If everything looks good, type `yes` then enter. This will commit to the `gh-pages` branch, and the site should automatically deploy shortly after.

To check if a deploy has happened, you can check https://www.speedscope.app/release.txt
which includes the version, the date, and the commit of the deploy.

## Upload a release to GitHub

This step must follow the "Publish to npm" step, since it uses assets from
the npm publish.

To make a zipfile suitable for uploading to GitHub as a release, run `scripts/prepare-zip-file.sh`.

Once that's done, you should have a zip file in `dist/release/`

Upload that file along with changelog notes to https://github.com/jlfwong/speedscope/releases/new
