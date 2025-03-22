import {installAndImport, uninstall} from "./npmPackages.js";
import Plugin, { PluginConfig, PluginDefinition } from "./Plugin.js";
import PluginContext from "./PluginContext.js";


export class PluginManager{
    private fetchedPlugins: Map<string, Plugin<any>> = new Map()
    private installedPlugins: Plugin<any>[] = [];

    constructor(private context: PluginContext){}

    async fetchNPMPackage(pluginNpmPackageName: string, useLink = false): Promise<Plugin<any> | null>{
        if(this.fetchedPlugins.has(pluginNpmPackageName)){
            return this.fetchedPlugins.get(pluginNpmPackageName)!;
        }
        const result = await installAndImport(pluginNpmPackageName, useLink);
        try{
            if(result.default instanceof Plugin){
                this.fetchedPlugins.set(pluginNpmPackageName, result.default);
                const plugin = result.default as Plugin<any>;
                plugin.installedUsingLink = useLink;
                return plugin;
            }else{
                return null;
            }
        }catch(err){
            return null;
        }
    }

    async install<Def extends PluginDefinition>(plugin: Plugin<Def>, config?: Partial<PluginConfig<Def>>){
        if(config){
            for(const k in config){
                const key = k as keyof typeof config;
                plugin.set(key, config[key]);
            }
        }
        this.installedPlugins.push(plugin);
        if(await plugin.install(this.context)){
            return await plugin.enable(this.context);
        }
        return false;
    }

    getPackageName(plugin: Plugin<any>): string | undefined{
        for(const packageName of this.fetchedPlugins.keys()){
            if(this.fetchedPlugins.get(packageName) === plugin) return packageName;
        }
    }

    async uninstall(plugin: Plugin<any>){
        const packageName = this.getPackageName(plugin);
        if(!packageName) return false;

        this.installedPlugins = this.installedPlugins.filter((p) => p != plugin);
        await plugin.uninstall(this.context);
        await uninstall(packageName), plugin.installedUsingLink;
        return true;
    }

    async disable(plugin: Plugin<any>){
        return await plugin.disable(this.context);
    }

    async enable(plugin: Plugin<any>){
        return await plugin.enable(this.context);
    }
}

export default new PluginManager(new PluginContext());