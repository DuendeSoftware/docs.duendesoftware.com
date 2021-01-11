+++
title = "Logout"
weight = 10
chapter = true
+++

# Logout Page

The logout page is responsible for terminating the user's authentication session.
This is an involved process and involves these steps:
* Ending the session by removing the authentication session cookie in your IdentityServer.
* Possibly triggering sign-out in an external provider if an external login was used.
* Notify all client applications that the user has signed out.
* If the logout is client initiated, redirect the user back to the client.

