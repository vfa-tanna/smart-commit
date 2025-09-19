#!/bin/bash
# Smart Commit Agents Installation Script

set -e

echo "🚀 Installing Smart Commit Agents..."

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_DIR="$HOME/commit-agents"

# Check if Python 3 is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    echo "Please install Python 3 and try again."
    exit 1
fi

# Create installation directory if it doesn't exist
if [ "$SCRIPT_DIR" != "$INSTALL_DIR" ]; then
    echo "📁 Copying files to $INSTALL_DIR..."
    
    # Create directory if it doesn't exist
    mkdir -p "$INSTALL_DIR"
    
    # Copy files
    cp -r "$SCRIPT_DIR"/* "$INSTALL_DIR/"
fi

# Make the script executable
echo "🔧 Making smart-commit executable..."
chmod +x "$INSTALL_DIR/bin/smart-commit"

# Check if PyYAML is installed
echo "📦 Checking Python dependencies..."
if ! python3 -c "import yaml" 2>/dev/null; then
    echo "Installing PyYAML..."
    if command -v pip3 &> /dev/null; then
        pip3 install PyYAML
    elif command -v pip &> /dev/null; then
        pip install PyYAML
    else
        echo "⚠️  Could not find pip. Please install PyYAML manually:"
        echo "   pip install PyYAML"
    fi
else
    echo "✅ PyYAML is already installed"
fi

# Add to PATH
SHELL_CONFIG=""
if [ -n "$ZSH_VERSION" ]; then
    SHELL_CONFIG="$HOME/.zshrc"
elif [ -n "$BASH_VERSION" ]; then
    SHELL_CONFIG="$HOME/.bashrc"
fi

if [ -n "$SHELL_CONFIG" ] && [ -f "$SHELL_CONFIG" ]; then
    # Check if PATH is already added
    if ! grep -q "commit-agents/bin" "$SHELL_CONFIG"; then
        echo "🛠️  Adding to PATH in $SHELL_CONFIG..."
        echo "" >> "$SHELL_CONFIG"
        echo "# Smart Commit Agents" >> "$SHELL_CONFIG"
        echo "export PATH=\"\$HOME/commit-agents/bin:\$PATH\"" >> "$SHELL_CONFIG"
        
        echo "✅ Added to PATH. Please restart your terminal or run:"
        echo "   source $SHELL_CONFIG"
    else
        echo "✅ Already in PATH"
    fi
else
    echo "⚠️  Could not detect shell config file."
    echo "Please add the following line to your shell config (.bashrc, .zshrc, etc.):"
    echo "   export PATH=\"\$HOME/commit-agents/bin:\$PATH\""
fi

# Test installation
if [ -x "$INSTALL_DIR/bin/smart-commit" ]; then
    echo ""
    echo "🎉 Installation complete!"
    echo ""
    echo "Usage examples:"
    echo "  smart-commit                    # Interactive mode"
    echo "  smart-commit --auto             # Automatic mode"
    echo "  smart-commit --stage-all --auto # Stage all and commit"
    echo "  smart-commit --analyze-only     # Analysis only"
    echo ""
    echo "For more information, see: $INSTALL_DIR/README.md"
    
    # Test if it's in PATH
    if command -v smart-commit &> /dev/null; then
        echo "✅ smart-commit is available in PATH"
    else
        echo "⚠️  smart-commit is not yet in PATH. Please restart your terminal."
    fi
else
    echo "❌ Installation failed. Please check permissions and try again."
    exit 1
fi