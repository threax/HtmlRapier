jsns.define("hr.data.paged", [
    "hr.rest",
    "hr.eventhandler"
],
function (exports, module, rest, EventHandler) {

    function PagedData(src, resultsPerPage) {
        var updating = new EventHandler();
        this.updating = updating.modifier;

        var updated = new EventHandler();
        this.updated = updated.modifier;

        var error = new EventHandler();
        this.error = error.modifier;

        this.resultsPerPage = resultsPerPage;
        this.currentPage = 0;

        function updateData() {
            updating.fire();
            var url = src + '?page=' + this.currentPage + '&count=' + this.resultsPerPage;
            rest.get(url,
                function (data) {
                    updated.fire(data);
                },
                function (data) {
                    error.fire(data);
                });
        }
        this.updateData = updateData;
    }

    module.exports = PagedData;
});