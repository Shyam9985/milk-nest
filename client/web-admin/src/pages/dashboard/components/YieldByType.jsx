import * as Icons from 'lucide-react';
import SectionCard from './SectionCard';
import HorizontalBars from './HorizontalBars';
import EmptyState from './EmptyState';
import { formatNumber } from '../dashboard.utils';

/*
 * What each kind of animal gave this period. With two or more types the bars rank them;
 * with a single type the number is the chart, so only the figures are shown.
 */
function YieldByType({ byType }) {

    const rows = byType || [];
    const chartData = rows.map((row) => ({ name: row.cattle_type_name, total: row.total }));

    return (
        <SectionCard title="Yield by cattle type" icon={Icons.Layers}
            hint="Litres and per-animal yield for each type of animal in the period">

            {!rows.length && (
                <EmptyState icon={Icons.Layers} title="Nothing recorded in this period" compact />
            )}

            {!!rows.length && (
                <div className="space-y-4">

                    {rows.length >= 2 && <HorizontalBars data={chartData} nameKey="name" valueKey="total" valueName="Litres" color="var(--chart-3)" />}

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs uppercase tracking-wide text-[var(--text-tertiary)]">
                                    <th className="py-2 pr-3 font-medium">Type</th>
                                    <th className="py-2 pr-3 text-right font-medium">Litres</th>
                                    <th className="py-2 pr-3 text-right font-medium">Animals</th>
                                    <th className="py-2 pr-3 text-right font-medium">L / animal / day</th>
                                    <th className="py-2 pr-3 text-right font-medium">Fat %</th>
                                    <th className="py-2 text-right font-medium">SNF %</th>
                                </tr>
                            </thead>
                            <tbody className="text-[var(--text-primary)]">
                                {rows.map((row) => (
                                    <tr key={row.cattle_type_id} className="border-t border-[var(--table-cell-border)]">
                                        <td className="whitespace-nowrap py-2 pr-3 font-medium">{row.cattle_type_name}</td>
                                        <td className="py-2 pr-3 text-right font-medium tabular-nums">{formatNumber(row.total)}</td>
                                        <td className="py-2 pr-3 text-right tabular-nums">{row.milked_cattle}</td>
                                        <td className="py-2 pr-3 text-right tabular-nums">{formatNumber(row.avg_per_animal_day)}</td>
                                        <td className="py-2 pr-3 text-right tabular-nums">{row.avg_fat === null ? '-' : formatNumber(row.avg_fat)}</td>
                                        <td className="py-2 text-right tabular-nums">{row.avg_snf === null ? '-' : formatNumber(row.avg_snf)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                </div>
            )}

        </SectionCard>
    );
}

export default YieldByType;
