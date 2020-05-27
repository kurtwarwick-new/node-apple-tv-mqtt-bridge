#!/usr/bin/env node

try {
    const fs = require("fs");
    const path = require("path");
    const minimist = require("minimist");
    const application = require("../src");
    const args = minimist(process.argv.splice(2));
    const configFilePath = path.resolve(process.cwd(), args.config);

    let config = require(configFilePath);

    application(config);
} catch (error) {
    console.log(error);
}
