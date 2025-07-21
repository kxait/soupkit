/**
 * @type {import('fastify').preHandlerHookHandler}
 */
export default async function verifyLogin(_, reply) {
  /** example verification code
   * // some kind of type jsdoc here
   * const identityService = di.get('identity');
   *
   * const isLoggedIn = await identityService.isLoggedIn();
   *
   * if (!isLoggedIn) {
   *   reply.redirect('/login');
   *   return;
   * }
   * */
  return;
}
