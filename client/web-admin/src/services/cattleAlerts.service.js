import { get } from "../store/api.service";

// cattle lifecycle alerts: dry-off due, calving due, milk withdrawal breaches, unregistered
// calves and eligibility drift. kept as its own endpoint rather than folded into the dashboard
// so a user with dashboard access but no cattle access still gets a working dashboard.
export async function getCattleAlerts(queryParams = {}) {
    try {
        return await get('cattle-alerts', queryParams);
    } catch (error) {
        return error;
    }
}
