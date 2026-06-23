module.exports = function (load) {
    return {
        getLoadedCookieValueByName(cookieName) {
            const loadedCookies = (load.config.loadedCookies || []);
            return loadedCookies[cookieName];
        },
    };
};
