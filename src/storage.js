htmlrest.storage =
{
    startupData: {},
    /**
    * @description Get the sesssion data, can specify a default value.
    * @param {string} name The name of the data to recover
    * @param {object} defaultValue, if not supplied is null
    * @return {object} The recovered object
    */
    getSessionJson: function (name, defaultValue)
    {
        if (defaultValue === undefined)
        {
            defaultValue = null;
        }

        var recovered = sessionStorage.getItem(name);
        if (recovered !== null)
        {
            recovered = JSON.parse(recovered);
        }
        else
        {
            recovered = defaultValue;
        }
        return recovered;
    },
    /**
    * @description Get the sesssion data, can specify a default value.
    * @param {string} name The name of the data to store
    * @param {object} value, if not supplied is null
    */
    storeJsonInSession: function (name, value)
    {
        sessionStorage.setItem(name, JSON.stringify(value));
    }
};