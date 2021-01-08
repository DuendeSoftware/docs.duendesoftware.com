---
title: "Users and Logging In"
date: 2020-09-10T08:22:12+02:00
weight: 40
---

One of the main goals of building a single sign-on (SSO) server is to allow users to login.
The standard mechanism to allow those users to login is for the client application to use a web browser.
This is obvious is the client is already a web application, but it's also the recommended practice for native and mobile applications.

When a user must login, the client application will redirect the user to the protocol endpoint in the SSO server to request authentication.
This protocol endpoint is called the [authorization endpoint]({{< ref "/reference/endpoints/authorize" >}}) and expects requests to be made from a browser with an interactive user.
As part of the authorize request, the SSO server will typically display a login page for the user to enter their credentials.
Once the user has authenticated, the SSO server will redirect the user back to the application with the protocol response.

{{% notice note %}}
The design of Duende IdentityServer allows you to build any custom UI workflow needed to satisfy your requirements for users.
This means you have the ability to customize any UI workflow (registration, login, password reset, etc.), support any credential type (password, MFA, etc.), use any user credentials system or database (greenfield or legacy), and/or use federated logins from any provider (social or enterprise).
You have the ability to control the entire user experience while Duende IdentityServer provides the implementation of the security protocol (OpenID Connect and OAuth).
{{% /notice %}}

This diagram shows the relationship of your custom UI pages and the IdentityServer middleware in your IdentityServer host application:

![](../../overview/images/middleware.png?height=500px)

## Login Workflow

When your IdentityServer receives an authorize request, it will inspect it for a current authentication session for a user. This authentication session is based on ASP.NET Core's authentication system and is ultimately determined by a cookie issued from your login page.

If the user has never logged in there will be no cookie, and then the request to the authorize endpoint will result in a redirect to your login page. This is where your custom workflow takes over to get the user logged in.

![](../../authentication/images/signin_flow.png?height=500px)

Once the login page has finished logging in the user with the ASP.NET Core authentication system, it will redirect the user back to the authorize endpoint.
This time the request to the authorize endpoint will have an authenticated session for the user, and it can then create the protocol response and redirect to the client application.

This design of redirecting the user from the protocol endpoint to custom pages in your IdentityServer is what allows you ultimate flexibility and control over the user workflow and experience.

## More details and other UI pages

In addition to the login page, there are other pages that Duende IdentityServer expects (e.g. logout, error, consent), and you could implement custom pages (e.g. register, forgot password, etc.) as well. 

Additionally, during any of the user workflows your code might need to use information about the original authorize request to perform logic to customize the user experience.

There are more details about building the login page, and coverage of these additional topics in the 
[Users and User Interaction]({{< ref "/authentication" >}}) 
section of this documentation.
