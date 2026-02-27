---
title: "BFF Diagnostics Endpoint"
description: Learn about the BFF diagnostics endpoint that provides access to user and client access tokens for development testing purposes.
date: 2022-12-29T10:22:12+02:00
sidebar:
  label: "Diagnostics"
  order: 40
redirect_from:
  - /bff/v2/session/management/diagnostics/
  - /bff/v3/fundamentals/session/management/diagnostics/
  - /identityserver/v5/bff/session/management/diagnostics/
  - /identityserver/v6/bff/session/management/diagnostics/
  - /identityserver/v7/bff/session/management/diagnostics/
---

:::note
This endpoint is only enabled in *Development* mode.
:::

The `/bff/diagnostics` endpoint returns the current user and client access token for testing purposes. The endpoint tries to retrieve and show current tokens. It may invoke both a refresh token flow for the user access token and a client credential flow for the client access token.

To use the diagnostics endpoint, make a `GET` request to `/bff/diagnostics`. Typically, this is done in a browser to diagnose a problem during development.


