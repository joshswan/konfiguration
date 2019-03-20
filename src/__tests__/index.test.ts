/*!
 * make-conf
 *
 * Copyright 2017-2019 Josh Swan
 * Released under the MIT license
 * https://github.com/joshswan/make-conf/blob/master/LICENSE
 */

import path from 'path';
import { expect } from 'chai';
import sinon from 'sinon';
import config, { Config } from '..';

beforeEach(() => {
  process.env = {
    NODE_ENV: 'test',
  };
});

describe('config', () => {
  it('should export instantiated config by default', () => {
    expect(config).to.be.instanceOf(Config);
    expect(config.ENV).to.equal('test');
    expect(config.environment).to.be.a('function');
    expect(config.get).to.be.a('function');
    expect(config.set).to.be.a('function');
  });

  describe('environment()', () => {
    it('should test if arguments match current environment', () => {
      expect(config.environment('test')).to.be.true;
      expect(config.environment('development', 'staging', 'test')).to.be.true;
      expect(config.environment('production')).to.be.false;
      expect(config.environment('production', 'development')).to.be.false;
    });
  });

  describe('get()', () => {
    it('should return config value at specified key', () => {
      config.test = 1;

      expect(config.get('test')).to.equal(1);
    });

    it('should accept dot notation to return nested keys', () => {
      config.test = { enabled: 1 };

      expect(config.get('test.enabled')).to.equal(1);
    });

    it('should return supplied default value if key does not exist', () => {
      expect(config.get('key.does.not.exist', 'defaultVal')).to.equal('defaultVal');
    });
  });

  describe('set()', () => {
    it('should set config value at specified key', () => {
      config.set('test', 1);

      expect(config.test).to.equal(1);
      expect(config.get('test')).to.equal(1);
    });

    it('should accept dot notation for nested keys', () => {
      config.test = { enabled: 1 };
      config.set('test.enabled', 0);

      expect(config.test.enabled).to.equal(0);
      expect(config.get('test.enabled')).to.equal(0);
    });
  });
});

describe('Config', () => {
  it('should parse files in NODE_CONFIG_DIR directory', () => {
    process.env.NODE_CONFIG_DIR = path.resolve(__dirname, '../../test/config');

    const conf = new Config();

    expect(conf.get('app.test')).to.be.true;
    expect(conf.get('app.port')).to.equal(3000);
    expect(conf.get('app.version')).to.equal('1.0.0');
    expect(conf.get('database')).to.eql({
      username: 'test',
      port: 1234,
    });
  });

  it('should merge files with *.ENV.yml names', () => {
    process.env.NODE_CONFIG_DIR = path.resolve(__dirname, '../../test/config-env');

    const test = new Config();
    expect(test.get('app.test')).to.equal('test');

    process.env.NODE_ENV = 'development';

    const dev = new Config();
    expect(dev.get('app.test')).to.equal('default');

    process.env.NODE_ENV = 'production';

    const prod = new Config();
    expect(prod.get('app.test')).to.equal('production');
  });

  it('should merge files with ENV/*.yml names', () => {
    process.env.NODE_CONFIG_DIR = path.resolve(__dirname, '../../test/config-env-dir');

    const test = new Config();
    expect(test.get('app.test')).to.equal('test');

    process.env.NODE_ENV = 'development';

    const dev = new Config();
    expect(dev.get('app.test')).to.equal('default');

    process.env.NODE_ENV = 'production';

    const prod = new Config();
    expect(prod.get('app.test')).to.equal('production');
  });

  it('should merge environment variables', () => {
    process.env.NODE_CONFIG_DIR = path.resolve(__dirname, '../../test/config');
    process.env.APP__TEST = '0';
    process.env.APP__PORT = '8000';
    process.env.DATABASE__USERNAME = 'prod';

    const conf = new Config();

    expect(conf.get('app.test')).to.be.false;
    expect(conf.get('app.port')).to.equal(8000);
    expect(conf.get('app.version')).to.equal('1.0.0');
    expect(conf.get('database')).to.eql({
      username: 'prod',
      port: 1234,
    });
  });

  describe('NODE_CONFIG', () => {
    it('should parse and merge JSON string from NODE_CONFIG environment variable', () => {
      process.env.NODE_CONFIG_DIR = path.resolve(__dirname, '../../test/config');
      process.env.NODE_CONFIG = JSON.stringify({ app: { version: '1.0.0-1' }, database: { username: 'prod' } });

      const conf = new Config();

      expect(conf.get('app.test')).to.be.true;
      expect(conf.get('app.port')).to.equal(3000);
      expect(conf.get('app.version')).to.equal('1.0.0-1');
      expect(conf.get('database')).to.eql({
        username: 'prod',
        port: 1234,
      });
    });

    it('should warn on invalid JSON in NODE_CONFIG environment variable', () => {
      process.env.NODE_CONFIG = '{ invalid_json = 1';

      const warn = sinon.stub(console, 'warn');
      const conf = new Config();

      expect(warn).to.be.calledOnce;
      expect(warn).to.be.calledWith('NODE_CONFIG environment variable is invalid JSON');
      expect(conf).to.be.instanceOf(Config);

      warn.restore();
    });
  });

  describe('NODE_CONFIG_PREFIX', () => {
    it('should merge environment variables prefixed with NODE_CONFIG_PREFIX', () => {
      process.env.NODE_CONFIG_DIR = path.resolve(__dirname, '../../test/config');
      process.env.NODE_CONFIG_PREFIX = 'APP_';
      process.env.APP_DATABASE__USERNAME = 'prod';
      process.env.APP_APP__PORT = '80';

      const conf = new Config();

      expect(conf.get('app.test')).to.be.true;
      expect(conf.get('app.port')).to.equal(80);
      expect(conf.get('app.version')).to.equal('1.0.0');
      expect(conf.get('database')).to.eql({
        username: 'prod',
        port: 1234,
      });
    });

    it('should not merge unprefixed environment variables', () => {
      process.env.NODE_CONFIG_DIR = path.resolve(__dirname, '../../test/config');
      process.env.NODE_CONFIG_PREFIX = 'APP_';
      process.env.DATABASE__USERNAME = 'prod';

      const conf = new Config();

      expect(conf.get('database')).to.eql({
        username: 'test',
        port: 1234,
      });
    });
  });
});
