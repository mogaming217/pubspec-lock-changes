import * as core from '@actions/core'
import { context, getOctokit } from '@actions/github'
import { resolve } from 'path'
import { existsSync, readFileSync } from 'fs'
import { getDiffBetweenLockFiles, parseLockFile } from './parser'
import { createCommentBody } from './comment'

const getBasePathFromInput = (input: string): string =>
  input.lastIndexOf('/') ? input.substring(0, input.lastIndexOf('/')) : ''

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
    const commentIfNoChanges = core.getInput('comment-if-no-changes') === 'true'

    const { owner, repo, number } = context.issue
    if (!number) {
      throw new Error(
        '💥 Cannot find the PR data in the workflow context, aborting!'
      )
    }

    const octokitParams = { owner, repo }

    // Fetch the base lock file

    const basePath = getBasePathFromInput(inputPath)
    core.debug(`basePath: ${basePath}`)
    // https://docs.github.com/ja/rest/git/trees?apiVersion=2022-11-28#get-a-tree
    const baseTree = await octokit.request(
      'GET /repos/{owner}/{repo}/git/trees/{branch}:{path}',
      { ...octokitParams, branch: baseBranch, path: basePath }
    )
    if (!baseTree || !baseTree.data || !baseTree.data.tree) {
      throw new Error('💥 Cannot fetch repository base branch tree, aborting!')
    }
    const tree = baseTree.data.tree as { path: string; sha: string }[]
    const baseLockSHA = tree.find(file => {
      core.debug(`file.path: ${file.path}`)
      return file.path === 'pubspec.lock'
    })?.sha
    if (!baseLockSHA) {
      throw new Error(
        `💥 Cannot find the base lock file, aborting! Found files are ${tree.map(t => t.path).join(',')}`
      )
    }

    const baseLockData = await octokit.request(
      'GET /repos/{owner}/{repo}/git/blobs/{file_sha}',
      { ...octokitParams, file_sha: baseLockSHA }
    )
    if (!baseLockData || !baseLockData.data || !baseLockData.data.content) {
      throw new Error('💥 Cannot fetch repository base lock file, aborting!')
    }
    const baseLock = parseLockFile(
      Buffer.from(baseLockData.data.content, 'base64').toString('utf-8'),
      targetLibraries
    )

    // Fetch the PR lock file

    const lockPath = resolve(process.cwd(), inputPath)
    if (!existsSync(lockPath)) {
      throw new Error(
        '💥 The code has not been checkout or the lock file does not exist in this PR, aborting!'
      )
    }
    const content = readFileSync(lockPath, { encoding: 'utf8' })
    const updatedLock = parseLockFile(content, targetLibraries)

    // Compare the lock files

    const diff = getDiffBetweenLockFiles(targetLibraries, baseLock, updatedLock)
    if (!commentIfNoChanges) return

    let body = '## Lock file changes\n\n'
    if (diff.length === 0) {
      body += 'No changes detected.'
    } else {
      body += createCommentBody(diff)
    }

    await octokit.rest.issues.createComment({
      ...octokitParams,
      issue_number: number,
      body
    })
    return
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
