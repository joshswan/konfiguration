/*!
 * konfiguration
 *
 * Copyright 2017-2020 Josh Swan
 * Released under the MIT license
 * https://github.com/joshswan/konfiguration/blob/master/LICENSE
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import yaml from 'js-yaml';
import {
  camelCase,
  get,
  isObjectLike,
  set,
} from 'lodash';

interface EnvVars {
  [key: string]: any;
}

function convert(value: any, type: string): any {
  switch (type) {
    case 'boolean':
      return /^(?:true|1)$/i.test(value);
    case 'number':
      return parseFloat(value);
    case 'string':
      return String(value);
    default:
      return value;
  }
}

function isObject(value: any): boolean {
  return isObjectLike(value) && !Array.isArray(value);
}

function reduce(destination: object, source: EnvVars): EnvVars {
  // Reduce source object keys, using destination as initial value
  return Object.keys(source).reduce((reduced: object, sourceKey: string) => {
    // Create config key
    const key = sourceKey
      // Remove non-word characters
      .replace(/\W/g, '')
      // Split on double-underscore for nesting
      .split('__')
      // Remove empty values
      .filter(Boolean)
      // Convert keys to camel-case
      .map(str => camelCase(str))
      // Convert to single string with dot notation
      .join('.');

    const destValue = get(destination, key);
    const sourceValue = source[sourceKey];

    // If new value is an object, merge recursively, and use current value as destination if object
    // Otherwise, set new value at key
    if (isObject(sourceValue)) {
      set(reduced, key, reduce(isObject(destValue) ? destValue : {}, sourceValue));
    } else {
      set(reduced, key, convert(sourceValue, typeof destValue));
    }

    return reduced;
  }, destination);
}

class Config {
  [key: string]: any;

  public ENV!: string;
  private dir!: string;
  private prefix!: string;

  constructor() {
    // eslint-disable-next-line no-multi-assign
    this.ENV = this.getEnv('NODE_ENV', 'development');
    this.dir = this.getEnv('NODE_CONFIG_DIR', path.resolve(this.getEnv('INIT_CWD', process.cwd()), 'config'));
    this.prefix = this.getEnv('NODE_CONFIG_PREFIX', '').toUpperCase();

    this.loadFiles();
    this.loadEnv();
  }

  environment(...envs: string[]): boolean {
    return envs.includes(this.ENV);
  }

  get(key: string, defaultValue?: any): any {
    return get(this, key, defaultValue);
  }

  set(key: string, value: any): void {
    set(this, key, value);
  }

  private getEnv(key: string, defaultValue?: any): any {
    const value = process.env[key] || defaultValue;

    this[key] = value;

    return value;
  }

  private loadFiles(): void {
    // Create list of *.yml, *.ENV.yml, and ENV/*.yml files
    const files = ['', this.ENV].map((subdir) => {
      const dir = path.join(this.dir, subdir);
      const suffix = `.${this.ENV}.`;

      if (!fs.existsSync(dir)) return [];

      return fs.readdirSync(dir)
        .filter(file => /\.(yml|yaml)$/.test(file))
        .filter(file => !/\w*\.\w*\./.test(file) || file.includes(suffix))
        .sort((a, b) => {
          if (!a.includes(suffix) && b.includes(suffix)) return -1;
          if (a.includes(suffix) && !b.includes(suffix)) return 1;
          return 0;
        })
        .map(file => path.resolve(dir, file));
    }).reduce((a, b) => a.concat(b));

    // Parse files and merge into config
    Object.assign(this, files.map(file => yaml.load(fs.readFileSync(file, 'utf8'))).filter(Boolean).reduce(reduce, {}));
  }

  private loadEnv(): void {
    dotenv.config({ path: path.resolve(this.getEnv('INIT_CWD', process.cwd()), '.env') });

    let env = {};

    if (this.getEnv('NODE_CONFIG')) {
      try {
        Object.assign(env, JSON.parse(this.getEnv('NODE_CONFIG')));
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('NODE_CONFIG environment variable is invalid JSON');
      }
    }

    env = Object.keys(process.env)
      // Filter environment variables by prefix
      .filter((key: string) => (
        key.toUpperCase().startsWith(this.prefix)
      ))
      // Create environment variable object with filtered keys
      .reduce((vars: EnvVars, key: string) => {
        vars[key.substring(this.prefix.length)] = process.env[key];

        return vars;
      }, env);

    // Merge environment variables into config
    reduce(this, env);
  }
}

export { Config };
export default Config;
