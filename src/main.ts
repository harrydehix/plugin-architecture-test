import PluginManager from "./PluginManager.js";

async function main(){
    const plugin = await PluginManager.fetchNPMPackage("test-plugin", true);
    if(!plugin) throw new Error("Failed to fetch plugin!");
    await PluginManager.install(plugin);
    await PluginManager.uninstall(plugin);
}

main();