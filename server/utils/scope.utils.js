/*
 * Data-scope filtering built on the user's hierarchy_level / hierarchy_key pair,
 * derived once in authService.buildUserObj and carried inside the signed JWT.
 *
 * Default filters target a branches_lst_t alias: branches denormalize the full
 * location spine (state -> district -> mandal -> village -> dairy farm -> branch),
 * so every scope level restricts with ONE indexed equality. Tables that carry their
 * own spine (positions) pass their column map instead.
 */

// maps hierarchy_level to the branches_lst_t column carrying that level's id.
// must stay in sync with SCOPE_KEY_COLUMNS in authService (the token side)
const BRANCH_SCOPE_COLUMNS = {
    form_branch: 'branch_id',
    dairy_form: 'dairy_farm_id',
    village: 'village_sachivalayam_id',
    mandal: 'mandal_ulb_id',
    district: 'district_id',
    state: 'state_id'
};

// position rows carry the same spine but name the branch column location_ref_id
// and have no state column (state level therefore fails closed on positions)
const POSITION_SCOPE_COLUMNS = {
    form_branch: 'location_ref_id',
    dairy_form: 'dairy_farm_id',
    village: 'village_sachivalayam_id',
    mandal: 'mandal_ulb_id',
    district: 'district_id'
};

/**********************************************
*name : getScopeFilter
*description : builds the row-scope condition for a query.
*   super_admin      -> { clause: '', unrestricted: true }   (no restriction)
*   known level      -> { clause: ' and <alias>.<col> = ?', params: [key] }
*   unknown / broken -> { clause: ' and 1 = 0', denied: true } so bad scope data
*                       fails closed: no rows, never all rows.
*   The user must always come from req.user (signed JWT), never from client parameters.
* input : (req.user, 'b') -> { clause: ' and b.district_id = ?', params: [5] }
*         (req.user, 'p', POSITION_SCOPE_COLUMNS) for position-shaped tables
************************************************/
exports.getScopeFilter = (user, alias, columns = BRANCH_SCOPE_COLUMNS) => {
    if (user?.hierarchy_level === 'super_admin') {
        return { clause: '', params: [], unrestricted: true, denied: false };
    }

    const column = columns[user?.hierarchy_level];
    if (!column) {
        return { clause: ' and 1 = 0', params: [], unrestricted: false, denied: true };
    }

    return {
        clause: ` and ${alias}.${column} = ?`,
        params: [Number(user?.hierarchy_key) || 0],
        unrestricted: false,
        denied: false
    };
};

exports.POSITION_SCOPE_COLUMNS = POSITION_SCOPE_COLUMNS;
