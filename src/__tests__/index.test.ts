/*!
 * konfiguration
 *
 * Copyright 2017-2019 Josh Swan
 * Released under the MIT license
 * https://github.com/joshswan/konfiguration/blob/master/LICENSE
 */

import { expect } from 'chai';
import { Config } from '../Config';
import config from '..';

describe('config', () => {
  it('should export instantiated config by default', () => {
    expect(config).to.be.instanceOf(Config);
    expect(config.ENV).to.equal('test');
    expect(config.environment).to.be.a('function');
    expect(config.get).to.be.a('function');
    expect(config.set).to.be.a('function');
  });
});
