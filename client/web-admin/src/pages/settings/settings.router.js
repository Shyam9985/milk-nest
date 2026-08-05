import Settings from "./Settings";
import State from "./state/State";
import District from "./district/District";
import Mandal from "./mandal/Mandal";
import Village from "./village/Village";
import Position from "./position/Position";
import Users from "./users/Users";
import Roles from "./roles/Roles";
import RolePermissions from "./role-permissions/RolePermissions";
import MenuManagement from "./menu-management/MenuManagement";
import RoleMenuMapping from "./role-menu-mapping/RoleMenuMapping";
import LoginHistory from "./login-history/LoginHistory";
import AuditTrail from "./audit-trail/AuditTrail";

export default [
    { path: '/settings', component: Settings, lazy: true },
    // ===================== MASTER DATA =====================
    { path: '/settings/master/state', component: State, lazy: true },
    { path: '/settings/master/district', component: District, lazy: true },
    { path: '/settings/master/mandal', component: Mandal, lazy: true },
    { path: '/settings/master/village', component: Village, lazy: true },
    { path: '/settings/master/position', component: Position, lazy: true },

    // ===================== SECURITY =====================
    { path: '/settings/security/users', component: Users, lazy: true },
    { path: '/settings/security/roles', component: Roles, lazy: true },
    { path: '/settings/security/role-permissions', component: RolePermissions, lazy: true },
    { path: '/settings/security/menu-management', component: MenuManagement, lazy: true },
    { path: '/settings/security/role-menu-mapping', component: RoleMenuMapping, lazy: true },

    // ===================== AUDIT =====================
    { path: '/settings/audit/login-history', component: LoginHistory, lazy: true },
    { path: '/settings/audit/audit-trail', component: AuditTrail, lazy: true }
]
