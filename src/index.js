const mqtt = require("mqtt");
const appletv = require("node-appletv-x");

module.exports = async (config) => {
    this.onSupportedCommands = (devicesConfiguration, message) => {
        if (!!message) {
            if (!message.length) {
                this.mqtt.publish(`${devicesConfiguration.topic}/active`, "false", { retain: true });
            }
        }
    };

    this.onNowPlaying = (devicesConfiguration, message) => {
        if (message && message.playbackState && message.playbackState.length > 1) {
            message.playbackState = message.playbackState[0].toUpperCase() + message.playbackState.substring(1).toLowerCase();
        }

        this.mqtt.publish(`${devicesConfiguration.topic}/state`, message && message.playbackState ? message.playbackState : "", { retain: true });
        this.mqtt.publish(`${devicesConfiguration.topic}/state/media/type`, message && message.album && message.artist ? "music" : "video", { retain: true });
        this.mqtt.publish(`${devicesConfiguration.topic}/state/media/title`, message && message.title ? message.title : "", { retain: true });
        this.mqtt.publish(`${devicesConfiguration.topic}/state/media/artist`, message && message.artist ? message.artist : "", { retain: true });
        this.mqtt.publish(`${devicesConfiguration.topic}/state/media/album`, message && message.album ? message.album : "", { retain: true });
        this.mqtt.publish(`${devicesConfiguration.topic}/state/media/elapsed`, message && message.elapsedTime > 0 ? message.elapsedTime.toString() : "", { retain: true });
        this.mqtt.publish(`${devicesConfiguration.topic}/state/media/duration`, message && message.duration > 0 ? message.duration.toString() : "", { retain: true });
        this.mqtt.publish(`${devicesConfiguration.topic}/state/application/name`, message && message.appDisplayName ? message.appDisplayName : "", { retain: true });
        this.mqtt.publish(`${devicesConfiguration.topic}/state/application/id`, message && message.appBundleIdentifier ? message.appBundleIdentifier : "", { retain: true });
        this.mqtt.publish(`${devicesConfiguration.topic}/active`, message && message.playbackState === "Playing" ? "true" : "false", { retain: true });
    };

    config.verbose && console.log(`connecting to mqtt host ${config.mqtt.url}...`);

    this.mqtt = mqtt.connect(config.mqtt.url);

    this.mqtt.on("error", console.error);
    this.mqtt.on("reconnect", () => config.verbose && console.log(`reconnecting to mqtt host ${config.mqtt.url}.`));
    this.mqtt.on("connect", () => {
        config.verbose && console.log(`connected to mqtt host ${config.mqtt.url}.`);
        config.devices.map(async (devicesConfiguration) => {
            try {
                let credentials = appletv.parseCredentials(devicesConfiguration.credentials);

                config.verbose && console.log(`scanning for apple tv with identifier ${credentials.uniqueIdentifier}.`);

                let devices = await appletv.scan(credentials.uniqueIdentifier);

                config.verbose && console.log(`apple tv with identifier ${credentials.uniqueIdentifier} found.`);
                config.verbose && console.log(`attempting to connect to apple tv with identifier ${credentials.uniqueIdentifier}.`);

                let connectedDevice = await devices[0].openConnection(credentials);

                config.verbose && console.log(`connected to apple tv with identifier ${credentials.uniqueIdentifier}.`);

                connectedDevice.on("nowPlaying", (message) => this.onNowPlaying(devicesConfiguration, message));
                connectedDevice.on("supportedCommands", (message) => this.onSupportedCommands(devicesConfiguration, message));

                setInterval(
                    () =>
                        connectedDevice.sendIntroduction().then((message) => this.mqtt.publish(`${devicesConfiguration.topic}/on`, (message.payload.logicalDeviceCount == 1) + "")),
                    5000
                );
            } catch (error) {
                console.error(error);
            }
        });
    });

    this.stop = () => {
        config.verbose && console.log(`closing connection to mqtt host ${config.mqtt.url}.`);
        this.mqtt.end();
    };
};
