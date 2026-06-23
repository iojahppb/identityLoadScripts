module.exports = function (load) {
    const {
        THINK_TIME,
        CHANNEL_NAME,
    } = load.config.user.args;

    const {
        dealwithIdentitySsoKeepAlive,
    } = require('../identity/identity')(load);

    async function identityKeepAliveAction() {
        await dealwithIdentitySsoKeepAlive();
        load.sleep(THINK_TIME);
    }

    return {
        identityKeepAliveAction,
    };
};
