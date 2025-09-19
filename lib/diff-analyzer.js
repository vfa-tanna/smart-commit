/**
 * Diff Analyzer Agent
 * Analyzes git diff output to extract meaningful information about changes
 */

const { execSync } = require('child_process');
const path = require('path');

class DiffAnalyzer {
    constructor() {
        this.fileExtensions = {
            '.py': 'python',
            '.js': 'javascript',
            '.ts': 'typescript',
            '.jsx': 'react',
            '.tsx': 'react',
            '.go': 'golang',
            '.java': 'java',
            '.cpp': 'cpp',
            '.c': 'c',
            '.rs': 'rust',
            '.rb': 'ruby',
            '.php': 'php',
            '.css': 'css',
            '.scss': 'sass',
            '.html': 'html',
            '.md': 'documentation',
            '.json': 'config',
            '.yaml': 'config',
            '.yml': 'config',
            '.xml': 'config',
            '.toml': 'config',
            '.dockerfile': 'docker',
            '.sql': 'database',
            '.sh': 'script',
            '.bash': 'script',
            '.zsh': 'script'
        };

        this.changePatterns = {
            'feature': [
                /add.*function/i, /new.*class/i, /implement.*/i,
                /create.*/i, /introduce.*/i, /build.*/i
            ],
            'fix': [
                /fix.*bug/i, /resolve.*/i, /correct.*/i,
                /patch.*/i, /repair.*/i, /address.*issue/i
            ],
            'refactor': [
                /refactor.*/i, /restructure.*/i, /reorganize.*/i,
                /clean.*up/i, /simplify.*/i, /optimize.*/i
            ],
            'docs': [
                /update.*documentation/i, /add.*comment/i, /improve.*readme/i,
                /document.*/i, /add.*docstring/i
            ],
            'style': [
                /format.*/i, /indent.*/i, /whitespace.*/i,
                /style.*/i, /lint.*/i, /prettier.*/i
            ],
            'test': [
                /add.*test/i, /test.*/i, /spec.*/i, /mock.*/i
            ],
            'chore': [
                /update.*dependency/i, /upgrade.*/i, /maintenance.*/i,
                /cleanup.*/i, /remove.*unused/i
            ]
        };
    }

    /**
     * Get current git status information
     */
    getGitStatus() {
        try {
            const result = execSync('git status --porcelain', { encoding: 'utf8' });
            
            const status = {
                added: [],
                modified: [],
                deleted: [],
                renamed: []
            };

            const lines = result.trim().split('\n');
            for (const line of lines) {
                if (!line) continue;

                const statusCode = line.substring(0, 2);
                const filename = line.substring(3);

                if (statusCode.includes('A')) {
                    status.added.push(filename);
                } else if (statusCode.includes('M')) {
                    status.modified.push(filename);
                } else if (statusCode.includes('D')) {
                    status.deleted.push(filename);
                } else if (statusCode.includes('R')) {
                    status.renamed.push(filename);
                }
            }

            return status;
        } catch (error) {
            return { added: [], modified: [], deleted: [], renamed: [] };
        }
    }

    /**
     * Get diff statistics (lines added/removed)
     */
    getDiffStats() {
        try {
            const result = execSync('git diff --cached --numstat', { encoding: 'utf8' });
            
            let added = 0, removed = 0, filesChanged = 0;

            const lines = result.trim().split('\n');
            for (const line of lines) {
                if (!line) continue;
                
                const parts = line.split('\t');
                if (parts.length >= 2) {
                    try {
                        added += parts[0] !== '-' ? parseInt(parts[0]) : 0;
                        removed += parts[1] !== '-' ? parseInt(parts[1]) : 0;
                        filesChanged++;
                    } catch (error) {
                        continue;
                    }
                }
            }

            return {
                files_changed: filesChanged,
                insertions: added,
                deletions: removed
            };
        } catch (error) {
            return { files_changed: 0, insertions: 0, deletions: 0 };
        }
    }

    /**
     * Get the staged diff content
     */
    getStagedDiff() {
        try {
            const result = execSync('git diff --cached', { encoding: 'utf8' });
            return result;
        } catch (error) {
            return '';
        }
    }

    /**
     * Analyze the types of files being changed
     */
    analyzeFileTypes(files) {
        const fileTypes = {};

        for (const file of files) {
            const ext = path.extname(file).toLowerCase();
            const fileType = this.fileExtensions[ext] || 'other';
            fileTypes[fileType] = (fileTypes[fileType] || 0) + 1;
        }

        return fileTypes;
    }

    /**
     * Detect the type of change based on diff content
     */
    detectChangeType(diffContent) {
        const diffLower = diffContent.toLowerCase();

        // Count matches for each change type
        const typeScores = {};
        for (const [changeType, patterns] of Object.entries(this.changePatterns)) {
            let score = 0;
            for (const pattern of patterns) {
                const matches = (diffLower.match(pattern) || []).length;
                score += matches;
            }
            typeScores[changeType] = score;
        }

        // Return the type with the highest score, default to 'feat' if no matches
        if (!typeScores || Math.max(...Object.values(typeScores)) === 0) {
            return 'feat';
        }

        return Object.keys(typeScores).reduce((a, b) => 
            typeScores[a] > typeScores[b] ? a : b
        );
    }

    /**
     * Extract function and class names from diff
     */
    extractFunctionsAndClasses(diffContent) {
        const patterns = [
            /\+.*def\s+(\w+)/g,        // Python functions
            /\+.*function\s+(\w+)/g,   // JavaScript functions
            /\+.*class\s+(\w+)/g,      // Class definitions
            /\+.*const\s+(\w+)\s*=/g,  // Const definitions
            /\+.*let\s+(\w+)\s*=/g,    // Let definitions
            /\+.*var\s+(\w+)\s*=/g,    // Var definitions
        ];

        const entities = [];
        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(diffContent)) !== null) {
                entities.push(match[1]);
            }
        }

        // Remove duplicates
        return [...new Set(entities)];
    }

    /**
     * Perform comprehensive analysis of staged changes
     */
    analyzeChanges() {
        const status = this.getGitStatus();
        const diffStats = this.getDiffStats();
        const diffContent = this.getStagedDiff();

        // Get all changed files
        const allFiles = [];
        for (const fileList of Object.values(status)) {
            allFiles.push(...fileList);
        }

        const fileTypes = this.analyzeFileTypes(allFiles);
        const changeType = this.detectChangeType(diffContent);
        const entities = this.extractFunctionsAndClasses(diffContent);

        // Determine scope based on file types
        const scope = this.determineScope(fileTypes, allFiles);

        return {
            status,
            stats: diffStats,
            file_types: fileTypes,
            change_type: changeType,
            scope,
            entities: entities.slice(0, 5), // Limit to first 5 entities
            diff_content: diffContent
        };
    }

    /**
     * Determine the scope of changes
     */
    determineScope(fileTypes, files) {
        if (Object.keys(fileTypes).length === 1) {
            return Object.keys(fileTypes)[0];
        }

        // Check for specific patterns
        if (files.some(f => f.toLowerCase().includes('test'))) {
            return 'test';
        }
        if (files.some(f => f.toLowerCase().includes('doc') || f.toLowerCase().includes('readme'))) {
            return 'docs';
        }
        if (files.some(f => f.toLowerCase().includes('config') || f.includes('.json') || f.includes('.yaml'))) {
            return 'config';
        }

        // Return the most common file type
        if (Object.keys(fileTypes).length > 0) {
            return Object.keys(fileTypes).reduce((a, b) => 
                fileTypes[a] > fileTypes[b] ? a : b
            );
        }

        return null;
    }
}

module.exports = DiffAnalyzer;
