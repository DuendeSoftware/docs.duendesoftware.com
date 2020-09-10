---
title: "Interactive Applications with ASP.NET Core"
date: 2020-09-10T08:22:12+02:00
---

The following steps are here to help you initialize your new website. If you don't know Hugo at all, we strongly suggest you learn more about it by following this [great documentation for beginners](https://gohugo.io/overview/quickstart/).

## Create your project

Hugo provides a `new` command to create a new website.

```
md quickstart
cd quickstart

md src
cd src

dotnet new is4empty -n IdentityServer
```

## Adding code

and add the following code:

```csharp
public static class Config
{
    public static IEnumerable<ApiScope> ApiScopes =>
        new List<ApiScope>
        {
            new ApiScope("api1", "My API")
        };
}
```

done!