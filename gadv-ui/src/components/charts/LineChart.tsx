import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';

interface LineChartProps {
    data: number[];
    labels: string[];
    color?: string;
    height?: number | string;
    className?: string;
}

const LineChart: React.FC<LineChartProps> = ({
    data,
    labels,
    color = '#6366F1', // Indigo-500 default
    height = 300,
    className = '',
}) => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    // Configuration
    // We'll map x from 0 to 100
    // We'll map y from 0 to 100 (where 0 is bottom, 100 is top)

    const { points, pathData, areaPathData } = useMemo(() => {
        if (!data || data.length === 0) {
            return { points: [], pathData: '', areaPathData: '', maxValue: 0 };
        }

        const max = Math.max(...data) || 1; // Avoid division by zero
        // Add 20% headroom
        const chartMax = max * 1.2;

        const pts = data.map((val, index) => {
            const x = (index / (data.length - 1)) * 100;
            // Invert Y because SVG 0 is top.
            const y = 100 - (val / chartMax) * 100;
            return { x, y, value: val, label: labels[index] };
        });

        const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

        // Close the area for gradient fill (bottom-right -> bottom-left)
        const areaD = `${d} L 100 100 L 0 100 Z`;

        return { points: pts, pathData: d, areaPathData: areaD, maxValue: max };
    }, [data, labels]);

    if (!data || data.length === 0) {
        return (
            <div className={`flex items-center justify-center text-slate-400 text-sm ${className}`} style={{ height }}>
                Pas de données disponibles
            </div>
        );
    }

    return (
        <div className={`relative w-full select-none group ${className}`} style={{ height }}>
            {/* Tooltip Overlay */}
            {hoveredIndex !== null && (
                <div
                    className="absolute z-20 pointer-events-none bg-slate-900 text-white text-xs rounded-lg py-1 px-2 shadow-xl transform -translate-x-1/2 -translate-y-full transition-all duration-75"
                    style={{
                        left: `${points[hoveredIndex].x}%`,
                        top: `${points[hoveredIndex].y}%`,
                        marginTop: '-12px',
                    }}
                >
                    <div className="font-bold">{points[hoveredIndex].value.toLocaleString()}</div>
                    <div className="text-slate-400 font-medium text-[10px] whitespace-nowrap">{points[hoveredIndex].label}</div>
                    {/* Arrow */}
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1 w-2 h-2 bg-slate-900 rotate-45"></div>
                </div>
            )}

            <svg
                className="w-full h-full overflow-visible"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
            >
                <defs>
                    <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.2} />
                        <stop offset="100%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                </defs>

                {/* Grid Lines (Optional - simplified to 3 lines) */}
                {[0, 50, 100].map((y) => (
                    <line
                        key={y}
                        x1="0"
                        y1={y}
                        x2="100"
                        y2={y}
                        stroke="#E2E8F0" // slate-200
                        strokeWidth="1"
                        vectorEffect="non-scaling-stroke"
                        strokeDasharray="4 4"
                    />
                ))}

                {/* Area Fill */}
                <motion.path
                    d={areaPathData}
                    fill={`url(#gradient-${color})`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                />

                {/* Main Line */}
                <motion.path
                    d={pathData}
                    fill="none"
                    stroke={color}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, ease: "easeInOut" }}
                />

                {/* Hover Interaction Areas */}
                {points.map((p, i) => (
                    <g key={i} onMouseEnter={() => setHoveredIndex(i)} onMouseLeave={() => setHoveredIndex(null)}>
                        {/* Invisible Hit Area (Vertical Stripe) */}
                        <rect
                            x={i === 0 ? 0 : (points[i - 1].x + p.x) / 2} // Start halfway from prev
                            y="0"
                            width={
                                // Width is distance to halfway next
                                (i === points.length - 1 ? 100 : (points[i + 1].x + p.x) / 2) -
                                (i === 0 ? 0 : (points[i - 1].x + p.x) / 2)
                            }
                            height="100"
                            fill="transparent"
                            className="cursor-crosshair"
                        />
                    </g>
                ))}
            </svg>

            {/* Floating Dots Overlay (to ensure perfect circles regardless of aspect ratio) */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ clipPath: 'inset(0 0 0 0)' }}> {/* clipPath ensures we don't bleed */}
                {/* We can map the points to absolute positions percentages */}
                {points.map((p, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-3 h-3 rounded-full border-2 border-white shadow-sm"
                        style={{
                            backgroundColor: color,
                            left: `${p.x}%`,
                            top: `${p.y}%`,
                            transform: 'translate(-50%, -50%)', // Centering
                        }}
                        initial={false}
                        animate={{
                            scale: hoveredIndex === i ? 1.5 : 0,
                            opacity: hoveredIndex === i ? 1 : 0
                        }}
                        transition={{ duration: 0.15 }}
                    />
                ))}
            </div>
        </div>
    );
};

export default LineChart;
