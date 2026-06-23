module.exports = async (load) => {
    const {
        THINK_TIME,
        CHANNEL_NAME,
    } = load.config.user.args;

    load.WebRequest.defaults.headers = {
        'X-PPB-LoadTesting': '56776d1a0f75d7b083deec0078875859',
        'Accept-Encoding': 'gzip, deflate',
        'User-Agent': CHANNEL_NAME === 'MOBILE'
            ? 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.146 Safari/537.36'
            : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.141 Safari/537.36',
    };
};
