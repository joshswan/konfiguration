# make-conf

[![NPM Version][npm-image]][npm-url] [![Build Status][build-image]][build-url] [![Dependency Status][depstat-image]][depstat-url] [![Dev Dependency Status][devdepstat-image]][devdepstat-url]

Configuration package for Node projects. Define your default configuration settings in YAML files and easily override/extend them using environment-specific files as well as environment variables.

## Quick start

```shell
yarn add make-conf
# OR
npm install make-conf --save

mkdir config
vi config/database.yaml
```

```yaml
database:
  username: user
  password: test
  hostname: localhost
```

**Override settings for production (using file)**

```shell
vi config/database.production.yaml
# OR
mkdir config/production
vi config/production/database.yaml
```

```yaml
database:
  hostname: prod-1.us-west-2.rds.amazonaws.com
```

**Override settings for production (using environment variables)**

```shell
export DATABASE__HOSTNAME=prod-1.us-west-2.rds.amazonaws.com
export DATABASE__PASSWORD=prodpass
```

**Use config values in the app code**

```javascript
import config from 'make-conf';

database.connect(config.get('database'));
```

## About make-conf

This package merges together configuration settings from general YAML-formatted config files, environment-specific YAML-formatted config files, and environment variables (in that order) to create a final application config that can used throughout your code. The environment is determined from the `NODE_ENV` environment variable and defaults to `development` if none is specified.

### Configuration files

Configuration files can be stored in a directory of your choice. The default directory is `./config`, but you can use the `NODE_CONFIG_DIR` environment variable to specify any location. All YAML files contained in the directory will be parsed and merged together, so it is entirely up to you how you want to structure your config files (e.g. a single file or a file per module).

### Environment-specific configuration files

Environment-specific YAML files contained in the config directory will only be merged in if the current environment matches. They can be placed in the root of the config directory and named `{filename}.{env}.yaml`, or they can be placed into a subdirectory `{env}/{filename}.yaml`.

### Environment variables

Environment variables are merged into the configuration after all files are loaded. They are type-cast to match the value in the configuration files, if one exists (e.g. if you have `port: 3000` in a config file and an environment variable `PORT=80` will be merged in to the `port` key as `80` despite being `"80"` in `process.env`).

#### NODE_CONFIG

The first environment variable that gets merged in is `NODE_CONFIG`, which must be a JSON-formatted string. This single environment variable allows you to override as much or as little of your config as you like.

#### Others

Then, other environment variables are merged in. Names are converted to camelCase and object dot-notation using the following rules: `__` becomes a `.` for nesting and `_` becomes a capital letter. For example, the environment variable `DATABASE__USER_NAME` would override `config.database.userName`.

Optionally, you can also specify an environment variable prefix using `NODE_CONFIG_PREFIX`, which filters the environment variables that will be merged. The prefix will be stripped when the name is converted for merging. For example, if you have `NODE_CONFIG_PREFIX="APP_"`, only environment variables matching `APP_*` would be merged (e.g. `APP_DATABASE__USER_NAME` -> `config.database.userName`).

## Usage

Now that all files and environment variables have been merged together, your config is ready to use throughout your application code. All properties can be accessed directly:

```javascript
import config from 'make-conf';

console.log(config.database.userName);
```

But there are various helper functions on the config class that can make things easier.

### config.environment()

Quickly check if you are running in one or more environments by passing them as arguments to `config.environment`:

```javascript
import config from 'make-conf';

if (config.environment('development', 'production')) {
  // Either in development or production environment
}
```

### config.get()

Quickly access config values using dot-notation or return a supplied default value if the key does not exist:

```javascript
import config from 'make-conf';

config.get('database'); // returns config.database
config.get('maybe.undefined', 'default_value'); // returns config.maybe.undefined or 'default_value' if undefined
```

### config.set()

Easily change config values using dot-notation:

```javascript
import config from 'make-conf';

config.set('database.userName', 'test');
config.get('database.userName'); // returns 'test'
```

[build-url]: https://travis-ci.org/joshswan/make-conf
[build-image]: https://travis-ci.org/joshswan/make-conf.svg?branch=master
[depstat-url]: https://david-dm.org/joshswan/make-conf
[depstat-image]: https://david-dm.org/joshswan/make-conf.svg
[devdepstat-url]: https://david-dm.org/joshswan/make-conf#info=devDependencies
[devdepstat-image]: https://david-dm.org/joshswan/make-conf/dev-status.svg
[npm-url]: https://www.npmjs.com/package/make-conf
[npm-image]: https://badge.fury.io/js/make-conf.svg
