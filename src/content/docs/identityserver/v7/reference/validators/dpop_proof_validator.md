---
title: "DPoP Proof Validator"
sidebar:
  order: 40
---

#### Duende.IdentityServer.Validation.IDPoPProofValidator

The `IDPoPProofValidator` interface is used to validate [DPoP](../tokens/pop/dpop) proof tokens
submitted to IdentityServer.
A default implementation is provided and can be overridden as necessary.

## IDPoPProofValidator APIs

* **`ValidateAsync`**

  Validates a DPoP proof token with the provided `DPoPProofValidationContext` for the current request.
  Returns a `DPoPProofValidationResult` object.

### DPoPProofValidationContext

Models the information to validate a DPoP proof token request.

* **`Client`**

  The `Client` making the request.

* **`ProofToken`**

  The proof token sent with the request.

### DPoPProofValidationResult

Models the result of a DPoP proof token validation.

* **`IsError`**

  Flag to indicate if validation failed.

* **`Error`**

  The error code if the validation failed.

* **`ErrorDescription`**

  The error description if the validation failed.

* **`JsonWebKey`**

  The serialized JWK from the validated DPoP proof token.

* **`JsonWebKeyThumbprint`**

  The JWK thumbprint from the validated DPoP proof token.

* **`Confirmation`**

  The 'cnf' value for the DPoP proof token.

* **`Payload`**

  The payload values of the DPoP proof token.

* **`TokenId`**

  The 'jti' value read from the payload.

* **`Nonce`**

  The 'nonce' value read from the payload.

* **`IssuedAt`**

  The 'iat' value read from the payload.

* **`ServerIssuedNonce`**

  The 'nonce' value issued by the server that should be emitted on the response.
