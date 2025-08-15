import { queryClient } from '@/db/drizzle/drizzle'
import { TopUpPluginInfo } from '@/document/topUpPluginInfo/topUpPluginInfo'
import { DbHandlerFabric } from '@/document/dbHandlerFabric'
import { closeTaskQueues } from '@/periodic_tasks/queue'

function doTests(mode: 'drizzle' | 'json') {
  const dbFandlerFabric = new DbHandlerFabric(mode)

  describe('topUpPlugin: mode ' + mode, () => {
    
    beforeEach(async () => {
    })

    afterAll(async () => {
      if (mode == 'drizzle')
        await queryClient.end()
      await closeTaskQueues()
    })    
    
    describe('createNew method', () => {
      it('should create a new topUpPlugin', async () => {
        const TesttopUpPluginName = 'Test topUpPlugin ' + Math.random().toFixed(10)
        const topUpPlugin = new TopUpPluginInfo(dbFandlerFabric)
        topUpPlugin.fields.name = TesttopUpPluginName
        topUpPlugin.fields.title = 'Test plugin title'
        topUpPlugin.fields.plugin = 'Test plugin'
        topUpPlugin.fields.active = true
        //topUpPlugin.fields.id = TesttopUpPluginId
        await topUpPlugin.createNew()

        const topUpPlugin_loaded = new TopUpPluginInfo(dbFandlerFabric)
        await topUpPlugin_loaded.loadExisting(topUpPlugin.fields.id)
        expect(topUpPlugin_loaded.fields.name).toBe(TesttopUpPluginName)
      })
    })

    describe('Data fields', () => {
      it('should fill data fields', async () => {
        const TesttopUpPluginName = 'Test topUpPlugin ' + Math.random().toFixed(10)
        const topUpPlugin = new TopUpPluginInfo(dbFandlerFabric)
        topUpPlugin.fields.name = TesttopUpPluginName
        topUpPlugin.fields.title = 'Test plugin title'
        topUpPlugin.fields.plugin = 'Test plugin'
        topUpPlugin.fields.active = true
        // topUpPlugin.fields.id = TesttopUpPluginId

        topUpPlugin.dataFields['info'] = 'additional info'
        await topUpPlugin.createNew()

        const topUpPlugin_loaded = new TopUpPluginInfo(dbFandlerFabric)
        await topUpPlugin_loaded.loadExisting(topUpPlugin.fields.id)
        expect(topUpPlugin_loaded.fields.name).toBe(TesttopUpPluginName)
        expect(topUpPlugin_loaded.dataFields['info']).toBe('additional info')
      })
    })
  })
}

doTests('json')
doTests('drizzle')