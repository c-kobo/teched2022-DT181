# ui5-middleware-cap

The `ui5-middleware-cap` is a UI5 tooling middleware which enables the integration of a CAP server into the UI5 development server via the CAP server express middlewares. The CAP server project just need to be a dependency of the UI5 or Fiori elements project.

> :construction: **Note**
> This is repository is work in progress and not final yet.

## Usage

Add a `devDependency` to the `ui5-middleware-cap`:

```sh
npm add ui5-middleware-cap -D
```

Register the middleware in the `ui5.yaml`:

```yaml
server:
  customMiddleware:
  - name: ui5-middleware-cap
    afterMiddleware: compression
```

That's it!

## How to obtain support

The sample code is provided "as-is".

## License

Copyright (c) 2023 SAP SE or an SAP affiliate company. All rights reserved.
This project is licensed under the Apache Software License, version 2.0 except as noted otherwise in the [LICENSE](LICENSE) file.
