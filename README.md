# Pubspec Lock Changes

Inspired from [yarn-lock-changes](https://github.com/Simek/yarn-lock-changes).

Creates a comment inside Pull Request with the human-readable summary of the
changes to the `pubspec.lock` file. Works in public and private repositories,
offers a degree of customization.

## Usage

### ⚡️ Workflow Example

```yml
name: Pubspec Lock Changes
on: [pull_request]

jobs:
  yarn_lock_changes:
    runs-on: ubuntu-latest
    # Permission overwrite is required for Dependabot PRs, see "Common issues" section below.
    permissions:
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

### 🔌 Inputs

| Input                  |      Required      |   Default   | Description                                                                                                       |
| ---------------------- | :----------------: | :---------: | ----------------------------------------------------------------------------------------------------------------- |
| `token`                | <ins>**Yes**</ins> |      –      | Repository `GITHUB_TOKEN` which allows action to make calls to the GitHub API (Octokit).                          |
| `collapsibleThreshold` |         No         |    `25`     | Number of lock changes, which will result in collapsed comment content, and an addition of changes summary table. |
| `failOnDowngrade`      |         No         |   `false`   | WFail the action when a dependency downgrade is detected. **Comment will still be posted.**                       |
| `path`                 |         No         | `yarn.lock` | Path to the `yarn.lock` file in the repository. Default value points to the file at project root.                 |
| `updateComment`        |         No         |   `true`    | Update the comment on each new commit. If value is set to `false`, bot will post a new comment on each change.    |
| `groupByType`          |         No         |   `false`   | Group the dependencies in the comment table by the change type.                                                   |

## 📸 Preview

### Basic comment appearance

<img alt="basic" src="https://user-images.githubusercontent.com/719641/116818857-c5029d80-ab6d-11eb-8b48-122b851c1d9e.png">

### Comment appearance when `collapsibleThreshold` has been reached

<img alt="summary" src="https://user-images.githubusercontent.com/719641/116819012-7efa0980-ab6e-11eb-99f1-15996b6f12b4.png">

## 📋 Common issues

### The action fails on the Dependabot pull requests

Due to the security reasons from March 1st, 2021 workflow runs that are
triggered by Dependabot have permissions reduced by default:

- [GitHub Actions: Workflows triggered by Dependabot PRs will run with read-only permissions](https://github.blog/changelog/2021-02-19-github-actions-workflows-triggered-by-dependabot-prs-will-run-with-read-only-permissions/)

To ensure that sufficient permissions for this action are always granted, you
will need to add `permissions` entry to the job which runs `yarn-lock-changes`:

```yml
jobs:
  ...:
    runs-on: ...
    #####
    permissions:
      pull-requests: write
    #####
    steps: ...
```

### The action fails in a private repository

After one of the GitHub Actions security breaches GitHub decided to trim down
the default permission set for actions running in private repositories.

If you are trying to run action with default setup in the private repository,
you will see the following error during `checkout` step:

```sh
remote: Repository not found.
Error: fatal: repository 'https://github.com/<your_user>/<your_repo>/' not found
Error: The process '/usr/bin/git' failed with exit code 128
```

This means that you will need to add the following `permissions` entry to the
job which runs `checkout`:

```yml
jobs:
  ...:
    runs-on: ...
    #####
    permissions:
      contents: read
    #####
    steps: ...
```

If you would like to learn a little bit more about this problem, you can visit
this issue in the GitHub Checkout Action repository:

- https://github.com/actions/checkout/issues/254

## 🔍️ Debugging

To run action in the debug mode you need to add the `ACTIONS_STEP_DEBUG`
repository secret and set it to `true`, as stated in the
[GitHub documentation](https://docs.github.com/en/actions/managing-workflow-runs/enabling-debug-logging#enabling-step-debug-logging).

Then additional information which might be useful for the users when debugging
the issues will be available in the action output, prefixed by `##[debug]`.
