#!/usr/bin/env node

/**
 * Basic Logger Example
 * A simple example to get started with common.logger usages.
 */

// -- Bootstrap

const Logger = require('../../dist/common/logger')

// -- Chain of command

async function main () {
  console.log('== Basic Logger Example ==')

  const logger1 = new Logger('example-1')
  logger1.info('You wont see this as the default visibility level is set to "warn".')
  logger1.warn('Warning. this is visible.')

  const logger2 = new Logger('example-2', { level: 'info' })
  logger2.info('Hello', 'World')
  logger2.info('Array test:', ['apple', 'banana', 'citrus'])
  logger2.setLevel('warn')
  logger2.info('You shouldnt see this as the visibility is now set to "warn"')

  const logger3 = new Logger('example-3', { level: Logger.levels.DEBUG })
  logger3.debug('You can also set log level via its type safe value.')
}

// -- Execute

main()
