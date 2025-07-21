import React from 'react';
import { randomUUID } from 'crypto';

/**
 * @param {Object} props
 * @param {Function} props.fun - the function
 * @param {string[]} [props.args] - the arguments to pass to the function
 * @param {boolean} [props.noInvoke] - true if the function should be declared but not invoked
 */
export default function Script({ fun, args, noInvoke = false }) {
  if (noInvoke && args) {
    throw new Error('cannot use args with noInvoke');
  }

  if (noInvoke) {
    return (
      <script
        dangerouslySetInnerHTML={{
          __html: fun.toString(),
        }}
      />
    );
  }

  if (!args) {
    return (
      <script
        dangerouslySetInnerHTML={{
          __html: clientInvokeNoArgs(fun),
        }}
      />
    );
  }

  return (
    <script
      dangerouslySetInnerHTML={{
        __html: clientInvoke(fun, args),
      }}
    />
  );
}

/**
 * @param {Function} func
 * @param {string[]} [args]
 * @returns {string}
 */
function clientInvoke(func, args = []) {
  const uuid = randomUUID().replaceAll('-', '');
  return `const _${uuid}=${JSON.stringify(args)};(${func.toString()})(..._${uuid})`;
}

/**
 * @param {Function} func
 * @returns {string}
 */
function clientInvokeNoArgs(func) {
  return `(${func.toString()})()`;
}
