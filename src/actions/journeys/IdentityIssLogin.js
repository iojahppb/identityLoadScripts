module.exports = function (load) {
    const {
        THINK_TIME,
    } = load.config.user.args;

    const {
        dealWithIssLogin,
    } = require('../identity/identity')(load);

    async function issLoginAction() {
        load.setUserCertificate('./data/sso-prod-sanity.pem', './data/sso-prod-sanity.pem', 'howmanybets');
        await dealWithIssLogin();
        load.sleep(THINK_TIME);
    }

    return {
        identityIssLoginAction: issLoginAction,
    };
};


