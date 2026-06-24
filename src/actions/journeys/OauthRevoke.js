module.exports = function (load) {
    const {
        THINK_TIME,
    } = load.config.user.args;

    const {
        dealwithOauthRevoke,
    } = require('../identity/identity')(load);

    async function oauthRevokeAction() {
        await dealwithOauthRevoke();
        load.sleep(THINK_TIME);
    }

    return {
        oauthRevokeAction,
    };
};

