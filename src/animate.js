(function () {
    htmlrest.animate = htmlrest.animate || {}

    /**
     * An animator that directly changes styles by changing display type on the element between "none" and ""
     */
    htmlrest.animate.NoAnimations = function(){

    }

    /**
     * Show the passed element.
     * @param {HTMLElement} element - The element to show
     */
    htmlrest.animate.NoAnimations.prototype.show = function (element) {
        element.style.display = "";
    }

    /**
     * Hide the passed element.
     * @param {HTMLElement} element - The element to hide
     */
    htmlrest.animate.NoAnimations.prototype.hide = function (element) {
        element.style.display = "none";
    }
})();