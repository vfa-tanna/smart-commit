"""
Constant values for commit agents
"""

# Conventional commit types and their descriptions
COMMIT_TYPES = {
    'feat': 'A new feature',
    'fix': 'A bug fix',
    'docs': 'Documentation only changes',
    'style': 'Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)',
    'refactor': 'A code change that neither fixes a bug nor adds a feature',
    'perf': 'A code change that improves performance',
    'test': 'Adding missing tests or correcting existing tests',
    'build': 'Changes that affect the build system or external dependencies',
    'ci': 'Changes to our CI configuration files and scripts',
    'chore': 'Other changes that do not modify src or test files',
    'revert': 'Reverts a previous commit'
}

# Map internal change types to conventional commit types
TYPE_MAPPING = {
    'feature': 'feat',
    'fix': 'fix',
    'docs': 'docs',
    'style': 'style',
    'refactor': 'refactor',
    'test': 'test',
    'chore': 'chore'
}

# Common action verbs for different commit types
ACTION_VERBS = {
    'feat': ['add', 'implement', 'create', 'introduce', 'build'],
    'fix': ['fix', 'resolve', 'correct', 'patch', 'repair'],
    'docs': ['update', 'improve', 'add', 'enhance', 'document'],
    'style': ['format', 'style', 'lint', 'prettify', 'clean'],
    'refactor': ['refactor', 'restructure', 'optimize', 'simplify', 'reorganize'],
    'test': ['add', 'update', 'improve', 'fix', 'enhance'],
    'chore': ['update', 'upgrade', 'maintain', 'cleanup', 'remove']
}
