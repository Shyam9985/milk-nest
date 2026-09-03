import { get, post, put, remove } from "../store/api.service";

export async function getStates() {
    try {
        return await get('settings/master/state');
    } catch (error) {
        return error;
    }
}

export async function createState(payload) {
    try {
        return await post('settings/master/state', payload);
    } catch (error) {
        return error;
    }
}

export async function updateState(stateId, payload) {
    try {
        return await put(`settings/master/state/${stateId}`, payload);
    } catch (error) {
        return error;
    }
}

export async function deleteState(stateId) {
    try {
        return await remove(`settings/master/state/${stateId}`);
    } catch (error) {
        return error;
    }
}

export async function getDistricts(queryParams = {}) {
    try {
        return await get('settings/master/district', queryParams);
    } catch (error) {
        return error;
    }
}

export async function createDistrict(payload) {
    try {
        return await post('settings/master/district', payload);
    } catch (error) {
        return error;
    }
}

export async function updateDistrict(districtId, payload) {
    try {
        return await put(`settings/master/district/${districtId}`, payload);
    } catch (error) {
        return error;
    }
}

export async function deleteDistrict(districtId) {
    try {
        return await remove(`settings/master/district/${districtId}`);
    } catch (error) {
        return error;
    }
}

export async function getMandals(queryParams = {}) {
    try {
        return await get('settings/master/mandal', queryParams);
    } catch (error) {
        return error;
    }
}

export async function createMandal(payload) {
    try {
        return await post('settings/master/mandal', payload);
    } catch (error) {
        return error;
    }
}

export async function updateMandal(mandalId, payload) {
    try {
        return await put(`settings/master/mandal/${mandalId}`, payload);
    } catch (error) {
        return error;
    }
}

export async function deleteMandal(mandalId) {
    try {
        return await remove(`settings/master/mandal/${mandalId}`);
    } catch (error) {
        return error;
    }
}

export async function getVillages(queryParams = {}) {
    try {
        return await get('settings/master/village', queryParams);
    } catch (error) {
        return error;
    }
}

export async function createVillage(payload) {
    try {
        return await post('settings/master/village', payload);
    } catch (error) {
        return error;
    }
}

export async function updateVillage(villageId, payload) {
    try {
        return await put(`settings/master/village/${villageId}`, payload);
    } catch (error) {
        return error;
    }
}

export async function deleteVillage(villageId) {
    try {
        return await remove(`settings/master/village/${villageId}`);
    } catch (error) {
        return error;
    }
}

export async function getRoles() {
    try {
        return await get('settings/master/role');
    } catch (error) {
        return error;
    }
}

export async function getRoleHierarchies() {
    try {
        return await get('settings/master/role/hierarchy');
    } catch (error) {
        return error;
    }
}

export async function createRole(payload) {
    try {
        return await post('settings/master/role', payload);
    } catch (error) {
        return error;
    }
}

export async function updateRole(roleId, payload) {
    try {
        return await put(`settings/master/role/${roleId}`, payload);
    } catch (error) {
        return error;
    }
}

export async function deleteRole(roleId) {
    try {
        return await remove(`settings/master/role/${roleId}`);
    } catch (error) {
        return error;
    }
}

export async function getGenders() {
    try {
        return await get('settings/master/gender');
    } catch (error) {
        return error;
    }
}

export async function createGender(payload) {
    try {
        return await post('settings/master/gender', payload);
    } catch (error) {
        return error;
    }
}

export async function updateGender(genderId, payload) {
    try {
        return await put(`settings/master/gender/${genderId}`, payload);
    } catch (error) {
        return error;
    }
}

export async function deleteGender(genderId) {
    try {
        return await remove(`settings/master/gender/${genderId}`);
    } catch (error) {
        return error;
    }
}

export async function getHierarchies() {
    try {
        return await get('settings/master/hierarchy');
    } catch (error) {
        return error;
    }
}

export async function createHierarchy(payload) {
    try {
        return await post('settings/master/hierarchy', payload);
    } catch (error) {
        return error;
    }
}

export async function updateHierarchy(hierarchyId, payload) {
    try {
        return await put(`settings/master/hierarchy/${hierarchyId}`, payload);
    } catch (error) {
        return error;
    }
}

export async function deleteHierarchy(hierarchyId) {
    try {
        return await remove(`settings/master/hierarchy/${hierarchyId}`);
    } catch (error) {
        return error;
    }
}

export async function getPositions() {
    try {
        return await get('settings/master/position');
    } catch (error) {
        return error;
    }
}

export async function getPositionRoles() {
    try {
        return await get('settings/master/position/role');
    } catch (error) {
        return error;
    }
}

export async function getPositionHierarchies() {
    try {
        return await get('settings/master/position/hierarchy');
    } catch (error) {
        return error;
    }
}

export async function getPositionUsers(queryParams = {}) {
    try {
        return await get('settings/master/position/user', queryParams);
    } catch (error) {
        return error;
    }
}

export async function getPositionBranches(queryParams = {}) {
    try {
        return await get('settings/master/position/branch', queryParams);
    } catch (error) {
        return error;
    }
}

export async function createPosition(payload) {
    try {
        return await post('settings/master/position', payload);
    } catch (error) {
        return error;
    }
}

export async function updatePosition(positionId, payload) {
    try {
        return await put(`settings/master/position/${positionId}`, payload);
    } catch (error) {
        return error;
    }
}

export async function deletePosition(positionId) {
    try {
        return await remove(`settings/master/position/${positionId}`);
    } catch (error) {
        return error;
    }
}

export async function getDairyFarms() {
    try {
        return await get('settings/master/dairy-farm');
    } catch (error) {
        return error;
    }
}

export async function createDairyFarm(payload) {
    try {
        return await post('settings/master/dairy-farm', payload);
    } catch (error) {
        return error;
    }
}

export async function updateDairyFarm(dairyFarmId, payload) {
    try {
        return await put(`settings/master/dairy-farm/${dairyFarmId}`, payload);
    } catch (error) {
        return error;
    }
}

export async function deleteDairyFarm(dairyFarmId) {
    try {
        return await remove(`settings/master/dairy-farm/${dairyFarmId}`);
    } catch (error) {
        return error;
    }
}

// ===================== ROLE PERMISSIONS =====================

export async function getRolePermissionList() {
    try {
        return await get('settings/security/role-permission');
    } catch (error) {
        return error;
    }
}

export async function getRolePermissionRoles() {
    try {
        return await get('settings/security/role-permission/role');
    } catch (error) {
        return error;
    }
}

export async function createRolePermission(payload) {
    try {
        return await post('settings/security/role-permission', payload);
    } catch (error) {
        return error;
    }
}

export async function updateRolePermission(rolePermissionId, payload) {
    try {
        return await put(`settings/security/role-permission/${rolePermissionId}`, payload);
    } catch (error) {
        return error;
    }
}

export async function deleteRolePermission(rolePermissionId) {
    try {
        return await remove(`settings/security/role-permission/${rolePermissionId}`);
    } catch (error) {
        return error;
    }
}

// ===================== MENU ITEMS =====================

export async function getMenuItemList() {
    try {
        return await get('settings/security/menu-item');
    } catch (error) {
        return error;
    }
}

export async function getMenuParentItems() {
    try {
        return await get('settings/security/menu-item/parent');
    } catch (error) {
        return error;
    }
}

export async function getMenuCategoryOptions() {
    try {
        return await get('settings/security/menu-item/category');
    } catch (error) {
        return error;
    }
}

export async function createMenuItem(payload) {
    try {
        return await post('settings/security/menu-item', payload);
    } catch (error) {
        return error;
    }
}

export async function updateMenuItem(menuItemId, payload) {
    try {
        return await put(`settings/security/menu-item/${menuItemId}`, payload);
    } catch (error) {
        return error;
    }
}

export async function deleteMenuItem(menuItemId) {
    try {
        return await remove(`settings/security/menu-item/${menuItemId}`);
    } catch (error) {
        return error;
    }
}

// ===================== QUICK MENU CATEGORIES =====================

export async function getMenuCategoryList() {
    try {
        return await get('settings/security/menu-category');
    } catch (error) {
        return error;
    }
}

export async function createMenuCategory(payload) {
    try {
        return await post('settings/security/menu-category', payload);
    } catch (error) {
        return error;
    }
}

export async function updateMenuCategory(categoryId, payload) {
    try {
        return await put(`settings/security/menu-category/${categoryId}`, payload);
    } catch (error) {
        return error;
    }
}

export async function deleteMenuCategory(categoryId) {
    try {
        return await remove(`settings/security/menu-category/${categoryId}`);
    } catch (error) {
        return error;
    }
}

// ===================== ROLE MENU MAPPING =====================

export async function getRoleMenuMapList() {
    try {
        return await get('settings/security/role-menu-map');
    } catch (error) {
        return error;
    }
}

export async function getRoleMenuMapRoles() {
    try {
        return await get('settings/security/role-menu-map/role');
    } catch (error) {
        return error;
    }
}

export async function getRoleMenuMapMenuItems() {
    try {
        return await get('settings/security/role-menu-map/menu-item');
    } catch (error) {
        return error;
    }
}

export async function createRoleMenuMap(payload) {
    try {
        return await post('settings/security/role-menu-map', payload);
    } catch (error) {
        return error;
    }
}

export async function updateRoleMenuMap(roleMenuId, payload) {
    try {
        return await put(`settings/security/role-menu-map/${roleMenuId}`, payload);
    } catch (error) {
        return error;
    }
}

export async function deleteRoleMenuMap(roleMenuId) {
    try {
        return await remove(`settings/security/role-menu-map/${roleMenuId}`);
    } catch (error) {
        return error;
    }
}

// ===================== USERS =====================

export async function getUserList() {
    try {
        return await get('settings/security/user');
    } catch (error) {
        return error;
    }
}

export async function createUser(payload) {
    try {
        return await post('settings/security/user', payload);
    } catch (error) {
        return error;
    }
}

export async function updateUser(userId, payload) {
    try {
        return await put(`settings/security/user/${userId}`, payload);
    } catch (error) {
        return error;
    }
}

export async function deleteUser(userId) {
    try {
        return await remove(`settings/security/user/${userId}`);
    } catch (error) {
        return error;
    }
}
