/*!
 * konfiguration
 *
 * Copyright 2017-2020 Josh Swan
 * Released under the MIT license
 * https://github.com/joshswan/konfiguration/blob/master/LICENSE
 */

import path from 'path';
import { Config } from '../Config';

beforeEach(() => {
  process.env = {
    NODE_ENV: 'test',
  };
});

describe('Config', () => {
  test('parses files in NODE_CONFIG_DIR directory', () => {
    process.env.NODE_CONFIG_DIR = path.resolve(__dirname, '../../test/config');

    const config = new Config();

    expect(config.get('app.test')).toBe(true);
    expect(config.get('app.port')).toBe(3000);
    expect(config.get('app.version')).toBe('1.0.0');
    expect(config.get('database')).toEqual({
      username: 'test',
      port: 1234,
    });
  });

  test('merges files with *.ENV.yml names', () => {
    process.env.NODE_CONFIG_DIR = path.resolve(__dirname, '../../test/config-env');

    const test = new Config();
    expect(test.get('app.test')).toBe('test');

    process.env.NODE_ENV = 'development';

    const dev = new Config();
    expect(dev.get('app.test')).toBe('default');

    process.env.NODE_ENV = 'production';

    const prod = new Config();
    expect(prod.get('app.test')).toBe('production');
  });

  test('merges files with ENV/*.yml names', () => {
    process.env.NODE_CONFIG_DIR = path.resolve(__dirname, '../../test/config-env-dir');

    const test = new Config();
    expect(test.get('app.test')).toBe('test');

    process.env.NODE_ENV = 'development';

    const dev = new Config();
    expect(dev.get('app.test')).toBe('default');

    process.env.NODE_ENV = 'production';

    const prod = new Config();
    expect(prod.get('app.test')).toBe('production');
  });

  test('merges environment variables', () => {
    process.env.NODE_CONFIG_DIR = path.resolve(__dirname, '../../test/config');
    process.env.APP__TEST = '0';
    process.env.APP__PORT = '8000';
    process.env.DATABASE__USERNAME = 'prod';

    const config = new Config();

    expect(config.get('app.test')).toBe(false);
    expect(config.get('app.port')).toBe(8000);
    expect(config.get('app.version')).toBe('1.0.0');
    expect(config.get('database')).toEqual({
      username: 'prod',
      port: 1234,
    });
  });

  describe('NODE_CONFIG', () => {
    test('parses and merges JSON string from NODE_CONFIG environment variable', () => {
      process.env.NODE_CONFIG_DIR = path.resolve(__dirname, '../../test/config');
      process.env.NODE_CONFIG = JSON.stringify({ app: { version: '1.0.0-1' }, database: { username: 'prod' } });

      const config = new Config();

      expect(config.get('app.test')).toBe(true);
      expect(config.get('app.port')).toBe(3000);
      expect(config.get('app.version')).toBe('1.0.0-1');
      expect(config.get('database')).toEqual({
        username: 'prod',
        port: 1234,
      });
    });

    test('warns on invalid JSON in NODE_CONFIG environment variable', () => {
      process.env.NODE_CONFIG = '{ invalid_json = 1';

      const warn = jest.spyOn(console, 'warn').mockImplementation();
      const config = new Config();

      expect(warn).toBeCalledTimes(1);
      expect(warn).toBeCalledWith('NODE_CONFIG environment variable is invalid JSON');
      expect(config).toBeInstanceOf(Config);
    });
  });

  describe('NODE_CONFIG_PREFIX', () => {
    test('merges environment variables prefixed with NODE_CONFIG_PREFIX', () => {
      process.env.NODE_CONFIG_DIR = path.resolve(__dirname, '../../test/config');
      process.env.NODE_CONFIG_PREFIX = 'APP_';
      process.env.APP_DATABASE__USERNAME = 'prod';
      process.env.APP_APP__PORT = '80';

      const config = new Config();

      expect(config.get('app.test')).toBe(true);
      expect(config.get('app.port')).toBe(80);
      expect(config.get('app.version')).toBe('1.0.0');
      expect(config.get('database')).toEqual({
        username: 'prod',
        port: 1234,
      });
    });

    test('does not merge unprefixed environment variables', () => {
      process.env.NODE_CONFIG_DIR = path.resolve(__dirname, '../../test/config');
      process.env.NODE_CONFIG_PREFIX = 'APP_';
      process.env.DATABASE__USERNAME = 'prod';

      const config = new Config();

      expect(config.get('database')).toEqual({
        username: 'test',
        port: 1234,
      });
    });
  });

  describe('environment()', () => {
    test('tests if arguments match current environment', () => {
      const config = new Config();

      expect(config.environment('test')).toBe(true);
      expect(config.environment('development', 'staging', 'test')).toBe(true);
      expect(config.environment('production')).toBe(false);
      expect(config.environment('production', 'development')).toBe(false);
    });
  });

  describe('get()', () => {
    test('returns config value at specified key', () => {
      const config = new Config();
      config.test = 1;

      expect(config.get('test')).toBe(1);
    });

    test('accepts dot notation to return nested keys', () => {
      const config = new Config();
      config.test = { enabled: 1 };

      expect(config.get('test.enabled')).toBe(1);
    });

    test('returns supplied default value if key does not exist', () => {
      const config = new Config();

      expect(config.get('key.does.not.exist', 'defaultVal')).toBe('defaultVal');
    });
  });

  describe('set()', () => {
    test('sets config value at specified key', () => {
      const config = new Config();
      config.set('test', 1);

      expect(config.test).toBe(1);
      expect(config.get('test')).toBe(1);
    });

    test('accepts dot notation for nested keys', () => {
      const config = new Config();
      config.test = { enabled: 1 };
      config.set('test.enabled', 0);

      expect(config.test.enabled).toBe(0);
      expect(config.get('test.enabled')).toBe(0);
    });
  });
});
