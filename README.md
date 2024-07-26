# Pubspec Lock Changes

Inspired from [yarn-lock-changes](https://github.com/Simek/yarn-lock-changes).

Creates a comment inside Pull Request with the human-readable summary of the
changes to the `pubspec.lock` file. Works in public and private repositories,
offers a degree of customization.

## Usage

### ⚡️ Workflow Example

```yaml
name: Pubspec Lock Changes
on: [pull_request]

jobs:
  yarn_lock_changes:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Pubspec Lock Changes
        # Please use `main` as version before the stable release will be published as `v1`.
        uses: mogaming217/pubspec-lock-changes@main
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          # Comma separated libraries to track changes.
          target-libraries: 'http,uuid'
          # Optional inputs, can be deleted safely if you are happy with default values.
          path: pubspec.lock
          base-branch: main
          comment-if-no-changes: true
```
