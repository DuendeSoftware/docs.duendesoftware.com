---
title: "Windows Authentication"
order: 22
newContentUrl: "https://docs.duendesoftware.com/identityserver/v7/samples/"
---

This solution contains samples when using [Windows Authentication](../ui/login/windows).

### IIS Hosting
This sample shows how to use Windows Authentication when hosting your IdentityServer behind IIS (or IIS Express).
The salient piece to understand is a new *LoginWithWindows* action method in the *AccountController* from the quickstarts.
Windows authentication is triggered, and once the result is determined the main authentication session cookie is created based on the *WindowsIdentity* results.
Also, note there is some configuration in *Startup* with a call to *Configure\<IISOptions>* (mainly to set *AutomaticAuthentication* to *false*).

[link to source code](https://github.com/DuendeSoftware/Samples/tree/main/IdentityServer/v5/WindowsAuthentication/IIS)
