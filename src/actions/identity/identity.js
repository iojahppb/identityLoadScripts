module.exports = function (load) {
    const {
        DOMAIN,
        PRODUCT_NAME,
        PASSWORD,
        SSM_ENDPOINT,
        OAUTH_CLIENT_ID,
        OAUTH_REDIRECT_URI,
        OAUTH_CLIENT_ID_ENCODED,
    } = load.config.user.args;

    const BRAND = ['BETFAIR', 'PADDYPOWER', 'SKYBET'].find((b) => DOMAIN.toUpperCase().includes(b)) || 'UNKNOWN';

    const {
        identityLogin,
        identityKeepAlive,
        identityLogout,
        oauthAuthorize,
        oauthFinalize,
        oauthToken,
    } = CustomerTribeEndpoints;

    const { webRequest } = require('../../common/webrequest')(load);
    const { getLoadedCookieValueByName } = require('../../common/utils')(load);

    async function dealwithIdentitySsoLogin() {
        const transaction = new load.Transaction('custTech.iss.login');
        transaction.start();

        const { username } = load.params;

        const response = await webRequest({
            url: identityLogin,
            method: 'POST',
            disableRedirection: true,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'upgrade-insecure-requests': '1',
                'X-Application': 'loadT3st',
                Accept: 'application/json',

            },
            body: {
                username: `${username}`,
                password: `${PASSWORD}`,
            },
            extractors: [
                new load.JsonPathExtractor('status', {
                    path: '$.status',
                }),
            ],
        }).send();

        const { Location: loginRedirectUrl } = response.headers;
        const { status } = response.extractors;

        if ((status !== 'SUCCESS') || (loginRedirectUrl && loginRedirectUrl.indexOf('errorCode') > -1)) {
            if (loginRedirectUrl) {
                const { errorCode } = (loginRedirectUrl.match(/errorCode=(?<errorCode>\w+)/) || {}).groups || {};
                load.log(`user failed to login: username ${username} Error ${errorCode}`, load.LogLevel.error);
                transaction.stop(load.TransactionStatus.Failed);
                return false;
            }
            load.log(`user failed to login: username ${username}`, load.LogLevel.error);
            transaction.stop(load.TransactionStatus.Failed);
            return false;
        }
        transaction.stop(load.TransactionStatus.Passed);
        return true;
    }

    async function dealwithIdentitySsoKeepAlive() {
        const transaction = new load.Transaction('custTech.sso.keep-alive');
        transaction.start();

        const response = await webRequest({
            url: identityKeepAlive,
            headers: {
                Referer: `https://myaccount${DOMAIN}/summary/accountsummary`,
                'Content-Type': 'text/html',
                'X-Authentication': getLoadedCookieValueByName('ssoid'),
            },
        }).send();

        if (response.size > 0) {
            transaction.stop(load.TransactionStatus.Passed);
        } else {
            transaction.stop(load.TransactionStatus.Failed);
        }
    }

    async function dealwithIdentitySsoLogout() {
        const transaction = new load.Transaction('custTech.iss.logout');
        transaction.start();

        const response = await webRequest({
            url: identityLogout,
            method: 'POST',
            disableRedirection: true,
            headers: {
                Referer: `https://myaccount${DOMAIN}/summary/accountsummary`,
                'Content-Type': 'application/x-www-form-urlencoded',
                'upgrade-insecure-requests': '1',
                'X-Authentication': getLoadedCookieValueByName('ssoid'),
            },
            body: {
                product: PRODUCT_NAME,
                redirectMethod: 'GET',
                url: `https://www${DOMAIN}/sport/logout/success?rurl=https%3A%2F%2Fwww${DOMAIN}%2Fsport`,
            },
        }).send();

        const { Location: logoutRedirectUrl } = response.headers;

        if (logoutRedirectUrl && logoutRedirectUrl.indexOf('errorCode') > -1) {
            const { errorCode } = (logoutRedirectUrl.match(/errorCode=(?<errorCode>\w+)/) || {}).groups || {};
            transaction.stop(load.TransactionStatus.Failed);
            load.log(`user failed to logout: username ${load.params.username} Error ${errorCode}`, load.LogLevel.error);
            return false;
        }
        transaction.stop(load.TransactionStatus.Passed);
        return true;
    }

    async function dealwithIdentityVerifySession() {
        const transaction = new load.Transaction('custTech.ssm.verifySession');
        transaction.start();

        const response = await webRequest({
            url: `https://${SSM_ENDPOINT}:443/SessionManagementService/v1.0`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Accept: '*/*',
                'user-agent': 'Mozilla/5.0 (Linux; Android 5.0; SM-G900P Build/LRX21T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Mobile Safari/537.36',
            },
            body: `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:sec="http://www.betfair.com/security/" xmlns:ses="http://www.betfair.com/servicetypes/v1/SessionManagement/"><soapenv:Header><sec:Credentials></sec:Credentials></soapenv:Header><soapenv:Body><ses:VerifySessionRequest><ses:sessionToken><ses:sessionToken>${getLoadedCookieValueByName('ssoid')}</ses:sessionToken></ses:sessionToken><ses:productEntityName><ses:name>rand</ses:name></ses:productEntityName><ses:performKeepAlive>FALSE</ses:performKeepAlive></ses:VerifySessionRequest></soapenv:Body></soapenv:Envelope>`,
        }).send();

        if (response.size > 0) {
            transaction.stop(load.TransactionStatus.Passed);
        } else {
            transaction.stop(load.TransactionStatus.Failed);
        }
    }

    async function dealwithIdentityKeepAlive() {
        const transaction = new load.Transaction('custTech.ssm.keepAlive');
        transaction.start();

        const response = await webRequest({
            url: `https://${SSM_ENDPOINT}:443/SessionManagementService/v1.0`,
            method: 'POST',
            //returnBody: true,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Accept: '*/*',
                'user-agent': 'Mozilla/5.0 (Linux; Android 5.0; SM-G900P Build/LRX21T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Mobile Safari/537.36',
            },
            body: `<?xml version="1.0"?><soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:sec="http://www.betfair.com/security/" xmlns:ses="http://www.betfair.com/servicetypes/v1/SessionManagement/"><soapenv:Header><sec:Credentials></sec:Credentials></soapenv:Header><soapenv:Body><ses:KeepAliveSessionRequest><ses:sessionToken><ses:sessionToken>${getLoadedCookieValueByName('ssoid')}</ses:sessionToken></ses:sessionToken><ses:productEntityName><ses:name>random</ses:name></ses:productEntityName></ses:KeepAliveSessionRequest></soapenv:Body></soapenv:Envelope>`,
        }).send();

        if (response.size > 0) {
            transaction.stop(load.TransactionStatus.Passed);
        } else {
            transaction.stop(load.TransactionStatus.Failed);
        }
    }

    async function dealwithIdentityCreateSession() {
        const transaction = new load.Transaction('custTech.ssm.createSession');
        transaction.start();

        const response = await webRequest({
            url: `https://${SSM_ENDPOINT}:443/SessionManagementService/v1.0`,
            method: 'POST',
            // returnBody: true,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Accept: '*/*',
                'user-agent': 'Mozilla/5.0 (Linux; Android 5.0; SM-G900P Build/LRX21T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Mobile Safari/537.36',
            },
            body: `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:sec="http://www.betfair.com/security/" xmlns:ses="http://www.betfair.com/servicetypes/v1/SessionManagement/"><soapenv:Header><sec:Credentials></sec:Credentials></soapenv:Header><soapenv:Body><ses:CreateSessionRequest><ses:userAccountReference><ses:accountId>${load.params.accountId}</ses:accountId><ses:userId>${load.params.userId}</ses:userId></ses:userAccountReference><ses:brand>${BRAND}</ses:brand><ses:productEntityName><ses:name>CHANGE_PASSWORD_REQUIRED</ses:name></ses:productEntityName><ses:sessionCreationContext><ses:entry key="IP_ADDRESS"><ses:String>82.1.1.0</ses:String></ses:entry><ses:entry key="JURISDICTION_NAME"><ses:String>PP_INTERNATIONAL</ses:String></ses:entry><ses:entry key="SESSION_TIMEOUT"><ses:String>86400</ses:String></ses:entry><ses:entry key="APPLICATION_SPECIFIC_DATA"><ses:String>82:0:0:0:en_GB:Europe/London:EUR:0:0:false:OK:1.1.1.1:false::sweden</ses:String></ses:entry></ses:sessionCreationContext></ses:CreateSessionRequest></soapenv:Body></soapenv:Envelope>`,
        }).send();

        if (response.size > 0) {
            transaction.stop(load.TransactionStatus.Passed);
        } else {
            transaction.stop(load.TransactionStatus.Failed);
        }
    }

    /**
     * Hits GET `/api/v1/oauth2/authorize` with a whitelisted client_id / redirect_uri and
     * no ssoid cookie. Considered Passed when the response is a 302 whose Location header
     * contains "identity" (i.e. the OAuth service redirected back to the identitysso login).
     */
    async function dealwithOauthAuthorize() {
        const transaction = new load.Transaction('custTech.oauth.authorize');
        transaction.start();

        const response = await webRequest({
            url: oauthAuthorize,
            method: 'GET',
            disableRedirection: true,
            headers: {
                Accept: 'application/json',
            },
            queryString: {
                response_type: 'code',
                client_id: OAUTH_CLIENT_ID,
                redirect_uri: OAUTH_REDIRECT_URI,
                state: 'generatedByLoadTests',
            },
        }).send();

        const { Location: locationHeader } = response.headers;

        if (response.status === 302 && locationHeader && locationHeader.includes('identity')) {
            transaction.stop(load.TransactionStatus.Passed);
            return true;
        }

        load.log(
            `oauth authorize failed: status=${response.status} location=${locationHeader}`,
            load.LogLevel.error,
        );
        transaction.stop(load.TransactionStatus.Failed);
        return false;
    }

    /**
     * Calls GET `/api/v1/oauth2/finalize` with ssoid cookie (already in cookie jar),
     * passing the same client_id / redirect_uri used by authorize.
     * Expects a 302 whose Location header contains `code=<OTT>`.
     * Returns the extracted code (one-time token) or `null` on failure.
     * Used internally by the OAuth token flow.
     */
    async function oauthFinalizeForCode() {
        const transaction = new load.Transaction('custTech.oauth.finalize');
        transaction.start();

        const response = await webRequest({
            url: oauthFinalize,
            method: 'GET',
            disableRedirection: true,
            headers: {
                Accept: 'application/json',
            },
            queryString: {
                response_type: 'code',
                client_id: OAUTH_CLIENT_ID,
                redirect_uri: OAUTH_REDIRECT_URI,
                state: 'generatedByLoadTests',
            },
        }).send();

        const { Location: locationHeader } = response.headers;

        if (response.status === 302 && locationHeader && locationHeader.includes('code=')) {
            const codeMatch = locationHeader.match(/code=([^&]+)/);
            const code = codeMatch ? decodeURIComponent(codeMatch[1]) : null;

            if (code) {
                transaction.stop(load.TransactionStatus.Passed);
                return code;
            }
        }

        load.log(
            `oauth finalize failed: status=${response.status} location=${locationHeader}`,
            load.LogLevel.error,
        );
        transaction.stop(load.TransactionStatus.Failed);
        return null;
    }

    /**
     * Mirrors the Java `tokenAuthorizationCodeHappyFlow` test:
     *   1. takes an existing ssoid (main session token) loaded from a sessions file,
     *   2. calls OAuth finalize to obtain a one-time token (code),
     *   3. POSTs to `/api/v1/oauth2/token` with `grant_type=authorization_code` and the code,
     *      using `OAUTH_CLIENT_ID_ENCODED` as the `Authorization` header.
     * Passes when the JSON response contains a non-empty `access_token`.
     */
    async function dealwithOauthToken() {
        const ott = await oauthFinalizeForCode();

        if (!ott) {
            return false;
        }

        const transaction = new load.Transaction('custTech.oauth.token');
        transaction.start();

        const response = await webRequest({
            url: oauthToken,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Accept: 'application/json',
                Authorization: OAUTH_CLIENT_ID_ENCODED,
            },
            body: {
                grant_type: 'authorization_code',
                code: ott,
            },
            extractors: [
                new load.JsonPathExtractor('accessToken', {
                    path: '$.access_token',
                }),
            ],
        }).send();

        const { accessToken } = response.extractors;

        if (accessToken) {
            transaction.stop(load.TransactionStatus.Passed);
            return true;
        }

        load.log(
            `oauth token failed: status=${response.status}`,
            load.LogLevel.error,
        );
        transaction.stop(load.TransactionStatus.Failed);
        return false;
    }

    return {
        dealwithIdentitySsoKeepAlive,
        dealwithIdentitySsoLogout,
        dealwithIdentitySsoLogin,
        dealwithIdentityVerifySession,
        dealwithIdentityKeepAlive,
        dealwithIdentityCreateSession,
        dealwithOauthAuthorize,
        dealwithOauthToken,
    };
};
