# Compact Better Thermostat Card

[![GitHub Release](https://img.shields.io/github/v/release/fappsde/lovelace-compact-better-thermostat-card?style=flat-square)](https://github.com/fappsde/lovelace-compact-better-thermostat-card/releases)
[![HACS](https://img.shields.io/badge/HACS-Custom-orange.svg?style=flat-square)](https://hacs.xyz/)
[![License](https://img.shields.io/github/license/fappsde/lovelace-compact-better-thermostat-card?style=flat-square)](LICENSE)

A compact, wide thermostat control card for Home Assistant with an integrated temperature/humidity graph in the background. Designed to work seamlessly with [Better Thermostat](https://github.com/KartoffelToby/better_thermostat) but compatible with any climate entity.

<!-- TODO: Add preview image at docs/preview.png -->
<img width="323" height="260" alt="image" src="https://github.com/user-attachments/assets/134f42c6-33f9-40fb-921c-8a1543113c7b" />



## Features

- Compact, wide layout (ideal for dashboards)
- Integrated temperature and humidity graph (via mini-graph-card)
- Status indicators for window open, summer mode, and heating
- HVAC mode and preset mode buttons
- Target temperature controls with +/- buttons
- Optional info bar with battery, outdoor temperature, and last changed time
- Full visual editor support
- Theming via Home Assistant CSS variables

## Requirements

- Home Assistant 2023.x or newer
- [mini-graph-card](https://github.com/kalkih/mini-graph-card) (install via HACS)

## Installation

### HACS (Recommended)

1. Open HACS in Home Assistant
2. Go to "Frontend" section
3. Click the three dots menu and select "Custom repositories"
4. Add this repository URL and select "Lovelace" as category
5. Search for "Compact Better Thermostat Card" and install
6. Refresh your browser

### Manual Installation

1. Download `compact-better-thermostat-card.js` from the latest release
2. Copy it to your `config/www/` folder
3. Add the resource in your Lovelace configuration:

```yaml
resources:
  - url: /local/compact-better-thermostat-card.js
    type: module
```

4. Refresh your browser

## Configuration

### Minimal Configuration

```yaml
type: custom:compact-better-thermostat-card
entity: climate.living_room
```

### Full Configuration

```yaml
type: custom:compact-better-thermostat-card

# Required
entity: climate.living_room

# Optional: Override name
name: Living Room

# Optional: External sensors (override entity attributes)
temperature_sensor: sensor.living_room_temperature
humidity_sensor: sensor.living_room_humidity

# Optional: Display options (all default to true)
show_humidity: true
show_window: true
show_summer: true
show_heating: true

# Optional: Additional info bar
show_battery: true
battery_entity: sensor.thermostat_battery
show_outdoor: true
outdoor_entity: sensor.outdoor_temperature
show_last_changed: true

# Temperature control step (default: 0.5)
step: 0.5

# Mini-graph-card options
graph:
  hours_to_show: 24
  points_per_hour: 2
  line_width: 2
  show_fill: true
  temperature_color: "var(--primary-color)"
  humidity_color: "var(--info-color)"
```

## Configuration Options

### Main Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `entity` | string | **required** | Climate entity ID |
| `name` | string | entity friendly_name | Display name |
| `temperature_sensor` | string | - | External temperature sensor entity |
| `humidity_sensor` | string | - | External humidity sensor entity |
| `step` | number | 0.5 | Temperature adjustment step |

### Display Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `show_humidity` | boolean | true | Show humidity display |
| `show_window` | boolean | true | Show window open indicator |
| `show_summer` | boolean | true | Show summer mode indicator |
| `show_heating` | boolean | true | Show heating indicator (animated) |

### Additional Info Bar

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `show_battery` | boolean | false | Show battery level |
| `battery_entity` | string | - | Battery sensor entity |
| `show_outdoor` | boolean | false | Show outdoor temperature |
| `outdoor_entity` | string | - | Outdoor temperature sensor entity |
| `show_last_changed` | boolean | false | Show last state change time |

### Graph Options

All options under `graph:` are passed to mini-graph-card:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `hours_to_show` | number | 24 | Hours of history to display |
| `points_per_hour` | number | 2 | Data points per hour |
| `line_width` | number | 2 | Line thickness |
| `show_fill` | boolean | true | Show area fill under lines |
| `temperature_color` | string | var(--primary-color) | Temperature line color |
| `humidity_color` | string | var(--info-color) | Humidity line color |

You can also pass any other [mini-graph-card options](https://github.com/kalkih/mini-graph-card#options).

## Status Indicators

The card shows status icons at the top when certain conditions are met:

| Icon | Condition | Description |
|------|-----------|-------------|
| Window | `window_open` or `window` attribute is `true` | Window is open |
| Sun | `summer_mode` or `summer` attribute is `true` | Summer mode active |
| Fire (animated) | `hvac_action` is `heating` or `call_for_heat` is `true` | Currently heating |

## HVAC Modes

The card automatically displays buttons for available HVAC modes:

| Mode | Icon | Color |
|------|------|-------|
| off | power | gray |
| heat | fire | orange |
| cool | snowflake | blue |
| heat_cool | sun-snowflake | orange |
| auto | thermostat-auto | green |
| dry | water-percent | light blue |
| fan_only | fan | light green |

## Preset Modes

If the climate entity supports preset modes, they are displayed:

| Preset | Icon | Color |
|--------|------|-------|
| eco | leaf | green |
| away | account-arrow-right | gray |
| boost | rocket-launch | deep orange |
| comfort | sofa | orange |
| home | home | green |
| sleep | sleep | deep purple |
| activity | run | deep orange |

## Interactions

| Element | Action | Result |
|---------|--------|--------|
| Card background | Click | Opens more-info dialog |
| + Button | Click | Increase target temperature |
| - Button | Click | Decrease target temperature |
| HVAC Mode Button | Click | Set HVAC mode |
| Preset Mode Button | Click | Set preset mode |

## Styling

The card uses Home Assistant CSS variables for theming. It will automatically adapt to your theme.

Key variables used:
- `--primary-color`
- `--primary-text-color`
- `--secondary-text-color`
- `--card-background-color`
- `--state-climate-heat-color`
- `--state-climate-cool-color`
- `--warning-color`

## Examples

### Basic Thermostat

```yaml
type: custom:compact-better-thermostat-card
entity: climate.bedroom
```

### With External Sensors

```yaml
type: custom:compact-better-thermostat-card
entity: climate.living_room
temperature_sensor: sensor.living_room_temp
humidity_sensor: sensor.living_room_humidity
```

### With All Info Bar Options

```yaml
type: custom:compact-better-thermostat-card
entity: climate.bathroom
name: Bathroom
show_battery: true
battery_entity: sensor.bathroom_thermostat_battery
show_outdoor: true
outdoor_entity: sensor.outdoor_temp
show_last_changed: true
```

### Custom Graph Settings

```yaml
type: custom:compact-better-thermostat-card
entity: climate.office
graph:
  hours_to_show: 48
  line_width: 3
  temperature_color: "#ff6b6b"
  humidity_color: "#4ecdc4"
```

## Troubleshooting

### Graph not showing

Make sure you have [mini-graph-card](https://github.com/kalkih/mini-graph-card) installed. The card will show a warning message if mini-graph-card is not available.

### Entity not found error

Verify that the entity ID in your configuration is correct and the entity exists in Home Assistant.

### Humidity not showing

The card only shows humidity if:
1. `show_humidity` is not set to `false`
2. Either a `humidity_sensor` is configured, or the climate entity has a `current_humidity` attribute

## Development

This card is built with vanilla JavaScript (ES6+) and does not require any build tools.

To contribute:
1. Fork the repository
2. Make your changes
3. Test in Home Assistant
4. Submit a pull request

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of all changes and version history.

## Credits

- [Better Thermostat](https://github.com/KartoffelToby/better_thermostat) - The integration this card is designed for
- [mini-graph-card](https://github.com/kalkih/mini-graph-card) - Used for the background graph

## License

MIT License - See [LICENSE](LICENSE) for details.
