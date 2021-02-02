/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for
 * license information.
 *
 * Code generated by Microsoft (R) AutoRest Code Generator.
 * Changes may cause incorrect behavior and will be lost if the code is
 * regenerated.
 */

// tslint:disable:quotemark
// tslint:disable:object-literal-sort-keys

import * as coreHttp from "@azure/core-http";

export const apiVersion: coreHttp.OperationQueryParameter = {
  parameterPath: "apiVersion",
  mapper: {
    required: true,
    serializedName: "api-version",
    type: {
      name: "String",
    },
  },
};
export const maxresults: coreHttp.OperationQueryParameter = {
  parameterPath: ["options", "maxresults"],
  mapper: {
    serializedName: "maxresults",
    constraints: {
      InclusiveMaximum: 25,
      InclusiveMinimum: 1,
    },
    type: {
      name: "Number",
    },
  },
};
export const secretName: coreHttp.OperationURLParameter = {
  parameterPath: "secretName",
  mapper: {
    required: true,
    serializedName: "secret-name",
    constraints: {
      Pattern: /^[0-9a-zA-Z-]+$/,
    },
    type: {
      name: "String",
    },
  },
};
export const secretVersion: coreHttp.OperationURLParameter = {
  parameterPath: "secretVersion",
  mapper: {
    required: true,
    serializedName: "secret-version",
    constraints: {
      Pattern: /^[a-f0-9]{32}$/,
    },
    type: {
      name: "String",
    },
  },
};
export const vaultBaseUrl: coreHttp.OperationURLParameter = {
  parameterPath: "vaultBaseUrl",
  mapper: {
    required: true,
    serializedName: "vaultBaseUrl",
    defaultValue: "",
    type: {
      name: "String",
    },
  },
  skipEncoding: true,
};
