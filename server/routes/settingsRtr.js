const express = require('express');
const router = express.Router();
const authmdlwre = require('../middleware/authMdlwre');
const settingsCtrl = require('../controllers/settingsCtrl');

// state master routes
router.get('/master/state', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('state', 'read'), settingsCtrl.getStatesCtrl);
router.post('/master/state', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('state', 'create'), settingsCtrl.createStateCtrl);
router.put('/master/state/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('state', 'update'), settingsCtrl.updateStateCtrl);
router.delete('/master/state/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('state', 'delete'), settingsCtrl.deleteStateCtrl);

// district master routes
router.get('/master/district', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('district', 'read'), settingsCtrl.getDistrictsCtrl);
router.post('/master/district', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('district', 'create'), settingsCtrl.createDistrictCtrl);
router.put('/master/district/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('district', 'update'), settingsCtrl.updateDistrictCtrl);
router.delete('/master/district/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('district', 'delete'), settingsCtrl.deleteDistrictCtrl);

// mandal/ULB master routes
router.get('/master/mandal', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('mandal', 'read'), settingsCtrl.getMandalsCtrl);
router.post('/master/mandal', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('mandal', 'create'), settingsCtrl.createMandalCtrl);
router.put('/master/mandal/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('mandal', 'update'), settingsCtrl.updateMandalCtrl);
router.delete('/master/mandal/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('mandal', 'delete'), settingsCtrl.deleteMandalCtrl);

// role master routes (hierarchy list feeds the role form dropdown)
router.get('/master/role', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('role', 'read'), settingsCtrl.getRolesCtrl);
router.get('/master/role/hierarchy', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('role', 'read'), settingsCtrl.getRoleHierarchiesCtrl);
router.post('/master/role', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('role', 'create'), settingsCtrl.createRoleCtrl);
router.put('/master/role/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('role', 'update'), settingsCtrl.updateRoleCtrl);
router.delete('/master/role/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('role', 'delete'), settingsCtrl.deleteRoleCtrl);

// village/sachivalayam master routes
router.get('/master/village', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('village', 'read'), settingsCtrl.getVillagesCtrl);
router.post('/master/village', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('village', 'create'), settingsCtrl.createVillageCtrl);
router.put('/master/village/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('village', 'update'), settingsCtrl.updateVillageCtrl);
router.delete('/master/village/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('village', 'delete'), settingsCtrl.deleteVillageCtrl);

// gender master routes
router.get('/master/gender', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('gender', 'read'), settingsCtrl.getGendersCtrl);
router.post('/master/gender', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('gender', 'create'), settingsCtrl.createGenderCtrl);
router.put('/master/gender/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('gender', 'update'), settingsCtrl.updateGenderCtrl);
router.delete('/master/gender/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('gender', 'delete'), settingsCtrl.deleteGenderCtrl);

// hierarchy master routes
router.get('/master/hierarchy', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('hierarchy', 'read'), settingsCtrl.getHierarchyListCtrl);
router.post('/master/hierarchy', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('hierarchy', 'create'), settingsCtrl.createHierarchyCtrl);
router.put('/master/hierarchy/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('hierarchy', 'update'), settingsCtrl.updateHierarchyCtrl);
router.delete('/master/hierarchy/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('hierarchy', 'delete'), settingsCtrl.deleteHierarchyCtrl);

// position master routes (role/hierarchy/user lists feed the position form dropdowns)
router.get('/master/position', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('position', 'read'), settingsCtrl.getPositionsCtrl);
router.get('/master/position/role', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('position', 'read'), settingsCtrl.getPositionRolesCtrl);
router.get('/master/position/hierarchy', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('position', 'read'), settingsCtrl.getPositionHierarchiesCtrl);
router.get('/master/position/user', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('position', 'read'), settingsCtrl.getPositionUsersCtrl);
router.get('/master/position/branch', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('position', 'read'), settingsCtrl.getPositionBranchesCtrl);
router.post('/master/position', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('position', 'create'), settingsCtrl.createPositionCtrl);
router.put('/master/position/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('position', 'update'), settingsCtrl.updatePositionCtrl);
router.delete('/master/position/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('position', 'delete'), settingsCtrl.deletePositionCtrl);

// dairy farm master routes
router.get('/master/dairy-farm', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('dairy-farm', 'read'), settingsCtrl.getDairyFarmsCtrl);
router.post('/master/dairy-farm', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('dairy-farm', 'create'), settingsCtrl.createDairyFarmCtrl);
router.put('/master/dairy-farm/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('dairy-farm', 'update'), settingsCtrl.updateDairyFarmCtrl);
router.delete('/master/dairy-farm/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('dairy-farm', 'delete'), settingsCtrl.deleteDairyFarmCtrl);

// role permission routes (role list feeds the form dropdown)
router.get('/security/role-permission', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('role-permissions', 'read'), settingsCtrl.getRolePermissionListCtrl);
router.get('/security/role-permission/role', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('role-permissions', 'read'), settingsCtrl.getRolePermissionRolesCtrl);
router.post('/security/role-permission', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('role-permissions', 'create'), settingsCtrl.createRolePermissionCtrl);
router.put('/security/role-permission/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('role-permissions', 'update'), settingsCtrl.updateRolePermissionCtrl);
router.delete('/security/role-permission/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('role-permissions', 'delete'), settingsCtrl.deleteRolePermissionCtrl);

// menu item routes (parent/category lists feed the form dropdowns)
router.get('/security/menu-item', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('menu-items', 'read'), settingsCtrl.getMenuItemListCtrl);
router.get('/security/menu-item/parent', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('menu-items', 'read'), settingsCtrl.getMenuParentItemsCtrl);
router.get('/security/menu-item/category', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('menu-items', 'read'), settingsCtrl.getMenuCategoryOptionsCtrl);
router.post('/security/menu-item', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('menu-items', 'create'), settingsCtrl.createMenuItemCtrl);
router.put('/security/menu-item/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('menu-items', 'update'), settingsCtrl.updateMenuItemCtrl);
router.delete('/security/menu-item/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('menu-items', 'delete'), settingsCtrl.deleteMenuItemCtrl);

// quick menu category routes (managed with the same 'menu-items' permission)
router.get('/security/menu-category', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('menu-items', 'read'), settingsCtrl.getMenuCategoryListCtrl);
router.post('/security/menu-category', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('menu-items', 'create'), settingsCtrl.createMenuCategoryCtrl);
router.put('/security/menu-category/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('menu-items', 'update'), settingsCtrl.updateMenuCategoryCtrl);
router.delete('/security/menu-category/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('menu-items', 'delete'), settingsCtrl.deleteMenuCategoryCtrl);

// role menu mapping routes (role/menu lists feed the form dropdowns)
router.get('/security/role-menu-map', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('role-menu-mapping', 'read'), settingsCtrl.getRoleMenuMapListCtrl);
router.get('/security/role-menu-map/role', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('role-menu-mapping', 'read'), settingsCtrl.getRoleMenuMapRolesCtrl);
router.get('/security/role-menu-map/menu-item', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('role-menu-mapping', 'read'), settingsCtrl.getRoleMenuMapMenuItemsCtrl);
router.post('/security/role-menu-map', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('role-menu-mapping', 'create'), settingsCtrl.createRoleMenuMapCtrl);
router.put('/security/role-menu-map/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('role-menu-mapping', 'update'), settingsCtrl.updateRoleMenuMapCtrl);
router.delete('/security/role-menu-map/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('role-menu-mapping', 'delete'), settingsCtrl.deleteRoleMenuMapCtrl);

// user routes (roles are granted through positions, so no role dropdown feed here)
router.get('/security/user', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('users', 'read'), settingsCtrl.getUserListCtrl);
router.post('/security/user', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('users', 'create'), settingsCtrl.createUserCtrl);
router.put('/security/user/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('users', 'update'), settingsCtrl.updateUserCtrl);
router.delete('/security/user/:id', authmdlwre.isAuthenticated, authmdlwre.isAuthorized('users', 'delete'), settingsCtrl.deleteUserCtrl);

module.exports = router;
