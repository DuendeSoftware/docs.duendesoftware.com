---
title: "BFF Diagnostics Endpoint"
menuTitle: "Diagnostics"
date: 2022-12-29T10:22:12+02:00
order: 40
---

The */bff/diagnostics* endpoint returns the current user and client access token for testing purposes. The endpoint tries to retrieve and show current tokens. It may invoke both a refresh token flow for the user access token and a client credential flow for the client access token.

To use the diagnostics endpoint, make a GET request to */bff/diagnostics*. Typically this is done in a browser to diagnose a problem during development.

:::note
This endpoint is only enabled in *Development* mode.
:::
