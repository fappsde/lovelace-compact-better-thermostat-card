# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2024-12-04

### Fixed
- Visual editor focus issue - input fields no longer lose focus after typing one character
- Form is now created once and updated instead of being recreated on every change

### Changed
- Refactored editor to use single initialization pattern
- Added `ev.stopPropagation()` to prevent event bubbling issues
- Added config change detection to prevent unnecessary updates

## [1.1.0] - 2024-12-04

### Added
- Visual editor with `ha-form` support
- `getConfigElement()` static method for proper HA editor integration
- Complete schema for all configuration options
- Expandable sections for Display Options, Additional Info, and Graph Settings
- Entity pickers with domain/device_class filtering
- `computeLabel` for user-friendly field names

### Changed
- Replaced `getConfigForm()` with `getConfigElement()` (correct HA API)
- Updated `getStubConfig()` to find first climate entity automatically

## [1.0.0] - 2024-12-04

### Added
- Initial release
- Compact, wide thermostat card layout
- Integration with mini-graph-card for background temperature/humidity graph
- Status indicators for window open, summer mode, and heating
- HVAC mode buttons (off, heat, cool, auto, etc.)
- Preset mode buttons (eco, boost, away, comfort, etc.)
- Target temperature controls with +/- buttons
- Optional info bar with battery, outdoor temperature, and last changed time
- HACS compliance with hacs.json
- Full documentation in README.md
