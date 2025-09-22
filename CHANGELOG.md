# Changelog

All notable changes to the GitHub Desktop for VS Code extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v1.1.0] - 2024-01-20

### Added
- Browser-based authentication using VS Code's built-in GitHub authentication
- GitHub CLI integration with automatic account detection
- GitHub Enterprise Server support
- Enhanced error logging for debugging authentication issues
- Dynamic sync status in timeline header
- Keyboard shortcuts documentation

### Changed
- Improved authentication token format for better GitHub compatibility
- Optimized README for VS Code Marketplace presentation
- Enhanced commit detail panel behavior
- Better file diff handling with dedicated panels
- Updated UI with Material-UI v7 components

### Fixed
- Authentication failures with push/pull operations (403 errors)
- Commit detail panel opening in wrong location
- Account switching not updating git credentials
- File diff panels creating multiple instances
- Extension auto-opening on startup

## [v1.0.6] - 2024-01-19

### Added
- Multi-account support with secure token storage
- Right-click context menus for Git operations
- Commit detail webview panels
- File staging/unstaging UI

### Changed
- Migrated to React 19
- Updated dependencies for security

### Fixed
- Repository detection issues
- Token persistence problems

## [v1.0.5] - 2024-01-18

### Added
- Initial release with core features
- GitHub Desktop-style UI
- Commit history visualization
- Branch management
- Basic Git operations

---

*For more details, see the [GitHub Releases](https://github.com/Satyam-2001/GitHub-Desktop/releases)*