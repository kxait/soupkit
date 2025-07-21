import ReactDOMServer from 'react-dom/server';
import React from 'react';
import ErrorPage from '@components/views/ErrorPage';

export default class ErrorPageFactoryService {
  /**
   * @param {number} errorCode
   * @param {string} error
   * @param {string} [traceCode]
   */
  getErrorPage(errorCode, error, traceCode) {
    const htmlString = ReactDOMServer.renderToString(
      <ErrorPage errorCode={errorCode} error={error} traceCode={traceCode} />,
    );

    return htmlString;
  }

  /**
   * @param {number} errorCode
   * @param {string} [traceCode]
   */
  getErrorHtmxFragment(errorCode, traceCode) {
    const htmlString = ReactDOMServer.renderToString(
      <div>
        Error! {errorCode}{' '}
        {traceCode && (
          <>
            (trace <pre>{traceCode}</pre>)
          </>
        )}
      </div>,
    );

    return htmlString;
  }
}
