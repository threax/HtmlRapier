(function () {
    htmlrest.animate = htmlrest.animate || {}

    htmlrest.animate.NoAnimations = function(){

    }

    htmlrest.animate.NoAnimations.prototype.show = function (element) {
        element.style.display = "";
    }

    htmlrest.animate.NoAnimations.prototype.hide = function (element) {
        element.style.display = "none";
    }
})();