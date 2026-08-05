-- Migration: add code columns + unique keys to geography masters, seed Super User permissions
-- Date: 2026-08-05

-- 1. Code columns (all four tables are empty, so NOT NULL is safe)
ALTER TABLE state_mstr_lst_t
    ADD COLUMN state_code VARCHAR(20) NOT NULL AFTER state_name,
    ADD UNIQUE KEY uq_state_name (state_name),
    ADD UNIQUE KEY uq_state_code (state_code);

ALTER TABLE district_mstr_lst_t
    ADD COLUMN district_code VARCHAR(20) NOT NULL AFTER district_name,
    ADD UNIQUE KEY uq_district_name_per_state (state_id, district_name),
    ADD UNIQUE KEY uq_district_code (district_code);

ALTER TABLE mandal_ulb_mstr_lst_t
    ADD COLUMN mandal_ulb_code VARCHAR(20) NOT NULL AFTER mandal_ulb_nm,
    ADD UNIQUE KEY uq_mandal_ulb_name_per_district (district_id, mandal_ulb_nm),
    ADD UNIQUE KEY uq_mandal_ulb_code (mandal_ulb_code);

ALTER TABLE village_sachivalayam_mst_lst_t
    ADD COLUMN village_sachivalayam_code VARCHAR(20) NOT NULL AFTER village_sachivalayam_nm,
    ADD UNIQUE KEY uq_village_name_per_mandal (district_id, mandal_ulb_id, village_sachivalayam_nm),
    ADD UNIQUE KEY uq_village_sachivalayam_code (village_sachivalayam_code);

-- 2. Full CRUD permissions for Super User (role_id 11) on master data keys (idempotent)
INSERT INTO role_permissions_t (role_id, permission_key, can_view, can_insert, can_update, can_delete, is_active)
SELECT 11, m.p_key, 1, 1, 1, 1, 1
FROM (
    SELECT 'state' AS p_key
    UNION ALL SELECT 'district'
    UNION ALL SELECT 'mandal'
    UNION ALL SELECT 'village'
    UNION ALL SELECT 'position'
) m
WHERE NOT EXISTS (
    SELECT 1 FROM role_permissions_t rp
    WHERE rp.role_id = 11 AND rp.permission_key = m.p_key
);
