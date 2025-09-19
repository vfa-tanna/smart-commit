#!/usr/bin/env python3
"""
Commit Message Generator Agent
Generates conventional commit messages based on diff analysis
"""

import re
from typing import Dict, List, Optional, Tuple

class MessageGenerator:
    def __init__(self):
        # Conventional commit types and their descriptions
        self.commit_types = {
            'feat': 'A new feature',
            'fix': 'A bug fix',
            'docs': 'Documentation only changes',
            'style': 'Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)',
            'refactor': 'A code change that neither fixes a bug nor adds a feature',
            'perf': 'A code change that improves performance',
            'test': 'Adding missing tests or correcting existing tests',
            'build': 'Changes that affect the build system or external dependencies',
            'ci': 'Changes to our CI configuration files and scripts',
            'chore': 'Other changes that do not modify src or test files',
            'revert': 'Reverts a previous commit'
        }
        
        # Map internal change types to conventional commit types
        self.type_mapping = {
            'feature': 'feat',
            'fix': 'fix',
            'docs': 'docs',
            'style': 'style',
            'refactor': 'refactor',
            'test': 'test',
            'chore': 'chore'
        }
        
        # Common action verbs for different commit types
        self.action_verbs = {
            'feat': ['add', 'implement', 'create', 'introduce', 'build'],
            'fix': ['fix', 'resolve', 'correct', 'patch', 'repair'],
            'docs': ['update', 'improve', 'add', 'enhance', 'document'],
            'style': ['format', 'style', 'lint', 'prettify', 'clean'],
            'refactor': ['refactor', 'restructure', 'optimize', 'simplify', 'reorganize'],
            'test': ['add', 'update', 'improve', 'fix', 'enhance'],
            'chore': ['update', 'upgrade', 'maintain', 'cleanup', 'remove']
        }

    def generate_subject(self, analysis: Dict) -> str:
        """Generate the subject line of the commit message"""
        commit_type = self.type_mapping.get(analysis['change_type'], 'feat')
        scope = analysis.get('scope')
        
        # Generate description based on analysis
        description = self._generate_description(analysis, commit_type)
        
        # Format: type(scope): description
        if scope and scope != 'other':
            return f"{commit_type}({scope}): {description}"
        else:
            return f"{commit_type}: {description}"

    def _generate_description(self, analysis: Dict, commit_type: str) -> str:
        """Generate the description part of the commit message"""
        status = analysis['status']
        entities = analysis.get('entities', [])
        file_types = analysis.get('file_types', {})
        stats = analysis.get('stats', {})
        
        # Choose appropriate verb
        verbs = self.action_verbs.get(commit_type, ['update'])
        verb = verbs[0]  # Use first verb as default
        
        # Generate description based on what changed
        if status['added'] and not status['modified'] and not status['deleted']:
            # Only additions
            if len(status['added']) == 1:
                filename = self._get_clean_filename(status['added'][0])
                return f"{verb} {filename}"
            else:
                return f"{verb} {len(status['added'])} new files"
        
        elif status['deleted'] and not status['added'] and not status['modified']:
            # Only deletions
            if len(status['deleted']) == 1:
                filename = self._get_clean_filename(status['deleted'][0])
                return f"remove {filename}"
            else:
                return f"remove {len(status['deleted'])} files"
        
        elif status['modified'] and not status['added'] and not status['deleted']:
            # Only modifications
            if entities:
                # Mention specific functions/classes if detected
                if len(entities) == 1:
                    return f"{verb} {entities[0]} function"
                elif len(entities) <= 3:
                    return f"{verb} {', '.join(entities)} functions"
                else:
                    return f"{verb} multiple functions"
            elif len(status['modified']) == 1:
                filename = self._get_clean_filename(status['modified'][0])
                return f"{verb} {filename}"
            else:
                return f"{verb} {len(status['modified'])} files"
        
        else:
            # Mixed changes
            total_files = len(status['added']) + len(status['modified']) + len(status['deleted'])
            
            # Try to be more specific about the changes
            if entities and commit_type in ['feat', 'fix', 'refactor']:
                if len(entities) == 1:
                    return f"{verb} {entities[0]}"
                else:
                    return f"{verb} {entities[0]} and related functionality"
            
            # Default to file-based description
            if total_files == 1:
                all_files = status['added'] + status['modified'] + status['deleted']
                filename = self._get_clean_filename(all_files[0])
                return f"{verb} {filename}"
            else:
                return f"{verb} {total_files} files"

    def _get_clean_filename(self, filepath: str) -> str:
        """Extract a clean, readable filename from a path"""
        # Remove file extension for cleaner message
        import os
        filename = os.path.basename(filepath)
        name_without_ext = os.path.splitext(filename)[0]
        
        # Convert snake_case and kebab-case to readable format
        readable_name = re.sub(r'[_-]', ' ', name_without_ext)
        
        return readable_name

    def generate_body(self, analysis: Dict) -> Optional[str]:
        """Generate the body of the commit message with details"""
        body_parts = []
        
        stats = analysis.get('stats', {})
        status = analysis['status']
        entities = analysis.get('entities', [])
        
        # Add statistics if significant
        if stats.get('files_changed', 0) > 3:
            body_parts.append(f"Modified {stats['files_changed']} files")
        
        if stats.get('insertions', 0) > 20 or stats.get('deletions', 0) > 20:
            insertions = stats.get('insertions', 0)
            deletions = stats.get('deletions', 0)
            body_parts.append(f"+{insertions} -{deletions} lines")
        
        # Add details about specific changes
        if entities and len(entities) > 1:
            body_parts.append(f"Updated functions: {', '.join(entities)}")
        
        # Add file type information if diverse
        file_types = analysis.get('file_types', {})
        if len(file_types) > 2:
            types_str = ', '.join(file_types.keys())
            body_parts.append(f"Affected: {types_str} files")
        
        return '\n'.join(body_parts) if body_parts else None

    def generate_full_message(self, analysis: Dict, include_body: bool = True) -> str:
        """Generate a complete commit message"""
        subject = self.generate_subject(analysis)
        
        if not include_body:
            return subject
        
        body = self.generate_body(analysis)
        
        if body:
            return f"{subject}\n\n{body}"
        else:
            return subject

    def suggest_multiple_messages(self, analysis: Dict, count: int = 3) -> List[str]:
        """Generate multiple commit message suggestions"""
        messages = []
        
        # Primary suggestion (most specific)
        messages.append(self.generate_full_message(analysis, include_body=False))
        
        if count > 1:
            # Alternative with different verb
            original_type = self.type_mapping.get(analysis['change_type'], 'feat')
            verbs = self.action_verbs.get(original_type, ['update'])
            
            if len(verbs) > 1:
                # Temporarily modify the generator to use different verb
                original_first_verb = verbs[0]
                verbs[0] = verbs[1]
                messages.append(self.generate_full_message(analysis, include_body=False))
                verbs[0] = original_first_verb
        
        if count > 2:
            # More generic version
            scope = analysis.get('scope')
            commit_type = self.type_mapping.get(analysis['change_type'], 'feat')
            stats = analysis.get('stats', {})
            
            files_changed = stats.get('files_changed', 1)
            if scope and scope != 'other':
                generic_msg = f"{commit_type}({scope}): update implementation"
            else:
                generic_msg = f"{commit_type}: update {files_changed} file{'s' if files_changed > 1 else ''}"
            messages.append(generic_msg)
        
        return messages[:count]

    def validate_message(self, message: str) -> Tuple[bool, List[str]]:
        """Validate a commit message against conventional commit standards"""
        errors = []
        
        lines = message.split('\n')
        subject = lines[0] if lines else ""
        
        # Check subject line format
        if not re.match(r'^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+\))?: .+', subject):
            errors.append("Subject line doesn't follow conventional commit format")
        
        # Check subject length
        if len(subject) > 72:
            errors.append("Subject line is too long (should be ≤ 72 characters)")
        
        # Check capitalization
        if subject and ':' in subject:
            description = subject.split(':', 1)[1].strip()
            if description and description[0].isupper():
                errors.append("Description should start with lowercase letter")
        
        # Check for period at end
        if subject.endswith('.'):
            errors.append("Subject line should not end with a period")
        
        return len(errors) == 0, errors

if __name__ == "__main__":
    # Example usage
    sample_analysis = {
        'change_type': 'feature',
        'scope': 'auth',
        'status': {'added': ['auth.py'], 'modified': [], 'deleted': []},
        'entities': ['login', 'authenticate'],
        'stats': {'files_changed': 1, 'insertions': 45, 'deletions': 2}
    }
    
    generator = MessageGenerator()
    messages = generator.suggest_multiple_messages(sample_analysis)
    
    print("Suggested commit messages:")
    for i, msg in enumerate(messages, 1):
        print(f"{i}. {msg}")
    
    print("\nFull message with body:")
    print(generator.generate_full_message(sample_analysis))