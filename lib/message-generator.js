/**
 * Commit Message Generator Agent
 * Generates conventional commit messages based on diff analysis
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { COMMIT_TYPES, TYPE_MAPPING, ACTION_VERBS } = require('./constants');

// Load environment variables from .env file
function loadEnvFile() {
    const envPath = path.join(__dirname, '..', '.env');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const lines = envContent.split('\n');

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine && !trimmedLine.startsWith('#')) {
                const [key, ...valueParts] = trimmedLine.split('=');
                if (key && valueParts.length > 0) {
                    const value = valueParts.join('=').trim();
                    process.env[key.trim()] = value;
                }
            }
        }
    }
}

// Load .env file when module is imported
loadEnvFile();

class MessageGenerator {
    constructor() {
        this.commitTypes = COMMIT_TYPES;
        this.typeMapping = TYPE_MAPPING;
        this.actionVerbs = ACTION_VERBS;
    }

    /**
     * Generate a commit message using OpenAI's GPT model based on the provided diff
     */
    async generateMessageWithGPT(diff, openaiApiKey = null, model = 'gpt-4o-mini') {
        const apiKey = openaiApiKey || process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error('OpenAI API key not found. Please:\n1. Create a .env file in the project root\n2. Add: OPENAI_API_KEY=your_api_key_here\n3. Get your API key from: https://platform.openai.com/api-keys');
        }

        const prompt = `You are an expert at writing conventional commit messages. Analyze the following git diff and generate a single, concise commit message following conventional commit format.

Rules:
- Use format: type(scope): description
- Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore
- Keep description under 50 characters
- Use lowercase for description
- No period at end
- Be specific about what changed

Git diff:
${diff}

Commit message:`;

        try {
            const response = await axios.post('https://api.openai.com/v1/chat/completions', {
                model: model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a professional developer who writes perfect conventional commit messages. Always respond with just the commit message, nothing else.'
                    },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 50,
                temperature: 0.1
            }, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            const message = response.data.choices[0].message.content.trim();

            // Clean up the message (remove quotes, extra text, etc.)
            return message.replace(/^["']|["']$/g, '').split('\n')[0].trim();
        } catch (error) {
            if (error.response?.status === 401) {
                throw new Error('Invalid OpenAI API key. Please check your OPENAI_API_KEY environment variable.');
            } else if (error.response?.status === 429) {
                throw new Error('OpenAI API rate limit exceeded. Please try again later.');
            } else {
                throw new Error(`OpenAI API error: ${error.response?.status} ${error.response?.data?.error?.message || error.message}`);
            }
        }
    }

    /**
     * Generate commit message suggestions using GPT
     */
    async generateGPTMessages(analysis, count = 3) {
        const diffContent = analysis.diff_content || '';
        if (!diffContent.trim()) {
            throw new Error('No diff content available for GPT analysis');
        }

        try {
            const message = await this.generateMessageWithGPT(diffContent);
            const suggestions = [message];

            // Generate alternative suggestions if requested
            if (count > 1) {
                // Use local generation for additional suggestions
                const localSuggestions = this.suggestMultipleMessages(analysis, count - 1);
                suggestions.push(...localSuggestions);
            }

            return suggestions.slice(0, count);
        } catch (error) {
            console.warn(`GPT generation failed: ${error.message}`);
            console.warn('Falling back to local generation...');
            return this.suggestMultipleMessages(analysis, count);
        }
    }

    /**
     * Generate the subject line of the commit message
     */
    generateSubject(analysis) {
        const commitType = this.typeMapping[analysis.change_type] || 'feat';
        const scope = analysis.scope;

        // Generate description based on analysis
        const description = this._generateDescription(analysis, commitType);

        // Format: type(scope): description
        if (scope && scope !== 'other') {
            return `${commitType}(${scope}): ${description}`;
        } else {
            return `${commitType}: ${description}`;
        }
    }

    /**
     * Generate the description part of the commit message
     */
    _generateDescription(analysis, commitType) {
        const status = analysis.status;
        const entities = analysis.entities || [];
        const fileTypes = analysis.file_types || {};
        const stats = analysis.stats || {};

        // Choose appropriate verb
        const verbs = this.actionVerbs[commitType] || ['update'];
        const verb = verbs[0]; // Use first verb as default

        // Generate description based on what changed
        if (status.added.length > 0 && status.modified.length === 0 && status.deleted.length === 0) {
            // Only additions
            if (status.added.length === 1) {
                const filename = this._getCleanFilename(status.added[0]);
                return `${verb} ${filename}`;
            } else {
                return `${verb} ${status.added.length} new files`;
            }
        } else if (status.deleted.length > 0 && status.added.length === 0 && status.modified.length === 0) {
            // Only deletions
            if (status.deleted.length === 1) {
                const filename = this._getCleanFilename(status.deleted[0]);
                return `remove ${filename}`;
            } else {
                return `remove ${status.deleted.length} files`;
            }
        } else if (status.modified.length > 0 && status.added.length === 0 && status.deleted.length === 0) {
            // Only modifications
            if (entities.length > 0) {
                // Mention specific functions/classes if detected
                if (entities.length === 1) {
                    return `${verb} ${entities[0]} function`;
                } else if (entities.length <= 3) {
                    return `${verb} ${entities.join(', ')} functions`;
                } else {
                    return `${verb} multiple functions`;
                }
            } else if (status.modified.length === 1) {
                const filename = this._getCleanFilename(status.modified[0]);
                return `${verb} ${filename}`;
            } else {
                return `${verb} ${status.modified.length} files`;
            }
        } else {
            // Mixed changes
            const totalFiles = status.added.length + status.modified.length + status.deleted.length;

            // Try to be more specific about the changes
            if (entities.length > 0 && ['feat', 'fix', 'refactor'].includes(commitType)) {
                if (entities.length === 1) {
                    return `${verb} ${entities[0]}`;
                } else {
                    return `${verb} ${entities[0]} and related functionality`;
                }
            }

            // Default to file-based description
            if (totalFiles === 1) {
                const allFiles = [...status.added, ...status.modified, ...status.deleted];
                const filename = this._getCleanFilename(allFiles[0]);
                return `${verb} ${filename}`;
            } else {
                return `${verb} ${totalFiles} files`;
            }
        }
    }

    /**
     * Extract a clean, readable filename from a path
     */
    _getCleanFilename(filepath) {
        const path = require('path');
        const filename = path.basename(filepath);
        const nameWithoutExt = path.parse(filename).name;

        // Convert snake_case and kebab-case to readable format
        const readableName = nameWithoutExt.replace(/[_-]/g, ' ');

        return readableName;
    }

    /**
     * Generate the body of the commit message with details
     */
    generateBody(analysis) {
        const bodyParts = [];

        const stats = analysis.stats || {};
        const status = analysis.status;
        const entities = analysis.entities || [];

        // Add statistics if significant
        if (stats.files_changed > 3) {
            bodyParts.push(`Modified ${stats.files_changed} files`);
        }

        if (stats.insertions > 20 || stats.deletions > 20) {
            const insertions = stats.insertions || 0;
            const deletions = stats.deletions || 0;
            bodyParts.push(`+${insertions} -${deletions} lines`);
        }

        // Add details about specific changes
        if (entities.length > 1) {
            bodyParts.push(`Updated functions: ${entities.join(', ')}`);
        }

        // Add file type information if diverse
        const fileTypes = analysis.file_types || {};
        if (Object.keys(fileTypes).length > 2) {
            const typesStr = Object.keys(fileTypes).join(', ');
            bodyParts.push(`Affected: ${typesStr} files`);
        }

        return bodyParts.length > 0 ? bodyParts.join('\n') : null;
    }

    /**
     * Generate a complete commit message
     */
    generateFullMessage(analysis, includeBody = true) {
        const subject = this.generateSubject(analysis);

        if (!includeBody) {
            return subject;
        }

        const body = this.generateBody(analysis);

        if (body) {
            return `${subject}\n\n${body}`;
        } else {
            return subject;
        }
    }

    /**
     * Generate multiple commit message suggestions
     */
    suggestMultipleMessages(analysis, count = 3) {
        const messages = [];

        // Primary suggestion (most specific)
        messages.push(this.generateFullMessage(analysis, false));

        if (count > 1) {
            // Alternative with different verb
            const originalType = this.typeMapping[analysis.change_type] || 'feat';
            const verbs = this.actionVerbs[originalType] || ['update'];

            if (verbs.length > 1) {
                // Temporarily modify the generator to use different verb
                const originalFirstVerb = verbs[0];
                verbs[0] = verbs[1];
                messages.push(this.generateFullMessage(analysis, false));
                verbs[0] = originalFirstVerb;
            }
        }

        if (count > 2) {
            // More generic version
            const scope = analysis.scope;
            const commitType = this.typeMapping[analysis.change_type] || 'feat';
            const stats = analysis.stats || {};

            const filesChanged = stats.files_changed || 1;
            let genericMsg;
            if (scope && scope !== 'other') {
                genericMsg = `${commitType}(${scope}): update implementation`;
            } else {
                genericMsg = `${commitType}: update ${filesChanged} file${filesChanged > 1 ? 's' : ''}`;
            }
            messages.push(genericMsg);
        }

        return messages.slice(0, count);
    }

    /**
     * Validate a commit message against conventional commit standards
     */
    validateMessage(message) {
        const errors = [];

        const lines = message.split('\n');
        const subject = lines[0] || '';

        // Check subject line format
        if (!/^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+\))?: .+/.test(subject)) {
            errors.push("Subject line doesn't follow conventional commit format");
        }

        // Check subject length
        if (subject.length > 72) {
            errors.push('Subject line is too long (should be ≤ 72 characters)');
        }

        // Check capitalization
        if (subject && subject.includes(':')) {
            const description = subject.split(':', 2)[1].trim();
            if (description && /[A-Z]/.test(description[0])) {
                errors.push('Description should start with lowercase letter');
            }
        }

        // Check for period at end
        if (subject.endsWith('.')) {
            errors.push('Subject line should not end with a period');
        }

        return [errors.length === 0, errors];
    }
}

module.exports = MessageGenerator;
