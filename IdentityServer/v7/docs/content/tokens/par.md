---
title: "Pushed Authorization Requests"
weight: 175
---

(Added in 7.0)

Pushed Authorization Requests (PAR) is a relatively new [OAuth standard](https://datatracker.ietf.org/doc/html/rfc9126) that improves the security of OAuth and OIDC flows by moving authorization parameters from the front channel to the back channel (that is, from redirect URLs in the browser to direct machine to machine http calls on the back end).

This prevents an attacker in the browser from 
- seeing authorization parameters (which could leak PII) and from 
- tampering with those parameters (e.g., the attacker could change the scope of access being requested). 
 
Pushing the authorization parameters also keeps request URLs short. Authorize parameters might get very long when using more complex OAuth and OIDC features, and URLs that are long cause issues in many browsers and networking infrastructure.

The use of PAR is encouraged by the [FAPI working group](https://openid.net/wg/fapi/) within the OpenID Foundation. For example, [the FAPI2.0 Security Profile](https://openid.bitbucket.io/fapi/fapi-2_0-security-profile.html) requires the use of PAR. This security profile is used by many of the groups working on open banking (primarily in Europe), in health care, and in other industries with high security requirements.

Duende.IdentityServer includes support for PAR in the Business Edition or higher license.

## Configuration
- *IdentityServerOptions* now includes the *PushedAuthorization* property to configure PAR.
  - *PushedAuthorizationOptions.Required* causes par to be required globally. This defaults to *false*. 
  - *PushedAuthorizationOptions.Lifetime* controls the lifetime of pushed authorization requests. The pushed authorization request's lifetime begins when the request to the PAR endpoint is received, and is validated until the authorize endpoint returns a response to the client application. Note that user interaction, such as entering credentials or granting consent, may need to occur before the authorize endpoint can do so. Setting the lifetime too low will likely cause login failures for interactive users, if pushed authorization requests expire before those users complete authentication. Some security profiles, such as the FAPI 2.0 Security Profile recommend an expiration within 10 minutes to prevent attackers from pre-generating requests. To balance these constraints, this lifetime defaults to 10 minutes. 
  - *PushedAuthorizationOptions.AllowUnregisteredPushedRedirectUris* controls whether clients may use redirect uris that were not previously registered. This is a relaxation of security guidance that is specifically allowed by the PAR specification because the pushed authorization requests are authenticated. It defaults to *false*.
- The *Client* configuration object now includes two new properties to configure PAR on a per-client basis.
  - *Client.RequirePushedAuthorization* controls if this client requires PAR. PAR is required if either the global configuration is enabled or if the client's flag is enabled (this can't be used to opt out of the global configuration). This defaults to *false*, which means the global configuration will be used.
  - *Client.PushedAuthorizationLifetime* controls the lifetime of pushed authorization requests for a client. If this lifetime is set, it takes precedence over the global configuration. This defaults to *null*, which means the global configuration is used.
- The *EndpointOptions* now includes a new flag to enable or disable the PAR endpoint: *EnablePushedAuthorizationEndpoint*, which defaults to *true*.
