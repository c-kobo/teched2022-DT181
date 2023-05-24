const path = require("path");

const setupCAPServer = require("./setupCAPServer");

/**
 * Custom UI5 Server middleware for CAP
 *
 * @param {object} parameters Parameters
 * @param {@ui5/logger/Logger} parameters.log Logger instance for use in the custom middleware
 * @param {object} parameters.resources Resource collections
 * @param {module:@ui5/fs.AbstractReader} parameters.resources.all Reader or Collection to read resources of the
 *                                        root project and its dependencies
 * @param {module:@ui5/fs.AbstractReader} parameters.resources.rootProject Reader or Collection to read resources of
 *                                        the project the server is started in
 * @param {module:@ui5/fs.AbstractReader} parameters.resources.dependencies Reader or Collection to read resources of
 *                                        the projects dependencies
 * @param {object} parameters.options Options
 * @param {string} [parameters.options.configuration] Custom server middleware configuration if given in ui5.yaml
 * @param {object} parameters.middlewareUtil Specification version dependent interface to a
 *                                        [MiddlewareUtil]{@link module:@ui5/server.middleware.MiddlewareUtil} instance
 * @returns {Function} Middleware function to use
 */
module.exports = async ({ log, resources, options, middlewareUtil }) => {

	// do not run the middleware in teh context of the cds-plugin-ui5
	// to avoid cyclic requests between the express middlewares
	if (process.env["cds-plugin-ui5"]) {
		log.info("Skipping middleware as CAP server started the UI5 application!");
		return async function(req, res, next) { /* dummy middleware function */ next(); };
	}

	// determine the server module id from dependencies if not provided
	const config = options?.configuration || {};
	if (!config.moduleId) {
		// lookup the CAP server from dependencies
		const pkgJson = require(path.join(process.cwd(), "package.json"));
		const deps = [];
		deps.push(...Object.keys(pkgJson.dependencies || {}));
		deps.push(...Object.keys(pkgJson.devDependencies || {}));
		//deps.push(...Object.keys(pkgJson.peerDependencies || {}));
		//deps.push(...Object.keys(pkgJson.optionalDependencies || {}));
		const serverDirs = deps.filter(dep => {
			// either a cds section is in the package.json
			// or the .cdsrc.json exists in the module dir
			try {
				const pkgJson = require(`${dep}/package.json`, {
					paths: [process.cwd()]
				});
				if (!pkgJson.cds) {
					require.resolve(`${dep}/.cdsrc.json`, {
						paths: [process.cwd()]
					});
				}
				return true;
			} catch(e) {
				return false;
			}
		});
		if (serverDirs.length === 1) {
			config.moduleId = serverDirs[0];
		}
	}

	// lookup the server root
	let serverRoot;
	try {
		serverRoot = path.dirname(require.resolve(config.moduleId + "/package.json", {
			paths: [process.cwd()]
		}));
	} catch(e) {
		log.warn(`Skipping middleware as server with moduleId "${config.moduleId}" cannot be found!`);
	}

	// only run if the server root was found!
	if (serverRoot) {

		// setup the CAP server
		const router = await setupCAPServer({
			root: serverRoot
		});

		// attach the router to the UI5 server
		return router;
	
	}

	return async function(req, res, next) { /* dummy middleware function */ next(); };

}
