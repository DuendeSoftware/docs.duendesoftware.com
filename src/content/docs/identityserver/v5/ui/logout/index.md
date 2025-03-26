---
title: Logout
sidebar:
  order: 10
---


# Logout Page

The logout page is responsible for terminating the user's authentication session.
This is a potentially complicated process and involves these steps:
* Ending the session by removing the authentication session cookie in your IdentityServer.
* Possibly triggering sign-out in an external provider if an external login was used.
* Notify all client applications that the user has signed out.
* If the logout is client initiated, redirect the user back to the client.

