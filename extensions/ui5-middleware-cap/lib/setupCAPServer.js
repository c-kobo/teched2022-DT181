const path = require("path");
const fs = require("fs");

const { Router } = require("express");

// inspired by https://cap.cloud.sap/docs/node.js/cds-serve
module.exports = async function setupCAPServer(options) {
	options = Object.assign({
		in_memory: true,
		from: "*",
		service: "all"
	}, options)

	// change dir for cds bootstrap
	const cwd = process.cwd();
	process.chdir(options.root);

	// require the CAP server module
	const cds = require("@sap/cds", {
		paths: [options.root]
	});

	// load the package.json for additional metadata
	const pkgJson = require(path.join(options.root, "package.json"), {
		paths: [options.root]
	});

	// rebuild the same logic as in @sap/cds/bin/server.js:
	//   * load custom server if exists (to attach hooks)
	//   * find and register plugins (for extensions)
	//   ==> ASK: helper to start the server with all configs
	let serverModuleId = "@sap/cds";
	if (fs.existsSync(path.join(options.root, "server.js"))) {
		require(path.join(options.root, "server.js"), {
			paths: [options.root]
		});
	}
	// here we by intention only use the dependencies and not the
	// devDependencies as we want to simulate the later runtime
	const plugins = Object.keys(pkgJson?.dependencies || {}).map((dep) => {
		try {
			return require.resolve(path.join(dep, "cds-plugin"), {
				paths: [options.root]
			});
		} catch (e) { /* undefined */ }
	}).filter((dep) => dep !== undefined);
	
	// create the Router for the CAP server
	const router = new Router();

	cds.emit("bootstrap", router);

	// load model from all sources
	const csn = await cds.load(options.from || '*', options);
	cds.model = cds.compile.for.nodejs(csn);
	cds.emit("loaded", cds.model);

	// bootstrap in-memory db
	async function _init (db) {
		if (!options.in_memory || cds.requires.multitenancy) return db;
		const fts = cds.requires.toggles && cds.resolve (features.folders);
		const m = !fts ? csn : await cds.load([options.from || '*', ...fts], options).then(cds.minify);
		return cds.deploy(m).to(db, options);
	}	

	// connect to prominent required services
	if (cds.requires.db) cds.db = await cds.connect.to("db").then(_init);
	if (cds.requires.messaging) await cds.connect.to("messaging");

	// serve own services as declared in model
	await cds.serve(options).from(csn).in(router);
	await cds.emit("served", cds.services);

	// launch http server (not needed here)
	/*
	cds .emit ('launching', app)
	const port = o.port ?? process.env.PORT || 4004
	const server = app.server = app.listen(port) .once ('listening', ()=> 
		cds.emit('listening', { server, url: `http://localhost:${port}` })
	)
	*/

	// change dir back (only needed temporary for cds bootstrap)
	process.chdir(cwd);

	return router;
};