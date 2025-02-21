# https://docs.duendesoftware.com

## Getting Started

You will need [**Hugo 0.140.2**](https://gohugo.io/) installed on your operating system and in the PATH. 

See the [official Hugo documentation](https://gohugo.io/installation/) for OS-specific instructions.

## Running the Documentation Site(s)

You can use `npm run` to run the documentation site locally:

* `npm run v7` - http://localhost:1313/identityserver/v7/
* `npm run v6` - http://localhost:1313/identityserver/v6/
* `npm run foss` - http://localhost:1313/foss/

## Making a page redirect to somewhere else

There are two ways to restructure content:
* Internal (move content around in the current structure)
* External (move content outside the current structure)

### Internal restructuring

When doing internal restructuring, move the page to its new location and then update its frontmatter
to include the old location:

```yaml
---
title: Page title
aliases:
  - "/old-path-to/content"
---

Page content goes here
```

This will generate the page at the new location, and put a redirect to it at the old location.

Note that the alias should not include the docs site prefix. To redirect `/identityserver/v7/example`,
use `/example` as the alias.

### External restructuring

When moving a page outside the structure, or you need a redirect to another location altogether,
you can keep the old page but replace its contents with just frontmatter - changing its type to `redirect`
and setting the redirect `target`:

```yaml
---
type: redirect
target: https://duckduckgo.com
---
```

This will remove the old page from the navigation structure, but keeps the URL around
with a redirect to the new location.