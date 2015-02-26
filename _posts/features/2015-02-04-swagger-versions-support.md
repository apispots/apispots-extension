---
layout: feature
title: Support for both v1.2 and v2.0 Swagger formats
excerpt: "Navigate the full API graph and see how resources are interconnected."
categories: features
tags: [swagger,spec]
image:
  thumb: common/swagger-logo.png
comments: true
share: false
---

# Swagger specification support

**swagger.ed** supports Swagger definitions created with the brand new [**v2.0** format](https://github.com/swagger-api/swagger-spec/blob/master/versions/2.0.md "Swagger v2.0")  but also supports the previous [**v1.2**](https://github.com/swagger-api/swagger-spec/blob/master/versions/1.2.md "Swagger v2.0") format for backwards compatibility.  

## Automatic specification detection

When you navigate with the browser to a URL that contains a valid **JSON** or **YAML** document,  **swagger.ed** checks if it is a valid
Swagger document, first by using the latest v2.0 parser from [**James Messinger**](https://github.com/BigstickCarpet/swagger-parser/blob/master/tests/index.html "Swagger v2.0 parser") and if it fails to parse the document, then tries once more using the v1.2 -> v2.0 converter module from [**Apigee**](https://github.com/apigee-127/swagger-converter "Swagger v1.2 -> v2.0 converter").