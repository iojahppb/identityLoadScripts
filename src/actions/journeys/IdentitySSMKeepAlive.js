module.exports = function (load) {
    const {
        THINK_TIME,
    } = load.config.user.args;

    const {
        dealwithIdentityKeepAlive,
    } = require('../identity/identity')(load);

    async function identitySSMKeepAliveAction() {
        load.setUserCertificate('./data/ssm/sso-prod-sanity.pem', './data/ssm/sso-prod-sanity.pem', 'howmanybets');

        await dealwithIdentityKeepAlive();
        load.sleep(THINK_TIME);
    }

    return {
        identitySSMKeepAliveAction,
    };
};
