---
title: "Custom Pages"
date: 2020-09-10T08:22:12+02:00
weight: 50
---

In addition to the pages your IdentityServer is expected to provide, you can add any other pages you wish. 
These could be pages needed during login (e.g. registration, password reset), self-service pages to allow the user to manage their profile (e.g. change password, change email), or even more specialized pages for various user workflows (e.g. password expired, or EULA).

These custom pages can be made available to the end user as links from the standard pages in your IdentityServer (i.e. login, consent), they can be rendered to the user during during login page workflows, or they could be displayed 

## Authorize Endpoint Requests and Custom Pages

As requests are made into the authorize endpoint, if a user already has an established authentication session then they will not be presented with a login page at your IdentityServer (as that is the normal expectation for single sign-on).

Duende IdentityServer provides the [authorize interaction response generator]({{<ref "/reference">}}) extensibility point to allow overriding or controlling the response from the authorize endpoint.
