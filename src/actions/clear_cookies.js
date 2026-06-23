module.exports = async function (load) {
    load.clearCookies();
    load.log('Removed Cookies');
};
