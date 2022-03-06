# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.3] - 2022-03-05
### Changed
- **BREAKING** Removed "@" path alias, and used baseUrl instead
- **BREAKING** Renamed createExponentialScaling to createPolynomialScaling and removed coefficient parameter
- Changed options passed into createLayerTreeNode; now allows overriding display
- App component is no longer cloned before being passed to `createApp`
- Changed TS version from ^4.5.4 to ~4.5.5
### Fixed
- Document title is set as soon as possible now

## [0.1.1] - 2022-03-02
### Added
- Configuration for Glitch projects
- Configuration for Replit projects
- Hide versionTitle if blank
### Changed
- **BREAKING** Renamed modInfo.json -> projInfo.json
- **BREAKING** Renamed mod.tsx -> projEntry.tsx
- Improved performance of branch drawing code
- Improved performance of formatting numbers
- Changed some projInfo default values to empty strings
- Renamed projInfo.allowSmall -> projInfo.defaultShowSmall
### Fixed
- Spacing on discord logo in NaN screen
- Some files accessing old location for persistence code
- Fixed lint-staged not being listed in devDependencies
- Branch locations were not accurate after scrolling
- Saves Manager displayed "default body" while closing
- Reset buttons activating when held down when canClick is false
- Lifting up on auto clickable elements not stopping the auto clicker
### Removed
- Removed Theme.stackedInfoboxes
- Removed Theme.showSingleTab

## [0.1.0] - Initial Release
