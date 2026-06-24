global.CustomerTribeEndpoints = require('./Endpoints.json').CustomerTribeEndpoints;

load.config.user.args = Object.fromEntries(Object.entries(load.config.user.args).map(([key, value]) => {
    let parsedValue;
    try {
        parsedValue = JSON.parse(value);
    } catch {
        parsedValue = value;
    }
    return [String(key).toUpperCase(), parsedValue];
}));

const {
    DOMAIN,
} = load.config.user.args;
// eslint-disable-next-line no-template-curly-in-string
const processEndpointDomain = (stringTemplate) => stringTemplate.replace('${DOMAIN}', DOMAIN);

global.CustomerTribeEndpoints = Object.fromEntries(Object.entries(CustomerTribeEndpoints).map(([key, value]) => [key, processEndpointDomain(value)]));

const vuserInit = require('./src/actions/vuser_init');
const loadSessionDataFromFile = require('./src/actions/loadSessionDataFromFile');
const clearCookies = require('./src/actions/clear_cookies');

const { identityKeepAliveAction } = require('./src/actions/journeys/IdentitySSOKeepAlive')(load);
const { identityVerifySessionAction, parallelIdentityVerifySessionAction } = require('./src/actions/journeys/IdentitySSMVerifySession')(load);
const { identitySSMKeepAliveAction } = require('./src/actions/journeys/IdentitySSMKeepAlive')(load);
const { identitySSMCreateSessionAction } = require('./src/actions/journeys/IdentitySSMCreateSession')(load);
const { identityLogoutAction } = require('./src/actions/journeys/IdentitySSOLogout')(load);
const { identityLoginAction } = require('./src/actions/journeys/IdentitySSOLogin')(load);
const { oauthAuthorizeAction } = require('./src/actions/journeys/OauthAuthorize')(load);
const { oauthTokenAction } = require('./src/actions/journeys/OauthToken')(load);

load.initialize(async () => { });
load.initialize('vuser_init', vuserInit.bind(this, load));

load.action('Load Session Data From File', loadSessionDataFromFile.bind(this, load));
load.action('Clear Cookies', clearCookies.bind(this, load));

load.action('Identity SSO KeepAlive', identityKeepAliveAction);
load.action('Identity SSO Logout', identityLogoutAction);
load.action('Identity SSO Login', identityLoginAction);
load.action('Identity SSM Verify Session', identityVerifySessionAction);
load.action('Identity SSM Keep Alive', identitySSMKeepAliveAction);
load.action('Identity SSM Create Session', identitySSMCreateSessionAction);
load.action('Parallel Identity SSM Verify Session', parallelIdentityVerifySessionAction);
load.action('OAuth Authorize', oauthAuthorizeAction);
load.action('OAuth Token', oauthTokenAction);

load.action('Empty Action', async () => { });

load.finalize(async () => {
});
