import * as core from '@actions/core'
import { context, getOctokit } from '@actions/github'
import { getDiffBetweenLockFiles, parseLockFile } from './parser'
import { createCommentBody } from './comment'
import { fetchLockFileText } from './fetch'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const octokit = getOctokit(core.getInput('token', { required: true }))
    const targetLibraries = core
      .getInput('target-libraries', { required: true })
      .split(',')
    const inputPath = core.getInput('path')
    const baseBranch = core.getInput('base-branch')
    const warningText = core.getInput('warning-text-if-changes')
    const commentIfNoChanges = core.getInput('comment-if-no-changes') === 'true'
    core.debug(`targetLibraries: ${targetLibraries}`)
    core.debug(`inputPath: ${inputPath}`)
    core.debug(`baseBranch: ${baseBranch}`)
    core.debug(`commentIfNoChanges: ${commentIfNoChanges}`)

    const { owner, repo, number } = context.issue
    if (!number) {
      throw new Error(
        '💥 Cannot find the PR data in the workflow context, aborting!'
      )
    }

    // Fetch the PR lock file

    const updatedLockFileText = await fetchLockFileText({
      branchOrSha: context.sha
    })
    const updatedLock = parseLockFile(updatedLockFileText, targetLibraries)
    core.debug(`updatedLock: ${JSON.stringify(updatedLock)}`)

    // Fetch the base lock file

    const baseLockFileText = await fetchLockFileText({
      branchOrSha: baseBranch
    })
    const baseLock = parseLockFile(baseLockFileText, targetLibraries)
    core.debug(`baseLock: ${JSON.stringify(baseLock)}`)

    // Compare the lock files

    const diff = getDiffBetweenLockFiles(targetLibraries, baseLock, updatedLock)
    core.debug(`diff: ${JSON.stringify(diff)}`)

    if (!commentIfNoChanges) return

    let body = `## Lock file changes\n\n`
    body += `Target libraries: ${targetLibraries.join(', ')}\n\n`
    if (diff.length === 0) {
      body += 'No changes detected.'
    } else {
      if (warningText) {
        body += `:warning: ${warningText}\n\n`
      }

      body += createCommentBody(diff)
    }

    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: number,
      body
    })
    return
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
