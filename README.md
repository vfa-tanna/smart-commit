# Smart Commit Agents

Intelligent git commit agents that analyze your changes and generate meaningful conventional commit messages automatically.

## Features

- 🔍 **Smart Analysis**: Analyzes git diffs to understand the nature of your changes
- 💬 **Conventional Commits**: Generates commit messages following the [Conventional Commits](https://www.conventionalcommits.org/) specification
- 🎯 **Context-Aware**: Detects file types, function names, and change patterns
- 🔄 **Multiple Suggestions**: Provides several commit message options to choose from
- ✅ **Validation**: Validates commit messages against conventional commit standards
- 🚀 **Interactive & Automated**: Supports both interactive and automated workflows
- 🌍 **Cross-Platform**: Works on Windows, macOS, and Linux with Node.js

## Prerequisites

- **Node.js 14+** - Download from [nodejs.org](https://nodejs.org)
- **Git** - Download from [git-scm.com](https://git-scm.com)
- **OpenAI API Key** (optional) - Get from [platform.openai.com](https://platform.openai.com/api-keys) for GPT features

## Installation

### Quick Install (Recommended)

```bash
# Download or clone the smart-commit project
git clone https://github.com/vfa-tanna/smart-commit.git
cd smart-commit

# Run the installation script
node install.js
```

### Manual Installation

```bash
# Clone the repository
git clone https://github.com/vfa-tanna/smart-commit.git
cd smart-commit

# Install dependencies
npm install

# Install globally (optional, for system-wide access)
npm install -g .
```

### Configure GPT (Optional)

To use GPT-powered commit message generation:

```bash
# Create .env file
cp env.example .env

# Edit .env and add your OpenAI API key
OPENAI_API_KEY=your_openai_api_key_here
```

Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys).

### Windows Installation

#### Option 1: Using Node.js (Recommended)
```cmd
# Download Node.js from https://nodejs.org
# Then run:
node install.js
```

#### Option 2: Manual Windows Setup
1. Install Node.js from [nodejs.org](https://nodejs.org)
2. Install Git from [git-scm.com](https://git-scm.com)
3. Clone or download the project
4. Run: `npm install`
5. Run: `npm install -g .` (for global installation)

## Usage

### Interactive Mode (Default)

The most user-friendly way to commit:

```bash
# Stage your changes first
git add .

# Run the smart commit agent
smart-commit
```

This will:
1. Analyze your staged changes
2. Show you a summary of what changed
3. Suggest multiple commit messages
4. Let you choose or write a custom message
5. Validate the message and commit

### Automatic Mode

For quick commits with generated messages:

```bash
# Auto-stage all changes and commit with generated message
smart-commit --stage-all --auto

# Use GPT for better message generation
smart-commit --stage-all --auto --gpt

# Or with staged changes
git add .
smart-commit --auto
```

### Analysis Only

To just see what the agent detects without committing:

```bash
git add .
smart-commit --analyze-only
```

### Custom Message

To use a custom message with validation:

```bash
git add .
smart-commit --auto --message "feat(auth): add login functionality"
```

### All Options

```bash
smart-commit [OPTIONS]

Options:
  -a, --auto           Automatically commit with generated message
  -m, --message TEXT   Custom commit message
  -s, --stage-all      Stage all changes before committing
  --analyze-only       Only analyze changes, don't commit
  --dry-run           Show what would be committed without committing
  --gpt               Use GPT to generate commit messages (requires OPENAI_API_KEY)
  --gpt-model MODEL   GPT model to use (default: gpt-4o-mini)
  --no-gpt            Disable GPT even if API key is available
  -h, --help          Show help message
```

## How It Works

### 1. Diff Analysis

The analyzer examines:
- **File types**: Python, JavaScript, Go, etc.
- **Change patterns**: Added, modified, deleted files
- **Code entities**: Function and class names
- **Statistics**: Lines added/removed, files changed

### 2. Message Generation

Based on the analysis, it generates:
- **Type**: `feat`, `fix`, `docs`, `refactor`, etc.
- **Scope**: Derived from file types or directory structure
- **Description**: Context-aware description of changes

### 3. Conventional Commits Format

Generated messages follow the format:
```
type(scope): description

body (optional)
```

Examples:
- `feat(auth): add user login functionality`
- `fix(api): resolve null pointer exception in user service`
- `docs: update README with installation instructions`
- `refactor(utils): simplify date formatting helper`

## Examples

### Python Project
```bash
# After adding a new authentication module
$ git add auth.py
$ smart-commit

🔍 Analyzing changes...

📊 Change Analysis:
   Type: feature
   Scope: python
   Files: 1
   Lines: +45 -2
   Functions/Classes: login, authenticate

💡 Suggested commit messages:
1. feat(python): add auth
2. feat(python): implement auth
3. feat: update 1 file

Select a commit message (1-5): 1

📝 Final commit message:
   "feat(python): add auth"

Proceed with commit? (Y/n): y
✅ Commit successful!
```

### Bug Fix
```bash
$ git add src/utils.py
$ smart-commit --auto

📝 Committing with message: "fix(utils): resolve validation error"
✅ Commit successful!
```

### GPT-Powered Commit
```bash
$ git add src/auth.js
$ smart-commit --gpt

🤖 GPT mode enabled (model: gpt-4o-mini)
🔍 Analyzing changes...

📊 Change Analysis:
   Type: feature
   Scope: javascript
   Files: 1
   Lines: +67 -12
   Functions/Classes: authenticate, validateToken

💡 Suggested commit messages:
1. feat(auth): implement JWT authentication with token validation
2. feat(auth): add secure user authentication system
3. feat(auth): implement token-based authentication

Select a commit message (1-5): 1
✅ Commit successful!
```

## Configuration

Edit `config/commit-agents.yaml` to customize:

```yaml
# Commit message rules
message_rules:
  max_subject_length: 72
  max_body_line_length: 100
  use_imperative_mood: true

# File type mappings
file_types:
  source_code:
    - .py
    - .js
    - .go
  # ... more mappings
```

## Integration

### Git Alias

Add to your `.gitconfig`:

```ini
[alias]
    sc = !smart-commit
    sca = !smart-commit --stage-all --auto
```

Usage:
```bash
git sc          # Interactive commit
git sca         # Auto-stage and commit
```

### Pre-commit Hook

Create `.git/hooks/prepare-commit-msg`:

```bash
#!/bin/sh
# Generate commit message if none provided
if [ -z "$2" ]; then
    smart-commit --analyze-only --dry-run > /tmp/commit-suggestion
    echo "# Suggested by smart-commit:" >> "$1"
    cat /tmp/commit-suggestion >> "$1"
fi
```

## Supported File Types

- **Languages**: Python, JavaScript, TypeScript, Go, Java, C++, Rust, Ruby, PHP
- **Web**: HTML, CSS, SCSS, Vue, Svelte
- **Config**: JSON, YAML, TOML, XML
- **Documentation**: Markdown, RST, TXT
- **Scripts**: Bash, Zsh, PowerShell

## Commit Types

Following [Conventional Commits](https://www.conventionalcommits.org/):

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Formatting, missing semicolons, etc.
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `build`: Build system or external dependencies
- `ci`: CI configuration changes
- `chore`: Other changes (maintenance, etc.)
- `revert`: Reverts a previous commit

## Troubleshooting

### No Changes Detected
```bash
❌ No staged changes to commit
💡 Use 'git add <files>' to stage changes or use --stage-all flag
```

**Solution**: Stage your changes with `git add` or use `--stage-all`

### Not in Git Repository
```bash
❌ Not in a git repository
```

**Solution**: Run the command inside a git repository

### Node.js Dependencies Missing
```bash
Error: Cannot find module 'yaml'
```

**Solution**: Install dependencies with `npm install`

### GPT Not Working
```bash
GPT failed: OpenAI API key not provided
```

**Solutions**:
1. Create a `.env` file in the project root
2. Add `OPENAI_API_KEY=your_api_key_here`
3. Get your API key from [platform.openai.com](https://platform.openai.com/api-keys)

### GPT API Key Invalid
```bash
Invalid OpenAI API key
```

**Solutions**:
1. Check your API key is correct
2. Ensure you have credits in your OpenAI account
3. Verify the API key has the necessary permissions

### Test Your Installation
```bash
# Run the test script to verify everything is working
node test-installation.js
```

### Windows-Specific Issues

#### Node.js Not Found
```cmd
'node' is not recognized as an internal or external command
```

**Solutions**:
1. Install Node.js from [nodejs.org](https://nodejs.org)
2. Restart your command prompt after installation
3. Check if Node.js is added to PATH

#### npm Not Found
```cmd
'npm' is not recognized as an internal or external command
```

**Solutions**:
1. Reinstall Node.js (npm comes with Node.js)
2. Check if npm is in your PATH
3. Try using `npx` instead

#### Permission Denied (Global Installation)
```cmd
Error: EACCES: permission denied
```

**Solutions**:
1. Run Command Prompt as Administrator
2. Use `npm install -g . --unsafe-perm`
3. Or install locally and use `npx smart-commit`

### Linux/macOS Issues

#### Permission Denied
```bash
Error: EACCES: permission denied
```

**Solutions**:
1. Use `sudo npm install -g .`
2. Or configure npm to use a different directory: `npm config set prefix ~/.npm-global`
3. Add `~/.npm-global/bin` to your PATH

## Advanced Usage

### Custom Analysis Rules

Extend the `DiffAnalyzer` class to add custom change detection patterns:

```javascript
const DiffAnalyzer = require('./lib/diff-analyzer');

class CustomAnalyzer extends DiffAnalyzer {
    constructor() {
        super();
        // Add custom patterns
        this.changePatterns['migration'] = [
            /add.*migration/i, /create.*table/i, /alter.*column/i
        ];
    }
}
```

### Custom Message Templates

Extend the `MessageGenerator` class:

```javascript
const MessageGenerator = require('./lib/message-generator');

class CustomGenerator extends MessageGenerator {
    generateSubject(analysis) {
        // Custom logic here
        return super.generateSubject(analysis);
    }
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Update documentation
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Changelog

### v2.0.0
- **Major rewrite**: Converted from Python to Node.js for better cross-platform support
- **GPT Integration**: Added OpenAI GPT support for intelligent commit message generation
- **Enhanced CLI**: Improved command-line interface with better error handling
- **Environment Configuration**: Added .env file support for API keys
- **Better UX**: Enhanced interactive mode with colored output and better prompts

### v1.0.0
- Interactive and automatic commit modes
- Support for major programming languages
- Conventional commit message generation
- Configurable rules and patterns