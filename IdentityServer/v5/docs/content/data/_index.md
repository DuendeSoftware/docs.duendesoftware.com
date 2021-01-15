+++
title = "Data Stores and Persistence"
weight = 80
chapter = true
+++

# Data Stores and Persistence

Duende IdentityServer is backed by two kinds of data:
* [Configuration Data]({{<ref "./configuration">}})
* [Operational Data]({{<ref "./operational">}})

This data is accessed dynamically at runtime using services in DI system that model the storage of this data.
You can implement these interfaces yourself and thus can use any database you wish.
If you prefer a relational database for this data, then we provide [EntityFramework Core]({{<ref "./ef">}}) implementations.
