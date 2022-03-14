# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.4] - 2022-03-13
### Added
- You can now access this.on() from within a createLayer function (and other BaseLayer properties)
- Support for passing non-persistent refs to createResource
- dontMerge class to allow features to ignore mergeAdjacent
### Fixed
- Clickables would not merge adjacent
- onClick and onHold functions would not be bound to their object when being called
- Refs passed to a components style prop would be ignored
- Fixed z-index issue when stopping hovering over features with .can class

## [0.1.3] - 2022-03-11
### Added
- Milestone.complete
- Challenge.complete
- setupAutoClick function to run a clickable's onClick every tick
- setupAutoComplete function to attempt to complete a challenge every tick
- isAnyChallengeActive function to query if any challenge from a given list is active
- Hotkeys now appear in info modal, if any exist
- projInfo.json now includes a "enablePausing" option that can be used to prevent the player from pausing the game
- Added a "gameWon" global event
### Changed
- **BREAKING** Buyables now default to an infinite purchase limit
- **BREAKING** devSpeed, playedTime, offlineTime, and diff now use numbers instead of Decimals
- **BREAKING** Achievements and milestones now use watchEffect to check for completion, instead of polling each tick. shouldEarn properties now only accept functions
- Cached more decimal values for optimization
### Fixed
- Many types not being exported
- setupHoldToClick wouldn't stop clicking after a component is unmounted
- Header's banner would not have correct width
### Removed
- **BREAKING** Removed setupAutoReset
### Documentation
- Support for documentation generation using typedoc
- Hide main layer from docs
- Hide prestige layer from docs
- Use stub declaration files for libs that don't provide types (vue-panzoom and vue-textarea-autosize)

## [0.1.2] - 2022-03-05
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
