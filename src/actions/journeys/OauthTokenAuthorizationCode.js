module.exports = function (load) {
    const {
        THINK_TIME,
    } = load.config.user.args;

    const {
        dealwithOauthTokenAuthorizationCode,
    } = require('../identity/identity')(load);

    async function oauthTokenAuthorizationCodeAction() {
        await dealwithOauthTokenAuthorizationCode();
        load.sleep(THINK_TIME);
    }

    return {
        oauthTokenAuthorizationCodeAction,
    };
};

