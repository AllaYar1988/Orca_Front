// Sparkline Component - Mini chart for sensor cards using uPlot
// Based on Hawk WEBSW-Front sparkline implementation
import { memo, useState, useRef, useEffect, useMemo, useCallback } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';

/**
 * Filter data to only include today's entries
 */
const filterTodayData = (data) => {
  if (!data || data.length === 0) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTimestamp = today.getTime();

  return data.filter(d => {
    let timestamp;
    if (typeof d === 'object' && d.timestamp) {
      timestamp = new Date(d.timestamp).getTime();
    } else if (typeof d === 'object' && d.logged_at) {
      timestamp = new Date(d.logged_at).getTime();
    } else {
      return true; // Keep raw values
    }
    return timestamp >= todayTimestamp;
  });
};

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
 * Sparkline Component using uPlot
 *
 * Features:
 * - Gradient fill under line
 * - Hover tooltip with value and time
 * - Cursor point marker on hover
 * - Filters to show only today's data
 * - React.memo for performance
 */
const Sparkline = ({
  data = [],
  height = 35,
  color = '#0d6efd',
  fillOpacity = 0.2,
  strokeWidth = 1.5,
  unit = '',
  className = '',
  todayOnly = true,
}) => {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const [hoverData, setHoverData] = useState(null);
  const [chartWidth, setChartWidth] = useState(0);
  const [isReady, setIsReady] = useState(false);
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

  // Convert data to uPlot format
  const { uplotData, formattedData } = useMemo(() => {
    // Filter to today's data if enabled
    const filtered = todayOnly ? filterTodayData(data) : data;
    if (!filtered || filtered.length === 0) return { uplotData: null, formattedData: [] };

    const formatted = filtered.map((item, index) => {
      if (typeof item === 'number') {
        return { value: item, index, datetime: '' };
      }

      // Handle different data formats
      let datetime = '';
      let value = 0;

      if (item.timestamp) {
        // Data from processSensorReadings: { timestamp, value }
        datetime = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        value = parseFloat(item.value) || 0;
      } else if (item.logged_at) {
        // Raw log data: { logged_at, log_value }
        datetime = new Date(item.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        value = parseFloat(item.log_value) || 0;
      } else if (item.datetime) {
        datetime = item.datetime;
        value = parseFloat(item.value) || 0;
      } else {
        value = parseFloat(item.value || item) || 0;
      }

      return { value, datetime, index };
    });

    // Sort by index to ensure correct order
    formatted.sort((a, b) => a.index - b.index);

    // uPlot format: [[indices], [values]]
    const indices = formatted.map((_, i) => i);
    const values = formatted.map(d => d.value);

    return {
      uplotData: [indices, values],
      formattedData: formatted
    };
  }, [data, todayOnly]);

  // Handle mouse leave
  const handleMouseLeave = useCallback(() => {
    setHoverData(null);
    isMouseOverRef.current = false;
    if (chartRef.current) {
      chartRef.current.setCursor({ left: -10, top: -10 });
    }
  }, []);

  // Build uPlot options
  const buildOptions = useCallback(() => {
    return {
      width: chartWidth,
      height: height,
      padding: [2, 2, 2, 2],
      cursor: {
        show: true,
        x: true,
        y: false,
        points: {
          show: true,
          size: 6,
          fill: color,
          stroke: '#fff',
          width: 1
        },
        drag: { x: false, y: false }
      },
      select: { show: false },
      scales: {
        x: { time: false },
        y: {
          auto: true,
          range: (u, dataMin, dataMax) => {
            const range = dataMax - dataMin;
            const padding = range > 0 ? range * 0.1 : 1;
            return [dataMin - padding, dataMax + padding];
          }
        }
      },
      axes: [
        { show: false },
        { show: false }
      ],
      series: [
        {}, // X series (index)
        {
          stroke: color,
          width: strokeWidth,
          fill: (u) => {
            const ctx = u.ctx;
            const canvasHeight = u.height;
            const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
            gradient.addColorStop(0, hexToRgba(color, fillOpacity * 2));
            gradient.addColorStop(1, hexToRgba(color, 0));
            return gradient;
          },
          points: { show: false }
        }
      ],
      hooks: {
        setCursor: [
          (u) => {
            if (!isMouseOverRef.current) {
              setHoverData(null);
              return;
            }

            const { idx, left } = u.cursor;

            if (left === undefined || left === null || left < 0 || left > u.width) {
              setHoverData(null);
              return;
            }

            if (idx !== null && idx !== undefined && formattedData[idx]) {
              const dataPoint = formattedData[idx];
              setHoverData({
                value: dataPoint.value,
                datetime: dataPoint.datetime,
                unit
              });
            } else {
              setHoverData(null);
            }
          }
        ]
      },
      legend: { show: false }
    };
  }, [chartWidth, height, color, strokeWidth, fillOpacity, formattedData, unit]);

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

    // Track mouse enter/leave on the chart overlay
    const over = chartRef.current.over;

    const handleMouseEnter = () => {
      isMouseOverRef.current = true;
    };

    const handleMouseLeaveInternal = () => {
      isMouseOverRef.current = false;
      setHoverData(null);
      if (chartRef.current) {
        chartRef.current.setCursor({ left: -10, top: -10 });
      }
    };

    over.addEventListener('mouseenter', handleMouseEnter);
    over.addEventListener('mouseleave', handleMouseLeaveInternal);

    return () => {
      over.removeEventListener('mouseenter', handleMouseEnter);
      over.removeEventListener('mouseleave', handleMouseLeaveInternal);
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [uplotData, chartWidth, buildOptions]);

  // Handle resize
  useEffect(() => {
    if (chartRef.current && chartWidth > 0) {
      chartRef.current.setSize({ width: chartWidth, height });
    }
  }, [chartWidth, height]);

  // Filter for display check
  const filteredData = todayOnly ? filterTodayData(data) : data;

  // Empty state with flat line placeholder
  if (!filteredData || filteredData.length === 0) {
    return (
      <div
        ref={containerRef}
        className={`sparkline sparkline--empty ${className}`}
        style={{
          width: '100%',
          height: `${height}px`,
          backgroundColor: '#f9fafb',
          borderRadius: '4px',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div style={{
          width: '80%',
          height: '2px',
          backgroundColor: `${color}40`,
          borderRadius: '1px'
        }} />
      </div>
    );
  }

  const tooltipHeight = 22;

  return (
    <div
      className={`sparkline-wrapper ${className}`}
      style={{
        width: '100%',
        height: `${height + tooltipHeight + 2}px`,
        visibility: isReady ? 'visible' : 'hidden'
      }}
      onMouseLeave={handleMouseLeave}
    >
      {/* Chart container */}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: `${height}px`
        }}
      />

      {/* Tooltip area - always reserved, fades in/out */}
      <div style={{
        width: '100%',
        height: `${tooltipHeight}px`,
        marginTop: '2px',
        opacity: hoverData ? 1 : 0,
        transition: 'opacity 0.15s ease'
      }}>
        <div style={{
          width: '100%',
          height: '100%',
          background: `linear-gradient(135deg, ${color}15 0%, ${color}25 100%)`,
          borderLeft: `3px solid ${color}`,
          borderRadius: '0 4px 4px 0',
          padding: '4px 8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '10px',
          boxSizing: 'border-box'
        }}>
          <span style={{ fontWeight: 700, color: color }}>
            {hoverData ? `${typeof hoverData.value === 'number' ? hoverData.value.toFixed(2) : hoverData.value} ${hoverData.unit}` : '\u00A0'}
          </span>
          <span style={{ color: '#6b7280', fontSize: '9px' }}>
            {hoverData?.datetime || '\u00A0'}
          </span>
        </div>
      </div>
    </div>
  );
};

// Wrap with React.memo to prevent unnecessary re-renders
export default memo(Sparkline);
