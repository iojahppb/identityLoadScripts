module.exports = function (load) {
    const {
        THINK_TIME,
    } = load.config.user.args;

    const {
        dealwithOauthFinalize,
    } = require('../identity/identity')(load);

    async function oauthFinalizeAction() {
        await dealwithOauthFinalize();
        load.sleep(THINK_TIME);
    }

    return {
        oauthFinalizeAction,
    };
};

