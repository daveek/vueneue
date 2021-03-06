const definePlugin = require('./lib/webpack/definePlugin');

module.exports = api => {
  api.chainWebpack(config => {
    // Change main entry
    config.entryPoints
      .get('app')
      .clear()
      .add('./src/vueneue/entries/client');
  });

  api.configureWebpack(() => {
    // Add required process vars for Vueneue (for SPA mode only)
    const defines = definePlugin();
    defines.__vueneue = true;
    return {
      plugins: [defines],
    };
  });

  api.service.projectOptions.transpileDependencies.push(
    /@vueneue\/vue-cli-plugin-ssr\/lib/,
  );

  require('./lib/commands/serve')(api, api.service.projectOptions);
  require('./lib/commands/build')(api, api.service.projectOptions);
  require('./lib/commands/start')(api, api.service.projectOptions);
};

module.exports.defaultModes = {
  'ssr:serve': 'development',
  'ssr:build': 'production',
  'ssr:start': 'production',
};
