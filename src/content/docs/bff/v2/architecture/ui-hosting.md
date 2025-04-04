---
title: "UI Hosting"
order: 2
---

## Hosting Options for the UI
There are several options for hosting the UI assets when using a BFF.

- Host the assets within the BFF host using the static file middleware
- Host the assets within the BFF host using the Microsoft SPA Templates
- Host the UI and BFF separately on subdomains of the same site and use CORS to allow cross-origin requests
- Serves the index page of the UI from the BFF host, and all other assets are loaded from another domain, such as a CDN

#### Static File Middleware
Hosting the UI together with the BFF is the simplest choice, as requests from the front end to the backend will automatically include the authentication cookie and not require CORS headers. If you create a BFF host using our templates, the UI will be hosted in this way:

```sh
dotnet new bffremoteapi

# or

dotnet new bfflocalapi
```

#### Host UI in the BFF using Microsoft Templates
Many frontend applications require a build process, which complicates the use of the static file middleware at development time. Visual Studio includes SPA templates that start up a SPA and proxy requests to it during development. Samples of Duende.BFF that take this approach using [React](/bff/v2/samples#reactjs-frontend) and [Angular](/bff/v2/samples#angular-frontend) are available. 

Microsoft's templates are easy-to-use at dev time from Visual Studio. They allow you to simply run the solution, and the template proxies requests to the front end for you. At deploy time, that proxy is removed and the static assets of the site are served by the static file middleware.


#### Host the UI separately
You may want to host the UI outside the BFF. At development time, UI developers might prefer to run the frontend outside of Visual Studio (e.g., using the node cli). You might also want to have separate deployments of the frontend and the BFF, and you might want your static UI assets hosted on a CDN. If that is your preference, there are a couple of options for hosting the frontend outside the C# project.

First, you can host the BFF and SPA entirely separately, and use CORS to make requests from the frontend to the backend. In order to include the auth cookie in those requests, the frontend code will have to [declare that it should send credentials](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#sending_a_request_with_credentials_included) using the *credentials: "include"* option.  You'll also need to ensure that the two components are hosted on subdomains of the same domain so that [third party cookie blocking](/bff/v2/architecture/third-party-cookies) doesn't prevent the frontend from including cookies in its requests to the BFF host.  

A sample of this approach is [available](/bff/v2/samples#separate-host-for-ui).

#### Serve the index page from the BFF host
Secondly, you could serve the index page of the SPA from the BFF, but have all the other static assets hosted on another host (presumably a CDN). This technique makes the UI and BFF have exactly the same origin, so the authentication cookie will be sent from the frontend to the BFF automatically, and third party cookie blocking and the SameSite cookie attribute won't present any problems.

Setting this up for local development takes a bit of effort, however. As you make changes to the frontend, the UI's build process might generate a change to the index page. If it does, you'll need to arrange for the index page being served by the BFF host to reflect that change.

Additionally, the front end will need to be configurable so that it is able to load its assets from other hosts. The mechanism for doing so will vary depending on the technology used to build the frontend. For instance, Angular includes a number of [deployment options](https://angular.io/guide/deployment) that allow you to control where it expects to find assets.

The added complexity of this technique is justified when there is a requirement to host the front end on a different site (typically a CDN) from the BFF.