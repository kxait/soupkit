/**
 * @param {import('fastify').FastifyInstance} fa
 */
export function addLayouting(fa) {
  fa.decorateReply('wrapLayout', function (/** @type {any} */ content) {
    this.type('text/html');
    return globalLayout(content);
  });

  fa.decorateReply('setLayout', function (/** @type {any} */ layoutFn) {
    this.customLayout = layoutFn;
  });

  fa.decorateReply('skipLayout', function () {
    this.noLayout = true;
  });

  fa.addHook(
    'onSend',
    async (
      request,
      /** @type {import('fastify').FastifyReply} */ reply,
      payload,
    ) => {
      if (
        typeof payload === 'string' &&
        reply
          .getHeader('content-type')
          ?.toString()
          ?.toLowerCase()
          ?.includes('text/html')
      ) {
        if (request.headers['hx-request']) {
          return payload;
        }

        // @ts-ignore
        if (reply.noLayout) {
          return payload;
        }
        // @ts-ignore
        const layoutFn = reply.customLayout || globalLayout;
        return layoutFn(payload);
      }
      return payload;
    },
  );
}

/**
 * @param {any} content
 */
export function globalLayout(content) {
  return `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <link rel="stylesheet" href="/styles.css">
      <script src="/htmx.min.js"></script>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>$name</title></head>
    <body>
      <main><div class="m-4">${content}</div></main>
    </body>
  </html>
`;
}
