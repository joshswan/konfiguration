/*!
 * make-conf
 *
 * Copyright 2017-2019 Josh Swan
 * Released under the MIT license
 * https://github.com/joshswan/make-conf/blob/master/LICENSE
 */

const { expect } = require('chai');
const makeConf = require('../');

beforeEach(() => {
  process.env = {};
});

describe('make-conf', () => {
  it('should merge source arguments', () => {
    const conf = makeConf({}, { test: 123 }, { test2: true });
    expect(conf).to.deep.equal({ test: 123, test2: true });
  });

  it('should merge environment variables by default', () => {
    const env = process.env = { app: 'makeConf' };
    const conf = makeConf({});
    expect(conf).to.deep.equal(env);
  });

  it('should convert uppercase environment variables to camel-case keys before merging', () => {
    process.env = { APP_ENV: 'test' };
    const conf = makeConf({ appEnv: 'development' });
    expect(conf).to.deep.equal({ appEnv: 'test' });
  });

  it('should remove non-word characters from keys', () => {
    const conf = makeConf({}, { '!!APP_ENV': 'test' });
    expect(conf).to.deep.equal({ appEnv: 'test' });
  });

  it('should nest keys with double-underscores', () => {
    const conf = makeConf({ app: { name: 'Test' } }, { APP__NAME: 'makeConf' });
    expect(conf).to.deep.equal({ app: { name: 'makeConf' } });
  });

  it('should remove empty keys when nesting', () => {
    const conf = makeConf({}, { APP____NAME: 'makeConf' });
    expect(conf).to.deep.equal({ app: { name: 'makeConf' } });
  });

  it('should recursively merge objects', () => {
    const conf = makeConf({ app: { name: 'Test', version: '1.0.0' } }, { app: { name: 'makeConf' } }, { APP__VERSION: '2.0.0' });
    expect(conf).to.deep.equal({ app: { name: 'makeConf', version: '2.0.0' } });
  });

  it('should convert types of merged values based on existing ones', () => {
    const conf = makeConf({ enabled: true, version: 1, name: 'makeConf', envs: ['test'] }, { enabled: '0', version: '3', name: 3.5, envs: ['dev'] });
    expect(conf).to.deep.equal({ enabled: false, version: 3, name: '3.5', envs: ['dev'] });
  });
});
