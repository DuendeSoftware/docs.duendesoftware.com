---
title: "UI Hosting"
description: A guide exploring different UI hosting strategies and their benefits when using Backend For Frontend (BFF) systems
sidebar:
  order: 2
redirect_from:
  - /bff/v2/architecture/ui-hosting/
  - /bff/v3/architecture/ui-hosting/
  - /identityserver/v5/bff/architecture/ui-hosting/
  - /identityserver/v6/bff/architecture/ui-hosting/
  - /identityserver/v7/bff/architecture/ui-hosting/
---

When building modern web applications, selecting the right hosting strategy for your UI assets is crucial for optimizing
performance, simplifying deployment, and ensuring seamless integration with Backend For Frontend (BFF) systems. This
guide explores various hosting approaches and their benefits.

## Hosting Options for the UI

There are several options for hosting the UI assets when using a BFF.

- Host the assets within the BFF host using the static file middleware
- Host the UI and BFF separately on subdomains of the same site and use CORS to allow cross-origin requests
- Serves the index page of the UI from the BFF host, and all other assets are loaded from another domain, such as a CDN

### Serving SPA assets from BFF host

Hosting the UI together with the BFF is the simplest choice, as requests from the front end to the backend will
automatically include the authentication cookie and not require CORS
headers. This makes the BFF and the front-end application a single deployable unit. Below shows a graphical overview of
what that would look like:

![Hosting BFF UI from the UI](../images/bff_ui_hosting_loc.svg)

If you create a BFF host using our templates, the UI will be hosted in this way:

```bash title="Terminal"
dotnet new bffremoteapi

# or

dotnet new bfflocalapi
```

Many frontend applications require a build process, which complicates the use of the static file middleware at
development time. Visual Studio includes SPA templates that start up a SPA and proxy requests to it during development.
Samples of Duende.BFF that take this approach using [React](/bff/samples#reactjs-frontend)
and [Angular](/bff/samples#angular-frontend) are available.

Microsoft's templates are easy-to-use at dev time from Visual Studio. They allow you to run the solution, and the
template proxies requests to the front end for you. At deploy time, that proxy is removed and the static assets of the
site are served by the static file middleware.

### Host The UI Separately

You may want to host the UI outside the BFF. At development time, UI developers might prefer to run the frontend
outside of Visual Studio (e.g., using the node cli). You might also want to have separate deployments of the frontend
and the BFF, and you might want your static UI assets hosted on a CDN. Below is a schematic overview of what that would
look like:

![Hosting BFF UI on CDN](../images/bff_ui_hosting_cdn.svg)

The browser accesses the application via the BFF. The BFF proxies the calls to index.html to the CDN. The browser can
then download all static assets from the CDN, but then use the BFF (and it’s API’s and user management API’s) secured by
the authentication cookie as normal.

Effectively, this turns your front-end and BFF Host into two separately deployable units. You'll need to ensure that the
two components are hosted on subdomains of the same domain so
that [third party cookie blocking](/bff/architecture/third-party-cookies) doesn't prevent the frontend from including
cookies in its requests to the BFF host.

In order for this architecture to work, the following things are needed:

* To make sure that client side routing works, there should be a catch-all route configured that proxies calls to the
  index.html. Once the index.html is served, the front-end will take over the application specific routing.
* The API’s hosted by the BFF and the applications API’s should be excluded from this catch-all routing. However, they
  should not be visited by the browser directly.
* The CDN needs to be configured to allow CORS requests from the application’s origin.

* In order to include the auth cookie in those requests, the frontend code will have
  to [declare that it should send credentials](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#sending_a_request_with_credentials_included)
  using the *credentials: "include"* option.

A sample of this approach is [available](/bff/samples#separate-host-for-ui).

### Serve The Index Page From The BFF Host

Lastly, you could serve the index page of the SPA from the BFF, but have all the other static assets hosted on
another host (presumably a CDN). This technique makes the UI and BFF have exactly the same origin, so the authentication
cookie will be sent from the frontend to the BFF automatically, and third party cookie blocking and the SameSite cookie
attribute won't present any problems. The following diagram shows how that would work:

![BFF Proxies the Index html from CDN](../images/bff_ui_hosting_proxy_index.svg)

Setting this up for local development takes a bit of effort, however. As you make changes to the frontend, the UI's build
process might generate a change to the index page. If it does, you'll need to arrange for the index page being served by
the BFF host to reflect that change.

Additionally, the front end will need to be configurable so that it is able to load its assets from other hosts. The
mechanism for doing so will vary depending on the technology used to build the frontend. For instance, Angular includes
a number of [deployment options](https://angular.io/guide/deployment) that allow you to control where it expects to find
assets.

The added complexity of this technique is justified when there is a requirement to host the front end on a different
site (typically a CDN) from the BFF.

:::note
BFF V4 has built-in support for proxying the index.html from a CDN. 
:::