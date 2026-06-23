module.exports = function (load) {
    const {
        THINK_TIME,
    } = load.config.user.args;

    const {
        dealwithIdentitySsoLogin,
    } = require('../identity/identity')(load);

    async function identityLoginAction() {
        await dealwithIdentitySsoLogin();
        load.sleep(THINK_TIME);
    }

    return {
        identityLoginAction,
    };
};
