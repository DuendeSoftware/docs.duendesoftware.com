---
title: Deployment
date: 2020-09-10T08:20:20+02:00
sidebar:
  order: 100
---


Because IdentityServer is made up of middleware and services that you use within an ASP.NET Core application, it can be hosted and deployed with the same diversity of technology as any other ASP.NET Core application. You have the choice about 
- where to host your IdentityServer (on-prem or in the cloud, and if in the cloud, which one?)
- which web server to use (IIS, Kestrel, Nginx, Apache, etc)
- how you'll scale and load-balance the deployment
- what kind of deployment artifacts you'll publish (files in a folder, containers, etc)
- how you'll manage the environment (a managed app service in the cloud, a Kubernetes cluster, etc)

While this is a lot of decisions to make, this also means that your IdentityServer implementation can be built, deployed, hosted, and managed with the same technology that you're using for any other ASP.NET applications that you have.

Microsoft publishes extensive [advice and documentation](https://docs.microsoft.com/en-us/aspnet/core/host-and-deploy/) about deploying ASP.NET Core applications, and it is applicable to IdentityServer implementations. We're not attempting to replace that documentation - or the documentation for other tools that you might be using in your environment. Rather, this section of our documentation focuses on IdentityServer-specific deployment and hosting considerations. 

:::note
Our experience has been that these topics are very important. Some of our most common support requests are related to [Data Protection](data_protection) and [Load Balancing](proxies), so we strongly encourage you to review those pages, along with the rest of this chapter before deploying IdentityServer to production.
:::

TODO LIST CHILDREN HERE