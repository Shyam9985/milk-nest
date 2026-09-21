const profilesMdl = require('../models/profilesMdl');
const resutils = require('../utils/response.utils');
const { log } = require('../utils/log.utils');

/*
 * Entity profiles. Each profile type is one entry in the registry below: a loader that
 * returns the entity's summary plus whatever related lists its screen shows. The
 * controller only knows the registry, so adding a profile type (a user, a position, a
 * supplier) is a new entry here and a new model - no route or controller change.
 * Every loader receives the caller so the model can apply the data scope.
 */

const PROFILE_LOADERS = {

    'dairy-farm': async (user, id) => {
        const [farm] = await profilesMdl.getDairyFarmProfileMdl(user, id);
        if (!farm) return null;
        const branches = await profilesMdl.getDairyFarmBranchesMdl(user, id);
        return { ...farm, branches };
    },

    'branch': async (user, id) => {
        const [branch] = await profilesMdl.getBranchProfileMdl(user, id);
        if (!branch) return null;
        const cattle = await profilesMdl.getBranchCattleMdl(user, id);
        return { ...branch, cattle };
    },

    'cattle': async (user, id) => {
        const [animal] = await profilesMdl.getCattleProfileMdl(user, id);
        if (!animal) return null;
        const recent_production = await profilesMdl.getCattleRecentProductionMdl(user, id);
        return { ...animal, recent_production };
    },
};

// the types the api will serve, exposed so the route can validate the url segment
exports.PROFILE_TYPES = Object.keys(PROFILE_LOADERS);

// loads one profile. an unknown type or an id outside the caller's scope both surface as
// "not found" so the api never confirms that something exists beyond the user's reach
exports.getProfileSrvc = async (user, type, id) => {
    log(`in getProfileSrvc (${type} #${id})`);

    const load = PROFILE_LOADERS[type];
    if (!load) {
        resutils.createError('unknownProfileType', `'${type}' is not a profile type.`);
    }

    const recordId = Number(id);
    if (!Number.isInteger(recordId) || recordId <= 0) {
        resutils.createError('validationFailed', 'A valid record id is required.');
    }

    const profile = await load(user, recordId);
    if (!profile) {
        resutils.createError('recordNotFound', 'The requested record was not found or is outside your scope.');
    }

    return { type, id: recordId, profile };
}
