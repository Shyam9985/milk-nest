import { get } from "../store/api.service";

// dropdown feeds for the scope bar, limited to the caller's jurisdiction by the server
export async function getDashboardFilters() {
    try {
        return await get('dashboard/filters');
    } catch (error) {
        return error;
    }
}

// the whole dashboard in one request: { from_date, to_date, dairy_farm_id, branch_id }
export async function getDashboard(queryParams = {}) {
    try {
        return await get('dashboard', queryParams);
    } catch (error) {
        return error;
    }
}
