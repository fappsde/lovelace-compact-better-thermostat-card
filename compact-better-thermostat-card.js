/**
 * Compact Better Thermostat Card
 * A compact, wide thermostat control card with integrated temperature/humidity graph
 *
 * @version 1.6.0
 * @author Claude
 * @license MIT
 * @dependency mini-graph-card (https://github.com/kalkih/mini-graph-card)
 */

const CARD_VERSION = '1.6.0';

console.info(
  `%c COMPACT-BETTER-THERMOSTAT-CARD %c v${CARD_VERSION} `,
  'color: white; background: #ff8c00; font-weight: bold;',
  'color: #ff8c00; background: white; font-weight: bold;'
);

/**
 * Editor Element for Visual Configuration
 * Uses ha-form for native HA look and feel
 *
 * IMPORTANT: After initialization, we NEVER update form.data because:
 * 1. ha-form manages its own internal state
 * 2. Updating form.data causes re-render and focus loss
 * 3. When user changes a value, ha-form fires value-changed
 * 4. We dispatch config-changed, HA calls setConfig back
 * 5. If we update form.data here, it creates a feedback loop
 */
class CompactBetterThermostatCardEditor extends HTMLElement {
  constructor() {
    super();
    this._config = {};
    this._hass = null;
    this._form = null;
    this._initialized = false;
    this.attachShadow({ mode: 'open' });
  }

  /**
   * Set the hass object
   * @param {Object} hass - Home Assistant object
   */
  set hass(hass) {
    this._hass = hass;
    // Only update the form's hass property
    if (this._form) {
      this._form.hass = hass;
    } else if (!this._initialized) {
      this._initialize();
    }
  }

  /**
   * Get the hass object
   * @returns {Object} Home Assistant object
   */
  get hass() {
    return this._hass;
  }

  /**
   * Set the config from the card (called by HA)
   * @param {Object} config - Card configuration
   */
  setConfig(config) {
    // Store config for reference
    this._config = this._mergeConfig(config);

    // IMPORTANT: Do NOT update this._form.data after initialization!
    // The form manages its own state. Updating it causes re-render and focus loss.
    // Only initialize if not yet done.
    if (!this._initialized && this._hass) {
      this._initialize();
    }
  }

  /**
   * Merge config with defaults
   * @param {Object} config - User config
   * @returns {Object} Merged config
   */
  _mergeConfig(config) {
    return {
      show_humidity: true,
      show_window: true,
      show_summer: true,
      show_heating: true,
      show_battery: false,
      show_outdoor: false,
      show_last_changed: false,
      step: 0.5,
      ...config,
      graph: {
        hours_to_show: 24,
        points_per_hour: 2,
        line_width: 2,
        show_fill: true,
        temperature_color: 'var(--primary-color)',
        humidity_color: 'var(--info-color)',
        target_color: 'var(--accent-color)',
        ...(config.graph || {}),
      },
    };
  }

  /**
   * Get the form schema for ha-form
   * @returns {Array} Schema array
   */
  _getSchema() {
    return [
      // Main Configuration
      {
        name: 'entity',
        required: true,
        selector: {
          entity: {
            domain: 'climate',
          },
        },
      },
      {
        name: 'name',
        selector: {
          text: {},
        },
      },
      // Sensor Grid
      {
        type: 'grid',
        name: '',
        schema: [
          {
            name: 'temperature_sensor',
            selector: {
              entity: {
                domain: 'sensor',
                device_class: 'temperature',
              },
            },
          },
          {
            name: 'humidity_sensor',
            selector: {
              entity: {
                domain: 'sensor',
                device_class: 'humidity',
              },
            },
          },
        ],
      },
      // Temperature Step
      {
        name: 'step',
        selector: {
          number: {
            min: 0.1,
            max: 1,
            step: 0.1,
            mode: 'box',
          },
        },
      },
      // Display Options
      {
        type: 'expandable',
        name: '',
        title: 'Display Options',
        icon: 'mdi:eye',
        schema: [
          {
            name: 'show_humidity',
            selector: { boolean: {} },
          },
          {
            name: 'show_window',
            selector: { boolean: {} },
          },
          {
            name: 'show_summer',
            selector: { boolean: {} },
          },
          {
            name: 'show_heating',
            selector: { boolean: {} },
          },
        ],
      },
      // Additional Information
      {
        type: 'expandable',
        name: '',
        title: 'Additional Information',
        icon: 'mdi:information-outline',
        schema: [
          {
            name: 'show_battery',
            selector: { boolean: {} },
          },
          {
            name: 'battery_entity',
            selector: {
              entity: {
                domain: 'sensor',
                device_class: 'battery',
              },
            },
          },
          {
            name: 'show_outdoor',
            selector: { boolean: {} },
          },
          {
            name: 'outdoor_entity',
            selector: {
              entity: {
                domain: 'sensor',
                device_class: 'temperature',
              },
            },
          },
          {
            name: 'show_last_changed',
            selector: { boolean: {} },
          },
        ],
      },
      // Graph Settings
      {
        type: 'expandable',
        name: 'graph',
        title: 'Graph Settings',
        icon: 'mdi:chart-line',
        schema: [
          {
            name: 'hours_to_show',
            selector: {
              number: {
                min: 1,
                max: 168,
                step: 1,
                mode: 'box',
                unit_of_measurement: 'h',
              },
            },
          },
          {
            name: 'points_per_hour',
            selector: {
              number: {
                min: 1,
                max: 12,
                step: 1,
                mode: 'box',
              },
            },
          },
          {
            name: 'line_width',
            selector: {
              number: {
                min: 1,
                max: 5,
                step: 0.5,
                mode: 'slider',
              },
            },
          },
          {
            name: 'show_fill',
            selector: { boolean: {} },
          },
          {
            name: 'temperature_color',
            selector: { text: {} },
          },
          {
            name: 'humidity_color',
            selector: { text: {} },
          },
          {
            name: 'target_color',
            selector: { text: {} },
          },
        ],
      },
    ];
  }

  /**
   * Compute label for form fields
   * @param {Object} schema - Schema item
   * @returns {string} Label text
   */
  _computeLabel(schema) {
    const labels = {
      // Main
      entity: 'Climate Entity',
      name: 'Card Name',
      temperature_sensor: 'Temperature Sensor',
      humidity_sensor: 'Humidity Sensor',
      step: 'Temperature Step',
      // Display Options
      show_humidity: 'Show Humidity',
      show_window: 'Show Window Status',
      show_summer: 'Show Summer Mode',
      show_heating: 'Show Heating Indicator',
      // Additional Info
      show_battery: 'Show Battery',
      battery_entity: 'Battery Sensor',
      show_outdoor: 'Show Outdoor Temperature',
      outdoor_entity: 'Outdoor Sensor',
      show_last_changed: 'Show Last Changed',
      // Graph
      hours_to_show: 'Hours to Show',
      points_per_hour: 'Points per Hour',
      line_width: 'Line Width',
      show_fill: 'Show Graph Fill',
      temperature_color: 'Temperature Color',
      humidity_color: 'Humidity Color',
      target_color: 'Target Color',
    };

    return labels[schema.name] || schema.name;
  }

  /**
   * Handle value changes from ha-form
   * @param {CustomEvent} ev - Value changed event
   */
  _valueChanged(ev) {
    ev.stopPropagation();

    if (!this._config || !this._hass) {
      return;
    }

    // const newConfig = ev.detail.value;
    const newValue = ev.detail.value;

    // Merge new values with existing config to preserve all fields
    // This is critical because ha-form only returns fields in the schema,
    // so we'd lose any config values not explicitly in the form
    const newConfig = {
      ...this._config,
      ...newValue,
    };

    // Properly merge nested graph object if both exist
    if (this._config.graph || newValue.graph) {
      newConfig.graph = {
        ...(this._config.graph || {}),
        ...(newValue.graph || {}),
      };
    }

    // Only dispatch if config actually changed
    if (JSON.stringify(newConfig) === JSON.stringify(this._config)) {
      return;
    }

    this._config = newConfig;

    // Dispatch config-changed event to Home Assistant
    const event = new CustomEvent('config-changed', {
      detail: { config: newConfig },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  /**
   * Initialize the editor (called once)
   */
  _initialize() {
    if (this._initialized || !this._hass) {
      return;
    }

    this._initialized = true;

    // Add styling
    const style = document.createElement('style');
    style.textContent = `
      :host {
        display: block;
      }
      ha-form {
        display: block;
      }
    `;
    this.shadowRoot.appendChild(style);

    // Create ha-form element (only once!)
    this._form = document.createElement('ha-form');
    this._form.hass = this._hass;
    this._form.data = this._config;
    this._form.schema = this._getSchema();
    this._form.computeLabel = this._computeLabel;

    // Add event listener for value changes
    this._form.addEventListener('value-changed', (ev) => this._valueChanged(ev));

    this.shadowRoot.appendChild(this._form);
  }

  /**
   * Called when element is added to DOM
   */
  connectedCallback() {
    if (this._hass && !this._initialized) {
      this._initialize();
    }
  }
}

// Register the editor element
customElements.define('compact-better-thermostat-card-editor', CompactBetterThermostatCardEditor);

/**
 * HVAC Mode configurations with icons and colors
 */
const HVAC_MODES = {
  off: { icon: 'mdi:power', color: 'var(--state-climate-off-color, #8a8a8a)' },
  heat: { icon: 'mdi:fire', color: 'var(--state-climate-heat-color, #ff8c00)' },
  cool: { icon: 'mdi:snowflake', color: 'var(--state-climate-cool-color, #2196f3)' },
  heat_cool: { icon: 'mdi:sun-snowflake-variant', color: '#ff8c00' },
  auto: { icon: 'mdi:thermostat-auto', color: 'var(--state-climate-auto-color, #4caf50)' },
  dry: { icon: 'mdi:water-percent', color: '#03a9f4' },
  fan_only: { icon: 'mdi:fan', color: '#8bc34a' },
};

/**
 * Preset Mode configurations with icons and colors
 */
const PRESET_MODES = {
  eco: { icon: 'mdi:leaf', color: '#4caf50' },
  away: { icon: 'mdi:account-arrow-right', color: '#9e9e9e' },
  boost: { icon: 'mdi:rocket-launch', color: '#ff5722' },
  comfort: { icon: 'mdi:sofa', color: '#ff9800' },
  home: { icon: 'mdi:home', color: '#4caf50' },
  sleep: { icon: 'mdi:sleep', color: '#673ab7' },
  activity: { icon: 'mdi:run', color: '#ff5722' },
};

/**
 * Card styles
 */
const CARD_STYLES = `
  :host {
    --cbt-card-height: 160px;
  }

  ha-card {
    position: relative;
    height: var(--cbt-card-height);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  /* Status Bar */
  .status-bar {
    display: flex;
    justify-content: center;
    gap: 8px;
    padding: 8px;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: 10;
    pointer-events: none;
  }

  .status-bar > * {
    pointer-events: auto;
  }

  .status-icon {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--card-background-color);
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .status-icon ha-icon {
    --mdc-icon-size: 16px;
  }

  .status-icon.warning {
    color: var(--warning-color, #ffc107);
  }

  .status-icon.heating {
    color: var(--state-climate-heat-color, #ff8c00);
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  /* Graph Container */
  .graph-container {
    position: absolute;
    inset: 0;
    opacity: 0.7;
    pointer-events: none;
    z-index: 0;
  }

  .graph-container mini-graph-card {
    height: 100%;
    --ha-card-background: transparent;
    --ha-card-box-shadow: none;
  }

  .graph-fallback {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--warning-color);
    font-size: 0.85rem;
    background: rgba(var(--rgb-primary-text-color), 0.02);
    z-index: 0;
  }

  /* Main Content */
  .main-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    flex: 1;
    position: relative;
    z-index: 5;
    cursor: pointer;
    min-height: 100px;
  }

  /* Backdrop Panel Base */
  .backdrop-panel {
    background: color-mix(in srgb, var(--card-background-color) 85%, transparent);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }

  /* Fallback for browsers without color-mix */
  @supports not (background: color-mix(in srgb, var(--card-background-color) 85%, transparent)) {
    .backdrop-panel {
      background: var(--card-background-color);
      opacity: 0.85;
    }
  }

  /* Fallback for browsers without backdrop-filter */
  @supports not (backdrop-filter: blur(10px)) {
    .backdrop-panel {
      background: var(--card-background-color);
      opacity: 0.95;
    }
  }

  /* Info Section (Temperature Block) */
  .info-section {
    display: grid;
    grid-template-columns: auto auto;
    grid-template-rows: auto auto auto;
    gap: 0;
    align-items: start;
    justify-content: start;
    align-self: center;
  }

  .current-temp {
    grid-column: 1;
    grid-row: 1 / 3;
    font-size: 2.5rem;
    font-weight: 500;
    line-height: 1;
    align-self: center;
  }

  .trend-arrow {
    grid-column: 2;
    grid-row: 1;
    font-size: 1rem;
    align-self: start;
    justify-self: start;
    margin-left: 4px;
  }

  .trend-arrow.up { color: var(--error-color, #f44336); }
  .trend-arrow.down { color: var(--info-color, #2196f3); }
  .trend-arrow.stable { color: var(--secondary-text-color); }

  .humidity {
    grid-column: 2;
    grid-row: 2;
    font-size: 0.85rem;
    color: var(--secondary-text-color);
    display: flex;
    align-items: center;
    gap: 4px;
    align-self: end;
    justify-self: start;
    margin-left: 4px;
  }

  .humidity ha-icon {
    --mdc-icon-size: 14px;
  }

  .room-name {
    grid-column: 1 / 3;
    grid-row: 3;
    font-size: 0.85rem;
    color: var(--secondary-text-color);
    margin-top: 4px;
  }

  /* Controls Group (Mode + Target) */
  .controls-group {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
  }

  /* Mode Buttons */
  .mode-section {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    padding: 6px 10px;
    gap: 4px;
  }

  .mode-btn {
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 8px;
    background: transparent;
    cursor: pointer;
    opacity: 0.4;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--primary-text-color);
  }

  .mode-btn:hover {
    opacity: 0.7;
    background: rgba(var(--rgb-primary-text-color), 0.05);
  }

  .mode-btn.active {
    opacity: 1;
    background: rgba(var(--rgb-primary-text-color), 0.1);
  }

  .mode-btn ha-icon {
    --mdc-icon-size: 20px;
  }

  /* Target Controls */
  .target-controls {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 8px 12px;
  }

  .target-btn {
    width: 36px;
    height: 36px;
    border: none;
    border-radius: 50%;
    background: var(--card-background-color);
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    color: var(--primary-text-color);
  }

  .target-btn:hover {
    background: var(--primary-color);
    color: white;
    transform: scale(1.05);
  }

  .target-btn:active {
    transform: scale(0.95);
  }

  .target-btn ha-icon {
    --mdc-icon-size: 20px;
  }

  .target-temp {
    font-size: 1.3rem;
    font-weight: 600;
    padding: 4px 0;
  }

  /* Responsive Behavior */
  @container (max-width: 300px) {
    .mode-section {
      display: none;
    }

    .current-temp {
      font-size: 2rem;
    }
  }

  @container (min-width: 300px) and (max-width: 400px) {
    .mode-section {
      padding: 4px 6px;
    }

    .mode-btn {
      width: 28px;
      height: 28px;
    }

    .current-temp {
      font-size: 2.2rem;
    }
  }

  /* Info Bar */
  .info-bar {
    display: flex;
    justify-content: center;
    gap: 16px;
    padding: 8px;
    font-size: 0.75rem;
    color: var(--secondary-text-color);
    border-top: 1px solid var(--divider-color);
    position: relative;
    z-index: 5;
  }

  .info-bar-item {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .info-bar .separator {
    opacity: 0.3;
  }

  /* Error State */
  .error {
    padding: 16px;
    color: var(--error-color);
    text-align: center;
  }
`;

/**
 * Compact Better Thermostat Card
 */
class CompactBetterThermostatCard extends HTMLElement {
  /**
   * Return the editor element for visual configuration
   * @returns {HTMLElement} Editor element
   */
  static getConfigElement() {
    return document.createElement('compact-better-thermostat-card-editor');
  }

  /**
   * Return stub config for card picker
   * @param {Object} hass - Home Assistant object
   * @returns {Object} Stub config with sensible defaults
   */
  static getStubConfig(hass) {
    // Find first climate entity
    const climateEntities = Object.keys(hass?.states || {}).filter(
      (entityId) => entityId.startsWith('climate.')
    );

    return {
      entity: climateEntities[0] || '',
      show_humidity: true,
      show_window: true,
      show_summer: true,
      show_heating: true,
      step: 0.5,
      graph: {
        hours_to_show: 24,
        points_per_hour: 2,
        line_width: 2,
        show_fill: true,
      },
    };
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = {};
    this._hass = null;
    this._graphCard = null;
    this._miniGraphAvailable = null;
    this._temperatureHistory = [];
  }

  /**
   * Set the card configuration
   * @param {Object} config - Card configuration
   */
  setConfig(config) {
    if (!config.entity) {
      throw new Error("Please define an entity");
    }

    this._config = {
      show_humidity: true,
      show_window: true,
      show_summer: true,
      show_heating: true,
      show_battery: false,
      show_outdoor: false,
      show_last_changed: false,
      step: 0.5,
      graph: {
        hours_to_show: 24,
        points_per_hour: 2,
        line_width: 2,
        show_fill: true,
        temperature_color: 'var(--primary-color)',
        humidity_color: 'var(--info-color)',
        target_color: 'var(--accent-color)',
      },
      ...config,
      graph: {
        hours_to_show: 24,
        points_per_hour: 2,
        line_width: 2,
        show_fill: true,
        temperature_color: 'var(--primary-color)',
        humidity_color: 'var(--info-color)',
        target_color: 'var(--accent-color)',
        ...config.graph,
      },
    };

    this._render();
  }

  /**
   * Set hass object
   * @param {Object} hass - Home Assistant object
   */
  set hass(hass) {
    const oldHass = this._hass;
    this._hass = hass;

    if (!this._config.entity) return;

    const entity = hass.states[this._config.entity];
    const oldEntity = oldHass?.states[this._config.entity];

    // Update graph card hass
    if (this._graphCard) {
      this._graphCard.hass = hass;
    }

    // Only re-render if entity changed
    if (entity !== oldEntity) {
      this._updateContent();
    }
  }

  /**
   * Get hass object
   * @returns {Object} Home Assistant object
   */
  get hass() {
    return this._hass;
  }

  /**
   * Check if mini-graph-card is available
   * @returns {boolean} True if available
   */
  _checkMiniGraphAvailable() {
    if (this._miniGraphAvailable === null) {
      this._miniGraphAvailable = customElements.get('mini-graph-card') !== undefined;
    }
    return this._miniGraphAvailable;
  }

  /**
   * Main render function
   */
  _render() {
    const styles = document.createElement('style');
    styles.textContent = CARD_STYLES;

    const card = document.createElement('ha-card');

    // Status bar
    const statusBar = document.createElement('div');
    statusBar.className = 'status-bar';
    statusBar.id = 'status-bar';

    // Graph container
    const graphContainer = document.createElement('div');
    graphContainer.className = 'graph-container';
    graphContainer.id = 'graph-container';

    // Main content
    const mainContent = document.createElement('div');
    mainContent.className = 'main-content';
    mainContent.id = 'main-content';
    mainContent.addEventListener('click', (e) => this._handleCardClick(e));

    // Info bar
    const infoBar = document.createElement('div');
    infoBar.className = 'info-bar';
    infoBar.id = 'info-bar';
    infoBar.style.display = 'none';

    card.appendChild(statusBar);
    card.appendChild(graphContainer);
    card.appendChild(mainContent);
    card.appendChild(infoBar);

    this.shadowRoot.innerHTML = '';
    this.shadowRoot.appendChild(styles);
    this.shadowRoot.appendChild(card);

    this._setupGraph();
    this._updateContent();
  }

  /**
   * Setup the mini-graph-card
   */
  _setupGraph() {
    const container = this.shadowRoot.getElementById('graph-container');
    if (!container) return;

    if (!this._checkMiniGraphAvailable()) {
      container.innerHTML = `
        <div class="graph-fallback">
          <span>mini-graph-card required. Install via HACS.</span>
        </div>
      `;
      return;
    }

    // Create mini-graph-card
    this._graphCard = document.createElement('mini-graph-card');

    const entities = [
      {
        entity: this._config.temperature_sensor || this._config.entity,
        attribute: this._config.temperature_sensor ? undefined : 'current_temperature',
        name: 'Temperature',
        color: this._config.graph.temperature_color,
      },
    ];

    // Add humidity if configured
    const humiditySource = this._config.humidity_sensor ||
      (this._hass?.states[this._config.entity]?.attributes?.current_humidity !== undefined
        ? this._config.entity : null);

    if (humiditySource && this._config.show_humidity) {
      entities.push({
        entity: this._config.humidity_sensor || this._config.entity,
        attribute: this._config.humidity_sensor ? undefined : 'current_humidity',
        name: 'Humidity',
        color: this._config.graph.humidity_color,
        y_axis: 'secondary',
        show_state: false,
      });
    }

    const graphConfig = {
      entities,
      show: {
        name: false,
        icon: false,
        state: false,
        legend: false,
        labels: false,
      },
      hours_to_show: this._config.graph.hours_to_show,
      points_per_hour: this._config.graph.points_per_hour,
      line_width: this._config.graph.line_width,
      show_fill: this._config.graph.show_fill,
      ...this._config.graph,
    };

    try {
      this._graphCard.setConfig(graphConfig);
      if (this._hass) {
        this._graphCard.hass = this._hass;
      }
      container.appendChild(this._graphCard);
    } catch (e) {
      console.error('Error setting up mini-graph-card:', e);
      container.innerHTML = `
        <div class="graph-fallback">
          <span>Error loading graph: ${e.message}</span>
        </div>
      `;
    }
  }

  /**
   * Update the content based on current state
   */
  _updateContent() {
    if (!this._hass || !this._config.entity) return;

    const entity = this._hass.states[this._config.entity];
    if (!entity) {
      this._showError(`Entity not found: ${this._config.entity}`);
      return;
    }

    this._updateStatusBar(entity);
    this._updateMainContent(entity);
    this._updateInfoBar(entity);
  }

  /**
   * Show error message
   * @param {string} message - Error message
   */
  _showError(message) {
    const mainContent = this.shadowRoot.getElementById('main-content');
    if (mainContent) {
      mainContent.innerHTML = `<div class="error">${message}</div>`;
    }
  }

  /**
   * Update the status bar icons
   * @param {Object} entity - Entity state
   */
  _updateStatusBar(entity) {
    const statusBar = this.shadowRoot.getElementById('status-bar');
    if (!statusBar) return;

    statusBar.innerHTML = '';
    const attrs = entity.attributes;

    // Window open indicator
    if (this._config.show_window !== false &&
        (attrs.window_open === true || attrs.window === true)) {
      statusBar.appendChild(this._createStatusIcon('mdi:window-open-variant', 'warning'));
    }

    // Summer mode indicator
    if (this._config.show_summer !== false &&
        (attrs.summer_mode === true || attrs.summer === true)) {
      statusBar.appendChild(this._createStatusIcon('mdi:weather-sunny', 'warning'));
    }

    // Heating indicator
    if (this._config.show_heating !== false &&
        (attrs.hvac_action === 'heating' || attrs.call_for_heat === true)) {
      statusBar.appendChild(this._createStatusIcon('mdi:fire', 'heating'));
    }
  }

  /**
   * Create a status icon element
   * @param {string} icon - MDI icon name
   * @param {string} className - Additional class name
   * @returns {HTMLElement} Status icon element
   */
  _createStatusIcon(icon, className) {
    const iconWrapper = document.createElement('div');
    iconWrapper.className = `status-icon ${className}`;

    const haIcon = document.createElement('ha-icon');
    haIcon.setAttribute('icon', icon);

    iconWrapper.appendChild(haIcon);
    return iconWrapper;
  }

  /**
   * Update the main content area
   * @param {Object} entity - Entity state
   */
  _updateMainContent(entity) {
    const mainContent = this.shadowRoot.getElementById('main-content');
    if (!mainContent) return;

    mainContent.innerHTML = '';

    // Info section (left)
    const infoSection = this._createInfoSection(entity);
    mainContent.appendChild(infoSection);

    // Controls group (mode + target controls on right)
    const controlsGroup = document.createElement('div');
    controlsGroup.className = 'controls-group';

    // Mode buttons
    const modeSection = this._createModeSection(entity);
    controlsGroup.appendChild(modeSection);

    // Target controls
    const targetControls = this._createTargetControls(entity);
    controlsGroup.appendChild(targetControls);

    mainContent.appendChild(controlsGroup);
  }

  /**
   * Create the info section
   * @param {Object} entity - Entity state
   * @returns {HTMLElement} Info section element
   */
  _createInfoSection(entity) {
    const section = document.createElement('div');
    section.className = 'info-section';

    // Current temperature (grid-column: 1, grid-row: 1/3)
    const currentTemp = this._getCurrentTemperature(entity);
    const tempSpan = document.createElement('span');
    tempSpan.className = 'current-temp';
    tempSpan.textContent = currentTemp !== null ? `${currentTemp.toFixed(1)}°` : '--°';
    section.appendChild(tempSpan);

    // Trend arrow (grid-column: 2, grid-row: 1)
    const trend = this._calculateTrend();
    if (trend) {
      const trendSpan = document.createElement('span');
      trendSpan.className = `trend-arrow ${trend.class}`;
      trendSpan.textContent = trend.arrow;
      section.appendChild(trendSpan);
    }

    // Humidity (grid-column: 2, grid-row: 2)
    if (this._config.show_humidity !== false) {
      const humidity = this._getCurrentHumidity(entity);
      if (humidity !== null) {
        const humiditySpan = document.createElement('span');
        humiditySpan.className = 'humidity';

        const humidityText = document.createElement('span');
        humidityText.textContent = `${Math.round(humidity)}%`;

        const humidityIcon = document.createElement('ha-icon');
        humidityIcon.setAttribute('icon', 'mdi:water-percent');

        humiditySpan.appendChild(humidityText);
        humiditySpan.appendChild(humidityIcon);
        section.appendChild(humiditySpan);
      }
    }

    // Room name (grid-column: 1/3, grid-row: 3)
    const roomName = document.createElement('div');
    roomName.className = 'room-name';
    roomName.textContent = this._config.name || entity.attributes.friendly_name || '';
    section.appendChild(roomName);

    return section;
  }

  /**
   * Get current temperature from sensor or entity
   * @param {Object} entity - Entity state
   * @returns {number|null} Current temperature
   */
  _getCurrentTemperature(entity) {
    if (this._config.temperature_sensor) {
      const sensor = this._hass.states[this._config.temperature_sensor];
      if (sensor) {
        return parseFloat(sensor.state);
      }
    }
    return entity.attributes.current_temperature ?? null;
  }

  /**
   * Get current humidity from sensor or entity
   * @param {Object} entity - Entity state
   * @returns {number|null} Current humidity
   */
  _getCurrentHumidity(entity) {
    if (this._config.humidity_sensor) {
      const sensor = this._hass.states[this._config.humidity_sensor];
      if (sensor) {
        return parseFloat(sensor.state);
      }
    }
    return entity.attributes.current_humidity ?? null;
  }

  /**
   * Calculate temperature trend
   * @returns {Object|null} Trend info with arrow and class
   */
  _calculateTrend() {
    // For now, return stable - trend calculation would require history API
    // This is a placeholder for future implementation
    return { arrow: '→', class: 'stable' };
  }

  /**
   * Create the mode buttons section
   * @param {Object} entity - Entity state
   * @returns {HTMLElement} Mode section element
   */
  _createModeSection(entity) {
    const section = document.createElement('div');
    section.className = 'mode-section backdrop-panel';

    // HVAC modes - all in one horizontal row
    const hvacModes = entity.attributes.hvac_modes || [];
    hvacModes.forEach(mode => {
      const modeConfig = HVAC_MODES[mode];
      if (modeConfig) {
        const btn = this._createModeButton(
          modeConfig.icon,
          mode === entity.state,
          modeConfig.color,
          () => this._setHvacMode(mode)
        );
        section.appendChild(btn);
      }
    });

    // Preset modes - continue in the same row
    const presetModes = (entity.attributes.preset_modes || []).filter(p => p !== 'none');
    presetModes.forEach(preset => {
      const presetConfig = PRESET_MODES[preset] || { icon: 'mdi:thermostat', color: 'var(--primary-color)' };
      const btn = this._createModeButton(
        presetConfig.icon,
        preset === entity.attributes.preset_mode,
        presetConfig.color,
        () => this._setPresetMode(preset)
      );
      section.appendChild(btn);
    });

    return section;
  }

  /**
   * Create a mode button
   * @param {string} icon - MDI icon
   * @param {boolean} active - Whether button is active
   * @param {string} color - Active color
   * @param {Function} onClick - Click handler
   * @returns {HTMLElement} Button element
   */
  _createModeButton(icon, active, color, onClick) {
    const btn = document.createElement('button');
    btn.className = `mode-btn ${active ? 'active' : ''}`;

    const haIcon = document.createElement('ha-icon');
    haIcon.setAttribute('icon', icon);

    if (active) {
      haIcon.style.color = color;
    }

    btn.appendChild(haIcon);
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      onClick();
    });

    return btn;
  }

  /**
   * Create target temperature controls
   * @param {Object} entity - Entity state
   * @returns {HTMLElement} Target controls element
   */
  _createTargetControls(entity) {
    const controls = document.createElement('div');
    controls.className = 'target-controls backdrop-panel';

    // Plus button
    const plusBtn = document.createElement('button');
    plusBtn.className = 'target-btn';
    const plusIcon = document.createElement('ha-icon');
    plusIcon.setAttribute('icon', 'mdi:plus');
    plusBtn.appendChild(plusIcon);
    plusBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this._adjustTemperature(this._config.step);
    });

    // Target temperature display
    const targetTemp = document.createElement('div');
    targetTemp.className = 'target-temp';
    const target = entity.attributes.temperature;
    targetTemp.textContent = target !== undefined ? `${target.toFixed(1)}°` : '--°';

    // Apply color based on HVAC mode
    const modeConfig = HVAC_MODES[entity.state];
    if (modeConfig) {
      targetTemp.style.color = modeConfig.color;
    }

    // Minus button
    const minusBtn = document.createElement('button');
    minusBtn.className = 'target-btn';
    const minusIcon = document.createElement('ha-icon');
    minusIcon.setAttribute('icon', 'mdi:minus');
    minusBtn.appendChild(minusIcon);
    minusBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this._adjustTemperature(-this._config.step);
    });

    controls.appendChild(plusBtn);
    controls.appendChild(targetTemp);
    controls.appendChild(minusBtn);

    return controls;
  }

  /**
   * Update the optional info bar
   * @param {Object} entity - Entity state
   */
  _updateInfoBar(entity) {
    const infoBar = this.shadowRoot.getElementById('info-bar');
    if (!infoBar) return;

    const items = [];

    // Battery
    if (this._config.show_battery && this._config.battery_entity) {
      const batteryEntity = this._hass.states[this._config.battery_entity];
      if (batteryEntity) {
        items.push(`🔋 ${Math.round(parseFloat(batteryEntity.state))}%`);
      }
    }

    // Outdoor temperature
    if (this._config.show_outdoor && this._config.outdoor_entity) {
      const outdoorEntity = this._hass.states[this._config.outdoor_entity];
      if (outdoorEntity) {
        items.push(`Außen: ${parseFloat(outdoorEntity.state).toFixed(1)}°`);
      }
    }

    // Last changed
    if (this._config.show_last_changed && entity.last_changed) {
      const lastChanged = new Date(entity.last_changed);
      const timeStr = lastChanged.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      items.push(`Geändert: ${timeStr}`);
    }

    if (items.length > 0) {
      infoBar.style.display = 'flex';
      infoBar.innerHTML = items.map((item, i) => {
        const span = `<span class="info-bar-item">${item}</span>`;
        return i < items.length - 1 ? `${span}<span class="separator">|</span>` : span;
      }).join('');
    } else {
      infoBar.style.display = 'none';
    }
  }

  /**
   * Handle card click to open more-info dialog
   * @param {Event} e - Click event
   */
  _handleCardClick(e) {
    const event = new CustomEvent('hass-more-info', {
      bubbles: true,
      composed: true,
      detail: { entityId: this._config.entity },
    });
    this.dispatchEvent(event);
  }

  /**
   * Set HVAC mode
   * @param {string} mode - HVAC mode to set
   */
  _setHvacMode(mode) {
    this._hass.callService('climate', 'set_hvac_mode', {
      entity_id: this._config.entity,
      hvac_mode: mode,
    });
  }

  /**
   * Set preset mode
   * @param {string} preset - Preset mode to set
   */
  _setPresetMode(preset) {
    this._hass.callService('climate', 'set_preset_mode', {
      entity_id: this._config.entity,
      preset_mode: preset,
    });
  }

  /**
   * Adjust target temperature
   * @param {number} delta - Temperature change
   */
  _adjustTemperature(delta) {
    const entity = this._hass.states[this._config.entity];
    if (!entity) return;

    const currentTarget = entity.attributes.temperature;
    if (currentTarget === undefined) return;

    const newTarget = Math.round((currentTarget + delta) * 10) / 10;

    this._hass.callService('climate', 'set_temperature', {
      entity_id: this._config.entity,
      temperature: newTarget,
    });
  }

  /**
   * Get card size for layout purposes
   * @returns {number} Card size
   */
  getCardSize() {
    return 3;
  }
}

// Register the custom element
customElements.define('compact-better-thermostat-card', CompactBetterThermostatCard);

// Register card in the card picker
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'compact-better-thermostat-card',
  name: 'Compact Better Thermostat Card',
  description: 'A compact thermostat card with integrated temperature/humidity graph',
  preview: true,
  documentationURL: 'https://github.com/fappsde/lovelace-compact-better-thermostat-card',
});
