import DairyFarmProfile from './DairyFarmProfile';
import BranchProfile from './BranchProfile';
import CattleProfile from './CattleProfile';

/*
 * The single place that knows which component shows which profile type, and what to call
 * it. Adding a profile (a user, a position, a supplier) is a new component plus one entry
 * here - the drawer, the hook and every EntityLink keep working unchanged.
 */
const PROFILE_REGISTRY = {
    'dairy-farm': { title: 'Dairy Farm', component: DairyFarmProfile, drawerSize: 'sm' },
    'branch': { title: 'Branch', component: BranchProfile, drawerSize: 'sm' },
    'cattle': { title: 'Cattle', component: CattleProfile, drawerSize: 'sm' },
};

export const getProfileDefinition = (type) => PROFILE_REGISTRY[type] || null;

export const PROFILE_TYPES = Object.keys(PROFILE_REGISTRY);
