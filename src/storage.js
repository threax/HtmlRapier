htmlrest.storage =
{
    startupData: {},
    getSessionStorageJson: function(name, defaultValue){
        if (defaultValue === undefined) {
            defaultValue = {};
        }

        var recovered = sessionStorage.getItem(name);
        if (recovered !== null) {
            recovered = JSON.parse(recovered);
        }
        else {
            recovered = defaultValue;
        }
        return recovered;
    }
};