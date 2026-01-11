// ChartsTab Component - Full chart visualization with Hawk-style design
import { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react';
import { getDeviceLogsRange } from '../api/devices';
import UPlotChart from './UPlotChart';
import { SENSOR_TYPES, CATEGORIES, getSensorConfig } from '../config/sensorTypes';
import '../styles/charts.css';

// Cache keys for sessionStorage
const CHARTS_CACHE_KEY = 'iot-charts-cache';
const CHARTS_STATE_KEY = 'iot-charts-state';

/**
 * Get cache from sessionStorage
 */
const getCache = () => {
  try {
    const cached = sessionStorage.getItem(CHARTS_CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {
    sessionStorage.removeItem(CHARTS_CACHE_KEY);
  }
  return {};
};

/**
 * Save data to cache
 */
const saveToCache = (deviceId, dateKey, data) => {
  try {
    const cache = getCache();
    if (!cache[deviceId]) {
      cache[deviceId] = {};
    }
    cache[deviceId][dateKey] = {
      data,
      timestamp: Date.now()
    };
    sessionStorage.setItem(CHARTS_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Cache save error - storage might be full
  }
};

/**
 * Get data from cache if valid
 */
const getFromCache = (deviceId, dateKey) => {
  const cache = getCache();
  const deviceCache = cache[deviceId]?.[dateKey];

  if (!deviceCache) return null;

  // Cache valid for 10 minutes
  const CACHE_TTL = 10 * 60 * 1000;
  if (Date.now() - deviceCache.timestamp > CACHE_TTL) {
    return null;
  }

  return deviceCache.data;
};

/**
 * Get chart state from sessionStorage (for navigation persistence)
 */
const getChartState = (deviceId) => {
  try {
    const stored = sessionStorage.getItem(CHARTS_STATE_KEY);
    if (stored) {
      const allState = JSON.parse(stored);
      return allState[deviceId] || null;
    }
  } catch {
    sessionStorage.removeItem(CHARTS_STATE_KEY);
  }
  return null;
};

/**
 * Save chart state to sessionStorage (for navigation persistence)
 */
const saveChartState = (deviceId, state) => {
  try {
    const stored = sessionStorage.getItem(CHARTS_STATE_KEY);
    const allState = stored ? JSON.parse(stored) : {};
    allState[deviceId] = {
      ...state,
      timestamp: Date.now()
    };
    sessionStorage.setItem(CHARTS_STATE_KEY, JSON.stringify(allState));
  } catch {
    // Storage might be full
  }
};

/**
 * LazyChart - Only renders chart when visible in viewport
 * Inspired by Hawk's advance page implementation
 */
const LazyChart = memo(({ children, height }) => {
  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        setIsVisible(visible);
        if (visible) {
          setHasBeenVisible(true);
        }
      },
      {
        root: null,
        rootMargin: '100px', // Start loading 100px before visible
        threshold: 0
      }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} style={{ minHeight: height }}>
      {(isVisible || hasBeenVisible) ? (
        children
      ) : (
        <div
          className="chart-placeholder"
          style={{
            height,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f9fafb',
            borderRadius: '8px',
            color: '#9ca3af'
          }}
        >
          Loading chart...
        </div>
      )}
    </div>
  );
});

/**
 * ChartsTab - Advanced chart visualization component
 *
 * Features:
 * - Date range selection
 * - Category-based variable grouping
 * - Multi-variable selection with chips
 * - Multiple independent charts
 * - Y-axis range configuration
 * - Drag-to-zoom functionality
 */
const ChartsTab = ({ device, logs: todayLogs, sensorConfigs, deviceId }) => {
  // Date range state
  const today = new Date().toISOString().split('T')[0];

  // Try to restore state from sessionStorage
  const savedState = useMemo(() => getChartState(deviceId), [deviceId]);

  const [dateFrom, setDateFrom] = useState(() => savedState?.dateFrom || today);
  const [dateTo, setDateTo] = useState(() => savedState?.dateTo || today);

  // Category and variable selection
  const [activeCategory, setActiveCategory] = useState(() => savedState?.activeCategory || 'all');
  const [selectedVariables, setSelectedVariables] = useState([]);

  // Charts state - restore from saved state if available
  const [charts, setCharts] = useState(() => savedState?.charts || []);
  const [chartIdCounter, setChartIdCounter] = useState(() => savedState?.chartIdCounter || 0);

  // Shared zoom state for all charts (synced zoom)
  const [sharedZoomRange, setSharedZoomRange] = useState(() => savedState?.sharedZoomRange || null);

  // Sync key for cursor synchronization across charts
  const CHART_SYNC_KEY = 'iot-charts-sync';

  // Data loading state
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Y-axis settings - restore from saved state
  const [yAxisSettings, setYAxisSettings] = useState(() => savedState?.yAxisSettings || {});
  const [activePopover, setActivePopover] = useState(null);

  // Keep refs for state to save on unmount
  const stateRef = useRef({});
  useEffect(() => {
    stateRef.current = {
      dateFrom,
      dateTo,
      activeCategory,
      charts,
      chartIdCounter,
      sharedZoomRange,
      yAxisSettings
    };
  });

  // Save state to sessionStorage on unmount (for navigation persistence)
  useEffect(() => {
    return () => {
      if (deviceId && stateRef.current.charts?.length > 0) {
        saveChartState(deviceId, stateRef.current);
      }
    };
  }, [deviceId]);

  // Get available variables from sensor configs
  const availableVariables = useMemo(() => {
    if (!sensorConfigs || sensorConfigs.length === 0) {
      // Fall back to unique keys from logs
      const uniqueKeys = [...new Set(todayLogs.map(l => l.log_key))];
      return uniqueKeys.map(key => {
        const type = key.split('_')[0]?.toUpperCase() || 'GEN';
        const config = getSensorConfig(type);
        return {
          key,
          label: key,
          type,
          category: config.category || 'general',
          color: config.color || '#6b7280',
          unit: '',
        };
      });
    }

    return sensorConfigs.map(config => {
      const sensorType = getSensorConfig(config.sensor_type);
      return {
        key: config.log_key,
        label: config.label || config.log_key,
        type: config.sensor_type,
        category: sensorType.category || 'general',
        color: sensorType.color || '#6b7280',
        unit: config.unit || '',
        // Alarm thresholds for chart visualization
        alarmEnabled: config.alarm_enabled,
        minAlarm: config.min_alarm,
        maxAlarm: config.max_alarm,
      };
    });
  }, [sensorConfigs, todayLogs]);

  // Group variables by category
  const categorizedVariables = useMemo(() => {
    const grouped = { all: availableVariables };

    availableVariables.forEach(v => {
      if (!grouped[v.category]) {
        grouped[v.category] = [];
      }
      grouped[v.category].push(v);
    });

    return grouped;
  }, [availableVariables]);

  // Get category counts
  const categoryCounts = useMemo(() => {
    const counts = { all: availableVariables.length };
    availableVariables.forEach(v => {
      counts[v.category] = (counts[v.category] || 0) + 1;
    });
    return counts;
  }, [availableVariables]);

  // Filter variables by active category
  const filteredVariables = useMemo(() => {
    if (activeCategory === 'all') return availableVariables;
    return categorizedVariables[activeCategory] || [];
  }, [activeCategory, availableVariables, categorizedVariables]);

  // Check if viewing today only
  const isToday = dateFrom === today && dateTo === today;

  // Fetch chart data when date range changes or new chart is added
  // Uses sessionStorage cache for historical data (like Hawk's advance page)
  const fetchChartData = useCallback(async (chartVariables) => {
    if (!chartVariables || chartVariables.length === 0) return [];

    if (isToday) {
      // Use today's logs from parent - always fresh for live data
      const keys = chartVariables.map(v => v.key);
      return todayLogs.filter(l => keys.includes(l.log_key));
    }

    // Check cache for historical data
    const dateKey = `${dateFrom}_${dateTo}`;
    const cachedData = getFromCache(deviceId, dateKey);
    if (cachedData) {
      // Filter cached data for requested variables
      const keys = chartVariables.map(v => v.key);
      const filteredData = cachedData.filter(l => keys.includes(l.log_key));
      if (filteredData.length > 0) {
        return filteredData;
      }
    }

    // Fetch historical data from API
    setLoading(true);
    setLoadingProgress(0);

    try {
      const from = `${dateFrom}T00:00:00`;
      const to = `${dateTo}T23:59:59`;

      const response = await getDeviceLogsRange(deviceId, from, to, {
        keys: chartVariables.map(v => v.key).join(',')
      });

      setLoadingProgress(100);

      if (response.success) {
        const logs = response.logs || [];

        // Save to cache for future requests
        // Only cache if we have data and it's not today (historical data doesn't change)
        if (logs.length > 0) {
          saveToCache(deviceId, dateKey, logs);
        }

        return logs;
      }
    } catch (err) {
      console.error('Failed to fetch chart data:', err);
    } finally {
      setLoading(false);
    }

    return [];
  }, [deviceId, dateFrom, dateTo, isToday, todayLogs]);

  // Handle variable selection toggle
  const toggleVariable = (variable) => {
    setSelectedVariables(prev => {
      const exists = prev.find(v => v.key === variable.key);
      if (exists) {
        return prev.filter(v => v.key !== variable.key);
      }
      return [...prev, variable];
    });
  };

  // Add selected variables to a new chart
  const addChart = async () => {
    if (selectedVariables.length === 0) return;

    const newChartId = chartIdCounter + 1;
    setChartIdCounter(newChartId);

    const data = await fetchChartData(selectedVariables);

    const newChart = {
      id: newChartId,
      variables: [...selectedVariables],
      data: data,
      zoomRange: null,
    };

    setCharts(prev => [...prev, newChart]);
    setSelectedVariables([]);
  };

  // Remove a chart
  const removeChart = (chartId) => {
    setCharts(prev => prev.filter(c => c.id !== chartId));
  };

  // Remove variable from a chart
  const removeVariableFromChart = (chartId, variableKey) => {
    setCharts(prev => prev.map(chart => {
      if (chart.id !== chartId) return chart;
      const newVariables = chart.variables.filter(v => v.key !== variableKey);
      if (newVariables.length === 0) {
        return null; // Will be filtered out
      }
      return { ...chart, variables: newVariables };
    }).filter(Boolean));
  };

  // Handle zoom on a chart - syncs to all charts
  const handleZoom = (chartId, range) => {
    setSharedZoomRange(range);
  };

  // Reset zoom on all charts
  const resetZoom = () => {
    setSharedZoomRange(null);
  };

  // Update chart data when date range changes
  useEffect(() => {
    const updateChartsData = async () => {
      if (charts.length === 0) return;

      for (const chart of charts) {
        const data = await fetchChartData(chart.variables);
        setCharts(prev => prev.map(c => {
          if (c.id !== chart.id) return c;
          return { ...c, data };
        }));
      }
    };

    updateChartsData();
  }, [dateFrom, dateTo, isToday, todayLogs]);

  // Handle Y-axis settings
  const openYAxisSettings = (chartId, variableKey) => {
    const key = `${chartId}-${variableKey}`;
    setActivePopover(activePopover === key ? null : key);
  };

  const updateYAxisSettings = (chartId, variableKey, settings) => {
    const key = `${chartId}-${variableKey}`;
    setYAxisSettings(prev => ({ ...prev, [key]: settings }));
    setActivePopover(null);
  };

  // Get category info
  const getCategoryInfo = (categoryKey) => {
    return CATEGORIES[categoryKey] || { label: categoryKey, icon: 'grid' };
  };

  return (
    <div className="iot-charts-tab">
      <div className="charts-wrapper">
        {/* Controls Section */}
        <div className="charts-controls-section">
          {/* Date Range */}
          <div className="charts-date-row">
            <div className="charts-control-group">
              <label>From Date</label>
              <input
                type="date"
                className="charts-input"
                value={dateFrom}
                max={dateTo}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="charts-control-group">
              <label>To Date</label>
              <input
                type="date"
                className="charts-input"
                value={dateTo}
                min={dateFrom}
                max={today}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            {isToday && (
              <div className="live-badge" style={{ marginLeft: 'auto' }}>
                <span className="live-dot"></span>
                Live Data
              </div>
            )}
          </div>

          {/* Category Tabs */}
          <div className="charts-category-tabs">
            <button
              className={`charts-category-tab ${activeCategory === 'all' ? 'active' : ''}`}
              onClick={() => setActiveCategory('all')}
            >
              <i className="bi bi-grid charts-category-icon"></i>
              <span>All</span>
              <span className="charts-category-count">{categoryCounts.all || 0}</span>
            </button>
            {Object.entries(CATEGORIES).map(([key, cat]) => {
              const count = categoryCounts[key] || 0;
              if (count === 0) return null;
              return (
                <button
                  key={key}
                  className={`charts-category-tab ${activeCategory === key ? 'active' : ''}`}
                  onClick={() => setActiveCategory(key)}
                >
                  <i className={`bi bi-${cat.icon} charts-category-icon`}></i>
                  <span>{cat.label}</span>
                  <span className="charts-category-count">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Variable Chips */}
          <div className="charts-variable-chips-container">
            {filteredVariables.length === 0 ? (
              <p style={{ color: '#6b7280', margin: 0 }}>No variables available</p>
            ) : (
              filteredVariables.map(variable => (
                <button
                  key={variable.key}
                  className={`charts-var-chip ${selectedVariables.find(v => v.key === variable.key) ? 'selected' : ''}`}
                  onClick={() => toggleVariable(variable)}
                  style={{
                    borderColor: selectedVariables.find(v => v.key === variable.key)
                      ? '#059669'
                      : variable.color
                  }}
                >
                  {variable.label}
                  {variable.unit && <span style={{ opacity: 0.7 }}> ({variable.unit})</span>}
                </button>
              ))
            )}
          </div>

          {/* Action Buttons */}
          <div className="charts-button-row">
            <button
              className="charts-add-button"
              onClick={addChart}
              disabled={selectedVariables.length === 0 || loading}
            >
              <i className="bi bi-plus-lg"></i>
              Add Chart ({selectedVariables.length} selected)
            </button>
            {selectedVariables.length > 0 && (
              <button
                className="charts-dropdown-button"
                onClick={() => setSelectedVariables([])}
              >
                <i className="bi bi-x-lg"></i>
                Clear Selection
              </button>
            )}
          </div>
        </div>

        {/* Loading Progress */}
        {loading && (
          <div className="chart-loading-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${loadingProgress}%` }} />
            </div>
            <span>Loading chart data...</span>
          </div>
        )}

        {/* Charts Section */}
        <div className="charts-section">
          {charts.length === 0 ? (
            <div className="charts-no-charts">
              <div className="chart-empty-state">
                <div className="chart-empty-icon">
                  <svg viewBox="0 0 160 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="10" y="80" width="140" height="2" rx="1" fill="#e2e8f0"/>
                    <rect x="10" y="10" width="2" height="70" rx="1" fill="#e2e8f0"/>
                    <path
                      d="M20 60 L45 45 L70 55 L95 30 L120 40 L145 25"
                      stroke="#cbd5e1"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeDasharray="4 4"
                      className="empty-chart-line"
                    />
                    <circle cx="45" cy="45" r="4" fill="#e2e8f0"/>
                    <circle cx="95" cy="30" r="4" fill="#e2e8f0"/>
                    <circle cx="145" cy="25" r="4" fill="#e2e8f0"/>
                  </svg>
                </div>
                <h4 className="chart-empty-title">No Charts Yet</h4>
                <p className="chart-empty-message">Select variables above and click "Add Chart" to visualize data</p>
                <p className="chart-empty-hint">Tip: You can create multiple charts with different variables</p>
              </div>
            </div>
          ) : (
            charts.map(chart => (
              <div key={chart.id} className="chart-container">
                {/* Chart Header */}
                <div className="chart-header">
                  <h3 className="chart-title">
                    Chart {chart.id}
                  </h3>
                  <div className="chart-actions">
                    {sharedZoomRange && (
                      <button
                        className="reset-zoom-button"
                        onClick={resetZoom}
                      >
                        <i className="bi bi-arrows-angle-expand reset-zoom-icon"></i>
                        <span className="reset-zoom-text">Reset Zoom</span>
                      </button>
                    )}
                    <button
                      className="charts-clear-button"
                      onClick={() => removeChart(chart.id)}
                    >
                      <i className="bi bi-trash3"></i>
                      Remove
                    </button>
                  </div>
                </div>

                {/* Variable Chips */}
                <div className="chart-variables">
                  {chart.variables.map(variable => {
                    const settingsKey = `${chart.id}-${variable.key}`;
                    const settings = yAxisSettings[settingsKey] || {};

                    return (
                      <div key={variable.key} className="chart-variable-chip-wrapper">
                        <div
                          className="chart-variable-chip"
                          style={{ borderColor: variable.color, color: variable.color }}
                        >
                          <span>{variable.label}</span>
                          {variable.unit && <span style={{ opacity: 0.6 }}>({variable.unit})</span>}
                          <button
                            className={`chart-chip-settings ${activePopover === settingsKey ? 'active' : ''}`}
                            onClick={() => openYAxisSettings(chart.id, variable.key)}
                            title="Y-axis settings"
                          >
                            <i className="bi bi-gear"></i>
                          </button>
                          {chart.variables.length > 1 && (
                            <button
                              className="chart-chip-remove"
                              onClick={() => removeVariableFromChart(chart.id, variable.key)}
                              title="Remove variable"
                            >
                              &times;
                            </button>
                          )}
                        </div>

                        {/* Y-Axis Popover */}
                        {activePopover === settingsKey && (
                          <YAxisPopover
                            variable={variable}
                            settings={settings}
                            onApply={(newSettings) => updateYAxisSettings(chart.id, variable.key, newSettings)}
                            onClose={() => setActivePopover(null)}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Chart - wrapped in LazyChart for performance */}
                <LazyChart height={350}>
                  <UPlotChart
                    data={chart.data}
                    variables={chart.variables.map(v => {
                      const settingsKey = `${chart.id}-${v.key}`;
                      const settings = yAxisSettings[settingsKey] || {};
                      // Default showAlarmThresholds to true if not explicitly set
                      const showThresholds = settings.showAlarmThresholds !== undefined ? settings.showAlarmThresholds : true;
                      return {
                        ...v,
                        yMin: settings.customRange ? settings.min : undefined,
                        yMax: settings.customRange ? settings.max : undefined,
                        // Only show alarm if enabled AND showAlarmThresholds is true
                        alarmEnabled: v.alarmEnabled && showThresholds,
                      };
                    })}
                    height={350}
                    onZoom={(range) => handleZoom(chart.id, range)}
                    zoomRange={sharedZoomRange}
                    syncKey={CHART_SYNC_KEY}
                  />
                </LazyChart>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Y-Axis Settings Popover Component
 */
const YAxisPopover = ({ variable, settings, onApply, onClose }) => {
  const [customRange, setCustomRange] = useState(settings.customRange || false);
  const [min, setMin] = useState(settings.min ?? '');
  const [max, setMax] = useState(settings.max ?? '');
  // Default to true (show thresholds) if alarm is enabled
  const [showAlarmThresholds, setShowAlarmThresholds] = useState(
    settings.showAlarmThresholds !== undefined ? settings.showAlarmThresholds : true
  );

  const hasAlarm = variable.alarmEnabled && (variable.minAlarm !== null || variable.maxAlarm !== null);

  const handleApply = () => {
    onApply({
      customRange,
      min: customRange ? parseFloat(min) : undefined,
      max: customRange ? parseFloat(max) : undefined,
      showAlarmThresholds,
    });
  };

  return (
    <div className="chart-yaxis-popover">
      <div className="chart-popover-header">
        Y-Axis Settings: {variable.label}
      </div>
      <div className="chart-popover-row">
        <label>
          <input
            type="checkbox"
            checked={customRange}
            onChange={(e) => setCustomRange(e.target.checked)}
          />
          Use custom range
        </label>
      </div>
      <div className="chart-popover-inputs">
        <div className="chart-popover-field">
          <label>Min</label>
          <input
            type="number"
            value={min}
            onChange={(e) => setMin(e.target.value)}
            disabled={!customRange}
            placeholder="Auto"
          />
        </div>
        <div className="chart-popover-field">
          <label>Max</label>
          <input
            type="number"
            value={max}
            onChange={(e) => setMax(e.target.value)}
            disabled={!customRange}
            placeholder="Auto"
          />
        </div>
      </div>
      {hasAlarm && (
        <div className="chart-popover-row" style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #e5e7eb' }}>
          <label>
            <input
              type="checkbox"
              checked={showAlarmThresholds}
              onChange={(e) => setShowAlarmThresholds(e.target.checked)}
            />
            Show alarm thresholds
          </label>
          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
            Min: {variable.minAlarm ?? 'N/A'}, Max: {variable.maxAlarm ?? 'N/A'}
          </div>
        </div>
      )}
      <button className="chart-popover-apply" onClick={handleApply}>
        Apply
      </button>
    </div>
  );
};

export default ChartsTab;
