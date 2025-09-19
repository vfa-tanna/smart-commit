/**
 * Helper utilities for commit agents
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const yaml = require('yaml');

/**
 * Load configuration from YAML file
 */
function loadConfig() {
    const configPath = path.join(__dirname, '..', 'config', 'commit-agents.yaml');
    
    try {
        const fileContent = fs.readFileSync(configPath, 'utf8');
        return yaml.parse(fileContent);
    } catch (error) {
        // Return default configuration if file doesn't exist
        return {
            message_rules: {
                max_subject_length: 72,
                max_body_line_length: 100,
                use_imperative_mood: true,
                capitalize_subject: false,
                end_subject_with_period: false
            }
        };
    }
}

/**
 * Run a git command with error handling
 */
function runGitCommand(args, captureOutput = true) {
    const cmd = ['git', ...args];
    try {
        const result = execSync(cmd.join(' '), { 
            encoding: 'utf8',
            stdio: captureOutput ? 'pipe' : 'inherit'
        });
        return { stdout: result, stderr: '', code: 0 };
    } catch (error) {
        throw new Error(`Git command failed: ${cmd.join(' ')}\nError: ${error.message}`);
    }
}

/**
 * Get the root directory of the git repository
 */
function getGitRoot() {
    const result = runGitCommand(['rev-parse', '--show-toplevel']);
    return path.resolve(result.stdout.trim());
}

/**
 * Check if current directory is in a git repository
 */
function isGitRepo() {
    try {
        runGitCommand(['rev-parse', '--git-dir']);
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Get the current git branch name
 */
function getCurrentBranch() {
    try {
        const result = runGitCommand(['branch', '--show-current']);
        return result.stdout.trim();
    } catch (error) {
        return 'main'; // fallback
    }
}

/**
 * Get information about git remotes
 */
function getRemoteInfo() {
    try {
        const result = runGitCommand(['remote', '-v']);
        const remotes = {};
        const lines = result.stdout.trim().split('\n');
        
        for (const line of lines) {
            if (line) {
                const parts = line.split(/\s+/);
                if (parts.length >= 2) {
                    const name = parts[0];
                    const url = parts[1];
                    remotes[name] = url;
                }
            }
        }
        
        return remotes;
    } catch (error) {
        return {};
    }
}

/**
 * Get information about recent commits
 */
function getLastCommits(count = 5) {
    try {
        const result = runGitCommand([`log`, `-${count}`, `--pretty=format:%h|%s|%an|%ar`]);
        
        const commits = [];
        const lines = result.stdout.trim().split('\n');
        
        for (const line of lines) {
            if (line) {
                const parts = line.split('|', 4);
                if (parts.length >= 4) {
                    commits.push({
                        hash: parts[0],
                        subject: parts[1],
                        author: parts[2],
                        date: parts[3]
                    });
                }
            }
        }
        
        return commits;
    } catch (error) {
        return [];
    }
}

/**
 * Format a list of files for display
 */
function formatFileList(files, maxDisplay = 5) {
    if (!files || files.length === 0) {
        return 'none';
    }
    
    if (files.length <= maxDisplay) {
        return files.join(', ');
    } else {
        const displayed = files.slice(0, maxDisplay);
        const remaining = files.length - maxDisplay;
        return `${displayed.join(', ')} and ${remaining} more`;
    }
}

/**
 * Truncate text to specified length
 */
function truncateText(text, maxLength, suffix = '...') {
    if (text.length <= maxLength) {
        return text;
    }
    return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Simple pluralization helper
 */
function pluralize(word, count) {
    if (count === 1) {
        return word;
    }
    
    // Simple pluralization rules
    if (word.endsWith('y')) {
        return word.slice(0, -1) + 'ies';
    } else if (['s', 'sh', 'ch', 'x', 'z'].some(ending => word.endsWith(ending))) {
        return word + 'es';
    } else {
        return word + 's';
    }
}

/**
 * Format git diff stats in a readable way
 */
function formatStats(insertions, deletions) {
    const parts = [];
    if (insertions > 0) {
        parts.push(`+${insertions}`);
    }
    if (deletions > 0) {
        parts.push(`-${deletions}`);
    }
    return parts.length > 0 ? parts.join(' ') : 'no changes';
}

/**
 * Detect the type of project based on files in the repository
 */
function detectProjectType() {
    try {
        const gitRoot = getGitRoot();
        
        // Check for common project files
        const projectIndicators = {
            'python': ['setup.py', 'pyproject.toml', 'requirements.txt', 'Pipfile'],
            'node': ['package.json', 'yarn.lock', 'npm-shrinkwrap.json'],
            'go': ['go.mod', 'go.sum'],
            'rust': ['Cargo.toml', 'Cargo.lock'],
            'java': ['pom.xml', 'build.gradle', 'build.gradle.kts'],
            'php': ['composer.json', 'composer.lock'],
            'ruby': ['Gemfile', 'Gemfile.lock', '.gemspec'],
            'docker': ['Dockerfile', 'docker-compose.yml', 'docker-compose.yaml'],
        };
        
        for (const [projectType, indicators] of Object.entries(projectIndicators)) {
            for (const indicator of indicators) {
                const filePath = path.join(gitRoot, indicator);
                if (fs.existsSync(filePath)) {
                    return projectType;
                }
            }
        }
        
        return null;
    } catch (error) {
        return null;
    }
}

/**
 * Get patterns from .gitignore file
 */
function getIgnorePatterns() {
    try {
        const gitRoot = getGitRoot();
        const gitignorePath = path.join(gitRoot, '.gitignore');
        
        if (!fs.existsSync(gitignorePath)) {
            return [];
        }
        
        const patterns = [];
        const content = fs.readFileSync(gitignorePath, 'utf8');
        const lines = content.split('\n');
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine && !trimmedLine.startsWith('#')) {
                patterns.push(trimmedLine);
            }
        }
        
        return patterns;
    } catch (error) {
        return [];
    }
}

/**
 * Add color to terminal output
 */
function colorizeOutput(text, color) {
    const colors = {
        'red': '\x1b[91m',
        'green': '\x1b[92m',
        'yellow': '\x1b[93m',
        'blue': '\x1b[94m',
        'purple': '\x1b[95m',
        'cyan': '\x1b[96m',
        'white': '\x1b[97m',
        'bold': '\x1b[1m',
        'end': '\x1b[0m'
    };
    
    const colorCode = colors[color.toLowerCase()] || '';
    const endCode = colors['end'] || '';
    
    return `${colorCode}${text}${endCode}`;
}

/**
 * Simple progress indicator for long-running operations
 */
class ProgressIndicator {
    constructor(message) {
        this.message = message;
        this.active = false;
    }

    start() {
        process.stdout.write(`${this.message}...`);
        this.active = true;
        return this;
    }

    end(success = true) {
        if (this.active) {
            if (success) {
                console.log(' ✅');
            } else {
                console.log(' ❌');
            }
        }
        this.active = false;
    }

    update(message) {
        if (this.active) {
            process.stdout.write(`\r${message}...`);
        }
    }
}

module.exports = {
    loadConfig,
    runGitCommand,
    getGitRoot,
    isGitRepo,
    getCurrentBranch,
    getRemoteInfo,
    getLastCommits,
    formatFileList,
    truncateText,
    pluralize,
    formatStats,
    detectProjectType,
    getIgnorePatterns,
    colorizeOutput,
    ProgressIndicator
};
