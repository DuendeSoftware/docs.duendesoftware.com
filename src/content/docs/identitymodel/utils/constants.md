---
title: Protocol and Claim Type Constants
description: Explore constant string classes provided by IdentityModel for OAuth 2.0, OpenID Connect protocol values, and JWT claim types
sidebar:
  order: 10
  label: Constants
redirect_from:
  - /foss/identitymodel/utils/constants/
---

When working with OAuth 2.0, OpenID Connect and claims, there are a lot
of **✨magic strings** for claim types and protocol values. IdentityModel
provides a couple of constant strings classes to help with that.

## OAuth 2.0 And OpenID Connect Protocol Values

The `OidcConstants` class provides a set of constants for OAuth 2.0 and
OpenID Connect protocol values.

#### AuthorizeRequest

| Name                | Value                   |
|---------------------|-------------------------|
| Scope               | `scope`                 |
| ResponseType        | `response_type`         |
| ClientId            | `client_id`             |
| RedirectUri         | `redirect_uri`          |
| State               | `state`                 |
| ResponseMode        | `response_mode`         |
| Nonce               | `nonce`                 |
| Display             | `display`               |
| Prompt              | `prompt`                |
| MaxAge              | `max_age`               |
| UiLocales           | `ui_locales`            |
| IdTokenHint         | `id_token_hint`         |
| LoginHint           | `login_hint`            |
| AcrValues           | `acr_values`            |
| CodeChallenge       | `code_challenge`        |
| CodeChallengeMethod | `code_challenge_method` |
| Request             | `request`               |
| RequestUri          | `request_uri`           |
| Resource            | `resource`              |
| DPoPKeyThumbprint   | `dpop_jkt`              |

### AuthorizeErrors

| Name                            | Value                               |
|---------------------------------|-------------------------------------|
| InvalidRequest                  | `invalid_request`                   |
| UnauthorizedClient              | `unauthorized_client`               |
| AccessDenied                    | `access_denied`                     |
| UnsupportedResponseType         | `unsupported_response_type`         |
| InvalidScope                    | `invalid_scope`                     |
| ServerError                     | `server_error`                      |
| TemporarilyUnavailable          | `temporarily_unavailable`           |
| UnmetAuthenticationRequirements | `unmet_authentication_requirements` |
| InteractionRequired             | `interaction_required`              |
| LoginRequired                   | `login_required`                    |
| AccountSelectionRequired        | `account_selection_required`        |
| ConsentRequired                 | `consent_required`                  |
| InvalidRequestUri               | `invalid_request_uri`               |
| InvalidRequestObject            | `invalid_request_object`            |
| RequestNotSupported             | `request_not_supported`             |
| RequestUriNotSupported          | `request_uri_not_supported`         |
| RegistrationNotSupported        | `registration_not_supported`        |
| InvalidTarget                   | `invalid_target`                    |

### AuthorizeResponse

| Name             | Value               |
|------------------|---------------------|
| Scope            | `scope`             |
| Code             | `code`              |
| AccessToken      | `access_token`      |
| ExpiresIn        | `expires_in`        |
| TokenType        | `token_type`        |
| RefreshToken     | `refresh_token`     |
| IdentityToken    | `id_token`          |
| State            | `state`             |
| SessionState     | `session_state`     |
| Issuer           | `iss`               |
| Error            | `error`             |
| ErrorDescription | `error_description` |

### DeviceAuthorizationResponse

| Name                    | Value                       |
|-------------------------|-----------------------------|
| DeviceCode              | `device_code`               |
| UserCode                | `user_code`                 |
| VerificationUri         | `verification_uri`          |
| VerificationUriComplete | `verification_uri_complete` |
| ExpiresIn               | `expires_in`                |
| Interval                | `interval`                  |

### EndSessionRequest

| Name                  | Value                      |
|-----------------------|----------------------------|
| IdTokenHint           | `id_token_hint`            |
| PostLogoutRedirectUri | `post_logout_redirect_uri` |
| State                 | `state`                    |
| Sid                   | `sid`                      |
| Issuer                | `iss`                      |
| UiLocales             | `ui_locales`               |

### TokenRequest

| Name                    | Value                   |
|-------------------------|-------------------------|
| GrantType               | `grant_type`            |
| RedirectUri             | `redirect_uri`          |
| ClientId                | `client_id`             |
| ClientSecret            | `client_secret`         |
| ClientAssertion         | `client_assertion`      |
| ClientAssertionType     | `client_assertion_type` |
| Assertion               | `assertion`             |
| Code                    | `code`                  |
| RefreshToken            | `refresh_token`         |
| Scope                   | `scope`                 |
| UserName                | `username`              |
| Password                | `password`              |
| CodeVerifier            | `code_verifier`         |
| TokenType               | `token_type`            |
| Algorithm               | `alg`                   |
| Key                     | `key`                   |
| DeviceCode              | `device_code`           |
| Resource                | `resource`              |
| Audience                | `audience`              |
| RequestedTokenType      | `requested_token_type`  |
| SubjectToken            | `subject_token`         |
| SubjectTokenType        | `subject_token_type`    |
| ActorToken              | `actor_token`           |
| ActorTokenType          | `actor_token_type`      |
| AuthenticationRequestId | `auth_req_id`           |

### BackchannelAuthenticationRequest

| Name                    | Value                       |
|-------------------------|-----------------------------|
| Scope                   | `scope`                     |
| ClientNotificationToken | `client_notification_token` |
| AcrValues               | `acr_values`                |
| LoginHintToken          | `login_hint_token`          |
| IdTokenHint             | `id_token_hint`             |
| LoginHint               | `login_hint`                |
| BindingMessage          | `binding_message`           |
| UserCode                | `user_code`                 |
| RequestedExpiry         | `requested_expiry`          |
| Request                 | `request`                   |
| Resource                | `resource`                  |
| DPoPKeyThumbprint       | `dpop_jkt`                  |

### BackchannelAuthenticationRequestErrors

| Name                  | Value                      |
|-----------------------|----------------------------|
| InvalidRequestObject  | `invalid_request_object`   |
| InvalidRequest        | `invalid_request`          |
| InvalidScope          | `invalid_scope`            |
| ExpiredLoginHintToken | `expired_login_hint_token` |
| UnknownUserId         | `unknown_user_id`          |
| UnauthorizedClient    | `unauthorized_client`      |
| MissingUserCode       | `missing_user_code`        |
| InvalidUserCode       | `invalid_user_code`        |
| InvalidBindingMessage | `invalid_binding_message`  |
| InvalidClient         | `invalid_client`           |
| AccessDenied          | `access_denied`            |
| InvalidTarget         | `invalid_target`           |

### TokenRequestTypes

| Name   | Value    |
|--------|----------|
| Bearer | `bearer` |
| Pop    | `pop`    |

### TokenErrors

| Name                    | Value                       |
|-------------------------|-----------------------------|
| InvalidRequest          | `invalid_request`           |
| InvalidClient           | `invalid_client`            |
| InvalidGrant            | `invalid_grant`             |
| UnauthorizedClient      | `unauthorized_client`       |
| UnsupportedGrantType    | `unsupported_grant_type`    |
| UnsupportedResponseType | `unsupported_response_type` |
| InvalidScope            | `invalid_scope`             |
| AuthorizationPending    | `authorization_pending`     |
| AccessDenied            | `access_denied`             |
| SlowDown                | `slow_down`                 |
| ExpiredToken            | `expired_token`             |
| InvalidTarget           | `invalid_target`            |
| InvalidDPoPProof        | `invalid_dpop_proof`        |
| UseDPoPNonce            | `use_dpop_nonce`            |

### TokenResponse

| Name             | Value               |
|------------------|---------------------|
| AccessToken      | `access_token`      |
| ExpiresIn        | `expires_in`        |
| TokenType        | `token_type`        |
| RefreshToken     | `refresh_token`     |
| IdentityToken    | `id_token`          |
| Error            | `error`             |
| ErrorDescription | `error_description` |
| BearerTokenType  | `Bearer`            |
| DPoPTokenType    | `DPoP`              |
| IssuedTokenType  | `issued_token_type` |
| Scope            | `scope`             |

### BackchannelAuthenticationResponse

| Name                    | Value         |
|-------------------------|---------------|
| AuthenticationRequestId | `auth_req_id` |
| ExpiresIn               | `expires_in`  |
| Interval                | `interval`    |

### PushedAuthorizationRequestResponse

| Name       | Value         |
|------------|---------------|
| ExpiresIn  | `expires_in`  |
| RequestUri | `request_uri` |

### TokenIntrospectionRequest

| Name          | Value             |
|---------------|-------------------|
| Token         | `token`           |
| TokenTypeHint | `token_type_hint` |

### RegistrationResponse

| Name                    | Value                       |
|-------------------------|-----------------------------|
| Error                   | `error`                     |
| ErrorDescription        | `error_description`         |
| ClientId                | `client_id`                 |
| ClientSecret            | `client_secret`             |
| RegistrationAccessToken | `registration_access_token` |
| RegistrationClientUri   | `registration_client_uri`   |
| ClientIdIssuedAt        | `client_id_issued_at`       |
| ClientSecretExpiresAt   | `client_secret_expires_at`  |
| SoftwareStatement       | `software_statement`        |

### ClientMetadata

| Name                                        | Value                                  |
|---------------------------------------------|----------------------------------------|
| RedirectUris                                | `redirect_uris`                        |
| ResponseTypes                               | `response_types`                       |
| GrantTypes                                  | `grant_types`                          |
| ApplicationType                             | `application_type`                     |
| Contacts                                    | `contacts`                             |
| ClientName                                  | `client_name`                          |
| LogoUri                                     | `logo_uri`                             |
| ClientUri                                   | `client_uri`                           |
| PolicyUri                                   | `policy_uri`                           |
| TosUri                                      | `tos_uri`                              |
| JwksUri                                     | `jwks_uri`                             |
| Jwks                                        | `jwks`                                 |
| SectorIdentifierUri                         | `sector_identifier_uri`                |
| Scope                                       | `scope`                                |
| PostLogoutRedirectUris                      | `post_logout_redirect_uris`            |
| FrontChannelLogoutUri                       | `frontchannel_logout_uri`              |
| FrontChannelLogoutSessionRequired           | `frontchannel_logout_session_required` |
| BackchannelLogoutUri                        | `backchannel_logout_uri`               |
| BackchannelLogoutSessionRequired            | `backchannel_logout_session_required`  |
| SoftwareId                                  | `software_id`                          |
| SoftwareStatement                           | `software_statement`                   |
| SoftwareVersion                             | `software_version`                     |
| SubjectType                                 | `subject_type`                         |
| TokenEndpointAuthenticationMethod           | `token_endpoint_auth_method`           |
| TokenEndpointAuthenticationSigningAlgorithm | `token_endpoint_auth_signing_alg`      |
| DefaultMaxAge                               | `default_max_age`                      |
| RequireAuthenticationTime                   | `require_auth_time`                    |
| DefaultAcrValues                            | `default_acr_values`                   |
| InitiateLoginUri                            | `initiate_login_uri`                   |
| RequestUris                                 | `request_uris`                         |
| IdentityTokenSignedResponseAlgorithm        | `id_token_signed_response_alg`         |
| IdentityTokenEncryptedResponseAlgorithm     | `id_token_encrypted_response_alg`      |
| IdentityTokenEncryptedResponseEncryption    | `id_token_encrypted_response_enc`      |
| UserinfoSignedResponseAlgorithm             | `userinfo_signed_response_alg`         |
| UserInfoEncryptedResponseAlgorithm          | `userinfo_encrypted_response_alg`      |
| UserinfoEncryptedResponseEncryption         | `userinfo_encrypted_response_enc`      |
| RequestObjectSigningAlgorithm               | `request_object_signing_alg`           |
| RequestObjectEncryptionAlgorithm            | `request_object_encryption_alg`        |
| RequestObjectEncryptionEncryption           | `request_object_encryption_enc`        |
| RequireSignedRequestObject                  | `require_signed_request_object`        |
| AlwaysUseDPoPBoundAccessTokens              | `dpop_bound_access_tokens`             |
| IntrospectionSignedResponseAlgorithm        | `introspection_signed_response_alg`    |
| IntrospectionEncryptedResponseAlgorithm     | `introspection_encrypted_response_alg` |
| IntrospectionEncryptedResponseEncryption    | `introspection_encrypted_response_enc` |

### TokenTypes

| Name          | Value           |
|---------------|-----------------|
| AccessToken   | `access_token`  |
| IdentityToken | `id_token`      |
| RefreshToken  | `refresh_token` |

### TokenTypeIdentifiers

| Name          | Value                                            |
|---------------|--------------------------------------------------|
| AccessToken   | `urn:ietf:params:oauth:token-type:access_token`  |
| IdentityToken | `urn:ietf:params:oauth:token-type:id_token`      |
| RefreshToken  | `urn:ietf:params:oauth:token-type:refresh_token` |
| Saml11        | `urn:ietf:params:oauth:token-type:saml1`         |
| Saml2         | `urn:ietf:params:oauth:token-type:saml2`         |
| Jwt           | `urn:ietf:params:oauth:token-type:jwt`           |

### AuthenticationSchemes

| Name                      | Value              |
|---------------------------|--------------------|
| AuthorizationHeaderBearer | `Bearer`           |
| AuthorizationHeaderDPoP   | `DPoP`             |
| FormPostBearer            | `access_token`     |
| QueryStringBearer         | `access_token`     |
| AuthorizationHeaderPop    | `PoP`              |
| FormPostPop               | `pop_access_token` |
| QueryStringPop            | `pop_access_token` |

### GrantTypes

| Name              | Value                                             |
|-------------------|---------------------------------------------------|
| Password          | `password`                                        |
| AuthorizationCode | `authorization_code`                              |
| ClientCredentials | `client_credentials`                              |
| RefreshToken      | `refresh_token`                                   |
| Implicit          | `implicit`                                        |
| Saml2Bearer       | `urn:ietf:params:oauth:grant-type:saml2-bearer`   |
| JwtBearer         | `urn:ietf:params:oauth:grant-type:jwt-bearer`     |
| DeviceCode        | `urn:ietf:params:oauth:grant-type:device_code`    |
| TokenExchange     | `urn:ietf:params:oauth:grant-type:token-exchange` |
| Ciba              | `urn:openid:params:grant-type:ciba`               |

### ClientAssertionTypes

| Name       | Value                                                      |
|------------|------------------------------------------------------------|
| JwtBearer  | `urn:ietf:params:oauth:client-assertion-type:jwt-bearer`   |
| SamlBearer | `urn:ietf:params:oauth:client-assertion-type:saml2-bearer` |

### ResponseTypes

| Name             | Value                 |
|------------------|-----------------------|
| Code             | `code`                |
| Token            | `token`               |
| IdToken          | `id_token`            |
| IdTokenToken     | `id_token token`      |
| CodeIdToken      | `code id_token`       |
| CodeToken        | `code token`          |
| CodeIdTokenToken | `code id_token token` |

### ResponseModes

| Name     | Value       |
|----------|-------------|
| FormPost | `form_post` |
| Query    | `query`     |
| Fragment | `fragment`  |

### DisplayModes

| Name  | Value   |
|-------|---------|
| Page  | `page`  |
| Popup | `popup` |
| Touch | `touch` |
| Wap   | `wap`   |

### PromptModes

| Name          | Value            |
|---------------|------------------|
| None          | `none`           |
| Login         | `login`          |
| Consent       | `consent`        |
| SelectAccount | `select_account` |
| Create        | `create`         |

### CodeChallengeMethods

| Name   | Value   |
|--------|---------|
| Plain  | `plain` |
| Sha256 | `S256`  |

### ProtectedResourceErrors

| Name              | Value                |
|-------------------|----------------------|
| InvalidToken      | `invalid_token`      |
| ExpiredToken      | `expired_token`      |
| InvalidRequest    | `invalid_request`    |
| InsufficientScope | `insufficient_scope` |

### EndpointAuthenticationMethods

| Name                    | Value                         |
|-------------------------|-------------------------------|
| PostBody                | `client_secret_post`          |
| BasicAuthentication     | `client_secret_basic`         |
| PrivateKeyJwt           | `private_key_jwt`             |
| TlsClientAuth           | `tls_client_auth`             |
| SelfSignedTlsClientAuth | `self_signed_tls_client_auth` |

### AuthenticationMethods

| Name                                | Value    |
|-------------------------------------|----------|
| FacialRecognition                   | `face`   |
| FingerprintBiometric                | `fpt`    |
| Geolocation                         | `geo`    |
| ProofOfPossessionHardwareSecuredKey | `hwk`    |
| IrisScanBiometric                   | `iris`   |
| KnowledgeBasedAuthentication        | `kba`    |
| MultipleChannelAuthentication       | `mca`    |
| MultiFactorAuthentication           | `mfa`    |
| OneTimePassword                     | `otp`    |
| PersonalIdentificationOrPattern     | `pin`    |
| ProofOfPossessionKey                | `pop`    |
| Password                            | `pwd`    |
| RiskBasedAuthentication             | `rba`    |
| RetinaScanBiometric                 | `retina` |
| SmartCard                           | `sc`     |
| ConfirmationBySms                   | `sms`    |
| ProofOfPossessionSoftwareSecuredKey | `swk`    |
| ConfirmationByTelephone             | `tel`    |
| UserPresenceTest                    | `user`   |
| VoiceBiometric                      | `vbm`    |
| WindowsIntegratedAuthentication     | `wia`    |

### Algorithms

#### Symmetric

| Name  | Value   |
|-------|---------|
| HS256 | `HS256` |
| HS384 | `HS384` |
| HS512 | `HS512` |

#### Asymmetric

| Name  | Value   |
|-------|---------|
| RS256 | `RS256` |
| RS384 | `RS384` |
| RS512 | `RS512` |
| ES256 | `ES256` |
| ES384 | `ES384` |
| ES512 | `ES512` |
| PS256 | `PS256` |
| PS384 | `PS384` |
| PS512 | `PS512` |

### Discovery

| Name                                        | Value                                              |
|---------------------------------------------|----------------------------------------------------|
| Issuer                                      | `issuer`                                           |
| AuthorizationEndpoint                       | `authorization_endpoint`                           |
| DeviceAuthorizationEndpoint                 | `device_authorization_endpoint`                    |
| TokenEndpoint                               | `token_endpoint`                                   |
| UserInfoEndpoint                            | `userinfo_endpoint`                                |
| IntrospectionEndpoint                       | `introspection_endpoint`                           |
| RevocationEndpoint                          | `revocation_endpoint`                              |
| DiscoveryEndpoint                           | `.well-known/openid-configuration`                 |
| JwksUri                                     | `jwks_uri`                                         |
| EndSessionEndpoint                          | `end_session_endpoint`                             |
| CheckSessionIframe                          | `check_session_iframe`                             |
| RegistrationEndpoint                        | `registration_endpoint`                            |
| MtlsEndpointAliases                         | `mtls_endpoint_aliases`                            |
| PushedAuthorizationRequestEndpoint          | `pushed_authorization_request_endpoint`            |
| FrontChannelLogoutSupported                 | `frontchannel_logout_supported`                    |
| FrontChannelLogoutSessionSupported          | `frontchannel_logout_session_supported`            |
| BackChannelLogoutSupported                  | `backchannel_logout_supported`                     |
| BackChannelLogoutSessionSupported           | `backchannel_logout_session_supported`             |
| GrantTypesSupported                         | `grant_types_supported`                            |
| CodeChallengeMethodsSupported               | `code_challenge_methods_supported`                 |
| ScopesSupported                             | `scopes_supported`                                 |
| SubjectTypesSupported                       | `subject_types_supported`                          |
| ResponseModesSupported                      | `response_modes_supported`                         |
| ResponseTypesSupported                      | `response_types_supported`                         |
| ClaimsSupported                             | `claims_supported`                                 |
| TokenEndpointAuthenticationMethodsSupported | `token_endpoint_auth_methods_supported`            |
| ClaimsLocalesSupported                      | `claims_locales_supported`                         |
| ClaimsParameterSupported                    | `claims_parameter_supported`                       |
| ClaimTypesSupported                         | `claim_types_supported`                            |
| DisplayValuesSupported                      | `display_values_supported`                         |
| AcrValuesSupported                          | `acr_values_supported`                             |
| IdTokenEncryptionAlgorithmsSupported        | `id_token_encryption_alg_values_supported`         |
| IdTokenEncryptionEncValuesSupported         | `id_token_encryption_enc_values_supported`         |
| IdTokenSigningAlgorithmsSupported           | `id_token_signing_alg_values_supported`            |
| OpPolicyUri                                 | `op_policy_uri`                                    |
| OpTosUri                                    | `op_tos_uri`                                       |
| RequestObjectEncryptionAlgorithmsSupported  | `request_object_encryption_alg_values_supported`   |
| RequestObjectEncryptionEncValuesSupported   | `request_object_encryption_enc_values_supported`   |
| RequestObjectSigningAlgorithmsSupported     | `request_object_signing_alg_values_supported`      |
| RequestParameterSupported                   | `request_parameter_supported`                      |
| RequestUriParameterSupported                | `request_uri_parameter_supported`                  |
| RequireRequestUriRegistration               | `require_request_uri_registration`                 |
| ServiceDocumentation                        | `service_documentation`                            |
| TokenEndpointAuthSigningAlgorithmsSupported | `token_endpoint_auth_signing_alg_values_supported` |
| UILocalesSupported                          | `ui_locales_supported`                             |
| UserInfoEncryptionAlgorithmsSupported       | `userinfo_encryption_alg_values_supported`         |
| UserInfoEncryptionEncValuesSupported        | `userinfo_encryption_enc_values_supported`         |
| UserInfoSigningAlgorithmsSupported          | `userinfo_signing_alg_values_supported`            |
| TlsClientCertificateBoundAccessTokens       | `tls_client_certificate_bound_access_tokens`       |
| AuthorizationResponseIssParameterSupported  | `authorization_response_iss_parameter_supported`   |
| PromptValuesSupported                       | `prompt_values_supported`                          |
| IntrospectionSigningAlgorithmsSupported     | `introspection_signing_alg_values_supported`       |
| IntrospectionEncryptionAlgorithmsSupported  | `introspection_encryption_alg_values_supported`    |
| IntrospectionEncryptionEncValuesSupported   | `introspection_encryption_enc_values_supported`    |

### BackchannelTokenDeliveryModes

| Name | Value  |
|------|--------|
| Poll | `poll` |
| Ping | `ping` |
| Push | `push` |

### Events

| Name              | Value                                                |
|-------------------|------------------------------------------------------|
| BackChannelLogout | `http://schemas.openid.net/event/backchannel-logout` |

### BackChannelLogoutRequest

| Name        | Value          |
|-------------|----------------|
| LogoutToken | `logout_token` |

### StandardScopes

| Name          | Value            | Description                                                                                                                                                |
|---------------|------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------|
| OpenId        | `openid`         | REQUIRED. Indicates the Client is making an OpenID Connect request. The behavior is unspecified if this is not included.                                   |
| Profile       | `profile`        | OPTIONAL. Requests access to End-User's default profile Claims such as `name`, `family_name`, `given_name`, etc.                                           |
| Email         | `email`          | OPTIONAL. Requests access to the `email` and `email_verified` Claims.                                                                                      |
| Address       | `address`        | OPTIONAL. Requests access to the `address` Claim.                                                                                                          |
| Phone         | `phone`          | OPTIONAL. Requests access to `phone_number` and `phone_number_verified` Claims.                                                                            |
| OfflineAccess | `offline_access` | MUST NOT be used with the OpenID Connect Implicit Client Implementer's Guide. Used in accordance with the OpenID Connect Basic Client Implementer's Guide. |

### HttpHeaders

| Name      | Value        |
|-----------|--------------|
| DPoP      | `DPoP`       |
| DPoPNonce | `DPoP-Nonce` |

## JWT Claim Types

The *JwtClaimTypes* class has all standard claim types found in the
OpenID Connect, JWT and OAuth 2.0 specs -many of them are also
aggregated at [IANA](https://www.iana.org/assignments/jwt/jwt.xhtml).

| Claim Type                          | Value                   | Description/Remarks                                                                                                                                                                                                                                                                                   |
|:------------------------------------|:------------------------|:------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Subject                             | `sub`                   | Unique Identifier for the End-User at the Issuer.                                                                                                                                                                                                                                                     |
| Name                                | `name`                  | End-User's full name in displayable form including all name parts, possibly including titles and suffixes, ordered according to the End-User's locale and preferences.                                                                                                                                |
| GivenName                           | `given_name`            | Given name(s) or first name(s) of the End-User. Note that in some cultures, people can have multiple given names; all can be present, with the names being separated by space characters.                                                                                                             |
| FamilyName                          | `family_name`           | Surname(s) or last name(s) of the End-User. Note that in some cultures, people can have multiple family names or no family name; all can be present, with the names being separated by space characters.                                                                                              |
| MiddleName                          | `middle_name`           | Middle name(s) of the End-User. Note that in some cultures, people can have multiple middle names; all can be present, with the names being separated by space characters. Also note that in some cultures, middle names are not used.                                                                |
| NickName                            | `nickname`              | Casual name of the End-User that may or may not be the same as the given_name. For instance, a nickname value of Mike might be returned alongside a given_name value of Michael.                                                                                                                      |
| PreferredUserName                   | `preferred_username`    | Shorthand name by which the End-User wishes to be referred to at the RP, such as janedoe or j.doe. This value MAY be any valid JSON string including special characters. **Remarks:** The relying party MUST NOT rely upon this value being unique, as discussed in the OpenID Connect specification. |
| Profile                             | `profile`               | URL of the End-User's profile page. The contents of this Web page SHOULD be about the End-User.                                                                                                                                                                                                       |
| Picture                             | `picture`               | URL of the End-User's profile picture. This URL MUST refer to an image file (e.g., PNG, JPEG, or GIF image file). **Remarks:** This URL SHOULD specifically reference a profile photo of the End-User rather than an arbitrary photo.                                                                 |
| WebSite                             | `website`               | URL of the End-User's Web page or blog. This Web page SHOULD contain information published by the End-User or an organization related to the End-User.                                                                                                                                                |
| Email                               | `email`                 | End-User's preferred e-mail address. Its value MUST conform to the RFC 5322 syntax. The relying party MUST NOT rely upon this value being unique.                                                                                                                                                     |
| EmailVerified                       | `email_verified`        | `"true"` if the End-User's e-mail address has been verified; otherwise `"false"`. **Remarks:** Verification methods vary depending on trust frameworks or agreements.                                                                                                                                 |
| Gender                              | `gender`                | End-User's gender. Allowed values include `"female"` and `"male"`, with additional values permissible when the predefined ones are not applicable.                                                                                                                                                    |
| BirthDate                           | `birthdate`             | End-User's birthday in ISO 8601 format (e.g., YYYY-MM-DD). The year MAY be `0000`, indicating it is omitted.                                                                                                                                                                                          |
| ZoneInfo                            | `zoneinfo`              | String representing the End-User's time zone, e.g., `Europe/Paris` or `America/Los_Angeles`.                                                                                                                                                                                                          |
| Locale                              | `locale`                | End-User's locale represented as a BCP47 language tag (e.g., `en-US`, `fr-CA`). Compatibility notes suggest some implementations may use underscores instead of dashes.                                                                                                                               |
| PhoneNumber                         | `phone_number`          | End-User's preferred telephone number. E.164 format is recommended, including extensions.                                                                                                                                                                                                             |
| PhoneNumberVerified                 | `phone_number_verified` | `"true"` if the End-User's phone number has been verified; otherwise `"false"`. **Remarks:** Applies to numbers in E.164 format.                                                                                                                                                                      |
| Address                             | `address`               | End-User's preferred postal address. Contains a JSON structure with predefined fields from the OpenID Connect specification.                                                                                                                                                                          |
| Audience                            | `aud`                   | Audience(s) that this ID Token is intended for. It MUST contain the OAuth 2.0 client_id of the Relying Party.                                                                                                                                                                                         |
| Issuer                              | `iss`                   | Issuer Identifier for the Issuer of the response in the form of a URL.                                                                                                                                                                                                                                |
| NotBefore                           | `nbf`                   | The time before which the JWT MUST NOT be accepted, specified in seconds since 1970-01-01T00:00:00Z.                                                                                                                                                                                                  |
| Expiration                          | `exp`                   | The token's expiration time in seconds since 1970-01-01T00:00:00Z.                                                                                                                                                                                                                                    |
| UpdatedAt                           | `updated_at`            | Time of last update for the End-User's information, measured in seconds since 1970-01-01T00:00:00Z.                                                                                                                                                                                                   |
| IssuedAt                            | `iat`                   | Time at which the JWT was issued, specified in seconds since 1970-01-01T00:00:00Z.                                                                                                                                                                                                                    |
| AuthenticationMethod                | `amr`                   | JSON array of strings identifying the authentication method(s) used.                                                                                                                                                                                                                                  |
| SessionId                           | `sid`                   | Session identifier representing an OP session at an RP for a logged-in End-User.                                                                                                                                                                                                                      |
| AuthenticationContextClassReference | `acr`                   | Specifies the Authentication Context Class Reference value satisfied during authentication. **Remarks:** Example: `"level 0"` indicates authentication did not meet ISO/IEC 29115 level 1.                                                                                                            |
| AuthenticationTime                  | `auth_time`             | Time of the End-User's authentication, measured in seconds since 1970-01-01T00:00:00Z.                                                                                                                                                                                                                |
| AuthorizedParty                     | `azp`                   | Authorized party to which the ID Token was issued.                                                                                                                                                                                                                                                    |
| AccessTokenHash                     | `at_hash`               | Access token hash value derived using a specific hash algorithm.                                                                                                                                                                                                                                      |
| AuthorizationCodeHash               | `c_hash`                | Authorization code hash value derived using a specific hash algorithm.                                                                                                                                                                                                                                |
| StateHash                           | `s_hash`                | State hash value derived using a specific hash algorithm.                                                                                                                                                                                                                                             |
| Nonce                               | `nonce`                 | Value used to mitigate replay attacks between a Client session and an ID Token.                                                                                                                                                                                                                       |
| JwtId                               | `jti`                   | A unique identifier for the token to prevent reuse.                                                                                                                                                                                                                                                   |
| Events                              | `events`                | Defines a set of event statements to describe a logical event that has occurred.                                                                                                                                                                                                                      |
| ClientId                            | `client_id`             | OAuth 2.0 Client Identifier valid at the Authorization Server.                                                                                                                                                                                                                                        |
| Scope                               | `scope`                 | OpenID Connect “openid” scope value. Additional scope values can be included.                                                                                                                                                                                                                         |
| Actor                               | `act`                   | Identifies the acting party to whom authority has been delegated.                                                                                                                                                                                                                                     |
| MayAct                              | `may_act`               | Statement asserting that a party is authorized to act on behalf of another party.                                                                                                                                                                                                                     |
| Id                                  | `id`                    | An identifier.                                                                                                                                                                                                                                                                                        |
| IdentityProvider                    | `idp`                   | The identity provider.                                                                                                                                                                                                                                                                                |
| Role                                | `role`                  | The role.                                                                                                                                                                                                                                                                                             |
| Roles                               | `roles`                 | The roles.                                                                                                                                                                                                                                                                                            |
| ReferenceTokenId                    | `reference_token_id`    | Reference token identifier.                                                                                                                                                                                                                                                                           |
| Confirmation                        | `cnf`                   | The confirmation.                                                                                                                                                                                                                                                                                     |
| Algorithm                           | `alg`                   | The algorithm.                                                                                                                                                                                                                                                                                        |
| JsonWebKey                          | `jwk`                   | JSON web key.                                                                                                                                                                                                                                                                                         |
| TokenType                           | `typ`                   | The token type.                                                                                                                                                                                                                                                                                       |
| DPoPHttpMethod                      | `htm`                   | DPoP HTTP method.                                                                                                                                                                                                                                                                                     |
| DPoPHttpUrl                         | `htu`                   | DPoP HTTP URL.                                                                                                                                                                                                                                                                                        |
| DPoPAccessTokenHash                 | `ath`                   | DPoP access token hash.                                                                                                                                                                                                                                                                               |

### JwtTypes

`JwtTypes` is a nested class that provides a set of constants for
confirmation methods. It can be found under the `JwtConstants` class.

| Type                     | Value                     | Description                        |
|:-------------------------|:--------------------------|:-----------------------------------|
| AccessToken              | `at+jwt`                  | OAuth 2.0 access token.            |
| AuthorizationRequest     | `oauth-authz-req+jwt`     | JWT secured authorization request. |
| DPoPProofToken           | `dpop+jwt`                | DPoP proof token.                  |
| IntrospectionJwtResponse | `token-introspection+jwt` | Token introspection JWT response.  |

### ConfirmationMethods

`ConfirmationMethods` is a nested class that provides a set of constants for
confirmation methods. It can be found under the `JwtConstants` class.

| Method               | Value      | Description                                |
|:---------------------|:-----------|:-------------------------------------------|
| JsonWebKey           | `jwk`      | JSON web key.                              |
| JwkThumbprint        | `jkt`      | JSON web key thumbprint.                   |
| X509ThumbprintSha256 | `x5t#S256` | X.509 certificate thumbprint using SHA256. |
