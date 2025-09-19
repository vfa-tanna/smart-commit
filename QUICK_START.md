# 🚀 Quick Start Guide - Smart Commit (Node.js)

## Quick Installation

### 1. Install Node.js
- Download Node.js from [nodejs.org](https://nodejs.org) (version 14+)
- Restart terminal after installation

### 2. Install Smart Commit
```bash
# Clone project or download
git clone https://github.com/vfa-tanna/smart-commit.git
cd smart-commit

# Install dependencies
npm install

# Install globally (optional)
npm install -g .
```

### 3. Configure GPT (Optional)
```bash
# Create .env file
copy env.example .env

# Edit .env and add your API key
OPENAI_API_KEY=your_api_key_here
```

## Usage

### Interactive Mode (Default)
```bash
# Stage files first
git add .

# Run smart-commit
smart-commit
# or
node bin/smart-commit.js
```

### Automatic Mode
```bash
# Stage and commit automatically
smart-commit --stage-all --auto

# Use GPT
smart-commit --stage-all --auto --gpt
```

### Analysis Only
```bash
# Only view analysis, don't commit
smart-commit --analyze-only
```

## Options

| Option | Description |
|--------|-------------|
| `-a, --auto` | Automatically commit with generated message |
| `-s, --stage-all` | Stage all files before committing |
| `--gpt` | Use GPT to generate message |
| `--analyze-only` | Only analyze, don't commit |
| `--dry-run` | Preview without committing |

## Usage Examples

```bash
# Interactive mode
smart-commit

# Auto commit with GPT
smart-commit --stage-all --auto --gpt

# Custom message
smart-commit --auto --message "fix: resolve bug in user authentication"

# Analyze changes
smart-commit --analyze-only
```

## Troubleshooting

### Node.js Not Found
```cmd
'node' is not recognized as an internal or external command
```
**Solution**: Install Node.js from [nodejs.org](https://nodejs.org)

### Dependencies Missing
```cmd
Error: Cannot find module 'chalk'
```
**Solution**: Run `npm install`

### GPT Not Working
```cmd
GPT failed: OpenAI API key not provided
```
**Solution**: 
1. Create `.env` file
2. Add `OPENAI_API_KEY=your_key_here`
3. Get API key from [platform.openai.com](https://platform.openai.com/api-keys)

## Test Installation
```bash
node test-installation.js
```

## Support
- GitHub: https://github.com/vfa-tanna/smart-commit
- Issues: https://github.com/vfa-tanna/smart-commit/issues
