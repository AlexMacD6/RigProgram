# Changelog

All notable changes to the RigProgram project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Equipment tags with detailed descriptions and tooltips
- Operations tags with phase descriptions and tooltips
- Enhanced document filtering system
- Brand color scheme implementation using Tailwind config
- Free-form category input with suggestions dropdown in document editor

### Changed
- Consolidated separate equipment and operations pages into a single documents page with advanced filtering
- Updated UI to follow brand guidelines with gold (#D4AF3D), black (#000000), and white (#FFFFFF) color scheme
- Improved tag display with tooltips for better context
- Moved Word document import button to the main toolbar for easier access
- Converted Featured Document checkbox to a button with a gold star that lights up when active
- Applied Rig Concierge brand styling to DocumentEditor component with proper gold accent colors
- Improved accessibility with proper focus states, ARIA labels and minimum touch target sizes

### Fixed
- Added polyfills for Node.js modules (buffer, stream, util) to support the mammoth.js document conversion library in browser environment
- Fixed Word document import to properly include section content when importing DOCX files
- Enhanced Featured button to show gold star properly when active

### Removed
- Separate equipment, operations, and category pages as they were redundant with the enhanced documents page
- Storybook dependencies and stories to simplify the project structure
- General tags feature from document editor, keeping only equipment and operations specific tags 