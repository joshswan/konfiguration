/*!
 * konfiguration
 *
 * Copyright 2017-2020 Josh Swan
 * Released under the MIT license
 * https://github.com/joshswan/konfiguration/blob/master/LICENSE
 */

import path from 'path';
import { expect } from 'chai';
import sinon from 'sinon';
import { Config } from '../Config';

beforeEach(() => {
  process.env = {
    NODE_ENV: 'test',
  };
});

describe('Config', () => {
  it('should parse files in NODE_CONFIG_DIR directory', () => {
    process.env.NODE_CONFIG_DIR = path.resolve(__dirname, '../../test/config');

    const config = new Config();

    expect(config.get('app.test')).to.be.true;
    expect(config.get('app.port')).to.equal(3000);
    expect(config.get('app.version')).to.equal('1.0.0');
    expect(config.get('database')).to.eql({
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

    const config = new Config();

    expect(config.get('app.test')).to.be.false;
    expect(config.get('app.port')).to.equal(8000);
    expect(config.get('app.version')).to.equal('1.0.0');
    expect(config.get('database')).to.eql({
      username: 'prod',
      port: 1234,
    });
  });

  describe('NODE_CONFIG', () => {
    it('should parse and merge JSON string from NODE_CONFIG environment variable', () => {
      process.env.NODE_CONFIG_DIR = path.resolve(__dirname, '../../test/config');
      process.env.NODE_CONFIG = JSON.stringify({ app: { version: '1.0.0-1' }, database: { username: 'prod' } });

      const config = new Config();

      expect(config.get('app.test')).to.be.true;
      expect(config.get('app.port')).to.equal(3000);
      expect(config.get('app.version')).to.equal('1.0.0-1');
      expect(config.get('database')).to.eql({
        username: 'prod',
        port: 1234,
      });
    });

    it('should warn on invalid JSON in NODE_CONFIG environment variable', () => {
      process.env.NODE_CONFIG = '{ invalid_json = 1';

      const warn = sinon.stub(console, 'warn');
      const config = new Config();

      expect(warn).to.be.calledOnce;
      expect(warn).to.be.calledWith('NODE_CONFIG environment variable is invalid JSON');
      expect(config).to.be.instanceOf(Config);

      warn.restore();
    });
  });

  describe('NODE_CONFIG_PREFIX', () => {
    it('should merge environment variables prefixed with NODE_CONFIG_PREFIX', () => {
      process.env.NODE_CONFIG_DIR = path.resolve(__dirname, '../../test/config');
      process.env.NODE_CONFIG_PREFIX = 'APP_';
      process.env.APP_DATABASE__USERNAME = 'prod';
      process.env.APP_APP__PORT = '80';

      const config = new Config();

      expect(config.get('app.test')).to.be.true;
      expect(config.get('app.port')).to.equal(80);
      expect(config.get('app.version')).to.equal('1.0.0');
      expect(config.get('database')).to.eql({
        username: 'prod',
        port: 1234,
      });
    });

    it('should not merge unprefixed environment variables', () => {
      process.env.NODE_CONFIG_DIR = path.resolve(__dirname, '../../test/config');
      process.env.NODE_CONFIG_PREFIX = 'APP_';
      process.env.DATABASE__USERNAME = 'prod';

      const config = new Config();

      expect(config.get('database')).to.eql({
        username: 'test',
        port: 1234,
      });
    });
  });

  describe('environment()', () => {
    it('should test if arguments match current environment', () => {
      const config = new Config();

      expect(config.environment('test')).to.be.true;
      expect(config.environment('development', 'staging', 'test')).to.be.true;
      expect(config.environment('production')).to.be.false;
      expect(config.environment('production', 'development')).to.be.false;
    });
  });

  describe('get()', () => {
    it('should return config value at specified key', () => {
      const config = new Config();
      config.test = 1;

      expect(config.get('test')).to.equal(1);
    });

    it('should accept dot notation to return nested keys', () => {
      const config = new Config();
      config.test = { enabled: 1 };

      expect(config.get('test.enabled')).to.equal(1);
    });

    it('should return supplied default value if key does not exist', () => {
      const config = new Config();

      expect(config.get('key.does.not.exist', 'defaultVal')).to.equal('defaultVal');
    });
  });

  describe('set()', () => {
    it('should set config value at specified key', () => {
      const config = new Config();
      config.set('test', 1);

      expect(config.test).to.equal(1);
      expect(config.get('test')).to.equal(1);
    });

    it('should accept dot notation for nested keys', () => {
      const config = new Config();
      config.test = { enabled: 1 };
      config.set('test.enabled', 0);

      expect(config.test.enabled).to.equal(0);
      expect(config.get('test.enabled')).to.equal(0);
    });
  });
});
