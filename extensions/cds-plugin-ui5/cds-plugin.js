const path = require('path');
const fs = require("fs");
const yaml = require("js-yaml");

const cds = require('@sap/cds');
const setupUI5Server = require("./lib/setupUI5Server");

// marker that the cds-plugin-ui5 plugin is running
// to disable the ui5-middleware-cap if used in apps
process.env["cds-plugin-ui5"] = true;

cds.on('bootstrap', async (app) => {
    console.log("[cds-ui5-plugin] bootstrap");

    // prepare the _app_links to add links dynamically
    const links = app._app_links = app._app_links || [];

    // lookup the app folder
    const appDirs = [];
    appDirs.push(...fs.readdirSync(path.join(process.cwd(), "app"), { withFileTypes: true }).
        filter(f => f.isDirectory() && fs.existsSync(path.join(process.cwd(), "app", f.name, "ui5.yaml"))).
        map(f => path.join(process.cwd(), "app", f.name)));

    // lookup the UI5 dependencies
    const pkgJson = require(path.join(process.cwd(), "package.json"));
    const deps = [];
    deps.push(...Object.keys(pkgJson.dependencies || {}));
    deps.push(...Object.keys(pkgJson.devDependencies || {}));
    //deps.push(...Object.keys(pkgJson.peerDependencies || {}));
    //deps.push(...Object.keys(pkgJson.optionalDependencies || {}));
    appDirs.push(...deps.filter(dep => {
        try {
            require.resolve(`${dep}/ui5.yaml`, {
                paths: [process.cwd()]
            });
            return true;
        } catch(e) {
            return false;
        }
    }));

    // if apps are available, attach the middlewares of the UI5 apps
    // to the express of the CAP server via a express router
    if (appDirs) {
        for await (const appDir of appDirs) {
            // read the ui5.yaml file to extract the configuration
            const ui5YamlPath = require.resolve(path.join(appDir, "ui5.yaml"), {
                paths: [ process.cwd() ]
            });
            let ui5Configs;
            try {
                const content = fs.readFileSync(ui5YamlPath, "utf-8");
                ui5Configs = yaml.loadAll(content);
            } catch (err) {
                if (err.name === "YAMLException") {
                    log.error(`Failed to read ${ui5YamlPath}!`);
                }
                throw err;
            }

            // by default the mount path is derived from the metadata/name
            // and can be overridden by customConfiguration/mountPath
            const ui5Config = ui5Configs?.[0];
            let mountPath = ui5Config?.customConfiguration?.mountPath || ui5Config?.metadata?.name;
            if (!/^\//.test(mountPath)) {
                mountPath = `/${mountPath}`; // always start with /
            }

            // Mounting the Router for the application to the CAP server
            console.log(`Mounting ${mountPath} to UI5 app ${appDir}`);
            const modulePath = path.dirname(ui5YamlPath);
            const router = await setupUI5Server({
                basePath: modulePath,
                configPath: modulePath,
                contextPath: mountPath,
                links
            });
            app.use(`${mountPath}`, router);
        }
    }
});

// mount static resources and common middlewares...
module.exports = {
    activate: function activate(conf) {
        console.log("[cds-ui5-plugin] activate", conf); 
    }  
};