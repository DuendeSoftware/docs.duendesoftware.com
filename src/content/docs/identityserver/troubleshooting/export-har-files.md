---
title: "Export HAR Files for Analyzing Client-Side Interactions"
description: Documentation for creating HAR files, and how they can be used for client-side diagnostics.
date: 2026-01-28T08:03:00+02:00
sidebar:
  label: "Export HAR Files"
  order: 16
---

[HTTP Archive (HAR)](https://en.wikipedia.org/wiki/HAR_(file_format)) files are logs of network interactions made by a web browser. They contain headers, request bodies, response payloads, and even sensitive information like cookie values sent and received for each interaction.

:::caution[Do not share sensitive information]
Before sharing any HAR files that contain sensitive values for diagnosing, you can sanitize that data by following the [steps below](#sanitize-a-har-file).
:::

## HAR File Considerations

* Consider using an **incognito window** of your browser. If you do, close all browser incognito instances you may have open and then open a new one before creating the HAR file to ensure the cache is cleared.
* Preserve the log across page navigations
  * If you are navigating to different pages (ex: logging in to a site with OAuth redirects), then any network calls made before the last redirect will be lost. Preserving the logs across page navigations aids in diagnosing issues. The below steps include instructions to preserve network logs while navigating across multiple pages.
* Generate HAR files with sensitive data
  * It is helpful to know that certain fields are have been set, but not necessarily the actual value. Some browsers will exclude sensitive data in HAR file exports by default. The below steps include instructions to enable sensitive data in HAR file exports for browsers that do not include it by default.

## Generating a HAR file

Generating a HAR file involves steps using your web browser and its associated developer tools. The browser-specific steps outlined below are all similar to each other. Other browsers will have similar steps.

### Google Chrome

1. Open the browser dev tools <https://developer.chrome.com/docs/devtools/open>.
1. In the dev tools, click on the Settings icon. Under the Network category, enable "Allow to generate HAR with sensitive data".
1. In the dev tools, navigate to the Network tab and enable the "Preserve log" checkbox.
1. In the browser, visit the page(s) and perform the steps that trigger the issue.
1. In the Network tab of the dev tools, click the down arrow and select the "Export HAR (with sensitive data)..." option to export the HAR file and save it locally.

### Safari

1. Enable the Web Inspector, and open it <https://developer.apple.com/documentation/safari-developer-tools/enabling-developer-features>.
1. In the Web Inspector in the Developer menu, navigate to the Network tab. Click the "Filter" button and enable "Preserve Log".
1. In the browser, visit the page(s) and perform the steps that trigger the issue.
1. In the Web Inspector, click "Export" to export the HAR file and save it locally.

### Firefox

1. Open the browser dev tools <https://firefox-source-docs.mozilla.org/devtools-user>.
1. In the dev tools, navigate to the Network tab, click the Network Settings icon, and enable "Persist Logs".
1. In the browser, visit the page(s) and perform the steps that trigger the issue.
1. In the Network tab of the dev tools, click the Network Settings icon, and select "Save All As Har" to save it locally.

### Microsoft Edge

1. Open the browser dev tools <https://learn.microsoft.com/en-us/microsoft-edge/devtools/overview>.
1. In the dev tools, click on the ellipsis icon, then select "Settings". Under the Network category, enable "Allow to generate HAR with sensitive data".
1. In the dev tools, navigate to the Network tab and enable the "Preserve log" checkbox.
1. In the browser, visit the page(s) and perform the steps that trigger the issue.
1. In the Network tab of the dev tools, click the down arrow and select the "Export HAR (with sensitive data)..." option to export the HAR file and save it locally.

## Sanitize a HAR file

Before sharing your HAR file with anyone, you should remove any sensitive data. You can do this manually by opening the HAR file with any JSON text editor and removing the sensitive data. We recommend replacing the data with a placeholder rather than deleting the entry. When diagnosing issues, it's helpful to know whether a field was set.

## Practice

If you would like to practice with a small sample, you can login to the Duende Demo Server and generate a HAR file from those interactions.

1. In your browser, navigate to <https://demo.duendesoftware.com/Account/Login>.
1. With your browser and dev tools open, the log being preserved, and the ability to export a HAR file with sensitive data, login to the site using one of the built-in users.
1. Export the HAR file with sensitive data.
1. Explore the HAR file JSON with a text editor.
