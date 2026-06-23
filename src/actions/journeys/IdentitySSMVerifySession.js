module.exports = function (load) {
    const {
        THINK_TIME,
    } = load.config.user.args;

    const {
        dealwithIdentityVerifySession,
    } = require('../identity/identity')(load);

    async function identityVerifySessionAction() {
        load.setUserCertificate('./data/sso-prod-sanity.pem', './data/sso-prod-sanity.pem', 'howmanybets');

        await dealwithIdentityVerifySession('');
        load.sleep(THINK_TIME);
    }

    async function parallelIdentityVerifySessionAction() {
        load.setUserCertificate('./data/sso-prod-sanity.pem', './data/sso-prod-sanity.pem', 'howmanybets');

        await Promise.all([
            dealwithIdentityVerifySession(1),
            dealwithIdentityVerifySession(2),
            dealwithIdentityVerifySession(3),
            dealwithIdentityVerifySession(4),
            dealwithIdentityVerifySession(5),
        ]);
        load.sleep(THINK_TIME);
    }

    return {
        identityVerifySessionAction,
        parallelIdentityVerifySessionAction,
    };
};
