import * as Icons from 'lucide-react';
import { ProfileHeader, ProfileSection, ProfileGrid, ProfileField, ProfileStat, ProfileBadge } from './components/ProfileField';
import EntityLink from './components/EntityLink';

/*
 * A dairy farm in full: identity and contacts, where it is, who runs it, and every branch
 * under it. Pure presentation - the data arrives as a prop, and links to a branch profile
 * are delegated through onNavigate so this component never knows how drawers work.
 */
function DairyFarmProfile({ profile, onNavigate }) {

    const location = [profile.village_sachivalayam_nm, profile.mandal_ulb_nm, profile.district_name, profile.state_name]
        .filter(Boolean).join(', ');

    return (
        <div className="space-y-5">

            <ProfileHeader icon={Icons.Warehouse} code={profile.dairy_farm_code} name={profile.dairy_farm_name}
                subtitle={location}
                badges={<ProfileBadge tone={profile.is_active ? 'success' : 'danger'}>{profile.is_active ? 'Active' : 'Inactive'}</ProfileBadge>} />

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <ProfileStat label="Branches" value={profile.branch_count} />
                <ProfileStat label="Cattle" value={profile.cattle_count} />
                <ProfileStat label="Director" value={profile.director_name || '-'} />
            </div>

            <ProfileSection title="Contact" icon={Icons.Phone}>
                <ProfileGrid>
                    <ProfileField label="Contact number" value={profile.contact_number} />
                    <ProfileField label="Email" value={profile.email} />
                    <ProfileField label="Address" value={profile.address} className="sm:col-span-2" />
                </ProfileGrid>
            </ProfileSection>

            <ProfileSection title="Branches" icon={Icons.Building2}>
                {!profile.branches?.length && <p className="text-sm text-[var(--text-tertiary)]">No branches yet.</p>}
                {!!profile.branches?.length && (
                    <ul className="divide-y divide-[var(--border-primary)]">
                        {profile.branches.map((branch) => (
                            <li key={branch.branch_id} className="flex items-center justify-between gap-3 py-2.5">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <EntityLink type="branch" id={branch.branch_id} onNavigate={onNavigate}>{branch.branch_code}</EntityLink>
                                        {!!branch.is_main_branch && <ProfileBadge tone="brand">Main</ProfileBadge>}
                                    </div>
                                    <p className="truncate text-sm text-[var(--text-primary)]">{branch.branch_name}</p>
                                    <p className="truncate text-xs text-[var(--text-tertiary)]">
                                        {[branch.village_sachivalayam_nm, branch.mandal_ulb_nm, branch.district_name].filter(Boolean).join(', ')}
                                    </p>
                                </div>
                                <div className="shrink-0 text-right">
                                    <p className="text-sm font-semibold tabular-nums text-[var(--text-primary)]">{branch.cattle_count}</p>
                                    <p className="text-xs text-[var(--text-tertiary)]">cattle</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </ProfileSection>

            <ProfileSection title="Record" icon={Icons.History}>
                <ProfileGrid>
                    <ProfileField label="Created" value={profile.created_at} />
                    <ProfileField label="Last updated" value={profile.updated_at} />
                </ProfileGrid>
            </ProfileSection>

        </div>
    );
}

export default DairyFarmProfile;
