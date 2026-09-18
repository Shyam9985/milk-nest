const express = require('express');
const router = express.Router();
const authmdlwre = require('../middleware/authMdlwre');
const settingsCtrl = require('../controllers/settingsCtrl');
const { audit } = require('../middleware/auditMdlwre');

// state master routes
router.get('/master/state', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('state', 'read'), settingsCtrl.getStatesCtrl);
router.post('/master/state', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('state', 'create'), audit('STATE', 'CREATE', 'state_mstr_lst_t', 'state_id'), settingsCtrl.createStateCtrl);
router.put('/master/state/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('state', 'update'), audit('STATE', 'UPDATE', 'state_mstr_lst_t', 'state_id'), settingsCtrl.updateStateCtrl);
router.delete('/master/state/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('state', 'delete'), audit('STATE', 'DELETE', 'state_mstr_lst_t', 'state_id'), settingsCtrl.deleteStateCtrl);

// district master routes
router.get('/master/district', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('district', 'read'), settingsCtrl.getDistrictsCtrl);
router.post('/master/district', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('district', 'create'), audit('DISTRICT', 'CREATE', 'district_mstr_lst_t', 'district_id'), settingsCtrl.createDistrictCtrl);
router.put('/master/district/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('district', 'update'), audit('DISTRICT', 'UPDATE', 'district_mstr_lst_t', 'district_id'), settingsCtrl.updateDistrictCtrl);
router.delete('/master/district/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('district', 'delete'), audit('DISTRICT', 'DELETE', 'district_mstr_lst_t', 'district_id'), settingsCtrl.deleteDistrictCtrl);

// mandal/ULB master routes
router.get('/master/mandal', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('mandal', 'read'), settingsCtrl.getMandalsCtrl);
router.post('/master/mandal', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('mandal', 'create'), audit('MANDAL', 'CREATE', 'mandal_ulb_mstr_lst_t', 'mandal_ulb_id'), settingsCtrl.createMandalCtrl);
router.put('/master/mandal/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('mandal', 'update'), audit('MANDAL', 'UPDATE', 'mandal_ulb_mstr_lst_t', 'mandal_ulb_id'), settingsCtrl.updateMandalCtrl);
router.delete('/master/mandal/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('mandal', 'delete'), audit('MANDAL', 'DELETE', 'mandal_ulb_mstr_lst_t', 'mandal_ulb_id'), settingsCtrl.deleteMandalCtrl);

// role master routes (hierarchy list feeds the role form dropdown)
router.get('/master/role', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('role', 'read'), settingsCtrl.getRolesCtrl);
router.get('/master/role/hierarchy', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('role', 'read'), settingsCtrl.getRoleHierarchiesCtrl);
router.post('/master/role', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('role', 'create'), audit('ROLE', 'CREATE', 'roles_lst_t', 'role_id'), settingsCtrl.createRoleCtrl);
router.put('/master/role/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('role', 'update'), audit('ROLE', 'UPDATE', 'roles_lst_t', 'role_id'), settingsCtrl.updateRoleCtrl);
router.delete('/master/role/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('role', 'delete'), audit('ROLE', 'DELETE', 'roles_lst_t', 'role_id'), settingsCtrl.deleteRoleCtrl);

// village/sachivalayam master routes
router.get('/master/village', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('village', 'read'), settingsCtrl.getVillagesCtrl);
router.post('/master/village', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('village', 'create'), audit('VILLAGE', 'CREATE', 'village_sachivalayam_mst_lst_t', 'village_sachivalayam_id'), settingsCtrl.createVillageCtrl);
router.put('/master/village/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('village', 'update'), audit('VILLAGE', 'UPDATE', 'village_sachivalayam_mst_lst_t', 'village_sachivalayam_id'), settingsCtrl.updateVillageCtrl);
router.delete('/master/village/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('village', 'delete'), audit('VILLAGE', 'DELETE', 'village_sachivalayam_mst_lst_t', 'village_sachivalayam_id'), settingsCtrl.deleteVillageCtrl);

// gender master routes
router.get('/master/gender', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('gender', 'read'), settingsCtrl.getGendersCtrl);
router.post('/master/gender', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('gender', 'create'), audit('GENDER', 'CREATE', 'gender_mstr_lst_t', 'gender_id'), settingsCtrl.createGenderCtrl);
router.put('/master/gender/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('gender', 'update'), audit('GENDER', 'UPDATE', 'gender_mstr_lst_t', 'gender_id'), settingsCtrl.updateGenderCtrl);
router.delete('/master/gender/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('gender', 'delete'), audit('GENDER', 'DELETE', 'gender_mstr_lst_t', 'gender_id'), settingsCtrl.deleteGenderCtrl);

// hierarchy master routes
router.get('/master/hierarchy', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('hierarchy', 'read'), settingsCtrl.getHierarchyListCtrl);
router.post('/master/hierarchy', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('hierarchy', 'create'), audit('HIERARCHY', 'CREATE', 'hierarchy_lst_t', 'hirrarchy_id'), settingsCtrl.createHierarchyCtrl);
router.put('/master/hierarchy/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('hierarchy', 'update'), audit('HIERARCHY', 'UPDATE', 'hierarchy_lst_t', 'hirrarchy_id'), settingsCtrl.updateHierarchyCtrl);
router.delete('/master/hierarchy/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('hierarchy', 'delete'), audit('HIERARCHY', 'DELETE', 'hierarchy_lst_t', 'hirrarchy_id'), settingsCtrl.deleteHierarchyCtrl);

// position master routes (role/hierarchy/user lists feed the position form dropdowns)
router.get('/master/position', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('position', 'read'), settingsCtrl.getPositionsCtrl);
router.get('/master/position/role', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('position', 'read'), settingsCtrl.getPositionRolesCtrl);
router.get('/master/position/hierarchy', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('position', 'read'), settingsCtrl.getPositionHierarchiesCtrl);
router.get('/master/position/user', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('position', 'read'), settingsCtrl.getPositionUsersCtrl);
router.get('/master/position/branch', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('position', 'read'), settingsCtrl.getPositionBranchesCtrl);
router.post('/master/position', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('position', 'create'), audit('POSITION', 'CREATE', 'position_lst_t', 'position_id'), settingsCtrl.createPositionCtrl);
router.put('/master/position/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('position', 'update'), audit('POSITION', 'UPDATE', 'position_lst_t', 'position_id'), settingsCtrl.updatePositionCtrl);
router.delete('/master/position/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('position', 'delete'), audit('POSITION', 'DELETE', 'position_lst_t', 'position_id'), settingsCtrl.deletePositionCtrl);

// dairy farm master routes
router.get('/master/dairy-farm', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('dairy-farm', 'read'), settingsCtrl.getDairyFarmsCtrl);
router.post('/master/dairy-farm', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('dairy-farm', 'create'), audit('DAIRY_FARM', 'CREATE', 'dairy_farm_lst_t', 'dairy_farm_id'), settingsCtrl.createDairyFarmCtrl);
router.put('/master/dairy-farm/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('dairy-farm', 'update'), audit('DAIRY_FARM', 'UPDATE', 'dairy_farm_lst_t', 'dairy_farm_id'), settingsCtrl.updateDairyFarmCtrl);
router.delete('/master/dairy-farm/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('dairy-farm', 'delete'), audit('DAIRY_FARM', 'DELETE', 'dairy_farm_lst_t', 'dairy_farm_id'), settingsCtrl.deleteDairyFarmCtrl);

// branch routes (sub branches managed from the dairy farm screen, same permission key)
router.get('/master/branch', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('dairy-farm', 'read'), settingsCtrl.getBranchListCtrl);
router.post('/master/branch', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('dairy-farm', 'create'), audit('BRANCH', 'CREATE', 'branches_lst_t', 'branch_id'), settingsCtrl.createBranchCtrl);
router.put('/master/branch/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('dairy-farm', 'update'), audit('BRANCH', 'UPDATE', 'branches_lst_t', 'branch_id'), settingsCtrl.updateBranchCtrl);
router.delete('/master/branch/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('dairy-farm', 'delete'), audit('BRANCH', 'DELETE', 'branches_lst_t', 'branch_id'), settingsCtrl.deleteBranchCtrl);

// cattle register routes (the animals themselves; dropdown feeds sit under the same key)
router.get('/master/cattle', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('cattle', 'read'), settingsCtrl.getCattleListCtrl);
router.get('/master/cattle/form-options', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('cattle', 'read'), settingsCtrl.getCattleFormOptionsCtrl);
router.get('/master/cattle/branch', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('cattle', 'read'), settingsCtrl.getCattleBranchOptionsCtrl);
router.get('/master/cattle/breed', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('cattle', 'read'), settingsCtrl.getCattleBreedOptionsCtrl);
router.post('/master/cattle', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('cattle', 'create'), audit('CATTLE', 'CREATE', 'cattle_lst_t', 'cattle_id'), settingsCtrl.createCattleCtrl);
router.put('/master/cattle/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('cattle', 'update'), audit('CATTLE', 'UPDATE', 'cattle_lst_t', 'cattle_id'), settingsCtrl.updateCattleCtrl);
router.delete('/master/cattle/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('cattle', 'delete'), audit('CATTLE', 'DELETE', 'cattle_lst_t', 'cattle_id'), settingsCtrl.deleteCattleCtrl);

// cattle type master routes - its own key, like every other master ('cattle' stays for cattle records)
router.get('/master/cattle-type', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('cattle-type', 'read'), settingsCtrl.getCattleTypeListCtrl);
router.post('/master/cattle-type', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('cattle-type', 'create'), audit('CATTLE_TYPE', 'CREATE', 'cattle_types_mstr_lst_t', 'cattle_type_id'), settingsCtrl.createCattleTypeCtrl);
router.put('/master/cattle-type/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('cattle-type', 'update'), audit('CATTLE_TYPE', 'UPDATE', 'cattle_types_mstr_lst_t', 'cattle_type_id'), settingsCtrl.updateCattleTypeCtrl);
router.delete('/master/cattle-type/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('cattle-type', 'delete'), audit('CATTLE_TYPE', 'DELETE', 'cattle_types_mstr_lst_t', 'cattle_type_id'), settingsCtrl.deleteCattleTypeCtrl);

// cattle breed master routes (cattle type list feeds the breed form dropdown)
router.get('/master/cattle-breed', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('cattle-breed', 'read'), settingsCtrl.getCattleBreedListCtrl);
router.get('/master/cattle-breed/cattle-type', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('cattle-breed', 'read'), settingsCtrl.getCattleBreedTypeOptionsCtrl);
router.post('/master/cattle-breed', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('cattle-breed', 'create'), audit('CATTLE_BREED', 'CREATE', 'cattle_breeds_mstr_lst_t', 'breed_id'), settingsCtrl.createCattleBreedCtrl);
router.put('/master/cattle-breed/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('cattle-breed', 'update'), audit('CATTLE_BREED', 'UPDATE', 'cattle_breeds_mstr_lst_t', 'breed_id'), settingsCtrl.updateCattleBreedCtrl);
router.delete('/master/cattle-breed/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('cattle-breed', 'delete'), audit('CATTLE_BREED', 'DELETE', 'cattle_breeds_mstr_lst_t', 'breed_id'), settingsCtrl.deleteCattleBreedCtrl);

// role permission routes (role list feeds the form dropdown)
router.get('/security/role-permission', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('role-permissions', 'read'), settingsCtrl.getRolePermissionListCtrl);
router.get('/security/role-permission/role', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('role-permissions', 'read'), settingsCtrl.getRolePermissionRolesCtrl);
router.post('/security/role-permission', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('role-permissions', 'create'), audit('ROLE_PERMISSION', 'CREATE', 'role_permissions_t', 'role_permission_id'), settingsCtrl.createRolePermissionCtrl);
router.put('/security/role-permission/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('role-permissions', 'update'), audit('ROLE_PERMISSION', 'UPDATE', 'role_permissions_t', 'role_permission_id'), settingsCtrl.updateRolePermissionCtrl);
router.delete('/security/role-permission/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('role-permissions', 'delete'), audit('ROLE_PERMISSION', 'DELETE', 'role_permissions_t', 'role_permission_id'), settingsCtrl.deleteRolePermissionCtrl);

// menu item routes (parent/category lists feed the form dropdowns)
router.get('/security/menu-item', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('menu-items', 'read'), settingsCtrl.getMenuItemListCtrl);
router.get('/security/menu-item/parent', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('menu-items', 'read'), settingsCtrl.getMenuParentItemsCtrl);
router.get('/security/menu-item/category', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('menu-items', 'read'), settingsCtrl.getMenuCategoryOptionsCtrl);
router.post('/security/menu-item', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('menu-items', 'create'), audit('MENU_ITEM', 'CREATE', 'menu_items_t', 'menu_item_id'), settingsCtrl.createMenuItemCtrl);
router.put('/security/menu-item/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('menu-items', 'update'), audit('MENU_ITEM', 'UPDATE', 'menu_items_t', 'menu_item_id'), settingsCtrl.updateMenuItemCtrl);
router.delete('/security/menu-item/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('menu-items', 'delete'), audit('MENU_ITEM', 'DELETE', 'menu_items_t', 'menu_item_id'), settingsCtrl.deleteMenuItemCtrl);

// quick menu category routes (managed with the same 'menu-items' permission)
router.get('/security/menu-category', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('menu-items', 'read'), settingsCtrl.getMenuCategoryListCtrl);
router.post('/security/menu-category', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('menu-items', 'create'), audit('MENU_CATEGORY', 'CREATE', 'quick_menu_category_lst_t', 'quick_menu_ctgry_id'), settingsCtrl.createMenuCategoryCtrl);
router.put('/security/menu-category/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('menu-items', 'update'), audit('MENU_CATEGORY', 'UPDATE', 'quick_menu_category_lst_t', 'quick_menu_ctgry_id'), settingsCtrl.updateMenuCategoryCtrl);
router.delete('/security/menu-category/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('menu-items', 'delete'), audit('MENU_CATEGORY', 'DELETE', 'quick_menu_category_lst_t', 'quick_menu_ctgry_id'), settingsCtrl.deleteMenuCategoryCtrl);

// role menu mapping routes (role/menu lists feed the form dropdowns)
router.get('/security/role-menu-map', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('role-menu-mapping', 'read'), settingsCtrl.getRoleMenuMapListCtrl);
router.get('/security/role-menu-map/role', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('role-menu-mapping', 'read'), settingsCtrl.getRoleMenuMapRolesCtrl);
router.get('/security/role-menu-map/menu-item', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('role-menu-mapping', 'read'), settingsCtrl.getRoleMenuMapMenuItemsCtrl);
router.post('/security/role-menu-map', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('role-menu-mapping', 'create'), audit('ROLE_MENU_MAP', 'CREATE', 'role_menu_map_t', 'role_menu_id'), settingsCtrl.createRoleMenuMapCtrl);
router.put('/security/role-menu-map/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('role-menu-mapping', 'update'), audit('ROLE_MENU_MAP', 'UPDATE', 'role_menu_map_t', 'role_menu_id'), settingsCtrl.updateRoleMenuMapCtrl);
router.delete('/security/role-menu-map/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('role-menu-mapping', 'delete'), audit('ROLE_MENU_MAP', 'DELETE', 'role_menu_map_t', 'role_menu_id'), settingsCtrl.deleteRoleMenuMapCtrl);

// user routes (roles are granted through positions, so no role dropdown feed here)
router.get('/security/user', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('users', 'read'), settingsCtrl.getUserListCtrl);
router.post('/security/user', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('users', 'create'), audit('USER', 'CREATE', 'users_lst_t', 'user_id'), settingsCtrl.createUserCtrl);
router.put('/security/user/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('users', 'update'), audit('USER', 'UPDATE', 'users_lst_t', 'user_id'), settingsCtrl.updateUserCtrl);
router.delete('/security/user/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('users', 'delete'), audit('USER', 'DELETE', 'users_lst_t', 'user_id'), settingsCtrl.deleteUserCtrl);

module.exports = router;
