module.exports = function (load) {
    const {
        THINK_TIME,
    } = load.config.user.args;

    const {
        createSessionsAndSaveToFile,
    } = require('../identity/identity')(load);

    async function identitySSMCreateSessionAndSaveAction() {
        load.setUserCertificate('./data/sso-prod-sanity.pem', './data/sso-prod-sanity.pem', 'howmanybets');

        await createSessionsAndSaveToFile();
        load.sleep(THINK_TIME);
    }

    return {
        identitySSMCreateSessionAndSaveAction,
    };
};

