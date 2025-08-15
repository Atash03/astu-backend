type StringFields = Record<string, string>

interface ITopUpPlugin {
  process(fields:TopUpFields): Promise<StringFields>
  checkFields(fields:TopUpFields): Promise<void>
}

type TopUpPluginFabricFun = () => ITopUpPlugin
interface ITopUpPluginModule {
  default: TopUpPluginFabricFun
}