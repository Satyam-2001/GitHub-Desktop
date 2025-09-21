# GitHub Desktop

A comprehensive VS Code extension that brings the complete GitHub Desktop experience directly into your editor. Built with modern React UI components and featuring advanced Git operations, multi-account management, and seamless GitHub integration.

## ✨ Features

### 🎨 **Modern React-Based Interface**
- **GitHub Desktop-style UI** with clean, responsive design
- **Material-UI components** styled with VS Code theming
- **Avatar integration** with user profile pictures
- **Dark/Light theme** support matching VS Code

### 📝 **Advanced Commit Management**
- **Interactive commit history** with detailed commit cards
- **Commit detail panel** opening in separate webview with file changes
- **Right-click context menu** on commits with full Git operations:
  - Reset to commit
  - Checkout commit
  - Revert changes
  - Create branch from commit
  - Create tags
  - Cherry-pick commits
  - Copy SHA/commit info
  - View on GitHub
- **File diff viewer** integrated with VS Code's native diff editor
- **Commit statistics** showing additions/deletions per file

### 🌿 **Branch Operations**
- **Advanced branch dropdown** with grouping (Default/Recent/Other)
- **Branch activity tracking** with last commit dates
- **Branch creation** from any commit
- **Branch merging** with merge dialog
- **Branch switching** with visual feedback

### 👥 **Multi-Account Support**
- **Multiple GitHub accounts** with easy switching
- **Secure token storage** using VS Code Secret Storage API
- **GitHub CLI integration** for automatic token reuse
- **Account-specific operations** with visual indicators

### 🔄 **Repository Management**
- **Auto-detection** of workspace repositories
- **Repository cloning** with account selection
- **Private repository** support
- **Repository switching** within VS Code
- **GitHub integration** for direct links

### 📱 **Changes & History Panel**
- **Unified interface** combining staging and history
- **File staging/unstaging** with checkbox selection
- **Commit message editing** with rich text support
- **Push/pull operations** with progress feedback
- **Real-time updates** when switching between tabs

## 🚀 Getting Started

### **Installation & Setup**
1. **Clone this repository**
2. **Install dependencies**: `npm install`
3. **Build the extension**: `npm run compile && npm run build-webview`
4. **Launch in VS Code**: Press `F5` or run `Debug: Start Debugging`

### **Quick Start Guide**

#### **1. Initial Setup**
- Open the **GitHub Desktop** view in the activity bar (🐙 icon)
- Run **GitHub Desktop: Sign In** command
- If GitHub CLI (`gh`) is installed and authenticated, tokens are reused automatically
- Otherwise, provide a Personal Access Token with `repo`, `read:org`, and `workflow` scopes

#### **2. Working with Repositories**
- **Auto-detection**: Open any Git repository - it's automatically detected
- **Clone new repos**: Use **GitHub Desktop: Clone Repository** for new projects
- **Switch repositories**: Select from the **Repositories** tree view

#### **3. Daily Workflow**
- **View changes**: Use the **Changes** tab to stage/unstage files
- **Commit changes**: Write commit messages and commit directly
- **Browse history**: Switch to **History** tab to see commit timeline
- **Right-click commits**: Access full context menu for Git operations
- **View commit details**: Click any commit to open detailed file changes
- **Branch operations**: Use the branch dropdown for switching, creating, merging

#### **4. Multi-Account Management**
- **Add accounts**: Repeat sign-in process for additional accounts
- **Switch accounts**: Use **GitHub Desktop: Switch Active Account**
- **Account indicators**: Active account highlighted in accounts tree

## 📋 Available Commands

| Command | ID | Description |
|---------|----|-----------|
| **GitHub Desktop: Sign In** | `githubDesktop.signIn` | Sign in with GitHub account |
| **GitHub Desktop: Sign Out** | `githubDesktop.signOut` | Sign out from current account |
| **GitHub Desktop: Switch Active Account** | `githubDesktop.switchAccount` | Switch between signed-in accounts |
| **GitHub Desktop: Clone Repository** | `githubDesktop.cloneRepository` | Clone repository with account selection |
| **GitHub Desktop: Open Repository** | `githubDesktop.openRepository` | Open repository in current window |
| **GitHub Desktop: Create Issue** | `githubDesktop.createIssue` | Create GitHub issue directly |
| **GitHub Desktop: Refresh Views** | `githubDesktop.refreshViews` | Force refresh all panels |

## ⚙️ Technical Details

### **Architecture**
- **Frontend**: React 19 + Material-UI + TypeScript
- **Backend**: VS Code Extension API + Node.js
- **Git Operations**: simple-git library
- **GitHub API**: @octokit/rest
- **Build System**: Vite (webviews) + Webpack (extension)

### **Data Storage**
- **Account metadata**: VS Code global state
- **Secure tokens**: VS Code Secret Storage API
- **Repository settings**: Workspace-specific storage
- **GitHub CLI integration**: Automatic token reuse when available

### **WebView Integration**
- **Separate webviews**: Main sidebar + commit detail panels
- **VS Code theming**: Full CSS variable integration
- **Message bridge**: Secure communication between React and extension
- **State persistence**: Maintains state across tab switches

## 🛠️ Development

### **Project Structure**
```
├── src/
│   ├── extension.ts              # Main extension entry point
│   ├── webviews/
│   │   ├── timelineView.ts       # Main sidebar webview provider
│   │   ├── commitDetailView.ts   # Commit detail webview provider
│   │   └── app/                  # React application
│   │       ├── App.tsx           # Main React app
│   │       ├── bridge.ts         # VS Code communication bridge
│   │       └── components/       # React components
│   ├── treeViews/                # Account & repository tree providers
│   └── utils/                    # Utility functions
├── out/                          # Compiled extension
├── dist/                         # Built webviews
└── media/                        # Extension icons & assets
```

### **Build Scripts**
- `npm run compile` - Build extension (Webpack)
- `npm run build-webview` - Build React webviews (Vite)
- `npm run watch` - Watch extension changes
- `npm run watch-webview` - Watch webview changes
- `npm run dev-webview` - Vite dev server for webviews

## 🎯 Roadmap

### **Planned Features**
- [ ] **Pull Request Management** - View, create, and manage PRs
- [ ] **GitHub Notifications** - Integrated notification center
- [ ] **Status Checks** - CI/CD status integration
- [ ] **Stash Management** - Git stash operations
- [ ] **Conflict Resolution** - Visual merge conflict resolution
- [ ] **GitHub Actions** - Workflow status and logs
- [ ] **Repository Insights** - Statistics and analytics
- [ ] **Team Collaboration** - @mentions and team features

### **Completed Features**
- [x] React-based modern UI
- [x] Commit history with avatars
- [x] Right-click context menus
- [x] Commit detail panels
- [x] Branch management with activity tracking
- [x] Multi-account support
- [x] File diff integration
- [x] Repository auto-detection
- [x] VS Code theme integration

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/vscode-github-desktop/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/vscode-github-desktop/discussions)
- **Documentation**: [Wiki](https://github.com/your-username/vscode-github-desktop/wiki)

