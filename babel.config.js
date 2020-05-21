/*!
 * konfiguration
 *
 * Copyright 2017-2020 Josh Swan
 * Released under the MIT license
 * https://github.com/joshswan/konfiguration/blob/master/LICENSE
 */

module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    '@babel/preset-typescript',
  ],
}
