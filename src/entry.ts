import { createBareServer } from './createServer.ts';
import type { BareServerInit, IPFamily } from './createServer.ts';
import { createServer } from 'node:http';
import exitHook from 'async-exit-hook';
import type { BareMaintainer } from './BareServer.ts';
import { httpServerHandler } from 'cloudflare:node';

// const bare = createBareServer('/', {
//   logErrors: true,
// });

// interface Env {}

// export default {
//   async fetch(request: Request, env: Env) {
//     if (bare.shouldRoute(request)) return bare.routeRequest(request);
//   },
// }

const startServer = ({
  directory,
  errors,
  host,
  port,
  localAddress,
  family,
  maintainer,
}: {
  directory: string;
  errors: boolean;
  host: string;
  port: number;
  localAddress?: string;
  family?: number;
  maintainer: BareMaintainer;
  maintainerFile?: string;
}) => {
  const config: BareServerInit = {
    logErrors: errors,
    family: family as IPFamily,
    maintainer: maintainer
  };
  const bareServer = createBareServer(directory, config);

  console.log('Error Logging:', errors);
  console.log(
    'URL:          ',
    `http://${host === '0.0.0.0' ? 'localhost' : host}${
      port === 80 ? '' : `:${port}`
    }${directory}`,
  );
  console.log('Maintainer:   ', config.maintainer);

  const server = createServer();

  server.on('request', (req, res) => {
    if (bareServer.shouldRoute(req)) {
      bareServer.routeRequest(req, res);
    } else {
      res.writeHead(400);
      res.end('Not found.');
    }
  });

  server.on('upgrade', (req, socket, head) => {
    if (bareServer.shouldRoute(req)) {
      bareServer.routeUpgrade(req, socket, head);
    } else {
      socket.end();
    }
  });

  exitHook(() => {
    bareServer.close();
    server.close();
  });

  return server;
};

const server = startServer({
  directory: '/',
  errors: true,
  host: '0.0.0.0',
  port: 8000,
  family: 0,
  maintainer: {
    website: 'https://github.com/akku1139/bare-server-worker-new',
  },
});
server.listen(8000)

export default httpServerHandler({ port: 8000 });
