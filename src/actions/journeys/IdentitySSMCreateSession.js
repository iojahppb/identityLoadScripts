module.exports = function (load) {
    const {
        THINK_TIME,
    } = load.config.user.args;

    const {
        dealwithIdentityCreateSession,
    } = require('../identity/identity')(load);

    async function identitySSMCreateSessionAction() {
        load.setUserCertificate('./data/sso-prod-sanity.pem', './data/sso-prod-sanity.pem', 'howmanybets');

        await dealwithIdentityCreateSession();
        load.sleep(THINK_TIME);
    }

    return {
        identitySSMCreateSessionAction,
    };
};
