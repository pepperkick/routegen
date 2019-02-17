const debug = require('debug')('pepperkick:routegen');

module.exports.init = async(app, options = {}) => {

    const defaultOptions = {
        routes: []
    }

    // merge options with defaults
    options = Object.assign(defaultOptions, options);

    // validate parameters

    // passed app instance should be an object
    if (!(app instanceof Object)) {
        throw new Error(`app instance passed is not an object`);
    }

    let routes = {};

    // walk the services option

    for (let servDef of options.routes) {
        if (servDef.module) {

            let defaultServDef = {
                parameters: []
            }

            servDef = Object.assign(defaultServDef, servDef);

            debug('processing a server definition:', JSON.stringify(servDef))

            let service = require(servDef.module);

            let name = servDef.as || servDef.module.split('routegen-').splice(-1);

            debug('with name:', name);

            routes[name] = {
                service,
                path: servDef.path,
                parameters: servDef.parameters
            }
        }
        else {
            throw new Error(`service definition does not have a module name`);
        }
    }

    // attach remaining services
    for (let routeName in routes) {
        await attachRoute(app, routes, routeName);
    }
}

let attachRoute = async(app, routes, routeName) => {
    let route = routes[routeName].service;
    let parameters = routes[routeName].parameters || [];
    let path = routes[routeName].path || "/";
        
    if (route && route instanceof Function) {
        const router = await route(app, path, parameters);
        app.use(path, router);
        debug('attached a new route with name:', routeName);

        // remove service from list
        delete routes[routeName];
    }
    else {
        throw new Error(`service did not return a function. Path: ${routes[routeName]}`);
    }
}