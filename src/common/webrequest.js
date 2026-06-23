module.exports = (load) => ({
    webRequest(options) {
        return new load.WebRequest({
            ...options,
        });
    },
});
