htmlrest.lifecycle = htmlrest.lifecycle || {
    ajaxLoad: function (settings) {
        var mainDisplay = undefined;
        if (settings.mainDisplayQuery) {
            mainDisplay = $(settings.mainDisplayQuery);
        }

        var loadingFailDisplay = undefined;
        if (settings.loadingFailDisplayQuery) {
            loadingFailDisplay = $(settings.loadingFailDisplayQuery);
        }

        var loadingDisplay = undefined;
        if (settings.loadingDisplayQuery) {
            loadingDisplay = $(settings.loadingDisplayQuery);
        }

        //Display Functions
        this.loading = function() {
            hideAll();
            if (loadingDisplay) {
                loadingDisplay.show();
            }
        }

        this.failed = function () {
            hideAll();
            if (loadingFailDisplay) {
                loadingFailDisplay.show();
            }
        }

        this.succeeded = function () {
            hideAll();
            if (mainDisplay) {
                mainDisplay.show();
            }
        }

        function hideAll() {
            if (mainDisplay) {
                mainDisplay.hide();
            }
            if (loadingFailDisplay) {
                loadingFailDisplay.hide();
            }
            if (loadingDisplay) {
                loadingDisplay.hide();
            }
        }
    }
}