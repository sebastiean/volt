/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for
 * license information.
 *
 * Code generated by Microsoft (R) AutoRest Code Generator.
 * Changes may cause incorrect behavior and will be lost if the code is
 * regenerated.
 */
// tslint:disable:object-literal-sort-keys

import * as coreHttp from "@azure/core-http";

import * as Mappers from "./mappers";
import { Operation } from "./operation";
import * as Parameters from "./parameters";

const serializer = new coreHttp.Serializer(Mappers);
// specifications for new method group start
const setSecretOperationSpec: coreHttp.OperationSpec = {
  httpMethod: "PUT",
  path: "secrets/{secret-name}",
  urlParameters: [
    Parameters.vaultBaseUrl,
    Parameters.secretName
  ],
  queryParameters: [
    Parameters.apiVersion
  ],
  requestBody: {
    parameterPath: {
      value: "value",
      tags: [
        "options",
        "tags"
      ],
      contentType: [
        "options",
        "contentType"
      ],
      secretAttributes: [
        "options",
        "secretAttributes"
      ]
    },
    mapper: {
      ...Mappers.SecretSetParameters,
      required: true
    }
  },
  responses: {
    200: {
      bodyMapper: Mappers.SecretBundle
    },
    default: {
      bodyMapper: Mappers.KeyVaultError
    }
  },
  serializer
};

const updateSecretLatestVersionOperationSpec: coreHttp.OperationSpec = {
  httpMethod: "PATCH",
  path: "secrets/{secret-name}",
  urlParameters: [
    Parameters.vaultBaseUrl,
    Parameters.secretName
  ],
  queryParameters: [
    Parameters.apiVersion
  ],
  requestBody: {
    parameterPath: {
      contentType: [
        "options",
        "contentType"
      ],
      secretAttributes: [
        "options",
        "secretAttributes"
      ],
      tags: [
        "options",
        "tags"
      ]
    },
    mapper: {
      ...Mappers.SecretUpdateParameters,
      required: true
    }
  },
  responses: {
    200: {
      bodyMapper: Mappers.SecretBundle
    },
    default: {
      bodyMapper: Mappers.KeyVaultError
    }
  },
  serializer
};

const deleteSecretOperationSpec: coreHttp.OperationSpec = {
  httpMethod: "DELETE",
  path: "secrets/{secret-name}",
  urlParameters: [
    Parameters.vaultBaseUrl,
    Parameters.secretName
  ],
  queryParameters: [
    Parameters.apiVersion
  ],
  responses: {
    200: {
      bodyMapper: Mappers.DeletedSecretBundle
    },
    default: {
      bodyMapper: Mappers.KeyVaultError
    }
  },
  serializer
};

const getSecretLatestVersionOperationSpec: coreHttp.OperationSpec = {
  httpMethod: "GET",
  path: "secrets/{secret-name}",
  urlParameters: [
    Parameters.vaultBaseUrl,
    Parameters.secretName
  ],
  queryParameters: [
    Parameters.apiVersion
  ],
  responses: {
    200: {
      bodyMapper: Mappers.SecretBundle
    },
    default: {
      bodyMapper: Mappers.KeyVaultError
    }
  },
  serializer
};

const updateSecretOperationSpec: coreHttp.OperationSpec = {
  httpMethod: "PATCH",
  path: "secrets/{secret-name}/{secret-version}",
  urlParameters: [
    Parameters.vaultBaseUrl,
    Parameters.secretName,
    Parameters.secretVersion
  ],
  queryParameters: [
    Parameters.apiVersion
  ],
  requestBody: {
    parameterPath: {
      contentType: [
        "options",
        "contentType"
      ],
      secretAttributes: [
        "options",
        "secretAttributes"
      ],
      tags: [
        "options",
        "tags"
      ]
    },
    mapper: {
      ...Mappers.SecretUpdateParameters,
      required: true
    }
  },
  responses: {
    200: {
      bodyMapper: Mappers.SecretBundle
    },
    default: {
      bodyMapper: Mappers.KeyVaultError
    }
  },
  serializer
};

const getSecretOperationSpec: coreHttp.OperationSpec = {
  httpMethod: "GET",
  path: "secrets/{secret-name}/{secret-version}",
  urlParameters: [
    Parameters.vaultBaseUrl,
    Parameters.secretName,
    Parameters.secretVersion
  ],
  queryParameters: [
    Parameters.apiVersion
  ],
  responses: {
    200: {
      bodyMapper: Mappers.SecretBundle
    },
    default: {
      bodyMapper: Mappers.KeyVaultError
    }
  },
  serializer
};

const getSecretsOperationSpec: coreHttp.OperationSpec = {
  httpMethod: "GET",
  path: "secrets",
  urlParameters: [
    Parameters.vaultBaseUrl
  ],
  queryParameters: [
    Parameters.maxresults,
    Parameters.apiVersion
  ],
  responses: {
    200: {
      bodyMapper: Mappers.SecretListResult
    },
    default: {
      bodyMapper: Mappers.KeyVaultError
    }
  },
  serializer
};

const getSecretVersionsOperationSpec: coreHttp.OperationSpec = {
  httpMethod: "GET",
  path: "secrets/{secret-name}/versions",
  urlParameters: [
    Parameters.vaultBaseUrl,
    Parameters.secretName
  ],
  queryParameters: [
    Parameters.maxresults,
    Parameters.apiVersion
  ],
  responses: {
    200: {
      bodyMapper: Mappers.SecretListResult
    },
    default: {
      bodyMapper: Mappers.KeyVaultError
    }
  },
  serializer
};

const getDeletedSecretsOperationSpec: coreHttp.OperationSpec = {
  httpMethod: "GET",
  path: "deletedsecrets",
  urlParameters: [
    Parameters.vaultBaseUrl
  ],
  queryParameters: [
    Parameters.maxresults,
    Parameters.apiVersion
  ],
  responses: {
    200: {
      bodyMapper: Mappers.DeletedSecretListResult
    },
    default: {
      bodyMapper: Mappers.KeyVaultError
    }
  },
  serializer
};

const getDeletedSecretOperationSpec: coreHttp.OperationSpec = {
  httpMethod: "GET",
  path: "deletedsecrets/{secret-name}",
  urlParameters: [
    Parameters.vaultBaseUrl,
    Parameters.secretName
  ],
  queryParameters: [
    Parameters.apiVersion
  ],
  responses: {
    200: {
      bodyMapper: Mappers.DeletedSecretBundle
    },
    default: {
      bodyMapper: Mappers.KeyVaultError
    }
  },
  serializer
};

const purgeDeletedSecretOperationSpec: coreHttp.OperationSpec = {
  httpMethod: "DELETE",
  path: "deletedsecrets/{secret-name}",
  urlParameters: [
    Parameters.vaultBaseUrl,
    Parameters.secretName
  ],
  queryParameters: [
    Parameters.apiVersion
  ],
  responses: {
    204: {},
    default: {
      bodyMapper: Mappers.KeyVaultError
    }
  },
  serializer
};

const recoverDeletedSecretOperationSpec: coreHttp.OperationSpec = {
  httpMethod: "POST",
  path: "deletedsecrets/{secret-name}/recover",
  urlParameters: [
    Parameters.vaultBaseUrl,
    Parameters.secretName
  ],
  queryParameters: [
    Parameters.apiVersion
  ],
  responses: {
    200: {
      bodyMapper: Mappers.SecretBundle
    },
    default: {
      bodyMapper: Mappers.KeyVaultError
    }
  },
  serializer
};

const backupSecretOperationSpec: coreHttp.OperationSpec = {
  httpMethod: "POST",
  path: "secrets/{secret-name}/backup",
  urlParameters: [
    Parameters.vaultBaseUrl,
    Parameters.secretName
  ],
  queryParameters: [
    Parameters.apiVersion
  ],
  responses: {
    200: {
      bodyMapper: Mappers.BackupSecretResult
    },
    default: {
      bodyMapper: Mappers.KeyVaultError
    }
  },
  serializer
};

const restoreSecretOperationSpec: coreHttp.OperationSpec = {
  httpMethod: "POST",
  path: "secrets/restore",
  urlParameters: [
    Parameters.vaultBaseUrl
  ],
  queryParameters: [
    Parameters.apiVersion
  ],
  requestBody: {
    parameterPath: {
      secretBundleBackup: "secretBundleBackup"
    },
    mapper: {
      ...Mappers.SecretRestoreParameters,
      required: true
    }
  },
  responses: {
    200: {
      bodyMapper: Mappers.SecretBundle
    },
    default: {
      bodyMapper: Mappers.KeyVaultError
    }
  },
  serializer
};

const Specifications: { [key: number]: coreHttp.OperationSpec } = {};
Specifications[Operation.SetSecret] = setSecretOperationSpec;
Specifications[Operation.UpdateSecretLatestVersion] = updateSecretLatestVersionOperationSpec;
Specifications[Operation.DeleteSecret] = deleteSecretOperationSpec;
Specifications[Operation.GetSecretLatestVersion] = getSecretLatestVersionOperationSpec;
Specifications[Operation.UpdateSecret] = updateSecretOperationSpec;
Specifications[Operation.GetSecret] = getSecretOperationSpec;
Specifications[Operation.GetSecrets] = getSecretsOperationSpec;
Specifications[Operation.GetSecretVersions] = getSecretVersionsOperationSpec;
Specifications[Operation.GetDeletedSecrets] = getDeletedSecretsOperationSpec;
Specifications[Operation.GetDeletedSecret] = getDeletedSecretOperationSpec;
Specifications[Operation.RecoverDeletedSecret] = recoverDeletedSecretOperationSpec;
Specifications[Operation.BackupSecret] = backupSecretOperationSpec;
Specifications[Operation.RestoreSecret] = restoreSecretOperationSpec;
export default Specifications;
