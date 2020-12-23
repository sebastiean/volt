import express from "express";
import morgan = require("morgan");

import IRequestListenerFactory from "./IRequestListenerFactory";
import logger from "./Logger";
import { RequestListener } from "./ServerBase";
import ExpressMiddlewareFactory from "./generated/ExpressMiddlewareFactory";
import IHandlers from "./generated/handlers/IHandlers";
import MiddlewareFactory from "./generated/MiddlewareFactory";
import SecretsHandler from "./handlers/SecretsHandler";
import ISecretsMetadataStore from "./persistence/ISecretsMetadataStore";
import { DEFAULT_CONTEXT_PATH } from "./utils/constants";
import createSecretsContextMiddleware from './middleware/secretsContext.middleware';
import { DeletionRecoveryLevel } from './generated/artifacts/models';

/**
 * Default RequestListenerFactory based on express framework.
 *
 * When creating other server implementations, such as based on Koa. Should also create a NEW
 * corresponding SecretsKoaRequestListenerFactory class by extending IRequestListenerFactory.
 *
 * @export
 * @class SecretsRequestListenerFactory
 * @implements {IRequestListenerFactory}
 */
export default class SecretsRequestListenerFactory
  implements IRequestListenerFactory {
  public constructor(
    private readonly metadataStore: ISecretsMetadataStore,
    private readonly enableAccessLog: boolean,
    private readonly accessLogWriteStream?: NodeJS.WritableStream,
    private readonly loose?: boolean,
    private readonly skipApiVersionCheck?: boolean,
    private readonly httpServerAddress?: string,
    private readonly recoveryLevel?: DeletionRecoveryLevel,
    private readonly recoverableDays?: number
  ) { }

  public createRequestListener(): RequestListener {
    const app = express().disable("x-powered-by");

    // MiddlewareFactory is a factory to create auto-generated middleware
    const middlewareFactory: MiddlewareFactory = new ExpressMiddlewareFactory(
      logger,
      DEFAULT_CONTEXT_PATH
    );

    // Create handlers into handler middleware factory
    const handlers: IHandlers = {
      voltServerSecretsHandler: new SecretsHandler(
        this.metadataStore,
        logger,
        this.httpServerAddress,
        this.recoveryLevel,
        this.recoverableDays
      )
    };

    /*
     * Generated middleware should follow strict orders
     * Manually created middleware can be injected into any points
     */

    // Access log per request
    if (this.enableAccessLog) {
      app.use(morgan("common", { stream: this.accessLogWriteStream }));
    }

    // Manually created middleware to deserialize feature related context which swagger doesn't know
    app.use(createSecretsContextMiddleware(this.skipApiVersionCheck));

    // Dispatch incoming HTTP request to specific operation
    app.use(middlewareFactory.createDispatchMiddleware());

    // Generated, will do basic validation defined in swagger
    app.use(middlewareFactory.createDeserializerMiddleware());

    // Generated, inject handlers to create a handler middleware
    app.use(middlewareFactory.createHandlerMiddleware(handlers));

    // Generated, will serialize response models into HTTP response
    app.use(middlewareFactory.createSerializerMiddleware());

    // Generated, will return MiddlewareError and Errors thrown in previous middleware/handlers to HTTP response
    app.use(middlewareFactory.createErrorMiddleware());

    // Generated, will end and return HTTP response immediately
    app.use(middlewareFactory.createEndMiddleware());

    return app;
  }
}