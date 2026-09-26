import * as Icons from 'lucide-react';
import { ProfileHeader, ProfileSection, ProfileGrid, ProfileField, ProfileStat, ProfileBadge } from './components/ProfileField';
import EntityLink from './components/EntityLink';
import SimpleTable from '../../components/table/SimpleTable';

const formatAge = (months) => {
    if (months === null || months === undefined) return null;
    const years = Math.floor(months / 12), rest = months % 12;
    if (!years) return `${rest} month${rest === 1 ? '' : 's'}`;
    return `${years} yr${years === 1 ? '' : 's'}${rest ? ` ${rest} mo` : ''}`;
};

const formatMoney = (value) => value === null || value === undefined || value === ''
    ? null
    : `₹ ${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const num = (value) => value === null || value === undefined ? '-' : Number(value).toFixed(2);

// one animal in full: identity, where it lives, its body details, purchase, and what it
// has produced - lifetime totals plus the most recent days
function CattleProfile({ profile, onNavigate }) {

    const isMale = /^male$/i.test(profile.gender_nm || '');
    const healthy = /healthy/i.test(profile.health_status || '');

    return (
        <div className="space-y-5">

            <ProfileHeader icon={Icons.Beef} code={profile.cattle_unique_code} name={`${profile.breed_name} ${profile.cattle_type_name}`}
                subtitle={<>
                    <EntityLink type="branch" id={profile.branch_id} onNavigate={onNavigate}>{profile.branch_name}</EntityLink>
                    {' · '}
                    <EntityLink type="dairy-farm" id={profile.dairy_farm_id} onNavigate={onNavigate}>{profile.dairy_farm_name}</EntityLink>
                </>}
                badges={<>
                    <ProfileBadge tone={healthy ? 'success' : 'warning'}>{profile.health_status || 'Health unknown'}</ProfileBadge>
                    {profile.gender_nm && <ProfileBadge tone="neutral">{profile.gender_nm}</ProfileBadge>}
                    {isMale && <ProfileBadge tone="neutral">Not milked</ProfileBadge>}
                </>} />

            {!isMale && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <ProfileStat label="Total milk" value={profile.total_litres ? num(profile.total_litres) : null} unit="L" hint={`${profile.recorded_days} day${profile.recorded_days === 1 ? '' : 's'} recorded`} />
                    <ProfileStat label="Avg per day" value={profile.avg_litres_per_day ? num(profile.avg_litres_per_day) : null} unit="L" />
                    <ProfileStat label="Avg fat" value={profile.avg_fat ? num(profile.avg_fat) : null} unit="%" hint={profile.avg_snf ? `SNF ${num(profile.avg_snf)}%` : undefined} />
                    <ProfileStat label="Last entry" value={profile.last_entry || 'Never'} />
                </div>
            )}

            <ProfileSection title="Details" icon={Icons.ClipboardList}>
                <ProfileGrid columns={3}>
                    <ProfileField label="Type" value={profile.cattle_type_name} />
                    <ProfileField label="Breed" value={profile.breed_name} />
                    <ProfileField label="Gender" value={profile.gender_nm} />
                    <ProfileField label="Date of birth" value={profile.date_of_birth} />
                    <ProfileField label="Age" value={formatAge(profile.age_months)} />
                    <ProfileField label="Colour" value={profile.color} />
                    <ProfileField label="Weight" value={profile.weight ? `${num(profile.weight)} kg` : null} />
                    <ProfileField label="Purchase date" value={profile.purchase_date} />
                    <ProfileField label="Purchase cost" value={formatMoney(profile.purchase_cost)} />
                    <ProfileField label="Remarks" value={profile.remarks} className="sm:col-span-3" />
                </ProfileGrid>
            </ProfileSection>

            {!isMale && (
                <ProfileSection title="Recent production" icon={Icons.Milk}>
                    <SimpleTable rows={profile.recent_production || []} rowKey="production_date" searchPlaceholder="Search by date or remark..."
                        emptyMessage="No milk recorded for this animal yet." dense
                        columns={[
                            { label: 'Date', field: 'production_date', className: 'whitespace-nowrap' },
                            { label: 'Morning', field: 'morning_quantity', align: 'right', searchable: false, className: 'tabular-nums text-[var(--text-secondary)]', render: num },
                            { label: 'Evening', field: 'evening_quantity', align: 'right', searchable: false, className: 'tabular-nums text-[var(--text-secondary)]', render: num },
                            { label: 'Total', field: 'total_quantity', align: 'right', searchable: false, className: 'tabular-nums font-medium', render: num },
                            { label: 'Fat %', field: 'fat_percentage', align: 'right', searchable: false, className: 'tabular-nums text-[var(--text-secondary)]', render: num },
                            { label: 'SNF %', field: 'snf_percentage', align: 'right', searchable: false, className: 'tabular-nums text-[var(--text-secondary)]', render: num },
                            { label: 'Remarks', field: 'remarks', sortable: false, className: 'text-[var(--text-secondary)]' },
                        ]} />
                </ProfileSection>
            )}

            <ProfileSection title="Record" icon={Icons.History}>
                <ProfileGrid>
                    <ProfileField label="Registered" value={profile.created_at} />
                    <ProfileField label="Last updated" value={profile.updated_at} />
                </ProfileGrid>
            </ProfileSection>

        </div>
    );
}

export default CattleProfile;
