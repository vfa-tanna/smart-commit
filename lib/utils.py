#!/usr/bin/env python3
"""
Helper utilities for commit agents
"""

import os
import yaml
import subprocess
from pathlib import Path
from typing import Dict, List, Optional, Any

def load_config() -> Dict[str, Any]:
    """Load configuration from YAML file"""
    config_path = Path(__file__).parent.parent / 'config' / 'commit-agents.yaml'
    
    try:
        with open(config_path, 'r') as f:
            return yaml.safe_load(f)
    except FileNotFoundError:
        # Return default configuration if file doesn't exist
        return {
            'commit_types': {
                'feat': 'A new feature',
                'fix': 'A bug fix',
                'docs': 'Documentation only changes',
                'style': 'Changes that do not affect the meaning of the code',
                'refactor': 'A code change that neither fixes a bug nor adds a feature',
                'test': 'Adding missing tests or correcting existing tests',
                'chore': 'Other changes that do not modify src or test files'
            },
            'message_rules': {
                'max_subject_length': 72,
                'max_body_line_length': 100,
                'use_imperative_mood': True,
                'capitalize_subject': False,
                'end_subject_with_period': False
            }
        }

def run_git_command(args: List[str], capture_output: bool = True) -> subprocess.CompletedProcess:
    """Run a git command with error handling"""
    cmd = ['git'] + args
    try:
        return subprocess.run(cmd, capture_output=capture_output, text=True, check=True)
    except subprocess.CalledProcessError as e:
        raise RuntimeError(f"Git command failed: {' '.join(cmd)}\nError: {e.stderr}")

def get_git_root() -> Path:
    """Get the root directory of the git repository"""
    result = run_git_command(['rev-parse', '--show-toplevel'])
    return Path(result.stdout.strip())

def is_git_repo() -> bool:
    """Check if current directory is in a git repository"""
    try:
        run_git_command(['rev-parse', '--git-dir'])
        return True
    except RuntimeError:
        return False

def get_current_branch() -> str:
    """Get the current git branch name"""
    try:
        result = run_git_command(['branch', '--show-current'])
        return result.stdout.strip()
    except RuntimeError:
        return 'main'  # fallback

def get_remote_info() -> Dict[str, str]:
    """Get information about git remotes"""
    try:
        result = run_git_command(['remote', '-v'])
        remotes = {}
        for line in result.stdout.strip().split('\n'):
            if line:
                parts = line.split()
                if len(parts) >= 2:
                    name, url = parts[0], parts[1]
                    remotes[name] = url
        return remotes
    except RuntimeError:
        return {}

def get_last_commits(count: int = 5) -> List[Dict[str, str]]:
    """Get information about recent commits"""
    try:
        result = run_git_command([
            'log', f'-{count}', '--pretty=format:%h|%s|%an|%ar'
        ])
        
        commits = []
        for line in result.stdout.strip().split('\n'):
            if line:
                parts = line.split('|', 3)
                if len(parts) >= 4:
                    commits.append({
                        'hash': parts[0],
                        'subject': parts[1],
                        'author': parts[2],
                        'date': parts[3]
                    })
        return commits
    except RuntimeError:
        return []

def format_file_list(files: List[str], max_display: int = 5) -> str:
    """Format a list of files for display"""
    if not files:
        return "none"
    
    if len(files) <= max_display:
        return ', '.join(files)
    else:
        displayed = files[:max_display]
        remaining = len(files) - max_display
        return f"{', '.join(displayed)} and {remaining} more"

def truncate_text(text: str, max_length: int, suffix: str = "...") -> str:
    """Truncate text to specified length"""
    if len(text) <= max_length:
        return text
    return text[:max_length - len(suffix)] + suffix

def pluralize(word: str, count: int) -> str:
    """Simple pluralization helper"""
    if count == 1:
        return word
    
    # Simple pluralization rules
    if word.endswith('y'):
        return word[:-1] + 'ies'
    elif word.endswith(('s', 'sh', 'ch', 'x', 'z')):
        return word + 'es'
    else:
        return word + 's'

def format_stats(insertions: int, deletions: int) -> str:
    """Format git diff stats in a readable way"""
    parts = []
    if insertions > 0:
        parts.append(f"+{insertions}")
    if deletions > 0:
        parts.append(f"-{deletions}")
    return ' '.join(parts) if parts else "no changes"

def detect_project_type() -> Optional[str]:
    """Detect the type of project based on files in the repository"""
    try:
        git_root = get_git_root()
        
        # Check for common project files
        project_indicators = {
            'python': ['setup.py', 'pyproject.toml', 'requirements.txt', 'Pipfile'],
            'node': ['package.json', 'yarn.lock', 'npm-shrinkwrap.json'],
            'go': ['go.mod', 'go.sum'],
            'rust': ['Cargo.toml', 'Cargo.lock'],
            'java': ['pom.xml', 'build.gradle', 'build.gradle.kts'],
            'php': ['composer.json', 'composer.lock'],
            'ruby': ['Gemfile', 'Gemfile.lock', '.gemspec'],
            'docker': ['Dockerfile', 'docker-compose.yml', 'docker-compose.yaml'],
        }
        
        for project_type, indicators in project_indicators.items():
            for indicator in indicators:
                if (git_root / indicator).exists():
                    return project_type
        
        return None
    except RuntimeError:
        return None

def get_ignore_patterns() -> List[str]:
    """Get patterns from .gitignore file"""
    try:
        git_root = get_git_root()
        gitignore_path = git_root / '.gitignore'
        
        if not gitignore_path.exists():
            return []
        
        patterns = []
        with open(gitignore_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    patterns.append(line)
        
        return patterns
    except (RuntimeError, IOError):
        return []

def colorize_output(text: str, color: str) -> str:
    """Add color to terminal output"""
    colors = {
        'red': '\033[91m',
        'green': '\033[92m',
        'yellow': '\033[93m',
        'blue': '\033[94m',
        'purple': '\033[95m',
        'cyan': '\033[96m',
        'white': '\033[97m',
        'bold': '\033[1m',
        'end': '\033[0m'
    }
    
    color_code = colors.get(color.lower(), '')
    end_code = colors.get('end', '')
    
    return f"{color_code}{text}{end_code}"

class ProgressIndicator:
    """Simple progress indicator for long-running operations"""
    
    def __init__(self, message: str):
        self.message = message
        self.active = False
    
    def __enter__(self):
        print(f"{self.message}...", end='', flush=True)
        self.active = True
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.active:
            if exc_type is None:
                print(" ✅")
            else:
                print(" ❌")
        self.active = False
    
    def update(self, message: str):
        if self.active:
            print(f"\r{message}...", end='', flush=True)

if __name__ == "__main__":
    # Test utilities
    print("Testing commit agent utilities...")
    
    if is_git_repo():
        print(f"✅ In git repository: {get_git_root()}")
        print(f"📋 Current branch: {get_current_branch()}")
        print(f"🔗 Remotes: {get_remote_info()}")
        print(f"🏗️  Project type: {detect_project_type()}")
        
        print("\n📝 Recent commits:")
        for commit in get_last_commits(3):
            print(f"  {commit['hash']} - {commit['subject']}")
    else:
        print("❌ Not in a git repository")