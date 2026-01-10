// UPlotChart Component - Full-featured chart for multi-variable visualization
// Inspired by Hawk WEBSW-Front uplot-chart implementation
import { memo, useState, useRef, useEffect, useMemo, useCallback } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';

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
function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' +
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

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
}) => {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const [chartWidth, setChartWidth] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [tooltip, setTooltip] = useState(null);
  const isMouseOverRef = useRef(false);

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
        y: true,
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
        }
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
            // Draw alarm-colored line segments and threshold lines
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

              // Draw red line segments where values exceed thresholds
              ctx.strokeStyle = '#ef4444';
              ctx.lineWidth = 2.5;
              ctx.lineCap = 'round';
              ctx.lineJoin = 'round';

              // Helper to check if value is in alarm
              const isInAlarm = (val) => {
                if (maxAlarm !== null && val > maxAlarm) return true;
                if (minAlarm !== null && val < minAlarm) return true;
                return false;
              };

              // Helper to find crossing point with a threshold
              const findCrossing = (v1, v2, threshold, x1, x2, y1, y2) => {
                const ratio = (threshold - v1) / (v2 - v1);
                return {
                  x: x1 + ratio * (x2 - x1),
                  y: y1 + ratio * (y2 - y1),
                  val: threshold
                };
              };

              for (let i = 0; i < seriesData.length - 1; i++) {
                const val1 = seriesData[i];
                const val2 = seriesData[i + 1];

                if (val1 === null || val2 === null) continue;

                const x1 = u.valToPos(timestamps[i], 'x', true);
                const x2 = u.valToPos(timestamps[i + 1], 'x', true);

                if (x2 < left || x1 > left + width) continue;

                const y1 = u.valToPos(val1, 'y', true);
                const y2 = u.valToPos(val2, 'y', true);

                const inAlarm1 = isInAlarm(val1);
                const inAlarm2 = isInAlarm(val2);

                // Collect all threshold crossings in this segment
                const crossings = [];

                // Check max threshold crossing
                if (maxAlarm !== null) {
                  const crosses = (val1 > maxAlarm) !== (val2 > maxAlarm);
                  if (crosses) {
                    crossings.push(findCrossing(val1, val2, maxAlarm, x1, x2, y1, y2));
                  }
                }

                // Check min threshold crossing
                if (minAlarm !== null) {
                  const crosses = (val1 < minAlarm) !== (val2 < minAlarm);
                  if (crosses) {
                    crossings.push(findCrossing(val1, val2, minAlarm, x1, x2, y1, y2));
                  }
                }

                // Sort crossings by x position
                crossings.sort((a, b) => a.x - b.x);

                // Draw alarm portions
                if (crossings.length === 0) {
                  // No crossings - draw full segment if in alarm
                  if (inAlarm1 && inAlarm2) {
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.stroke();
                  }
                } else if (crossings.length === 1) {
                  // One crossing
                  const cross = crossings[0];
                  if (inAlarm1) {
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(cross.x, cross.y);
                    ctx.stroke();
                  }
                  if (inAlarm2) {
                    ctx.beginPath();
                    ctx.moveTo(cross.x, cross.y);
                    ctx.lineTo(x2, y2);
                    ctx.stroke();
                  }
                } else if (crossings.length === 2) {
                  // Two crossings (segment goes through both thresholds)
                  const cross1 = crossings[0];
                  const cross2 = crossings[1];

                  if (inAlarm1) {
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(cross1.x, cross1.y);
                    ctx.stroke();
                  }
                  // Middle section - check if it's in alarm
                  const midVal = (cross1.val + cross2.val) / 2;
                  if (isInAlarm(midVal)) {
                    ctx.beginPath();
                    ctx.moveTo(cross1.x, cross1.y);
                    ctx.lineTo(cross2.x, cross2.y);
                    ctx.stroke();
                  }
                  if (inAlarm2) {
                    ctx.beginPath();
                    ctx.moveTo(cross2.x, cross2.y);
                    ctx.lineTo(x2, y2);
                    ctx.stroke();
                  }
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
        setCursor: [
          (u) => {
            if (!isMouseOverRef.current) {
              setTooltip(null);
              return;
            }

            const { idx, left, top } = u.cursor;

            if (left === undefined || left < 0 || left > u.width) {
              setTooltip(null);
              return;
            }

            if (idx !== null && idx !== undefined && u.data[0][idx] !== undefined) {
              const timestamp = u.data[0][idx] * 1000;
              const values = variables.map((v, i) => ({
                label: v.label || v.key,
                value: u.data[i + 1][idx],
                color: v.color || CHART_COLORS[i % CHART_COLORS.length],
                unit: v.unit || '',
              })).filter(v => v.value !== null);

              setTooltip({
                time: formatDateTime(timestamp),
                values,
                left: Math.min(left, chartWidth - 200),
                top: 10,
              });
            } else {
              setTooltip(null);
            }
          }
        ]
      },
      legend: {
        show: showLegend,
      }
    };
  }, [chartWidth, height, variables, showLegend, onZoom]);

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

    // Track mouse events
    const over = chartRef.current.over;

    const handleMouseEnter = () => {
      isMouseOverRef.current = true;
    };

    const handleMouseLeave = () => {
      isMouseOverRef.current = false;
      setTooltip(null);
    };

    over.addEventListener('mouseenter', handleMouseEnter);
    over.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      over.removeEventListener('mouseenter', handleMouseEnter);
      over.removeEventListener('mouseleave', handleMouseLeave);
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

      {/* Tooltip */}
      {tooltip && (
        <div
          className="chart-tooltip"
          style={{
            position: 'absolute',
            left: `${tooltip.left}px`,
            top: `${tooltip.top}px`,
            pointerEvents: 'none',
            zIndex: 100,
          }}
        >
          <p className="chart-tooltip-date">{tooltip.time}</p>
          {tooltip.values.map((v, i) => (
            <p key={i} style={{ color: v.color }}>
              <strong>{v.label}:</strong> {v.value?.toFixed(2)} {v.unit}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

export default memo(UPlotChart);
