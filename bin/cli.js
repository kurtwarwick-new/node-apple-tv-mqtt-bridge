#!/usr/bin/env node

try {
const fs = require("fs");
const path = require("path");
const minimist = require('minimist');
const application = require("../src");

const args = minimist(process.argv.splice(2));

const configFilePath = path.resolve(process.cwd(), args.config);

let config = require(configFilePath);

console.log(config);

application(config);

//const args = process.args.split("--").map(arg => );
//const configFilePath = process.args[]

//let config = require(process.args[0]);

//appleTvMqttBridge(config);
} catch (error) {
    console.log(error);
}