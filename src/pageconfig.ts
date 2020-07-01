///<amd-module-off name="hr.pageconfig"/>

/**
 * The config function on the page, this is reserved in order to use the pageconfig system.
 * Each function should be called hr_config and should take call any previously existing
 * config function automatically. A suggested implementation of this is:
 *  window.hr_config = (function(next){{
 *    return function(config)
 *      {{
 *          config.YOUR_CONFIG_SECTION = {youroption: "value"};
 *          return next ? next(config) : config;
 *      }}
 *  }})(window.hr_config); //next is send the previous value of window.hr_config and then returns a clojure with that value and the new function.
 * @param config The config object to fill out.
 */
declare function hr_config<T>(config: T): T;

/**
 * Read the config off the page. You can optionally pass existing config. This function returns the configuration object after it is read.
 * @param config An existing config value to further fill out.
 */
export function read<T>(config?: T): T{
    if(config === undefined){
        config = <T>{};
    }
    return (<any>window).hr_config ? (<any>window).hr_config(config) : config;
}