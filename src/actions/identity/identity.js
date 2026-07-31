module.exports = function (load) {
    const {
        DOMAIN,
        PRODUCT_NAME,
        PASSWORD,
        SSM_ENDPOINT,
        ISS_ENDPOINT,
        OAUTH_CLIENT_ID,
        OAUTH_REDIRECT_URI,
        OAUTH_CLIENT_ID_ENCODED,
        CREATE_ACCESS_TOKENS,
        SHOULD_USE_EXISTING_USERNAMES,
        IP_ADDRESS,
        JA4,
    } = load.config.user.args;

    const BRAND = ['BETFAIR', 'PADDYPOWER', 'SKYBET'].find((b) => DOMAIN.toUpperCase().includes(b)) || 'UNKNOWN';

    const {
        identityLogin,
        identityKeepAlive,
        identityLogout,
        oauthAuthorize,
        oauthFinalize,
        oauthToken,
        oauthRevoke,
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
            returnBody: true,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Accept: '*/*',
                'user-agent': 'Mozilla/5.0 (Linux; Android 5.0; SM-G900P Build/LRX21T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Mobile Safari/537.36',
            },
            body: `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:sec="http://www.betfair.com/security/" xmlns:ses="http://www.betfair.com/servicetypes/v1/SessionManagement/"><soapenv:Header><sec:Credentials></sec:Credentials></soapenv:Header><soapenv:Body><ses:CreateSessionRequest><ses:userAccountReference><ses:accountId>${load.params.accountId}</ses:accountId><ses:userId>${load.params.userId}</ses:userId></ses:userAccountReference><ses:brand>${BRAND}</ses:brand><ses:productEntityName><ses:name>CHANGE_PASSWORD_REQUIRED</ses:name></ses:productEntityName><ses:sessionCreationContext><ses:entry key="IP_ADDRESS"><ses:String>82.1.1.0</ses:String></ses:entry><ses:entry key="JURISDICTION_NAME"><ses:String>PP_INTERNATIONAL</ses:String></ses:entry><ses:entry key="SESSION_TIMEOUT"><ses:String>86400</ses:String></ses:entry><ses:entry key="APPLICATION_SPECIFIC_DATA"><ses:String>82:0:0:0:en_GB:Europe/London:EUR:0:0:false:OK:1.1.1.1:false::sweden</ses:String></ses:entry></ses:sessionCreationContext></ses:CreateSessionRequest></soapenv:Body></soapenv:Envelope>`,
        }).send();

        if (response.size > 0) {
            transaction.stop(load.TransactionStatus.Passed);
            const bodyStr = response.body || '';
            const match = bodyStr.match(/sessionToken>([^<]+)</);
            return match ? match[1] : null;
        } else {
            transaction.stop(load.TransactionStatus.Failed);
            return null;
        }
    }

    function getDataFilePaths() {
        const domainUpper = (DOMAIN || '').toUpperCase();
        const suffix = domainUpper.includes('BETFAIR') ? 'BF' : domainUpper.includes('PADDYPOWER') ? 'PP' : 'SBG';
        const baseDir = '/storm/data';
        return {
            baseDir,
            sessionsFile: `${baseDir}/IdentitySso${suffix}Sessions.txt`,
            accessTokensFile: `${baseDir}/IdentityOauth${suffix}AccessTokens.txt`,
            markerFile: `${baseDir}/.initialized`,
        };
    }

    let dataFilesInitialized = false;

    function initDataFilesIfNeeded() {
        if (dataFilesInitialized) return;
        const fs = require('fs');
        const { baseDir, sessionsFile, accessTokensFile, markerFile } = getDataFilePaths();

        if (!fs.existsSync(baseDir)) {
            try { fs.mkdirSync(baseDir, { recursive: true }); } catch (e) { /* */ }
        }

        // Remove stale marker from a previous run (older than 30s) so the first vuser can claim it
        try {
            const stats = fs.statSync(markerFile);
            if (Date.now() - stats.mtimeMs > 30000) {
                fs.unlinkSync(markerFile);
            }
        } catch (e) { /* doesn't exist — fine */ }

        try {
            // 'wx' flag = write exclusive: fails if file already exists (atomic check)
            fs.writeFileSync(markerFile, new Date().toISOString(), { flag: 'wx' });

            // Only the vuser that successfully created the marker reaches here
            try { fs.unlinkSync(sessionsFile); } catch (e) { /* */ }
            fs.writeFileSync(sessionsFile, 'ssoid\n');

            if (CREATE_ACCESS_TOKENS === true || CREATE_ACCESS_TOKENS === 'true') {
                try { fs.unlinkSync(accessTokensFile); } catch (e) { /* */ }
                fs.writeFileSync(accessTokensFile, 'accessToken\n');
            }
        } catch (e) {
            // Another vuser already created the marker — skip
        }

        dataFilesInitialized = true;
    }

    /**
     * Creates a session (and optionally an OAuth access token) and appends the
     * resulting value(s) to the corresponding data file(s) under /storm/data.
     * Intended to be run locally for data generation.
     * Controlled by userArgument CREATE_ACCESS_TOKENS (true/false).
     */
    async function createSessionsAndSaveToFile() {
        const fs = require('fs');
        const { sessionsFile, accessTokensFile } = getDataFilePaths();

        initDataFilesIfNeeded();

        const sessionToken = await dealwithIdentityCreateSession();

        if (!sessionToken) {
            load.log('createSessionsAndSaveToFile: no session token obtained', load.LogLevel.error);
            return null;
        }

        fs.appendFileSync(sessionsFile, sessionToken + '\n');

        if (CREATE_ACCESS_TOKENS === true || CREATE_ACCESS_TOKENS === 'true') {
            // Put the freshly created session token into the cookie jar so that
            // dealwithOauthFinalize can pick it up via getLoadedCookieValueByName('ssoid').
            load.addCookies(new load.Cookie({
                name: 'ssoid',
                value: sessionToken,
                domain: `${DOMAIN}`,
                path: '/',
            }));
            load.config.loadedCookies = load.config.loadedCookies || {};
            load.config.loadedCookies.ssoid = sessionToken;

            const accessToken = await dealwithOauthTokenAuthorizationCode();

            if (accessToken) {
                fs.appendFileSync(accessTokensFile, accessToken + '\n');
            } else {
                load.log('createSessionsAndSaveToFile: no access token obtained', load.LogLevel.error);
            }
        }

        return sessionToken;
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
    async function dealwithOauthFinalize() {
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
    async function dealwithOauthTokenAuthorizationCode() {
        const ott = await dealwithOauthFinalize();

        if (!ott) {
            return false;
        }

        const transaction = new load.Transaction('custTech.oauth.tokenAuthorizationCode');
        transaction.start();

        const response = await webRequest({
            url: oauthToken,
            method: 'POST',
            returnBody: true,
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
                new load.JsonPathExtractor('refreshToken', {
                    path: '$.refresh_token',
                }),
            ],
        }).send();

        const { refreshToken } = response.extractors;

        if (refreshToken) {
            transaction.stop(load.TransactionStatus.Passed);
            return refreshToken;
        }

        load.log(
            `oauth tokenAuthorizationCode failed: status=${response.status}`,
            load.LogLevel.error,
        );
        transaction.stop(load.TransactionStatus.Failed);
        return null;
    }

    /**
     * Mirrors the Java `refreshTokenRefreshHappyFlow` test:
     *   1. takes an existing access token loaded from a data file (IdentityOauthBFAccessTokens / IdentityOauthPPAccessTokens),
     *   2. POSTs to `/api/v1/oauth2/token` with `grant_type=refresh_token` and the access token as `refresh_token`,
     *      using `OAUTH_CLIENT_ID_ENCODED` as the `Authorization` header.
     * Passes when the JSON response contains both a non-empty `access_token` and `refresh_token`.
     */
    async function dealwithOauthTokenRefresh() {
        const { accessToken: inputToken } = load.params;

        if (!inputToken) {
            load.log('oauth tokenRefresh: no accessToken in params', load.LogLevel.error);
            return false;
        }

        const transaction = new load.Transaction('custTech.oauth.tokenRefresh');
        transaction.start();

        const response = await webRequest({
            url: oauthToken,
            method: 'POST',
            returnBody: true,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Accept: 'application/json',
                Authorization: OAUTH_CLIENT_ID_ENCODED,
            },
            body: {
                grant_type: 'refresh_token',
                refresh_token: inputToken,
            },
            extractors: [
                new load.JsonPathExtractor('accessToken', {
                    path: '$.access_token',
                }),
                new load.JsonPathExtractor('refreshToken', {
                    path: '$.refresh_token',
                }),
            ],
        }).send();

        const { accessToken, refreshToken } = response.extractors;

        if (accessToken && refreshToken) {
            transaction.stop(load.TransactionStatus.Passed);
            return true;
        }

        load.log(
            `oauth tokenRefresh failed: status=${response.status}`,
            load.LogLevel.error,
        );
        transaction.stop(load.TransactionStatus.Failed);
        return false;
    }

    /**
     * Varianta 1 — Token + Revoke in the same iteration:
     *   1. calls the full token flow (finalize + token, each with their own transaction),
     *   2. POSTs to `/api/v1/oauth2/revoke` with the freshly obtained access_token.
     * Passes when the JSON response contains `status: "SUCCESS"`.
     */
    async function dealwithOauthRevoke() {
        const accessToken = await dealwithOauthTokenAuthorizationCode();

        if (!accessToken) {
            return false;
        }

        const transaction = new load.Transaction('custTech.oauth.revoke');
        transaction.start();

        const response = await webRequest({
            url: oauthRevoke,
            method: 'POST',
            returnBody: true,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Accept: 'application/json',
            },
            body: {
                token: accessToken,
                token_type_hint: 'access_token',
            },
            extractors: [
                new load.JsonPathExtractor('status', {
                    path: '$.status',
                }),
            ],
        }).send();

        const { status } = response.extractors;

        if (status === 'SUCCESS') {
            transaction.stop(load.TransactionStatus.Passed);
            return true;
        }

        load.log(
            `oauth revoke failed: status=${response.status} body_status=${status}`,
            load.LogLevel.error,
        );
        transaction.stop(load.TransactionStatus.Failed);
        return false;
    }

    // ─── ISS Login helpers ────────────────────────────────────────────────

    function randomString(length) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    function randomIpAddress() {
        // Range: 82.1.1.0 – 82.35.255.255
        const octet2 = Math.floor(Math.random() * 35) + 1; // 1–35
        const octet3 = Math.floor(Math.random() * 256);    // 0–255
        const octet4 = Math.floor(Math.random() * 256);    // 0–255
        return `82.${octet2}.${octet3}.${octet4}`;
    }

    async function dealWithIssLogin() {
        const transaction = new load.Transaction('custTech.iss.soap.login');
        transaction.start();

        // ── username ──────────────────────────────────────────────────────
        let username;
        if (SHOULD_USE_EXISTING_USERNAMES === true || SHOULD_USE_EXISTING_USERNAMES === 'true') {
            username = load.params.username;
        } else {
            username = randomString(10);
        }

        // ── IP address ────────────────────────────────────────────────────
        const resolvedIp = (IP_ADDRESS === 'random') ? randomIpAddress() : IP_ADDRESS;

        // ── JA4 ───────────────────────────────────────────────────────────
        const resolvedJa4 = (JA4 === 'random') ? `ja4${randomString(10)}` : JA4;

        const soapBody = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:sec="http://www.betfair.com/security/" xmlns:iden="http://www.betfair.com/servicetypes/v1/Identitysso/"><soapenv:Header><sec:Credentials></sec:Credentials></soapenv:Header><soapenv:Body><iden:LoginRequest><iden:username>${username}</iden:username><iden:password>${PASSWORD}</iden:password><iden:productEntityName><iden:name>loadTestProduct</iden:name></iden:productEntityName><iden:channel>WEB</iden:channel><iden:brand>${BRAND}</iden:brand><iden:loginContext><iden:entry key="IP_ADDRESS"><iden:String>${resolvedIp}</iden:String></iden:entry><iden:entry key="DOMAIN"><iden:String>${DOMAIN}</iden:String></iden:entry><iden:entry key="PATH"><iden:String>/api/login</iden:String></iden:entry><iden:entry key="TMX_ID"><iden:String>loadTestTmxID</iden:String></iden:entry><iden:entry key="JA4"><iden:String>${resolvedJa4}</iden:String></iden:entry></iden:loginContext></iden:LoginRequest></soapenv:Body></soapenv:Envelope>`;

        let response;

        response = await webRequest({
            url: `https://${ISS_ENDPOINT}:443/IdentityssoService/v1.0`,
            method: 'POST',
            returnBody: true,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Accept: '*/*',
                'user-agent': 'Mozilla/5.0 (Linux; Android 5.0; SM-G900P Build/LRX21T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Mobile Safari/537.36',
            },
            body: soapBody,
        }).send();

        if (response.size > 0) {
            transaction.stop(load.TransactionStatus.Passed);
            return true;
        }

        load.log(`ISS login failed: username=${username} status=${response.status}`, load.LogLevel.error);
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
        createSessionsAndSaveToFile,
        dealwithOauthAuthorize,
        dealwithOauthFinalize,
        dealwithOauthTokenAuthorizationCode,
        dealwithOauthTokenRefresh,
        dealwithOauthRevoke,
        dealWithIssLogin,
    };
};
