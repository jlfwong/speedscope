# Contributing to speedscope

Hi! This is a short guide & set of guidelines for contributing to speedscope.
Contributors of all skill levels are welcome to submit pull requests.

This project adheres to the Contributor Covenant [code of conduct](./CODE_OF_CONDUCT.md).
All contributors are expected to uphold this code of conduct.

## Setting up for development

To start running speedscope locally, run the following:

    git clone https://github.com/jlfwong/speedscope.git
    cd speedscope
    npm install
    npm run serve

This should open up a running version of speedscope in your default browser.

In your terminal, you should see something like this:

    $ npm run serve
    > speedscope@0.7.1 serve /Users/jlfwong/code/speedscope
    > parcel assets/index.html --open --no-autoinstall

    Server running at http://localhost:1234
    ✨  Built in 7.30s.

Most of speedscope is written in TypeScript. If you're unfamiliar with
TypeScript, then you can either just try to learn it as you go, then the
[official TypeScript
documentation](https://www.typescriptlang.org/docs/home.html) may be of use
to you!

If you're not sure where the code you want to modify lives, the [`README.md`
in the `src/` directory](./src/README.md) might be helpful.

## Code formatting

All TypeScript code in speedscope is automatically formatted with
[Prettier](https://prettier.io/). This means that while you're writing your code,
you don't have to worry about following a formatting guide, because a program will
format your code for you!

The easiest way to use Prettier is via an editor integration. See the [Editor
Integration](https://prettier.io/docs/en/editors.html) page from Prettier's
documentation for help with that.

If you don't want to do that, you can alternatively run the autoformatter by
running `npm run prettier`.

## Running tests

All TypeScript tests are written use [Jest](https://jestjs.io/). To run the
tests, run `npm run jest`.

## Contributing new features

Before contributing code to implement a new feature, please open an issue to
discuss it first. Large pull requests that are submitted without first getting
maintainer buy-in are unlikely to be reviewed or merged.

For features that will cause a visual change, please include visual mockups of
the change you're planning on making.

## Contributing bug fixes

If you discover a bug, please file an issue. If the code change required to
fix it is small (< ~20 lines), then feel free to just open a PR to fix the
issue without trying to get buy-in ahead of time.
