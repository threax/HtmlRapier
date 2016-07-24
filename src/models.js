"use strict";

jsns.define("htmlrest.models", [
    "htmlrest.form",
    "htmlrest.textstream",
    "htmlrest.components",
    "htmlrest.typeidentifiers"
],
function(exports, module, forms, TextStream, components, typeId){

    function FormModel(form, src) {
        this.setData = function (data) {
            forms.populate(form, data);
        }

        this.appendData = this.setData;

        this.getData = function () {
            return forms.serialize(form);
        }

        this.getSrc = function () {
            return src;
        }
    }

    function ComponentModel(element, src, component) {
        this.setData = function (data, createdCallback) {
            components.empty(element);
            this.appendData(data, createdCallback);
        }

        this.appendData = function (data, createdCallback) {
            if (typeId.isArray(data) || typeId.isFunction(data)) {
                components.repeat(component, element, data, createdCallback);
            }
            else if (data) {
                components.single(component, element, data, createdCallback);
            }
        }

        this.getData = function () {
            return {};
        }

        this.getSrc = function () {
            return src;
        }
    }

    function TextNodeModel(element, src) {
        var dataTextElements = undefined;

        this.setData = function (data) {
            dataTextElements = bindData(data, element, dataTextElements);
        }

        this.appendData = this.setData;

        this.getData = function () {
            return {};
        }

        this.getSrc = function () {
            return src;
        }
    }

    function bindData(data, element, dataTextElements) {
        //No found elements, iterate everything.
        if (dataTextElements === undefined) {
            dataTextElements = [];
            var iter = document.createNodeIterator(element, NodeFilter.SHOW_TEXT, function (node) {
                var textStream = new TextStream(node.textContent);
                if (textStream.foundVariable()) {
                    node.textContent = textStream.format(data);
                    dataTextElements.push({
                        node: node,
                        stream: textStream
                    });
                }
            }, false);
            while (iter.nextNode()) { } //Have to walk to get results
        }
            //Already found the text elements, output those.
        else {
            for (var i = 0; i < dataTextElements.length; ++i) {
                var node = dataTextElements[i];
                node.node.textContent = node.stream.format(data);
            }
        }

        return dataTextElements;
    }

    function build(element) {
        var src = element.getAttribute('data-hr-model-src');
        if (element.nodeName === 'FORM') {
            return new FormModel(element, src);
        }
        else {
            var component = element.getAttribute('data-hr-model-component');
            if (component) {
                return new ComponentModel(element, src, component);
            }
            else {
                return new TextNodeModel(element, src);
            }
        }
    }
    exports.build = build;

    function NullModel() {
        this.setData = function (data) {

        }

        this.appendData = this.setData;

        this.getData = function () {
            return {};
        }

        this.getSrc = function () {
            return "";
        }
    }
    exports.NullModel = NullModel;
});