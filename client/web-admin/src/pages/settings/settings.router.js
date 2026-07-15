import Settings from "./Setings";
import Country from "./Country";
import State from "./State";
import District from "./District";
import Mandal from "./Mandal";
import UBL from "./UBL";
import Village from "./Village";
import Department from "./Department";
import Designation from "./Designation";
import Position from "./Position";
import Branch from "./Branch";
import FinancialYear from "./FinancialYear";
import Language from "./Language";
import Users from "./Users";
import Roles from "./Roles";
import RolePermissions from "./RolePermissions";
import MenuManagement from "./MenuManagement";
import RoleMenuMapping from "./RoleMenuMapping";
import PasswordPolicy from "./PasswordPolicy";
import LoginPolicy from "./LoginPolicy";
import Company from "./Company";
import Organization from "./Organization";
import Office from "./Office";
import Region from "./Region";
import Division from "./Division";
import GeneralSettings from "./GeneralSettings";
import Theme from "./Theme";
import DateFormat from "./DateFormat";
import TimeZone from "./TimeZone";
import EmailConfiguration from "./EmailConfiguration";
import SMSConfiguration from "./SMSConfiguration";
import FileUpload from "./FileUpload";
import WorkflowTypes from "./WorkflowTypes";
import ApprovalLevels from "./ApprovalLevels";
import StatusMaster from "./StatusMaster";
import EscalationRules from "./EscalationRules";
import EmailTemplates from "./EmailTemplates";
import SMSTemplates from "./SMSTemplates";
import PushNotifications from "./PushNotifications";
import AlertRules from "./AlertRules";
import ReportCategories from "./ReportCategories";
import ReportTemplates from "./ReportTemplates";
import DashboardConfiguration from "./DashboardConfiguration";
import LoginHistory from "./LoginHistory";
import UserActivity from "./UserActivity";
import AuditTrail from "./AuditTrail";
import SystemLogs from "./SystemLogs";

export default [
    { path: '/settings', component: Settings, lazy: true },
    // ===================== MASTER DATA =====================
    { path: '/settings/master/country', component: Country, lazy: true },
    { path: '/settings/master/state', component: State, lazy: true },
    { path: '/settings/master/district', component: District, lazy: true },
    { path: '/settings/master/mandal', component: Mandal, lazy: true },
    { path: '/settings/master/ubl', component: UBL, lazy: true },
    { path: '/settings/master/village', component: Village, lazy: true },
    { path: '/settings/master/department', component: Department, lazy: true },
    { path: '/settings/master/designation', component: Designation, lazy: true },
    { path: '/settings/master/position', component: Position, lazy: true },
    { path: '/settings/master/branch', component: Branch, lazy: true },
    { path: '/settings/master/financial-year', component: FinancialYear, lazy: true },
    { path: '/settings/master/language', component: Language, lazy: true },

    // ===================== SECURITY =====================
    { path: '/settings/security/users', component: Users, lazy: true },
    { path: '/settings/security/roles', component: Roles, lazy: true },
    { path: '/settings/security/role-permissions', component: RolePermissions, lazy: true },
    { path: '/settings/security/menu-management', component: MenuManagement, lazy: true },
    { path: '/settings/security/role-menu-mapping', component: RoleMenuMapping, lazy: true },
    { path: '/settings/security/password-policy', component: PasswordPolicy, lazy: true },
    { path: '/settings/security/login-policy', component: LoginPolicy, lazy: true },

    // ===================== ORGANIZATION =====================
    { path: '/settings/organization/company', component: Company, lazy: true },
    { path: '/settings/organization/organization', component: Organization, lazy: true },
    { path: '/settings/organization/office', component: Office, lazy: true },
    { path: '/settings/organization/region', component: Region, lazy: true },
    { path: '/settings/organization/division', component: Division, lazy: true },

    // ===================== APPLICATION =====================
    { path: '/settings/application/general', component: GeneralSettings, lazy: true },
    { path: '/settings/application/theme', component: Theme, lazy: true },
    { path: '/settings/application/date-format', component: DateFormat, lazy: true },
    { path: '/settings/application/time-zone', component: TimeZone, lazy: true },
    { path: '/settings/application/email', component: EmailConfiguration, lazy: true },
    { path: '/settings/application/sms', component: SMSConfiguration, lazy: true },
    { path: '/settings/application/file-upload', component: FileUpload, lazy: true },

    // ===================== WORKFLOW =====================
    { path: '/settings/workflow/types', component: WorkflowTypes, lazy: true },
    { path: '/settings/workflow/approval-levels', component: ApprovalLevels, lazy: true },
    { path: '/settings/workflow/status-master', component: StatusMaster, lazy: true },
    { path: '/settings/workflow/escalation-rules', component: EscalationRules, lazy: true },

    // ===================== NOTIFICATIONS =====================
    { path: '/settings/notifications/email-templates', component: EmailTemplates, lazy: true },
    { path: '/settings/notifications/sms-templates', component: SMSTemplates, lazy: true },
    { path: '/settings/notifications/push', component: PushNotifications, lazy: true },
    { path: '/settings/notifications/alert-rules', component: AlertRules, lazy: true },

    // ===================== REPORTS =====================
    { path: '/settings/reports/categories', component: ReportCategories, lazy: true },
    { path: '/settings/reports/templates', component: ReportTemplates, lazy: true },
    { path: '/settings/reports/dashboard', component: DashboardConfiguration, lazy: true },

    // ===================== AUDIT =====================
    { path: '/settings/audit/login-history', component: LoginHistory, lazy: true },
    { path: '/settings/audit/user-activity', component: UserActivity, lazy: true },
    { path: '/settings/audit/audit-trail', component: AuditTrail, lazy: true },
    { path: '/settings/audit/system-logs', component: SystemLogs, lazy: true }
]