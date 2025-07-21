import React from 'react';

/**
 * @param {Object} props
 * @param {number} props.errorCode
 * @param {string} props.error
 * @param {string} [props.traceCode]
 */
export default function ErrorPage({ errorCode, error, traceCode = undefined }) {
  return (
    <div>
      <h1 className="text-2xl text-red-500">Error {errorCode}</h1>
      <div>{error}</div>
      {traceCode && (
        <div>
          Trace code: <pre>{traceCode}</pre>
        </div>
      )}
    </div>
  );
}
