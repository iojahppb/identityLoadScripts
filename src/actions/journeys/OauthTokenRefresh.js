module.exports = function (load) {
    const {
        THINK_TIME,
    } = load.config.user.args;

    const {
        dealwithOauthTokenRefresh,
    } = require('../identity/identity')(load);

    async function oauthTokenRefreshAction() {
        await dealwithOauthTokenRefresh();
        load.sleep(THINK_TIME);
    }

    return {
        oauthTokenRefreshAction,
    };
};

