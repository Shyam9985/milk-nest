const resutils = require("../../utils/response.utils")
const RESPONSE_STATUS = require("../../utils/standard.messages")
const admMdl = require("../models/adminMdl")


exports.getMenuItemsCtrl = async (req, res) => {
    try {
        const menuItems = await admMdl.getMenuItemsMdl(req.user);

        return resutils.sendSuccessResponse(req, res, menuItems || [], RESPONSE_STATUS.SUCCESS, { function: 'get menu items' });

    } catch (error) {
        console.log(error);
        resutils.sendErrorResponse(req, res, 'Unable to fetch menu items', RESPONSE_STATUS.UNABLE_TO_PROCESS, { function: 'get menu items' });
    }

}