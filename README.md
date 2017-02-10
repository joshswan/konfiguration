# make-conf
[![NPM Version][npm-image]][npm-url] [![Build Status][build-image]][build-url] [![Dependency Status][depstat-image]][depstat-url] [![Dev Dependency Status][devdepstat-image]][devdepstat-url]

Config builder for Node projects. Merges environment variables with default config object(s) to produce simple config object and allows all config options to be overridable via environment variables.

## Installation

```javascript
npm install make-conf --save
```

## Behavior

All keys are converted to camel-case and nested appropriately based on the following rules:
- Single underscore -> camel-case (e.g. `NODE_ENV` becomes `nodeEnv`)
- Double underscore -> nested object (e.g. `APP__NAME` becomes `app.name`)

After converting keys, values are merged:
- Objects are merged recursively
- All other values (e.g. arrays, strings) are replaced

## Usage

Pass in any config sources to get merged config result.

```javascript
const makeConf = require('make-conf');

// Using a default object
const conf = makeConf({ nodeEnv: 'development', appName: 'awesome-app' }, ...configObjects)

// Using folder of YAML files
const conf = makeConf({ someKey: 'default' }, ...fs.readdirSync('./config').map(file => yaml.load(fs.readFileSync(path.join('./config', file), 'utf8'))));

// Example
// Environment variables: NODE_ENV=production APP__VERSION=2.0.0
const conf = makeConf({ nodeEnv, 'development', app: { name: 'Test', version: '1.0.0' }}, { app: { name: 'makeConf' }});
// { nodeEnv: 'production', app: { name: 'makeConf', version: '2.0.0' }}
```

[build-url]: https://travis-ci.org/joshswan/make-conf
[build-image]: https://travis-ci.org/joshswan/make-conf.svg?branch=master
[depstat-url]: https://david-dm.org/joshswan/make-conf
[depstat-image]: https://david-dm.org/joshswan/make-conf.svg
[devdepstat-url]: https://david-dm.org/joshswan/make-conf#info=devDependencies
[devdepstat-image]: https://david-dm.org/joshswan/make-conf/dev-status.svg
[npm-url]: https://www.npmjs.com/package/make-conf
[npm-image]: https://badge.fury.io/js/make-conf.svg
