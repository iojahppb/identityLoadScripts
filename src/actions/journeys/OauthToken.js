module.exports = function (load) {
    const {
        THINK_TIME,
    } = load.config.user.args;

    const {
        dealwithOauthToken,
    } = require('../identity/identity')(load);

    async function oauthTokenAction() {
        await dealwithOauthToken();
        load.sleep(THINK_TIME);
    }

    return {
        oauthTokenAction,
    };
};
