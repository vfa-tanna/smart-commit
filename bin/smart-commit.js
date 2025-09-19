#!/usr/bin/env node
/**
 * Smart Commit Agent
 * Main script that orchestrates diff checking, message generation, and committing
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { program } = require('commander');
const chalk = require('chalk');
const inquirer = require('inquirer');

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

// Load .env file when script starts
loadEnvFile();

// Import our modules
const DiffAnalyzer = require('../lib/diff-analyzer');
const MessageGenerator = require('../lib/message-generator');
const { isGitRepo, getCurrentBranch } = require('../lib/utils');

class SmartCommitAgent {
    constructor() {
        this.analyzer = new DiffAnalyzer();
        this.generator = new MessageGenerator();
    }

    /**
     * Check if we're in a git repository
     */
    checkGitRepo() {
        return isGitRepo();
    }

    /**
     * Check if there are staged changes to commit
     */
    checkStagedChanges() {
        try {
            const result = execSync('git diff --cached', { encoding: 'utf8' });
            return result.trim().length > 0;
        } catch (error) {
            return false;
        }
    }

    /**
     * Stage all modified files
     */
    stageAllChanges() {
        try {
            execSync('git add -A', { stdio: 'inherit' });
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Commit staged changes with the given message
     */
    commitWithMessage(message) {
        try {
            execSync(`git commit -m "${message}"`, { stdio: 'inherit' });
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get user choice from a list of options
     */
    async getUserChoice(options, prompt = 'Choose an option') {
        const choices = options.map((option, index) => ({
            name: `${index + 1}. ${option}`,
            value: index
        }));

        const { choice } = await inquirer.prompt([{
            type: 'list',
            name: 'choice',
            message: prompt,
            choices: choices
        }]);

        return choice;
    }

    /**
     * Interactive commit workflow
     */
    async interactiveCommit(useGPT = false) {
        console.log(chalk.blue('🔍 Analyzing changes...'));
        
        // Analyze the changes
        const analysis = this.analyzer.analyzeChanges();
        
        if (!Object.values(analysis.status).some(files => files.length > 0)) {
            console.log(chalk.red('❌ No changes detected to commit'));
            return false;
        }

        // Display analysis summary
        console.log(chalk.cyan('\n📊 Change Analysis:'));
        console.log(`   Type: ${analysis.change_type}`);
        console.log(`   Scope: ${analysis.scope || 'general'}`);
        console.log(`   Files: ${analysis.stats.files_changed}`);
        console.log(`   Lines: +${analysis.stats.insertions} -${analysis.stats.deletions}`);
        
        if (analysis.entities.length > 0) {
            console.log(`   Functions/Classes: ${analysis.entities.join(', ')}`);
        }

        // Generate message suggestions
        console.log(chalk.yellow('\n💡 Suggested commit messages:'));
        let suggestions;
        
        if (useGPT && process.env.OPENAI_API_KEY) {
            try {
                console.log(chalk.blue('🤖 Using GPT to generate suggestions...'));
                suggestions = await this.generator.generateGPTMessages(analysis);
            } catch (error) {
                console.log(chalk.yellow(`⚠️  GPT failed: ${error.message}`));
                console.log(chalk.blue('🔄 Falling back to local generation...'));
                suggestions = this.generator.suggestMultipleMessages(analysis);
            }
        } else {
            suggestions = this.generator.suggestMultipleMessages(analysis);
        }
        
        // Add options for custom message, GPT (if not used), and cancel
        const options = [...suggestions];
        if (!useGPT && process.env.OPENAI_API_KEY) {
            options.push('🤖 Generate with GPT');
        }
        options.push('Write custom message', 'Cancel');
        
        const choiceIdx = await this.getUserChoice(options, 'Select a commit message');
        
        if (choiceIdx === options.length - 1) { // Cancel
            console.log(chalk.red('❌ Commit cancelled'));
            return false;
        } else if (choiceIdx === options.length - 2) { // Custom message
            const { message } = await inquirer.prompt([{
                type: 'input',
                name: 'message',
                message: 'Enter your commit message:'
            }]);
            
            if (!message.trim()) {
                console.log(chalk.red('❌ Empty message, commit cancelled'));
                return false;
            }
            var finalMessage = message.trim();
        } else if (options[choiceIdx] === '🤖 Generate with GPT') {
            // Generate with GPT
            try {
                console.log(chalk.blue('🤖 Generating with GPT...'));
                const gptSuggestions = await this.generator.generateGPTMessages(analysis, 1);
                finalMessage = gptSuggestions[0];
            } catch (error) {
                console.log(chalk.red(`❌ GPT generation failed: ${error.message}`));
                return false;
            }
        } else {
            var finalMessage = suggestions[choiceIdx];
        }

        // Validate the message
        const [isValid, errors] = this.generator.validateMessage(finalMessage);
        if (!isValid) {
            console.log(chalk.yellow('\n⚠️  Message validation warnings:'));
            for (const error of errors) {
                console.log(`   - ${error}`);
            }
            
            const { continueAnyway } = await inquirer.prompt([{
                type: 'confirm',
                name: 'continueAnyway',
                message: 'Continue anyway?',
                default: false
            }]);
            
            if (!continueAnyway) {
                console.log(chalk.red('❌ Commit cancelled'));
                return false;
            }
        }

        // Show final message and confirm
        console.log(chalk.green('\n📝 Final commit message:'));
        console.log(`   "${finalMessage}"`);
        
        const { proceed } = await inquirer.prompt([{
            type: 'confirm',
            name: 'proceed',
            message: 'Proceed with commit?',
            default: true
        }]);
        
        if (proceed) {
            if (this.commitWithMessage(finalMessage)) {
                console.log(chalk.green('✅ Commit successful!'));
                return true;
            } else {
                console.log(chalk.red('❌ Commit failed'));
                return false;
            }
        } else {
            console.log(chalk.red('❌ Commit cancelled'));
            return false;
        }
    }

    /**
     * Automatic commit with generated message
     */
    async autoCommit(customMessage = null, useGPT = false) {
        const analysis = this.analyzer.analyzeChanges();
        
        if (!Object.values(analysis.status).some(files => files.length > 0)) {
            console.log(chalk.red('❌ No changes detected to commit'));
            return false;
        }

        let message;
        if (customMessage) {
            message = customMessage;
        } else {
            // Generate message using GPT or local generation
            if (useGPT && process.env.OPENAI_API_KEY) {
                try {
                    console.log(chalk.blue('🤖 Generating commit message with GPT...'));
                    const gptSuggestions = await this.generator.generateGPTMessages(analysis, 1);
                    message = gptSuggestions[0];
                } catch (error) {
                    console.log(chalk.yellow(`⚠️  GPT failed: ${error.message}`));
                    console.log(chalk.blue('🔄 Falling back to local generation...'));
                    const suggestions = this.generator.suggestMultipleMessages(analysis, 1);
                    message = suggestions[0] || 'chore: update files';
                }
            } else {
                // Use the first (best) suggestion
                const suggestions = this.generator.suggestMultipleMessages(analysis, 1);
                message = suggestions[0] || 'chore: update files';
            }
        }

        console.log(chalk.green(`📝 Committing with message: "${message}"`));
        
        if (this.commitWithMessage(message)) {
            console.log(chalk.green('✅ Commit successful!'));
            return true;
        } else {
            console.log(chalk.red('❌ Commit failed'));
            return false;
        }
    }

    /**
     * Show analysis without committing
     */
    showAnalysisOnly() {
        console.log(chalk.blue('🔍 Analyzing changes...'));
        const analysis = this.analyzer.analyzeChanges();
        
        console.log(chalk.cyan('\n📊 Detailed Analysis:'));
        console.log(JSON.stringify(analysis, null, 2));
        
        console.log(chalk.yellow('\n💡 Suggested commit messages:'));
        const suggestions = this.generator.suggestMultipleMessages(analysis);
        suggestions.forEach((msg, i) => {
            console.log(`${i + 1}. ${msg}`);
        });
    }
}

async function main() {
    // Setup command line arguments
    program
        .name('smart-commit')
        .description('Smart Git Commit Agent with GPT support')
        .version('1.0.0')
        .option('-a, --auto', 'Automatically commit with generated message')
        .option('-m, --message <text>', 'Custom commit message')
        .option('-s, --stage-all', 'Stage all changes before committing')
        .option('--analyze-only', 'Only analyze changes, don\'t commit')
        .option('--dry-run', 'Show what would be committed without actually committing')
        .option('--gpt', 'Use GPT to generate commit messages (requires OPENAI_API_KEY)')
        .option('--gpt-model <model>', 'GPT model to use', 'gpt-4o-mini')
        .option('--no-gpt', 'Disable GPT even if API key is available');

    program.parse();

    const options = program.opts();
    
    // Check for GPT API key
    const hasGPTKey = !!process.env.OPENAI_API_KEY;
    const useGPT = options.gpt && hasGPTKey && !options.noGpt;
    
    
    if (options.gpt && !hasGPTKey) {
        console.log(chalk.yellow('⚠️  --gpt flag used but OPENAI_API_KEY not found'));
        console.log(chalk.yellow('💡 To use GPT:'));
        console.log(chalk.yellow('   1. Create a .env file in the project root'));
        console.log(chalk.yellow('   2. Add: OPENAI_API_KEY=your_api_key_here'));
        console.log(chalk.yellow('   3. Get your API key from: https://platform.openai.com/api-keys'));
    }
    
    if (useGPT) {
        console.log(chalk.blue(`🤖 GPT mode enabled (model: ${options.gptModel})`));
    }
    
    const agent = new SmartCommitAgent();
    
    // Check if we're in a git repository
    if (!agent.checkGitRepo()) {
        console.log(chalk.red('❌ Not in a git repository'));
        process.exit(1);
    }
    
    // Stage all changes if requested
    if (options.stageAll) {
        console.log(chalk.blue('📥 Staging all changes...'));
        if (!agent.stageAllChanges()) {
            console.log(chalk.red('❌ Failed to stage changes'));
            process.exit(1);
        }
    }
    
    // Check for staged changes
    if (!agent.checkStagedChanges()) {
        console.log(chalk.red('❌ No staged changes to commit'));
        console.log(chalk.yellow('💡 Use \'git add <files>\' to stage changes or use --stage-all flag'));
        process.exit(1);
    }
    
    // Handle different modes
    try {
        if (options.analyzeOnly) {
            agent.showAnalysisOnly();
        } else if (options.dryRun) {
            console.log(chalk.blue('🔍 Dry run - showing what would be committed:'));
            agent.showAnalysisOnly();
        } else if (options.auto) {
            const success = await agent.autoCommit(options.message, useGPT);
            process.exit(success ? 0 : 1);
        } else {
            const success = await agent.interactiveCommit(useGPT);
            process.exit(success ? 0 : 1);
        }
    } catch (error) {
        console.error(chalk.red('❌ Error:'), error.message);
        process.exit(1);
    }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error(chalk.red('❌ Uncaught Exception:'), error.message);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error(chalk.red('❌ Unhandled Rejection at:'), promise, 'reason:', reason);
    process.exit(1);
});

// Run the main function if this script is executed directly
if (require.main === module) {
    main();
}

module.exports = SmartCommitAgent;
