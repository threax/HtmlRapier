var thingy = {};

jsns.run(function (using) {
    //function outputFactory() {
    //    var iter = jsns.getFac();
        
    //    for (key in iter) {
    //        intellisense.logMessage("lib " + key);
    //        var lib = iter[key]();
    //        for(libKey in lib){
    //            intellisense.logMessage("   key " + libKey + " val " + lib[libKey]);
    //        }
    //    }
    //}

    //function outputModule() {
    //    var iter = jsns.getMod();
    //    intellisense.logMessage("modules " + iter);
    //    outputObject(iter);
    //}

    function outputObject(iter){
        for (key in iter) {
            intellisense.logMessage("key " + key + " val " + iter[key]);
        }
    }

    intellisense.addEventListener('statementcompletion', function (e) {
        //if (e.targetName === 'debug') {
            intellisense.logMessage("Debug jsns");

            //intellisense.logMessage("comments " + " " + iter + " "  + intellisense.getFunctionComments(iter));

            //outputFactory();

            var rest = using("htmlrest.rest");
            intellisense.logMessage('restaazaaa');
            //outputObject(rest);

            // Prints out all statement completion items.
            //e.items.forEach(function (item) {
            //    //intellisense.logMessage('[completion item] ' + item.name + ', kind:' + item.kind + ', scope:' + item.scope + ', value:' + item.value);
            //    //item.name = "things";
            //});
        //}
    });
});