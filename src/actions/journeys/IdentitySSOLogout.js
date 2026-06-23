module.exports = function (load) {
    const {
        THINK_TIME,
    } = load.config.user.args;

    const {
        dealwithIdentitySsoLogout,
    } = require('../identity/identity')(load);

    async function identityLogoutAction() {
        await dealwithIdentitySsoLogout();
        load.sleep(THINK_TIME);
    }

    return {
        identityLogoutAction,
    };
};
