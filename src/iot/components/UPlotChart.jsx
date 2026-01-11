// UPlotChart Component - Full-featured chart for multi-variable visualization
// Inspired by Hawk WEBSW-Front uplot-chart implementation
import { memo, useState, useRef, useEffect, useMemo, useCallback } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import '../styles/charts.css';

// Chart color palette for multiple series (red reserved for alarms)
const CHART_COLORS = [
  '#0d6efd', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4',
  '#ec4899', '#84cc16', '#f97316', '#6366f1', '#14b8a6',
  '#a855f7', '#22c55e', '#0891b2', '#0ea5e9', '#8b5cf6'
];

/**
 * Convert hex color to rgba
 */
function hexToRgba(hex, alpha) {
  let r, g, b;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else {
    r = parseInt(hex.slice(1, 3), 16);
    g = parseInt(hex.slice(3, 5), 16);
    b = parseInt(hex.slice(5, 7), 16);
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Format timestamp for display
 */

/**
 * UPlotChart Component
 *
 * Full-featured charting component with:
 * - Multiple series support
 * - Drag-to-zoom functionality
 * - Custom tooltips
 * - Responsive sizing
 * - Y-axis range configuration
 */
const UPlotChart = ({
  data = [],
  variables = [], // Array of { key, label, color, unit, yMin, yMax, alarmEnabled, minAlarm, maxAlarm }
  height = 350,
  showLegend = true,
  onZoom = null,
  zoomRange = null,
  className = '',
  syncKey = null, // Cursor sync key - charts with same key sync cursors
}) => {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const [chartWidth, setChartWidth] = useState(0);
  const [isReady, setIsReady] = useState(false);

  // Measure container width with ResizeObserver
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        if (width > 0) {
          setChartWidth(width);
          setIsReady(true);
        }
      }
    };

    updateWidth();

    const resizeObserver = new ResizeObserver(updateWidth);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  // Process data for uPlot format
  const { uplotData, timeRange } = useMemo(() => {
    if (!data || data.length === 0 || variables.length === 0) {
      return { uplotData: null, timeRange: null };
    }

    // Group data by timestamp
    const timeMap = new Map();

    data.forEach(item => {
      const timestamp = new Date(item.logged_at || item.timestamp).getTime() / 1000; // Unix seconds
      if (!timeMap.has(timestamp)) {
        timeMap.set(timestamp, {});
      }
      const key = item.log_key || item.key;
      const value = parseFloat(item.log_value ?? item.value);
      if (!isNaN(value)) {
        timeMap.get(timestamp)[key] = value;
      }
    });

    // Sort by timestamp
    const sortedTimes = Array.from(timeMap.keys()).sort((a, b) => a - b);

    if (sortedTimes.length === 0) {
      return { uplotData: null, timeRange: null };
    }

    // Build uPlot data arrays
    const timestamps = sortedTimes;
    const seriesData = variables.map(v => {
      return sortedTimes.map(t => {
        const val = timeMap.get(t)?.[v.key];
        return val !== undefined ? val : null;
      });
    });

    return {
      uplotData: [timestamps, ...seriesData],
      timeRange: { min: sortedTimes[0], max: sortedTimes[sortedTimes.length - 1] }
    };
  }, [data, variables]);

  // Build chart options
  const buildOptions = useCallback(() => {
    const series = [
      {}, // X-axis (time)
      ...variables.map((v, idx) => ({
        label: v.label || v.key,
        stroke: v.color || CHART_COLORS[idx % CHART_COLORS.length],
        width: 2,
        points: { show: false },
        spanGaps: true,
      }))
    ];

    // Configure scales
    const scales = {
      x: { time: true },
    };

    // Configure Y-axis - use single scale for simplicity
    scales.y = {
      auto: true,
      range: (u, dataMin, dataMax) => {
        // Check if any variable has custom range
        const customMin = variables.find(v => v.yMin !== undefined)?.yMin;
        const customMax = variables.find(v => v.yMax !== undefined)?.yMax;

        if (customMin !== undefined && customMax !== undefined) {
          return [customMin, customMax];
        }

        // Auto range with padding
        const range = dataMax - dataMin || 1;
        const padding = range * 0.1;
        return [
          customMin ?? (dataMin - padding),
          customMax ?? (dataMax + padding)
        ];
      }
    };

    // Configure axes
    const axes = [
      {
        stroke: '#6b7280',
        grid: { stroke: '#e5e7eb', width: 1 },
        ticks: { stroke: '#e5e7eb', width: 1 },
        values: (u, vals) => vals.map(v => {
          const date = new Date(v * 1000);
          // Show date if range > 1 day
          if (u.scales.x.max - u.scales.x.min > 86400) {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
          }
          return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }),
        font: '11px system-ui',
        size: 40,
      },
      {
        stroke: '#6b7280',
        grid: { stroke: '#e5e7eb', width: 1 },
        ticks: { stroke: '#e5e7eb', width: 1 },
        values: (u, vals) => vals.map(v => v.toFixed(1)),
        font: '11px system-ui',
        size: 60,
      }
    ];

    return {
      width: chartWidth,
      height: height,
      padding: [16, 16, 8, 8],
      cursor: {
        show: true,
        x: true,
        y: false, // No horizontal cursor line
        points: {
          show: true,
          size: 8,
          fill: (u, seriesIdx) => series[seriesIdx]?.stroke || '#0d6efd',
          stroke: '#fff',
          width: 2
        },
        drag: {
          x: true,
          y: false,
          setScale: true,
        },
        sync: syncKey ? {
          key: syncKey,
          setSeries: true,
        } : undefined,
      },
      select: {
        show: true,
        left: 0,
        width: 0,
      },
      scales,
      axes,
      series,
      hooks: {
        draw: [
          (u) => {
            // Draw filled alarm zones and threshold lines
            const ctx = u.ctx;
            const { left, top, width, height } = u.bbox;

            variables.forEach((v, idx) => {
              if (!v.alarmEnabled) return;

              const seriesIdx = idx + 1;
              const seriesData = u.data[seriesIdx];
              const timestamps = u.data[0];

              if (!seriesData || seriesData.length === 0) return;

              const minAlarm = v.minAlarm !== null && v.minAlarm !== undefined ? parseFloat(v.minAlarm) : null;
              const maxAlarm = v.maxAlarm !== null && v.maxAlarm !== undefined ? parseFloat(v.maxAlarm) : null;

              ctx.save();

              // Clip to chart area
              ctx.beginPath();
              ctx.rect(left, top, width, height);
              ctx.clip();

              // Fill style for alarm zones (semi-transparent red)
              ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';

              // Helper to find crossing point with a threshold
              const findCrossing = (v1, v2, threshold, t1, t2) => {
                const ratio = (threshold - v1) / (v2 - v1);
                return {
                  t: t1 + ratio * (t2 - t1),
                  val: threshold
                };
              };

              // Draw filled area for values above maxAlarm
              if (maxAlarm !== null) {
                const maxY = u.valToPos(maxAlarm, 'y', true);

                ctx.beginPath();
                let inAlarmZone = false;
                let lastX = null;

                for (let i = 0; i < seriesData.length; i++) {
                  const val = seriesData[i];
                  if (val === null) {
                    if (inAlarmZone) {
                      // Close the current zone
                      ctx.lineTo(lastX, maxY);
                      ctx.closePath();
                      ctx.fill();
                      ctx.beginPath();
                      inAlarmZone = false;
                    }
                    continue;
                  }

                  const x = u.valToPos(timestamps[i], 'x', true);
                  const y = u.valToPos(val, 'y', true);

                  // Check for crossing from previous point
                  if (i > 0 && seriesData[i - 1] !== null) {
                    const prevVal = seriesData[i - 1];
                    const prevX = u.valToPos(timestamps[i - 1], 'x', true);

                    // Crossing into alarm zone
                    if (prevVal <= maxAlarm && val > maxAlarm) {
                      const cross = findCrossing(prevVal, val, maxAlarm, timestamps[i - 1], timestamps[i]);
                      const crossX = u.valToPos(cross.t, 'x', true);
                      ctx.moveTo(crossX, maxY);
                      ctx.lineTo(x, y);
                      inAlarmZone = true;
                    }
                    // Crossing out of alarm zone
                    else if (prevVal > maxAlarm && val <= maxAlarm) {
                      const cross = findCrossing(prevVal, val, maxAlarm, timestamps[i - 1], timestamps[i]);
                      const crossX = u.valToPos(cross.t, 'x', true);
                      ctx.lineTo(crossX, maxY);
                      ctx.closePath();
                      ctx.fill();
                      ctx.beginPath();
                      inAlarmZone = false;
                    }
                    // Continue in alarm zone
                    else if (val > maxAlarm && inAlarmZone) {
                      ctx.lineTo(x, y);
                    }
                    // Start new alarm zone (first point above threshold)
                    else if (val > maxAlarm && !inAlarmZone) {
                      ctx.moveTo(x, maxY);
                      ctx.lineTo(x, y);
                      inAlarmZone = true;
                    }
                  } else if (val > maxAlarm) {
                    // First point is in alarm zone
                    ctx.moveTo(x, maxY);
                    ctx.lineTo(x, y);
                    inAlarmZone = true;
                  }

                  lastX = x;
                }

                // Close final zone if still in alarm
                if (inAlarmZone && lastX !== null) {
                  ctx.lineTo(lastX, maxY);
                  ctx.closePath();
                  ctx.fill();
                }
              }

              // Draw filled area for values below minAlarm
              if (minAlarm !== null) {
                const minY = u.valToPos(minAlarm, 'y', true);

                ctx.beginPath();
                let inAlarmZone = false;
                let lastX = null;

                for (let i = 0; i < seriesData.length; i++) {
                  const val = seriesData[i];
                  if (val === null) {
                    if (inAlarmZone) {
                      ctx.lineTo(lastX, minY);
                      ctx.closePath();
                      ctx.fill();
                      ctx.beginPath();
                      inAlarmZone = false;
                    }
                    continue;
                  }

                  const x = u.valToPos(timestamps[i], 'x', true);
                  const y = u.valToPos(val, 'y', true);

                  if (i > 0 && seriesData[i - 1] !== null) {
                    const prevVal = seriesData[i - 1];

                    // Crossing into alarm zone (going below min)
                    if (prevVal >= minAlarm && val < minAlarm) {
                      const cross = findCrossing(prevVal, val, minAlarm, timestamps[i - 1], timestamps[i]);
                      const crossX = u.valToPos(cross.t, 'x', true);
                      ctx.moveTo(crossX, minY);
                      ctx.lineTo(x, y);
                      inAlarmZone = true;
                    }
                    // Crossing out of alarm zone
                    else if (prevVal < minAlarm && val >= minAlarm) {
                      const cross = findCrossing(prevVal, val, minAlarm, timestamps[i - 1], timestamps[i]);
                      const crossX = u.valToPos(cross.t, 'x', true);
                      ctx.lineTo(crossX, minY);
                      ctx.closePath();
                      ctx.fill();
                      ctx.beginPath();
                      inAlarmZone = false;
                    }
                    // Continue in alarm zone
                    else if (val < minAlarm && inAlarmZone) {
                      ctx.lineTo(x, y);
                    }
                    // Start new alarm zone
                    else if (val < minAlarm && !inAlarmZone) {
                      ctx.moveTo(x, minY);
                      ctx.lineTo(x, y);
                      inAlarmZone = true;
                    }
                  } else if (val < minAlarm) {
                    ctx.moveTo(x, minY);
                    ctx.lineTo(x, y);
                    inAlarmZone = true;
                  }

                  lastX = x;
                }

                if (inAlarmZone && lastX !== null) {
                  ctx.lineTo(lastX, minY);
                  ctx.closePath();
                  ctx.fill();
                }
              }

              ctx.restore();

              // Draw threshold lines
              ctx.save();
              ctx.setLineDash([6, 4]);
              ctx.strokeStyle = '#ef4444';
              ctx.lineWidth = 1.5;

              if (minAlarm !== null) {
                const y = u.valToPos(minAlarm, 'y', true);
                if (y >= top && y <= top + height) {
                  ctx.beginPath();
                  ctx.moveTo(left, y);
                  ctx.lineTo(left + width, y);
                  ctx.stroke();

                  ctx.setLineDash([]);
                  ctx.fillStyle = '#ef4444';
                  ctx.font = '10px system-ui';
                  ctx.fillText(`Min: ${minAlarm}`, left + 5, y - 4);
                }
              }

              if (maxAlarm !== null) {
                const y = u.valToPos(maxAlarm, 'y', true);
                if (y >= top && y <= top + height) {
                  ctx.setLineDash([6, 4]);
                  ctx.beginPath();
                  ctx.moveTo(left, y);
                  ctx.lineTo(left + width, y);
                  ctx.stroke();

                  ctx.setLineDash([]);
                  ctx.fillStyle = '#ef4444';
                  ctx.font = '10px system-ui';
                  ctx.fillText(`Max: ${maxAlarm}`, left + 5, y + 12);
                }
              }

              ctx.restore();
            });
          }
        ],
        setSelect: [
          (u) => {
            if (u.select.width > 10) {
              const min = u.posToVal(u.select.left, 'x');
              const max = u.posToVal(u.select.left + u.select.width, 'x');
              if (onZoom) {
                onZoom({ min, max });
              }
              u.setSelect({ left: 0, width: 0 }, false);
            }
          }
        ],
      },
      legend: {
        show: showLegend,
      }
    };
  }, [chartWidth, height, variables, showLegend, onZoom, syncKey]);

  // Initialize/update chart
  useEffect(() => {
    if (!containerRef.current || !uplotData || chartWidth === 0) return;

    // Clean up existing chart
    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    const opts = buildOptions();
    chartRef.current = new uPlot(opts, uplotData, containerRef.current);

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [uplotData, chartWidth, buildOptions]);

  // Apply external zoom range
  useEffect(() => {
    if (chartRef.current && zoomRange) {
      chartRef.current.setScale('x', zoomRange);
    }
  }, [zoomRange]);

  // Handle resize
  useEffect(() => {
    if (chartRef.current && chartWidth > 0) {
      chartRef.current.setSize({ width: chartWidth, height });
    }
  }, [chartWidth, height]);

  // Empty state
  if (!uplotData || variables.length === 0) {
    return (
      <div className={`chart-empty-state ${className}`}>
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
        <h4 className="chart-empty-title">No Data to Display</h4>
        <p className="chart-empty-message">Select variables and date range to view chart</p>
        <p className="chart-empty-hint">Drag to zoom, double-click to reset</p>
      </div>
    );
  }

  return (
    <div className={`uplot-chart-wrapper ${className}`} style={{ position: 'relative' }}>
      {/* Chart container */}
      <div
        ref={containerRef}
        className="uplot-container"
        style={{
          width: '100%',
          minHeight: `${height}px`,
          visibility: isReady ? 'visible' : 'hidden'
        }}
      />
    </div>
  );
};

// Custom comparison function for memo to prevent unnecessary re-renders
const arePropsEqual = (prevProps, nextProps) => {
  // Only re-render if these critical props change
  if (prevProps.height !== nextProps.height) return false;
  if (prevProps.showLegend !== nextProps.showLegend) return false;
  if (prevProps.syncKey !== nextProps.syncKey) return false;
  if (prevProps.className !== nextProps.className) return false;

  // Compare zoom range
  if (prevProps.zoomRange?.min !== nextProps.zoomRange?.min ||
      prevProps.zoomRange?.max !== nextProps.zoomRange?.max) return false;

  // Compare data length and timestamps (shallow check for performance)
  if (prevProps.data?.length !== nextProps.data?.length) return false;

  // Compare variables by key (most common change)
  const prevKeys = prevProps.variables?.map(v => v.key).join(',') || '';
  const nextKeys = nextProps.variables?.map(v => v.key).join(',') || '';
  if (prevKeys !== nextKeys) return false;

  // Compare y-axis settings for each variable
  const prevYSettings = prevProps.variables?.map(v => `${v.yMin}-${v.yMax}-${v.alarmEnabled}`).join(',') || '';
  const nextYSettings = nextProps.variables?.map(v => `${v.yMin}-${v.yMax}-${v.alarmEnabled}`).join(',') || '';
  if (prevYSettings !== nextYSettings) return false;

  // If data arrays exist, do a shallow check on first and last items
  if (prevProps.data?.length > 0 && nextProps.data?.length > 0) {
    const prevFirst = prevProps.data[0];
    const nextFirst = nextProps.data[0];
    const prevLast = prevProps.data[prevProps.data.length - 1];
    const nextLast = nextProps.data[nextProps.data.length - 1];

    if (prevFirst?.logged_at !== nextFirst?.logged_at ||
        prevLast?.logged_at !== nextLast?.logged_at) return false;
  }

  return true; // Props are equal, skip re-render
};

export default memo(UPlotChart, arePropsEqual);
