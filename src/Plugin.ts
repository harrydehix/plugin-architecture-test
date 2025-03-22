import PluginContext from "./PluginContext.js";

export type PluginParameter<T> = {
    label: string,
    description?: string,
    value: T,
    choices?: [string, T][],
}

export type ExtractPluginParameterType<Param extends PluginParameter<any>> = Param extends PluginParameter<infer T> ? T : never;

export type PluginDefinition = {
    name: string,
    author: string,
    description?: string,
    configurableParameters: {
        [Property in string]: PluginParameter<any>
    },
}

export type PluginConfig<Def extends PluginDefinition> = {
    name: string,
    author: string,
    description?: string,
    configurableParameters: {
        [Property in keyof Def["configurableParameters"]]: ExtractPluginParameterType<Def["configurableParameters"][Property]>
    }
}

export default class Plugin<Definition extends PluginDefinition>{
    private installHook = (context: PluginContext, config: PluginConfig<Definition>) => Promise.resolve()
    private enableHook = (context: PluginContext, config: PluginConfig<Definition>) => Promise.resolve()
    private disableHook = (context: PluginContext, config: PluginConfig<Definition>) => Promise.resolve()
    private uninstallHook = (context: PluginContext, config: PluginConfig<Definition>) => Promise.resolve()
    private state: "uninstalled" | "enabled" | "disabled" = "uninstalled";
    public installedUsingLink: boolean = false;

    private constructor(private definition: Definition, public config: PluginConfig<Definition>){}

    public static create<Definition extends PluginDefinition>(definition: Definition){
        const config = Plugin.createDefaultConfig(definition);
        return new Plugin<Definition>(definition, config);
    }

    private static createDefaultConfig<T extends PluginDefinition>(definition: T): PluginConfig<T>  {
        const result: Partial<PluginConfig<T>["configurableParameters"]> = {};
        for(const k in definition.configurableParameters){
            const key = k as keyof T["configurableParameters"];
            result[key] = definition.configurableParameters[key as any].value;
        }
        return {
            ...definition,
            configurableParameters: result as PluginConfig<T>["configurableParameters"]
        };
    }

    public set<K extends keyof PluginConfig<Definition>>(key: K, value: PluginConfig<Definition>[K]){
        this.config[key] = value;
    }

    public onInstall(hook: (context: PluginContext, config: PluginConfig<Definition>) => Promise<void>): this{
        this.installHook = hook;
        return this;
    }

    public onEnabled(hook: (context: PluginContext, config: PluginConfig<Definition>) => Promise<void>): this{
        this.enableHook = hook;
        return this;
    }

    public onDisabled(hook: (context: PluginContext, config: PluginConfig<Definition>) => Promise<void>): this{
        this.disableHook = hook;
        return this;
    }

    public onUninstall(hook: (context: PluginContext, config: PluginConfig<Definition>) => Promise<void>): this{
        this.uninstallHook = hook;
        return this;
    }

    public async install(context: PluginContext){
        if(!this.isInstalled()){
            await this.installHook(context, this.config);
            this.state = "disabled";
            return true;
        }
        return false;
    }

    public async uninstall(context: PluginContext){
        if(this.isInstalled()){
            await this.uninstallHook(context, this.config);
            this.state = "uninstalled";
            return true;
        }
        return false;
    }

    public async enable(context: PluginContext){
        if(!this.isEnabled()){
            await this.enableHook(context, this.config);
            this.state = "enabled";
            return true;
        }
        return false;
    }

    public async disable(context: PluginContext){
        if(this.isEnabled()){
            await this.disableHook(context, this.config);
            this.state = "disabled";
            return true;
        }
        return false;
    }
    
    public isEnabled(){
        return this.state === "enabled";
    }

    public isInstalled(){
        return this.state !== "uninstalled";
    }
}