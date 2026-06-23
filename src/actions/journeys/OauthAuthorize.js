module.exports = function (load) {
    const {
        THINK_TIME,
    } = load.config.user.args;

    const {
        dealwithOauthAuthorize,
    } = require('../identity/identity')(load);

    async function oauthAuthorizeAction() {
        await dealwithOauthAuthorize();
        load.sleep(THINK_TIME);
    }

    return {
        oauthAuthorizeAction,
    };
};
