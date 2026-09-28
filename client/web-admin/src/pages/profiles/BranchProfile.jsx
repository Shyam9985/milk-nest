import * as Icons from 'lucide-react';
import { ProfileHeader, ProfileSection, ProfileGrid, ProfileField, ProfileStat, ProfileBadge } from './components/ProfileField';
import EntityLink from './components/EntityLink';
import SimpleTable from '../../components/table/SimpleTable';

// a branch in full: where it is, who runs it, how the herd looks and every animal on it
function BranchProfile({ profile, onNavigate }) {

    const location = [profile.village_sachivalayam_nm, profile.mandal_ulb_nm, profile.district_name, profile.state_name]
        .filter(Boolean).join(', ');

    return (
        <div className="space-y-5">

            <ProfileHeader icon={Icons.Building2} code={profile.branch_code} name={profile.branch_name}
                subtitle={<>Part of <EntityLink type="dairy-farm" id={profile.dairy_farm_id} onNavigate={onNavigate}>{profile.dairy_farm_name}</EntityLink></>}
                badges={<>
                    {!!profile.is_main_branch && <ProfileBadge tone="brand">Main branch</ProfileBadge>}
                    <ProfileBadge tone={profile.is_active ? 'success' : 'danger'}>{profile.is_active ? 'Active' : 'Inactive'}</ProfileBadge>
                </>} />

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <ProfileStat label="Cattle" value={profile.cattle_count} hint={`${profile.milking_count} milking`} />
                <ProfileStat label="Last milk entry" value={profile.last_entry || 'Never'} />
                <ProfileStat label="Incharge" value={profile.incharge_name || '-'} hint={profile.manager_name ? `Manager: ${profile.manager_name}` : undefined} />
            </div>

            {/* where the rest of the herd is, for the animals not on today's sheet. 'Milking' is the
                can_produce_milk flag, so these four read against the same number shown above */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <ProfileStat label="Milking" value={profile.milking_count ?? 0} hint="on the day sheet" />
                <ProfileStat label="Pregnant" value={profile.pregnant_count ?? 0} hint="pregnancy in progress" />
                <ProfileStat label="Dry" value={profile.dry_count ?? 0} hint="dried off or marked dry" />
                <ProfileStat label="Under treatment" value={profile.under_treatment_count ?? 0} hint="open illness" />
            </div>

            <ProfileSection title="Location & contact" icon={Icons.MapPin}>
                <ProfileGrid>
                    <ProfileField label="Location" value={location} className="sm:col-span-2" />
                    <ProfileField label="Address" value={profile.address} className="sm:col-span-2" />
                    <ProfileField label="Contact number" value={profile.contact_number} />
                    <ProfileField label="Email" value={profile.email} />
                </ProfileGrid>
            </ProfileSection>

            <ProfileSection title="Cattle" icon={Icons.Beef}>
                <SimpleTable rows={profile.cattle || []} rowKey="cattle_id" searchPlaceholder="Search cattle..."
                    emptyMessage="No cattle registered at this branch."
                    columns={[
                        { label: 'Code', field: 'cattle_unique_code', className: 'whitespace-nowrap',
                          render: (value, animal) => <EntityLink type="cattle" id={animal.cattle_id} onNavigate={onNavigate}>{value}</EntityLink> },
                        { label: 'Type', field: 'cattle_type_name', className: 'text-[var(--text-secondary)]' },
                        { label: 'Breed', field: 'breed_name', className: 'text-[var(--text-secondary)]' },
                        { label: 'Gender', field: 'gender_nm', className: 'text-[var(--text-secondary)]' },
                        // derived from open treatment episodes, not a stored column
                        { label: 'Health', field: 'open_treatments', sortable: false,
                          render: (value, animal) => (Number(value) > 0
                              ? <ProfileBadge tone="warning">{animal.open_illness || 'Under treatment'}</ProfileBadge>
                              : <ProfileBadge tone="success">Well</ProfileBadge>) },
                    ]} />
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

export default BranchProfile;
