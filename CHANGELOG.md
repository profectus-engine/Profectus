# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.0] - 2022-04-10
### Added
- conversion.currentAt [#4](https://github.com/profectus-engine/Profectus/pull/4)
- OptionsFunc utility type, improving type inferencing in feature types
- minimumGain property to ResetButton, defaulting to 1
### Changed
- **BREAKING** Major persistence rework
    - Removed makePersistent
    - Removed old Persistent, and renamed PersistentRef to Persistent
    - createLazyProxy now takes optional base object (replacing use cases for makePersistent)
    - Added warnings when creating refs outside a layer
    - Added warnings when persistent refs aren't included in their layer object
- **BREAKING** createLayer now takes id as the first param, rather than inside the option function
- resetButton now shows "Req:" instead of "Next:" when conversion.buyMax is false
- Conversion nextAt and currentAt now cap at 0 after reverting modifier
### Fixed
- Independent conversion gain calculation [#4](https://github.com/profectus-engine/Profectus/pull/4)
- Persistence issue when loading layer dynamically
- resetButton's gain and requirement display being incorrect when conversion.buyMax is false
- Independent conversions with buyMax false capping incorrectly

## [0.2.2] - 2022-04-01
Unironically posting an update on April Fool's Day ;)
### Changed
- **BREAKING** Replaced tsparticles with pixi-emitter. Different options, and behaves differently.
- Print key and value in lazy proxy's setter message
- Update bounding boxes after web fonts load in
### Removed
- safff.txt

## [0.2.1] - 2022-03-29
### Changed
- **BREAKING** Reworked conversion.modifyGainAmount into conversion.gainModifier, with several utility functions. This makes nextAt accurate with modified gain
### Fixed
- Made overlay nav not overlap leftmost layer

## [0.2.0] - 2022-03-27
### Added
- Particles feature
- Collapsible layout component
- Utility function for splitting off the first from the list of features that meets a given filter
### Changed
- **BREAKING** Reworked most of the code from Links into a generic Context component that manages the positions of features in the DOM
- Updated vue-cli and TS dependencies
- Challenges cannot be started when maxed, and `canStart` now defaults to `true`
- onClick listeners on various features now get passed a MouseEvent or TouchEvent when possible
- Minor style changes to Milestones, most notably removing min-height
### Fixed
- Buyables didn't support CoercableComponents for displays
- TreeNodes would have a double glow effect on hover
### Removed
- Unused mousemove listener attached to App.vue

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
