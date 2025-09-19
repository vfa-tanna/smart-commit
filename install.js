#!/usr/bin/env node
/**
 * Smart Commit Agents Installation Script for Node.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

console.log(chalk.green('🚀 Installing Smart Commit Agents...'));

// Get the directory where this script is located
const scriptDir = __dirname;
const installDir = path.join(process.env.USERPROFILE || process.env.HOME, 'commit-agents');

// Check if Node.js is available
try {
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    console.log(chalk.green(`✅ Node.js found: ${nodeVersion}`));
    
    const version = parseInt(nodeVersion.substring(1).split('.')[0]);
    if (version < 14) {
        console.log(chalk.red('❌ Node.js 14+ is required'));
        process.exit(1);
    }
} catch (error) {
    console.log(chalk.red('❌ Node.js is required but not found.'));
    console.log(chalk.yellow('Please install Node.js from https://nodejs.org'));
    process.exit(1);
}

// Check if npm is available
try {
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    console.log(chalk.green(`✅ npm found: ${npmVersion}`));
} catch (error) {
    console.log(chalk.red('❌ npm is required but not found.'));
    console.log(chalk.yellow('Please install npm or reinstall Node.js'));
    process.exit(1);
}

// Create installation directory if it doesn't exist
if (scriptDir !== installDir) {
    console.log(chalk.blue(`📁 Copying files to ${installDir}...`));
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(installDir)) {
        fs.mkdirSync(installDir, { recursive: true });
    }
    
    // Copy files (excluding node_modules, .git, etc.)
    copyDirectory(scriptDir, installDir, {
        exclude: ['node_modules', '.git', '*.log', '*.tmp']
    });
}

// Install dependencies
console.log(chalk.blue('📦 Installing dependencies...'));
try {
    process.chdir(installDir);
    execSync('npm install', { stdio: 'inherit' });
    console.log(chalk.green('✅ Dependencies installed successfully'));
} catch (error) {
    console.log(chalk.red('❌ Failed to install dependencies'));
    console.log(chalk.yellow('Please run: npm install'));
    process.exit(1);
}

// Install globally
console.log(chalk.blue('🌍 Installing globally...'));
try {
    execSync('npm install -g .', { stdio: 'inherit' });
    console.log(chalk.green('✅ Installed globally'));
} catch (error) {
    console.log(chalk.yellow('⚠️  Global installation failed. You can still use locally.'));
    console.log(chalk.yellow('Try running as administrator or use: npm install -g .'));
}

// Test installation
console.log(chalk.blue('🧪 Testing installation...'));
try {
    const testResult = execSync('node test-installation.js', { 
        encoding: 'utf8',
        cwd: installDir 
    });
    console.log(testResult);
} catch (error) {
    console.log(chalk.yellow('⚠️  Test failed, but installation may still work'));
}

console.log(chalk.green('\n🎉 Installation complete!'));
console.log(chalk.cyan('\nUsage examples:'));
console.log('  smart-commit                    # Interactive mode');
console.log('  smart-commit --auto             # Automatic mode');
console.log('  smart-commit --stage-all --auto # Stage all and commit');
console.log('  smart-commit --analyze-only     # Analysis only');
console.log(chalk.cyan(`\nFor more information, see: ${installDir}/README.md`));

/**
 * Copy directory recursively with exclude patterns
 */
function copyDirectory(src, dest, options = {}) {
    const { exclude = [] } = options;
    
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        // Check if entry should be excluded
        const shouldExclude = exclude.some(pattern => {
            if (pattern.includes('*')) {
                const regex = new RegExp(pattern.replace(/\*/g, '.*'));
                return regex.test(entry.name);
            }
            return entry.name === pattern;
        });
        
        if (shouldExclude) {
            continue;
        }
        
        if (entry.isDirectory()) {
            copyDirectory(srcPath, destPath, options);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}
