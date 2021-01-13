+++
title = "Login"
weight = 10
chapter = true
+++

# Login Page

The login page is responsible for establishing the user's authentication session.
This requires a user to present credentials and typically involves these steps:
* Provide the user with a page to allow them to enter credentials locally, use an external login provider, or use some other means of authenticating.
* Start the session by creating the authentication session cookie in your IdentityServer.
* If the login is client initiated, redirect the user back to the client.




