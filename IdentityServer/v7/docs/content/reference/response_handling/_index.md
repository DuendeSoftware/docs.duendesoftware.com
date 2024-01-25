+++
title = "Response Generators"
weight = 55
chapter = true
+++

# Response Generators

IdentityServer's endpoints follow a pattern of abstraction in which a response generator uses a validated input model to produce a response model. The response model is a type that represents the data that will be returned from the endpoint. The response model is then wrapped in Result model, which is a type that facilitates serialization by an implementation of *IHttpResponseWriter*.

Customization of protocol endpoint responses is possible in both the response generators and response writers.
Response generator customizations are appropriate when you want to change the "business logic" of the endpoint and is typically accomplished by overriding virtual methods in the default response generator. Response writer customizations are appropriate when you want to change the serialization, encoding, or headers of the HTTP response and is accomplished by registering a custom implementation of the *IHttpResponseWriter*.

{{%children style="h4" /%}}

