---
title: Duende IdentityModel OIDC Client Samples
description: A collection of sample applications demonstrating how to use IdentityModel.OidcClient with various platforms and UI frameworks.
sidebar:
  label: Samples
  order: 5
redirect_from:
  - /foss/identitymodel.oidcclient/samples/
---

Samples of IdentityModel.OidcClient are available [on
GitHub](https://github.com/IdentityModel/IdentityModel.OidcClient.Samples). Our samples
show how to use a OidcClient with a variety of platforms and UI tools, including:

- [.NET MAUI](https://github.com/IdentityModel/IdentityModel.OidcClient.Samples/tree/main/Maui)
- [WPF with the system browser](https://github.com/IdentityModel/IdentityModel.OidcClient.Samples/tree/main/Wpf)
- [WPF with an embedded browser](https://github.com/IdentityModel/IdentityModel.OidcClient.Samples/tree/main/WpfWebView2)
- [WinForms with an embedded browser](https://github.com/DuendeArchive/IdentityModel.OidcClient.Samples/tree/main/WinFormsWebView2)
- [Cross Platform Console Applications](https://github.com/IdentityModel/IdentityModel.OidcClient.Samples/tree/main/NetCoreConsoleClient) (relies on kestrel for processing the callback)
- [Windows Console Applications](https://github.com/IdentityModel/IdentityModel.OidcClient.Samples/tree/main/HttpSysConsoleClient) (relies on an HttpListener - a wrapper around the windows HTTP.sys driver)
- [Windows Console Applications using custom uri schemes](https://github.com/IdentityModel/IdentityModel.OidcClient.Samples/tree/main/WindowsConsoleSystemBrowser)

All samples use a [demo instance of Duende IdentityServer](https://demo.duendesoftware.com)
as their OIDC Provider. You can see its [source code on GitHub](https://github.com/DuendeSoftware/demo.duendesoftware.com).

You can log in with *alice/alice* or *bob/bob*

## Additional samples

* [Unity3D](https://github.com/peterhorsley/Unity3D.Authentication.Example)

## No Longer Maintained

These samples are no longer maintained because their underlying technology is no
longer supported.

- [UWP](https://github.com/IdentityModel/IdentityModel.OidcClient.Samples/tree/archived/uwp/Uwp)
- [Xamarin](https://github.com/IdentityModel/IdentityModel.OidcClient.Samples/tree/archived/xamarin/XamarinAndroidClient)
- [Xamarin Forms](https://github.com/IdentityModel/IdentityModel.OidcClient.Samples/tree/archived/xamarin/XamarinForms)
- [Xamarin iOS - AuthenticationServices](https://github.com/IdentityModel/IdentityModel.OidcClient.Samples/tree/archived/xamarin/iOS_AuthenticationServices)
- [Xamarin iOS - SafariServices](https://github.com/IdentityModel/IdentityModel.OidcClient.Samples/tree/archived/xamarin/iOS_SafariServices)