import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LabelList } from 'recharts';
import ChartTooltip from './ChartTooltip';
import { formatNumber } from '../dashboard.utils';

/*
 * A ranked horizontal bar chart for one measure across a few entities (branches, cattle
 * types). One hue only - the bars differ by length, not colour - with the exact value
 * labelled at each bar's end so the chart is readable without hovering.
 */
const AXIS_TICK = { fill: 'var(--chart-axis-text)', fontSize: 11 };
const ROW_HEIGHT = 40;

function HorizontalBars({ data, nameKey, valueKey, valueName = 'Litres', unit = ' L', color = 'var(--chart-1)' }) {

    const height = Math.max(120, data.length * ROW_HEIGHT + 24);

    return (
        <div style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ top: 4, right: 56, left: 8, bottom: 0 }} barCategoryGap="28%">
                    <CartesianGrid horizontal={false} stroke="var(--chart-grid)" />
                    <XAxis type="number" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey={nameKey} width={120} tick={{ ...AXIS_TICK, fill: 'var(--text-secondary)' }}
                        axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip unit={unit} />} cursor={{ fill: 'var(--hover-bg)' }} />
                    <Bar dataKey={valueKey} name={valueName} fill={color} radius={[0, 4, 4, 0]} maxBarSize={22} isAnimationActive={false}>
                        <LabelList dataKey={valueKey} position="right" formatter={(value) => `${formatNumber(value)}${unit}`}
                            style={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

export default HorizontalBars;
