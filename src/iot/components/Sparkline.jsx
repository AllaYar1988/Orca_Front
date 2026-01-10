import { useEffect, useRef, useState } from 'react';
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
 * Create gradient fill for uPlot
 */
const createGradient = (u, color) => {
  const gradient = u.ctx.createLinearGradient(0, u.bbox.top, 0, u.bbox.top + u.bbox.height);
  gradient.addColorStop(0, `${color}40`);
  gradient.addColorStop(1, `${color}05`);
  return gradient;
};

/**
 * Sparkline Component using uPlot
 *
 * Features:
 * - Gradient fill under line
 * - Hover info via onHover callback or inline display
 * - No data point markers
 * - Filters to show only today's data
 *
 * @param {function} onHover - Callback with { value, time } when hovering, null when leaving
 * @param {boolean} showInlineTooltip - Show tooltip inline below chart (default: true)
 */
const Sparkline = ({
  data = [],
  width = 120,
  height = 32,
  color = '#0d6efd',
  unit = '',
  className = '',
  todayOnly = true,
  onHover,
  showInlineTooltip = true,
}) => {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const [hoverInfo, setHoverInfo] = useState(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Filter to today's data if enabled
    const filteredData = todayOnly ? filterTodayData(data) : data;

    if (filteredData.length === 0) {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
      return;
    }

    // Prepare data for uPlot
    let timestamps = [];
    let values = [];

    if (typeof filteredData[0] === 'object' && filteredData[0].timestamp) {
      // Data from processSensorReadings: { timestamp, value }
      timestamps = filteredData.map(d => Math.floor(new Date(d.timestamp).getTime() / 1000));
      values = filteredData.map(d => parseFloat(d.value) || 0);
    } else if (typeof filteredData[0] === 'object' && filteredData[0].logged_at) {
      // Raw log data: { logged_at, log_value }
      timestamps = filteredData.map(d => Math.floor(new Date(d.logged_at).getTime() / 1000));
      values = filteredData.map(d => parseFloat(d.log_value) || 0);
    } else {
      // Fallback for simple array of numbers
      const now = Math.floor(Date.now() / 1000);
      timestamps = filteredData.map((_, i) => now - (filteredData.length - i - 1) * 60);
      values = filteredData.map(d => parseFloat(d) || 0);
    }

    // Sort by timestamp (ascending) to ensure correct chart order
    const sorted = timestamps.map((t, i) => ({ t, v: values[i] }))
      .sort((a, b) => a.t - b.t);
    timestamps = sorted.map(s => s.t);
    values = sorted.map(s => s.v);

    // Hover plugin
    const hoverPlugin = () => ({
      hooks: {
        setCursor: (u) => {
          const { idx } = u.cursor;
          if (idx !== null && idx !== undefined && values[idx] !== undefined) {
            const val = values[idx];
            const time = new Date(timestamps[idx] * 1000).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            });

            const info = { value: val, time, unit };
            setHoverInfo(info);
            if (onHover) onHover(info);
          }
        },
      },
    });

    // uPlot options
    const opts = {
      width,
      height,
      plugins: [hoverPlugin()],
      cursor: {
        show: true,
        x: true,
        y: false,
        points: {
          show: false, // No data point markers on hover
        },
      },
      select: { show: false },
      legend: { show: false },
      axes: [
        { show: false },
        { show: false },
      ],
      scales: {
        x: { time: false },
        y: {
          auto: true,
          range: (u, min, max) => {
            const padding = (max - min) * 0.15 || 1;
            return [min - padding, max + padding];
          },
        },
      },
      series: [
        {},
        {
          stroke: color,
          width: 1.5,
          fill: (u) => createGradient(u, color),
          points: { show: false }, // No data point markers
        },
      ],
    };

    // Destroy previous chart
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    // Create chart
    chartRef.current = new uPlot(opts, [timestamps, values], containerRef.current);

    // Clear hover info on mouse leave
    const handleMouseLeave = () => {
      setHoverInfo(null);
      if (onHover) onHover(null);
    };

    containerRef.current.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
      containerRef.current?.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [data, width, height, color, unit, todayOnly, onHover]);

  // Filter for display check
  const filteredData = todayOnly ? filterTodayData(data) : data;

  // Handle empty data
  if (filteredData.length === 0) {
    return (
      <div
        className={`sparkline sparkline--empty ${className}`}
        style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>No data today</span>
      </div>
    );
  }

  return (
    <div className={`sparkline-wrapper ${className}`}>
      <div ref={containerRef} style={{ width, height }} />

      {/* Inline tooltip below chart */}
      {showInlineTooltip && hoverInfo && (
        <div className="sparkline-inline-tooltip">
          <span className="sparkline-inline-tooltip__value">{hoverInfo.value}{unit}</span>
          <span className="sparkline-inline-tooltip__time">{hoverInfo.time}</span>
        </div>
      )}
    </div>
  );
};

export default Sparkline;
