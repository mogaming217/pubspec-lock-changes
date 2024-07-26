import * as parser from '../src/parser'

describe('parseLockFile', () => {
  it('parses a lock file', () => {
    const content = `packages:
  http:
    dependency: "direct main"
    description:
      name: http
      sha256: "1234567890"
      url: "https://pub.dev"
    source: hosted
    version: "1.0.0"
  http-sample:
    dependency: "direct main"
    description:
      name: http-sample
      sha256: "1234567890"
      url: "https://pub.dev"
    source: hosted
    version: "1.0.0"
    `
    const targetLibraries = ['http']
    const result = parser.parseLockFile(content, targetLibraries)
    expect(result).toEqual({
      http: {
        name: 'http',
        version: '1.0.0',
        description: {
          name: 'http',
          sha256: '1234567890',
          url: 'https://pub.dev'
        }
      }
    })
  })
})

describe('getDiffBetweenLockFiles', () => {
  it('returns a diff between two lock files', () => {
    const base = {
      http: {
        name: 'http',
        version: '1.0.0',
        description: {
          name: 'http',
          sha256: '1234567890',
          url: 'https://pub.dev'
        }
      },
      'http-removed': {
        name: 'http-removed',
        version: '1.0.0',
        description: {
          name: 'http',
          sha256: '123456789',
          url: 'https://pub.dev'
        }
      }
    }
    const updated = {
      http: {
        name: 'http',
        version: '1.0.1',
        description: {
          name: 'http',
          sha256: '12345678901234567890',
          url: 'https://pub.dev'
        }
      },
      'http-added': {
        name: 'http-added',
        version: '1.0.0',
        description: {
          name: 'http',
          sha256: '123456789',
          url: 'https://pub.dev'
        }
      }
    }
    const targetLibraries = ['http', 'http-removed', 'http-added']
    const result = parser.getDiffBetweenLockFiles(
      targetLibraries,
      base,
      updated
    )
    expect(result).toEqual([
      {
        type: 'updated',
        name: 'http',
        diff: [
          {
            fieldName: 'version',
            base: '1.0.0',
            updated: '1.0.1'
          },
          {
            fieldName: 'description.sha256',
            base: '1234567890',
            updated: '12345678901234567890'
          }
        ]
      },
      {
        type: 'removed',
        base: {
          name: 'http-removed',
          version: '1.0.0',
          description: {
            name: 'http',
            sha256: '123456789',
            url: 'https://pub.dev'
          }
        }
      },
      {
        type: 'added',
        updated: {
          name: 'http-added',
          version: '1.0.0',
          description: {
            name: 'http',
            sha256: '123456789',
            url: 'https://pub.dev'
          }
        }
      }
    ])
  })
})
