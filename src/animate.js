(function () {
    htmlrest.animate = htmlrest.animate || {}

    htmlrest.animate.NoAnimations = function(){

    }

    htmlrest.animate.NoAnimations.prototype.show = function (element) {
        $(element).show();
    }

    htmlrest.animate.NoAnimations.prototype.hide = function (element) {
        $(element).hide();
    }
})();