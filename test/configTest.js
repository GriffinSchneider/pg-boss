const assert = require('assert')
const PgBoss = require('../')
const helper = require('./testHelper')

describe('config', function () {
  it('should allow a 50 character custom schema name', async function () {
    const config = this.test.bossConfig
    config.schema = 'thisisareallylongschemanamefortestingmaximumlength'

    assert.strictEqual(config.schema.length, 50)

    const boss = new PgBoss(config)

    await boss.start()
    await boss.stop()

    await helper.dropSchema(config.schema)
  })

  it('should not allow more than 50 characters in schema name', function () {
    const config = this.test.bossConfig

    config.schema = 'thisisareallylongschemanamefortestingmaximumlengthb'

    assert(config.schema.length > 50)

    assert.throws(() => new PgBoss(config))
  })

  it('should accept a connectionString property', async function () {
    const connectionString = helper.getConnectionString()
    const boss = new PgBoss({ connectionString, schema: this.test.bossConfig.schema })

    await boss.start()
    await boss.stop()
  })

  it('set pool config `poolSize`', async function () {
    const poolSize = 4
    const boss = await helper.start({ ...this.test.bossConfig, poolSize })

    assert(boss.db.config.poolSize === poolSize)
    assert(boss.db.pool.options.max === poolSize)

    await boss.stop()
  })

  it('set pool config `max`: `poolSize` === `max`', async function () {
    const max = 4
    const boss = await helper.start({ ...this.test.bossConfig, max })

    assert(boss.db.config.max === boss.db.config.poolSize)
    assert(boss.db.config.max === max)
    assert(boss.db.config.poolSize === max)
    assert(boss.db.pool.options.max === max)

    await boss.stop()
  })

  it('start() should fail if pgcrypto is not available', async function () {
    const database = 'pgboss_test1'

    const db = await helper.getDb('postgres')

    await db.executeSql(`CREATE DATABASE ${database}`)

    const config = { ...this.test.bossConfig, database }

    const boss = new PgBoss(config)

    try {
      await boss.start()
      assert(false, 'Error should have been thrown by missing pgcrypto extension')
    } catch (err) {
      assert(err.message.includes('gen_random_uuid()'))
    }

    await db.executeSql(`SELECT pg_terminate_backend( pid ) FROM pg_stat_activity WHERE pid <> pg_backend_pid() AND datname = '${database}'`)
    await db.executeSql(`DROP DATABASE ${database}`)
  })
})
