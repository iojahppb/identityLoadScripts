module.exports = function (load) {
    const {
        THINK_TIME,
    } = load.config.user.args;

    const {
        dealwithIdentitySsoViewRecoverPassword,
    } = require('../identity/identity')(load);

    async function identitySsoViewRecoverPasswordAction() {
        await dealwithIdentitySsoViewRecoverPassword();
        load.sleep(THINK_TIME);
    }

    return {
        identitySsoViewRecoverPasswordAction,
    };
};

