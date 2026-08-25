module.exports = function (load) {
    const {
        THINK_TIME,
    } = load.config.user.args;

    const {
        dealwithIdentitySsoViewLogin,
    } = require('../identity/identity')(load);

    async function identitySsoViewLoginAction() {
        await dealwithIdentitySsoViewLogin();
        load.sleep(THINK_TIME);
    }

    return {
        identitySsoViewLoginAction,
    };
};

