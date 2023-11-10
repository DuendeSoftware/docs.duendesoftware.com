+++
title = "Data Stores and Persistence"
weight = 80
chapter = true
+++

# Data Stores and Persistence

Duende IdentityServer is backed by two kinds of data:
* [Configuration Data]({{<ref "./configuration">}})
* [Operational Data]({{<ref "./operational">}})

Data access is abstracted by store interfaces that are registered in the DI system. 
These store interfaces allow IdentityServer to access the data it needs at runtime when processing requests. 
You can implement these interfaces yourself and thus can use any database you wish.
If you prefer a relational database for this data, then we provide [EntityFramework Core]({{<ref "./ef">}}) implementations.


{{% notice note %}}
Given that data stores abstract the details of the data stored, strictly speaking, IdentityServer does not know or understand where the data is actually being stored.
As such, there is no built-in administrative tool to populate or manage this data.
There are third-party options (both commercial and FOSS) that provide an administrative UI for managing the data when using the EntityFramework Core implementations.
{{% /notice %}}
