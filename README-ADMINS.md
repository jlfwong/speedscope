This document describes processes needed by admins of this repository.

At time of writing, deployment assumes you're running macOS. It probably
works if you're on a linux, and almost definitely does not work on Windows.

## Test the release

Speedscope is tested in CI, so all the automated tests should be passing. We'll
just be doing a few sanity checks to make sure the build & deployment machinery is working correctly.

    scripts/prepare-test-installation.sh

This will do a mock publish & installation to ensure that the version we're about to publish is going to
work. At the end of this command, it should echo a `cd` command to run in your shell
to switch to the installation directory. Something like this:

```
Run the following command to switch into the test directory
cd /var/folders/l0/qtd9z14973s2tw81vmzwkyp00000gp/T/speedscope-test-installation.9Ssdd2PZ/package
```

Run this command, to switch to the test directory.

Inside of here, run `bin/cli.mjs`. This should open a copy of speedscope in browser.
Try importing a profile from disk via the browse button and make sure it works.

Next, try running `bin/cli.mjs dist/release/perf-vertx*`. This should immediately open
speedscope in browser, and the perf-vertx file should load immediately.

## Create & publish the new release

Ensure you have the Github CLI tools installed and you're authenticated. Try running the following if you're unsure:

    gh auth status
    npm whoami

In your default browser, ensure that you're logged into your npm account, otherwise you'll see a 404 page when you open the authenticate link during the npm publish.

Once ready to publish, run:

    scripts/publish-and-deploy.sh

## Verifying the release

To verify that the npm publish was successful, run `npm install -g speedscope`.
Try `speedscope`, which should open speedscope in browser.
Try `speedscope sample/profiles/stackcollapse/simple.txt`, which should immediately load the profile.

To verify the website has finished deploying, check the version number shown in the console of https://www.speedscope.app/
