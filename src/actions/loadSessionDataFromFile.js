const sessionsCookies = ['ssoid'];

module.exports = (load) => {
    const {
        DOMAIN,
    } = load.config.user.args;
    const params = { ...load.params };
    load.config.loadedCookies = {};

    const loadedCookies = sessionsCookies.filter((item) => !!params[item])
        .map((item) => {
            load.config.loadedCookies[item] = params[item];
            return new load.Cookie({
                name: item,
                value: params[item],
                domain: `${DOMAIN}`,
                path: '/',
            });
        });
    loadedCookies.map(load.addCookies);

    if (loadedCookies.length < 1) {
        load.log('Invalid Login Cookies To Load', load.LogLevel.error);
        load.exit(load.ExitType.abort);
    }

    const mgrcookie = new load.Cookie(`mgr=y; Domain=${DOMAIN}; Path=/;`);
    const loggedincookie = new load.Cookie(`loggedIn=true; Domain=${DOMAIN}; Path=/;`);

    load.addCookies(loggedincookie);
    load.addCookies(mgrcookie);
};
