///<amd-module-off name="hr.componentbuilder"/>

import { BindingCollection } from './bindingcollection';
import { TextStream } from './textstream';
import { IComponentBuilder } from './components';
import * as textstream from './textstream';

export class VariantBuilder{
    private tokenizedString: TextStream = null;

    constructor(private componentString: string){
        
    }

    public create(data, parentComponent, insertBeforeSibling) {
        this.ensureTokenizer();
        return createItem(data, this.tokenizedString, parentComponent, insertBeforeSibling);
    }

    private ensureTokenizer(): void {
        if (this.tokenizedString === null) {
            this.tokenizedString = new TextStream(this.componentString);
        }
    }
}

type VariantBuilderMap = {[key: string]: VariantBuilder};

export class ComponentBuilder implements IComponentBuilder {
    private variants: VariantBuilderMap = {};
    private tokenizedString: TextStream = null;

    constructor(private componentString: string){
    }

    public create(data: textstream.ITextStreamData, parentComponent: Node, insertBeforeSibling: Node, variant: string) {
        if (variant !== null && this.variants.hasOwnProperty(variant)) {
            return this.variants[variant].create(data, parentComponent, insertBeforeSibling);
        }

        this.ensureTokenizer();
        return createItem(data, this.tokenizedString, parentComponent, insertBeforeSibling);
    }

    public addVariant(name: string, variantBuilder: VariantBuilder) {
        this.variants[name] = variantBuilder;
    }

    private ensureTokenizer(): void {
        if (this.tokenizedString === null) {
            this.tokenizedString = new TextStream(this.componentString);
        }
    }
}

//Component creation function
function createItem(data: textstream.ITextStreamData, componentStringStream: textstream.TextStream, parentComponent: Node, insertBeforeSibling: Node) {
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