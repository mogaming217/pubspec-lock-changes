import * as core from '@actions/core'
import { context, getOctokit } from '@actions/github'

const getBasePathFromInput = (input: string): string =>
  input.lastIndexOf('/') ? input.substring(0, input.lastIndexOf('/')) : ''

export const fetchLockFileText = async ({
  branchOrSha
}: {
  branchOrSha: string
}): Promise<string> => {
  const octokit = getOctokit(core.getInput('token', { required: true }))
  const inputPath = core.getInput('path')

  const { owner, repo, number } = context.issue
  if (!number) {
    throw new Error(
      '💥 Cannot find the PR data in the workflow context, aborting!'
    )
  }
  const octokitParams = { owner, repo }

  // https://docs.github.com/ja/rest/git/trees?apiVersion=2022-11-28#get-a-tree
  const baseTree = await octokit.request(
    'GET /repos/{owner}/{repo}/git/trees/{branchOrSha}:{path}',
    {
      ...octokitParams,
      branchOrSha: branchOrSha,
      path: getBasePathFromInput(inputPath)
    }
  )
  if (!baseTree || !baseTree.data || !baseTree.data.tree) {
    throw new Error('💥 Cannot fetch repository base branch tree, aborting!')
  }

  const tree = baseTree.data.tree as { path: string; sha: string }[]
  const lockSha = tree.find(file => file.path === 'pubspec.lock')?.sha
  if (!lockSha) {
    throw new Error(`💥 Cannot find the pubspec.lock file, aborting!`)
  }

  const baseLockData = await octokit.request(
    'GET /repos/{owner}/{repo}/git/blobs/{file_sha}',
    { ...octokitParams, file_sha: lockSha }
  )
  if (!baseLockData || !baseLockData.data || !baseLockData.data.content) {
    throw new Error('💥 Cannot fetch repository lock file, aborting!')
  }

  return Buffer.from(baseLockData.data.content, 'base64').toString('utf-8')
}
