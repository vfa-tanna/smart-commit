#!/usr/bin/env python3
"""
Diff Analyzer Agent
Analyzes git diff output to extract meaningful information about changes
"""

import re
import subprocess
import json
from typing import Dict, List, Tuple, Optional
from pathlib import Path

class DiffAnalyzer:
    def __init__(self):
        self.file_extensions = {
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
        }
        
        self.change_patterns = {
            'feature': [
                r'add.*function', r'new.*class', r'implement.*', 
                r'create.*', r'introduce.*', r'build.*'
            ],
            'fix': [
                r'fix.*bug', r'resolve.*', r'correct.*',
                r'patch.*', r'repair.*', r'address.*issue'
            ],
            'refactor': [
                r'refactor.*', r'restructure.*', r'reorganize.*',
                r'clean.*up', r'simplify.*', r'optimize.*'
            ],
            'docs': [
                r'update.*documentation', r'add.*comment', r'improve.*readme',
                r'document.*', r'add.*docstring'
            ],
            'style': [
                r'format.*', r'indent.*', r'whitespace.*',
                r'style.*', r'lint.*', r'prettier.*'
            ],
            'test': [
                r'add.*test', r'test.*', r'spec.*', r'mock.*'
            ],
            'chore': [
                r'update.*dependency', r'upgrade.*', r'maintenance.*',
                r'cleanup.*', r'remove.*unused'
            ]
        }

    def get_git_status(self) -> Dict[str, List[str]]:
        """Get current git status information"""
        try:
            result = subprocess.run(['git', 'status', '--porcelain'], 
                                  capture_output=True, text=True, check=True)
            
            status = {'added': [], 'modified': [], 'deleted': [], 'renamed': []}
            
            for line in result.stdout.strip().split('\n'):
                if not line:
                    continue
                    
                status_code = line[:2]
                filename = line[3:]
                
                if 'A' in status_code:
                    status['added'].append(filename)
                elif 'M' in status_code:
                    status['modified'].append(filename)
                elif 'D' in status_code:
                    status['deleted'].append(filename)
                elif 'R' in status_code:
                    status['renamed'].append(filename)
                    
            return status
        except subprocess.CalledProcessError:
            return {'added': [], 'modified': [], 'deleted': [], 'renamed': []}

    def get_diff_stats(self) -> Dict[str, int]:
        """Get diff statistics (lines added/removed)"""
        try:
            result = subprocess.run(['git', 'diff', '--cached', '--numstat'], 
                                  capture_output=True, text=True, check=True)
            
            added, removed = 0, 0
            files_changed = 0
            
            for line in result.stdout.strip().split('\n'):
                if not line:
                    continue
                parts = line.split('\t')
                if len(parts) >= 2:
                    try:
                        added += int(parts[0]) if parts[0] != '-' else 0
                        removed += int(parts[1]) if parts[1] != '-' else 0
                        files_changed += 1
                    except ValueError:
                        continue
                        
            return {
                'files_changed': files_changed,
                'insertions': added,
                'deletions': removed
            }
        except subprocess.CalledProcessError:
            return {'files_changed': 0, 'insertions': 0, 'deletions': 0}

    def get_staged_diff(self) -> str:
        """Get the staged diff content"""
        try:
            result = subprocess.run(['git', 'diff', '--cached'], 
                                  capture_output=True, text=True, check=True)
            return result.stdout
        except subprocess.CalledProcessError:
            return ""

    def analyze_file_types(self, files: List[str]) -> Dict[str, int]:
        """Analyze the types of files being changed"""
        file_types = {}
        
        for file in files:
            ext = Path(file).suffix.lower()
            file_type = self.file_extensions.get(ext, 'other')
            file_types[file_type] = file_types.get(file_type, 0) + 1
            
        return file_types

    def detect_change_type(self, diff_content: str) -> str:
        """Detect the type of change based on diff content"""
        diff_lower = diff_content.lower()
        
        # Count matches for each change type
        type_scores = {}
        for change_type, patterns in self.change_patterns.items():
            score = 0
            for pattern in patterns:
                matches = len(re.findall(pattern, diff_lower))
                score += matches
            type_scores[change_type] = score
        
        # Return the type with the highest score, default to 'feat' if no matches
        if not type_scores or max(type_scores.values()) == 0:
            return 'feat'
        
        return max(type_scores, key=type_scores.get)

    def extract_functions_and_classes(self, diff_content: str) -> List[str]:
        """Extract function and class names from diff"""
        patterns = [
            r'\+.*def\s+(\w+)',  # Python functions
            r'\+.*function\s+(\w+)',  # JavaScript functions
            r'\+.*class\s+(\w+)',  # Class definitions
            r'\+.*const\s+(\w+)\s*=',  # Const definitions
            r'\+.*let\s+(\w+)\s*=',  # Let definitions
            r'\+.*var\s+(\w+)\s*=',  # Var definitions
        ]
        
        entities = []
        for pattern in patterns:
            matches = re.findall(pattern, diff_content, re.MULTILINE)
            entities.extend(matches)
        
        return list(set(entities))  # Remove duplicates

    def analyze_changes(self) -> Dict:
        """Perform comprehensive analysis of staged changes"""
        status = self.get_git_status()
        diff_stats = self.get_diff_stats()
        diff_content = self.get_staged_diff()
        
        # Get all changed files
        all_files = []
        for file_list in status.values():
            all_files.extend(file_list)
        
        file_types = self.analyze_file_types(all_files)
        change_type = self.detect_change_type(diff_content)
        entities = self.extract_functions_and_classes(diff_content)
        
        # Determine scope based on file types
        scope = self.determine_scope(file_types, all_files)
        
        return {
            'status': status,
            'stats': diff_stats,
            'file_types': file_types,
            'change_type': change_type,
            'scope': scope,
            'entities': entities[:5],  # Limit to first 5 entities
            'diff_content': diff_content
        }

    def determine_scope(self, file_types: Dict[str, int], files: List[str]) -> Optional[str]:
        """Determine the scope of changes"""
        if len(file_types) == 1:
            return list(file_types.keys())[0]
        
        # Check for specific patterns
        if any('test' in f.lower() for f in files):
            return 'test'
        if any('doc' in f.lower() or 'readme' in f.lower() for f in files):
            return 'docs'
        if any('config' in f.lower() or '.json' in f or '.yaml' in f for f in files):
            return 'config'
        
        # Return the most common file type
        if file_types:
            return max(file_types, key=file_types.get)
        
        return None

if __name__ == "__main__":
    analyzer = DiffAnalyzer()
    analysis = analyzer.analyze_changes()
    print(json.dumps(analysis, indent=2))