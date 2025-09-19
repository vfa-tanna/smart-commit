# Smart Commit Agents

Intelligent git commit agents that analyze your changes and generate meaningful conventional commit messages automatically.

## Features

- 🔍 **Smart Analysis**: Analyzes git diffs to understand the nature of your changes
- 💬 **Conventional Commits**: Generates commit messages following the [Conventional Commits](https://www.conventionalcommits.org/) specification
- 🎯 **Context-Aware**: Detects file types, function names, and change patterns
- 🔄 **Multiple Suggestions**: Provides several commit message options to choose from
- ✅ **Validation**: Validates commit messages against conventional commit standards
- 🚀 **Interactive & Automated**: Supports both interactive and automated workflows

## Installation

### Quick Install

```bash
# Clone or copy the commit-agents directory to your preferred location
cd ~/commit-agents

# Make the main script executable
chmod +x bin/smart-commit

# Add to your PATH (add this to your ~/.zshrc or ~/.bashrc)
export PATH="$HOME/commit-agents/bin:$PATH"

# Install required Python dependencies
pip install PyYAML
```

### Manual Setup

1. Copy the `commit-agents` directory to `~/commit-agents`
2. Make the script executable: `chmod +x ~/commit-agents/bin/smart-commit`
3. Add to PATH: `export PATH="$HOME/commit-agents/bin:$PATH"`
4. Install dependencies: `pip install PyYAML`

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

### Python Dependencies Missing
```bash
ModuleNotFoundError: No module named 'yaml'
```

**Solution**: Install dependencies with `pip install PyYAML`

## Advanced Usage

### Custom Analysis Rules

Extend the `DiffAnalyzer` class to add custom change detection patterns:

```python
from lib.diff_analyzer import DiffAnalyzer

class CustomAnalyzer(DiffAnalyzer):
    def __init__(self):
        super().__init__()
        # Add custom patterns
        self.change_patterns['migration'] = [
            r'add.*migration', r'create.*table', r'alter.*column'
        ]
```

### Custom Message Templates

Extend the `MessageGenerator` class:

```python
from lib.message_generator import MessageGenerator

class CustomGenerator(MessageGenerator):
    def generate_subject(self, analysis):
        # Custom logic here
        return super().generate_subject(analysis)
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

### v1.0.0
- Initial release
- Interactive and automatic commit modes
- Support for major programming languages
- Conventional commit message generation
- Configurable rules and patterns