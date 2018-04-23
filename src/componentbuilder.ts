///<amd-module name="hr.componentbuilder"/>

import {BindingCollection} from 'hr.bindingcollection';
import { TextStream } from 'hr.textstream';
import { IComponentBuilder } from 'hr.components';

export class VariantBuilder{
    private tokenizedString: TextStream;
    private currentBuildFunc;

    constructor(private componentString: string){
        this.currentBuildFunc = this.tokenize;
    }

    public tokenize(data, parentComponent, insertBeforeSibling) {
        this.tokenizedString = new TextStream(this.componentString);
        this.currentBuildFunc = this.build;
        return this.build(data, parentComponent, insertBeforeSibling);
    }

    public build(data, parentComponent, insertBeforeSibling) {
        return createItem(data, this.tokenizedString, parentComponent, insertBeforeSibling);
    }

    public create(data, parentComponent, insertBeforeSibling) {
        return this.currentBuildFunc(data, parentComponent, insertBeforeSibling);
    }
}

type VariantBuilderMap = {[key: string]: VariantBuilder};

export class ComponentBuilder implements IComponentBuilder {
    private variants: VariantBuilderMap = {};
    private tokenizedString;
    private currentBuildFunc;

    constructor(private componentString: string){
        this.currentBuildFunc = this.tokenize;
    }

    public tokenize(data, parentComponent, insertBeforeSibling) {
        this.tokenizedString = new TextStream(this.componentString);
        this.currentBuildFunc = this.build;
        return this.build(data, parentComponent, insertBeforeSibling);
    }

    public build(data, parentComponent, insertBeforeSibling) {
        return createItem(data, this.tokenizedString, parentComponent, insertBeforeSibling);
    }

    public create(data, parentComponent, insertBeforeSibling, variant) {
        if (variant !== null && this.variants.hasOwnProperty(variant)) {
            return this.variants[variant].create(data, parentComponent, insertBeforeSibling);
        }
        return this.currentBuildFunc(data, parentComponent, insertBeforeSibling);
    }

    public addVariant(name: string, variantBuilder: VariantBuilder) {
        this.variants[name] = variantBuilder;
    }
}

//Component creation function
function createItem(data, componentStringStream, parentComponent, insertBeforeSibling) {
    var itemMarkup = componentStringStream.format(data);
    var newItems = str2DOMElement(itemMarkup);
    var arrayedItems = [];

    for (var i = 0; i < newItems.length; ++i) {
        var newItem = newItems[i];
        parentComponent.insertBefore(newItem, insertBeforeSibling);
        arrayedItems.push(newItem);
    }

    return new BindingCollection(arrayedItems);
}

//Actual creation function
function str2DOMElement(html: string) {
    //From j Query and the discussion on http://krasimirtsonev.com/blog/article/Revealing-the-magic-how-to-properly-convert-HTML-string-to-a-DOM-element
    //Modified, does not support body tags and returns collections of children

    var wrapMap: any = {
        option: [1, "<select multiple='multiple'>", "</select>"],
        legend: [1, "<fieldset>", "</fieldset>"],
        area: [1, "<map>", "</map>"],
        param: [1, "<object>", "</object>"],
        thead: [1, "<table>", "</table>"],
        tr: [2, "<table><tbody>", "</tbody></table>"],
        col: [2, "<table><tbody></tbody><colgroup>", "</colgroup></table>"],
        td: [3, "<table><tbody><tr>", "</tr></tbody></table>"],
        body: [0, "", ""],
        _default: [1, "<div>", "</div>"]
    };
    wrapMap.optgroup = wrapMap.option;
    wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
    wrapMap.th = wrapMap.td;
    var match = /<\s*\w.*?>/g.exec(html);
    var element: any = document.createElement('div');
    if (match != null) {
        var tag = match[0].replace(/</g, '').replace(/>/g, '').split(' ')[0];
        var map = wrapMap[tag] || wrapMap._default, element;
        html = map[1] + html + map[2];
        element.innerHTML = html;
        // Descend through wrappers to the right content
        var j = map[0];
        while (j--) {
            element = element.lastChild;
        }
    } else {
        element.innerHTML = html;
    }

    return element.childNodes;
}