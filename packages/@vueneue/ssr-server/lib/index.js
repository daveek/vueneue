const { readFileSync } = require('fs-extra');
const { join } = require('path');
const Koa = require('koa');
const mount = require('koa-mount');
const serve = require('koa-static');

const createRenderer = require('./createRenderer');
const renderRoute = require('./renderRoute');

module.exports = async opts => {
  const { dist, host, port, ssr } = opts;

  const app = new Koa();
  const isProduction = process.env.NODE_ENV === 'production';
  const serverContext = { ...opts, app };

  let readyPromise;
  if (isProduction) {
    const serverBundle = require(join(dist, 'server-bundle.json'));
    const clientManifest = require(join(dist, 'client-manifest.json'));
    serverContext.renderer = createRenderer(serverBundle, {
      clientManifest,
      directives: ssr ? ssr.directives : undefined,
    });
    readyPromise = Promise.resolve();
  } else {
    readyPromise = require('./devMiddleware')(
      serverContext,
      (bundle, options) => {
        serverContext.renderer = createRenderer(bundle, {
          ...options,
          directives: ssr ? ssr.directives : undefined,
        });
      },
    );
  }

  await readyPromise;

  /**
   * Server
   */
  if (isProduction) {
    // In production mode get index.ssr.html file content
    serverContext.template = readFileSync(
      join(dist, 'index.ssr.html'),
      'utf-8',
    );

    // Add middlewares on Koa
    app.use(mount('/', serve(dist)));
  }

  // Server customization
  if (ssr && typeof ssr.server === 'function') {
    ssr.server(app);
  }

  app.use(ctx => {
    const { url } = ctx;
    const ssrContext = { url, ctx };

    serverContext.ctx = ctx;

    if (isProduction) {
      return renderRoute(serverContext, ssrContext);
    } else {
      return readyPromise.then(() => renderRoute(serverContext, ssrContext));
    }
  });

  let httpServer;

  const { https } = ssr || {};
  if (https && https.key && https.cert) {
    httpServer = require('https').createServer(https, app.callback());
  } else {
    httpServer = require('http').createServer(app.callback());
  }

  httpServer.listen(port, host, () => {
    // eslint-disable-next-line
    console.log(`Server started at http://${host}:${port}`);
  });

  return httpServer;
};
