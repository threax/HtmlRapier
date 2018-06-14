///<amd-module name="hr.defaultform"/>

import * as component from 'hr.components';
import {ComponentBuilder, VariantBuilder} from 'hr.componentbuilder';

//Register default components
if (!component.isDefined("hr.forms.default")) {
    var builder = new ComponentBuilder(
        '<div data-hr-toggle="{{buildName}}Hide" data-hr-style-on="display:none;"><div class="form-group" data-hr-toggle="{{buildName}}Error" data-hr-class-on="has-error"><label for="{{uniqueId}}" class="control-label">{{title}}<span data-hr-view="{{buildName}}ErrorMessage" data-hr-toggle="{{buildName}}Error" data-hr-style-on="display:inline" style="display:none"> - {{{this}}}</span></label><input id="{{uniqueId}}" class="form-control" name="{{buildName}}" type="{{buildType}}" /></div></div>'
    );
    builder.addVariant("date-time", new VariantBuilder(
        '<div data-hr-toggle="{{buildName}}Hide" data-hr-style-on="display:none;"><div class="form-group" data-hr-toggle="{{buildName}}Error" data-hr-class-on="has-error"><label for="{{uniqueId}}" class="control-label">{{title}}<span data-hr-view="{{buildName}}ErrorMessage" data-hr-toggle="{{buildName}}Error" data-hr-style-on="display:inline" style="display:none"> - {{{this}}}</span></label><input id="{{uniqueId}}" class="form-control" name="{{buildName}}" type="text" /></div></div>'
    ));
    builder.addVariant("date", new VariantBuilder(
        '<div data-hr-toggle="{{buildName}}Hide" data-hr-style-on="display:none;"><div class="form-group" data-hr-toggle="{{buildName}}Error" data-hr-class-on="has-error"><label for="{{uniqueId}}" class="control-label">{{title}}<span data-hr-view="{{buildName}}ErrorMessage" data-hr-toggle="{{buildName}}Error" data-hr-style-on="display:inline" style="display:none"> - {{{this}}}</span></label><input id="{{uniqueId}}" class="form-control" name="{{buildName}}" type="text" /></div></div>'
    ));
    builder.addVariant("textarea", new VariantBuilder(
        '<div data-hr-toggle="{{buildName}}Hide" data-hr-style-on="display:none;"><div class="form-group" data-hr-toggle="{{buildName}}Error" data-hr-class-on="has-error"><label for="{{uniqueId}}" class="control-label">{{title}}<span data-hr-view="{{buildName}}ErrorMessage" data-hr-toggle="{{buildName}}Error" data-hr-style-on="display:inline" style="display:none"> - {{{this}}}</span></label><textarea id="{{uniqueId}}" class="form-control" name="{{buildName}}" rows="{{size}}"></textarea></div></div>'
    ));
    builder.addVariant("checkbox", new VariantBuilder(
        '<div data-hr-toggle="{{buildName}}Hide" data-hr-style-on="display:none;"><div class="checkbox"><label><input type="checkbox" name="{{buildName}}" value="{{buildValue}}" />&nbsp;{{title}}</label></div></div>'
    ));
    builder.addVariant("hidden", new VariantBuilder(
        '<input id="{{uniqueId}}" type="hidden" name="{{buildName}}" />'
    ));
    builder.addVariant("select", new VariantBuilder(
        '<div data-hr-toggle="{{buildName}}Hide" data-hr-style-on="display:none;"><div class="form-group" data-hr-toggle="{{buildName}}Error" data-hr-class-on="has-error"><label for="{{uniqueId}}" class="control-label">{{title}}<span data-hr-view="{{buildName}}ErrorMessage" data-hr-toggle="{{buildName}}Error" data-hr-style-on="display:inline" style="display:none"> - {{{this}}}</span></label><select id="{{uniqueId}}" class="form-control" name="{{buildName}}"/></div></div>'
    ));
    builder.addVariant("multiselect", new VariantBuilder(
        '<div data-hr-toggle="{{buildName}}Hide" data-hr-style-on="display:none;"><div class="form-group" data-hr-toggle="{{buildName}}Error" data-hr-class-on="has-error"><label for="{{uniqueId}}" class="control-label">{{title}}<span data-hr-view="{{buildName}}ErrorMessage" data-hr-toggle="{{buildName}}Error" data-hr-style-on="display:inline" style="display:none"> - {{{this}}}</span></label><select id="{{uniqueId}}" class="form-control" name="{{buildName}}" multiple size="{{size}}"/></div></div>'
    ));
    builder.addVariant("arrayEditor", new VariantBuilder(
        '<div data-hr-toggle="{{buildName}}Hide" data-hr-style-on="display:none;">'
            +'<div data-hr-toggle="{{buildName}}Error" data-hr-class-on="has-error">'
            +'<label class="control-label">{{title}}<span data-hr-view="{{buildName}}ErrorMessage" data-hr-toggle="{{buildName}}Error" data-hr-style-on="display:inline" style="display:none"> - {{{this}}}</span></label>'
            +'<div class="panel panel-default"><div class="panel-body">'
                +'<div data-hr-view="items" data-hr-view-component="hr.forms.default-arrayEditorItem"></div>'
                +'<button class="btn btn-default" data-hr-on-click="add">Add</button>'
            +'</div></div>'
        +'</div></div>'
    ));
    builder.addVariant("multicheckbox", new VariantBuilder(
        '<div data-hr-toggle="{{buildName}}Hide" data-hr-style-on="display:none;">' +
            '<div class="form-group" data-hr-toggle="{{buildName}}Error" data-hr-class-on="has-error">' +
                '<label class="control-label">{{title}}<span data-hr-view="{{buildName}}ErrorMessage" data-hr-toggle="{{buildName}}Error" data-hr-style-on="display:inline" style="display:none"> - {{{this}}}</span></label>' +
                '<div class="panel panel-default" style="max-height:150px;overflow:auto;">' +
                    '<div data-hr-view="items" data-hr-view-component="hr.forms.default-multicheckboxitem"></div>' +
                '</div>' + 
                '<div class="clearfix"></div>' +
            '</div>' + 
        '</div>'
    ));
    builder.addVariant("radiobutton", new VariantBuilder(
        '<div data-hr-toggle="{{buildName}}Hide" data-hr-style-on="display:none;">' +
        '<div class="form-group" data-hr-toggle="{{buildName}}Error" data-hr-class-on="has-error">' +
            '<label class="control-label">{{title}}<span data-hr-view="{{buildName}}ErrorMessage" data-hr-toggle="{{buildName}}Error" data-hr-style-on="display:inline" style="display:none"> - {{{this}}}</span></label>' +
            '<div data-hr-view="items" data-hr-view-component="hr.forms.default-radiobutton"></div>' +
        '</div></div>'
    ));
    builder.addVariant("search", new VariantBuilder(
        `<div data-hr-toggle="{{buildName}}Hide" data-hr-style-on="display:none;">
            <div class="form-group" data-hr-toggle="{{buildName}}Error" data-hr-class-on="has-error">
                <label for="{{uniqueId}}" class="control-label">
                    {{title}}<span data-hr-view="{{buildName}}ErrorMessage" data-hr-toggle="{{buildName}}Error" data-hr-style-on="display:inline" style="display:none"> - {{{this}}}</span>
                </label>
                <div data-hr-on-focusout="stopSearch" data-hr-handle="searchFocusParent">
                    <input id="{{uniqueId}}" class="form-control" name="{{buildName}}" type="text" data-hr-on-input="updateSearch" />
                    <div class="dropdown" data-hr-toggle="popup" data-hr-class-on="open">
                        <ul class="dropdown-menu" data-hr-view="results" data-hr-view-component="hr.forms.default-searchResult"></ul>
                    </div>
                </div>
            </div>
        </div>`
    ));
    component.register("hr.forms.default", builder);

    component.register("hr.forms.default-multicheckboxitem", new ComponentBuilder(
        '<div class="checkbox"><label><input type="checkbox" value="{{value}}" data-hr-handle="check" />&nbsp;{{label}}</label></div>'
    ));

    component.register("hr.forms.default-radiobutton", new ComponentBuilder(
        '<div class="radio"><label><input type="radio" name="{{name}}" value="{{value}}" data-hr-handle="radio" />&nbsp;{{label}}</label></div>'
    ));

    component.register("hr.forms.default-arrayEditorItem", new ComponentBuilder(
        '<div class="panel panel-default"><div class="panel-body"><button data-hr-on-click="remove" class="btn btn-default" data-hr-form-end>Remove</button></div></div>'
    ));

    component.register("hr.forms.default-searchResult", new ComponentBuilder(
        '<li><a href="#" data-hr-on-click="selectItem">{{title}}</a></li>'
    ));
}

//Register horizontal form
if (!component.isDefined("hr.forms.horizontal")) {
    var builder = new ComponentBuilder(
        '<div data-hr-toggle="{{buildName}}Hide" data-hr-style-on="display:none;"><div class="form-group" data-hr-toggle="{{buildName}}Error" data-hr-class-on="has-error"><label for="{{uniqueId}}" class="col-sm-2 control-label">{{title}}<span data-hr-view="{{buildName}}ErrorMessage" data-hr-toggle="{{buildName}}Error" data-hr-style-on="display:inline" style="display:none"> - {{{this}}}</span></label><div class="col-sm-10"><input id="{{uniqueId}}" class="form-control" name="{{buildName}}" type="{{buildType}}" /></div></div></div>'
    );
    builder.addVariant("date-time", new VariantBuilder(
        '<div data-hr-toggle="{{buildName}}Hide" data-hr-style-on="display:none;"><div class="form-group" data-hr-toggle="{{buildName}}Error" data-hr-class-on="has-error"><label for="{{uniqueId}}" class="col-sm-2 control-label">{{title}}<span data-hr-view="{{buildName}}ErrorMessage" data-hr-toggle="{{buildName}}Error" data-hr-style-on="display:inline" style="display:none"> - {{{this}}}</span></label><div class="col-sm-10"><input id="{{uniqueId}}" class="form-control" name="{{buildName}}" type="text" /></div></div></div>'
    ));
    builder.addVariant("date", new VariantBuilder(
        '<div data-hr-toggle="{{buildName}}Hide" data-hr-style-on="display:none;"><div class="form-group" data-hr-toggle="{{buildName}}Error" data-hr-class-on="has-error"><label for="{{uniqueId}}" class="col-sm-2 control-label">{{title}}<span data-hr-view="{{buildName}}ErrorMessage" data-hr-toggle="{{buildName}}Error" data-hr-style-on="display:inline" style="display:none"> - {{{this}}}</span></label><div class="col-sm-10"><input id="{{uniqueId}}" class="form-control" name="{{buildName}}" type="text" /></div></div></div>'
    ));
    builder.addVariant("textarea", new VariantBuilder(
        '<div data-hr-toggle="{{buildName}}Hide" data-hr-style-on="display:none;"><div class="form-group" data-hr-toggle="{{buildName}}Error" data-hr-class-on="has-error"><label for="{{uniqueId}}" class="col-sm-2 control-label">{{title}}<span data-hr-view="{{buildName}}ErrorMessage" data-hr-toggle="{{buildName}}Error" data-hr-style-on="display:inline" style="display:none"> - {{{this}}}</span></label><div class="col-sm-10"><textarea id="{{uniqueId}}" class="form-control" name="{{buildName}}" rows="{{size}}"></textarea></div></div></div>'
    ));
    builder.addVariant("checkbox", new VariantBuilder(
        '<div data-hr-toggle="{{buildName}}Hide" data-hr-style-on="display:none;"><div class="form-group"><div class="col-sm-offset-2 col-sm-10"><div class="checkbox"><label><input type="checkbox" name="{{buildName}}" value="{{buildValue}}" />&nbsp;{{title}}</label></div></div></div></div>'
    ));
    builder.addVariant("hidden", new VariantBuilder(
        '<input type="hidden" name="{{buildName}}" />'
    ));
    builder.addVariant("select", new VariantBuilder(
        '<div data-hr-toggle="{{buildName}}Hide" data-hr-style-on="display:none;"><div class="form-group" data-hr-toggle="{{buildName}}Error" data-hr-class-on="has-error"><label for="{{uniqueId}}" class="col-sm-2 control-label">{{title}}<span data-hr-view="{{buildName}}ErrorMessage" data-hr-toggle="{{buildName}}Error" data-hr-style-on="display:inline" style="display:none"> - {{{this}}}</span></label><div class="col-sm-10"><select id="{{uniqueId}}" class="form-control" name="{{buildName}}"/></div></div></div>'
    ));
    builder.addVariant("multiselect", new VariantBuilder(
        '<div data-hr-toggle="{{buildName}}Hide" data-hr-style-on="display:none;"><div class="form-group" data-hr-toggle="{{buildName}}Error" data-hr-class-on="has-error"><label for="{{uniqueId}}" class="col-sm-2 control-label">{{title}}<span data-hr-view="{{buildName}}ErrorMessage" data-hr-toggle="{{buildName}}Error" data-hr-style-on="display:inline" style="display:none"> - {{{this}}}</span></label><div class="col-sm-10"><select id="{{uniqueId}}" class="form-control" name="{{buildName}}" multiple size="{{size}}"/></div></div></div>'
    ));
    builder.addVariant("arrayEditor", new VariantBuilder(
        '<div data-hr-toggle="{{buildName}}Hide" data-hr-style-on="display:none;">'
            +'<div data-hr-toggle="{{buildName}}Error" data-hr-class-on="has-error">'
                +'<label class="control-label col-sm-2">{{title}}<span data-hr-view="{{buildName}}ErrorMessage" data-hr-toggle="{{buildName}}Error" data-hr-style-on="display:inline" style="display:none"> - {{{this}}}</span></label>'
                +'<div class="col-sm-10 panel panel-default"><div class="panel-body">'
                    +'<div data-hr-view="items" data-hr-view-component="hr.forms.horizontal-arrayEditorItem"></div>'
                    +'<button class="btn btn-default" data-hr-on-click="add">Add</button>'
                +'</div></div>'
        +'</div></div>'
    ));
    builder.addVariant("multicheckbox", new VariantBuilder(
        '<div data-hr-toggle="{{buildName}}Hide" data-hr-style-on="display:none;">' +
            '<div data-hr-toggle="{{buildName}}Error" data-hr-class-on="has-error">' +
                '<label class="control-label col-sm-2">{{title}}<span data-hr-view="{{buildName}}ErrorMessage" data-hr-toggle="{{buildName}}Error" data-hr-style-on="display:inline" style="display:none"> - {{{this}}}</span></label>' +
                '<div class="col-sm-10 panel panel-default" style="max-height:150px;overflow:auto;">' +
                    '<div class="panel-body" data-hr-view="items" data-hr-view-component="hr.forms.horizontal-multicheckboxitem"></div>' +
                '</div>' + 
                '<div class="clearfix"></div>' +
            '</div>' + 
        '</div>'
    ));
    builder.addVariant("radiobutton", new VariantBuilder(
        '<div data-hr-toggle="{{buildName}}Hide" data-hr-style-on="display:none;">' +
        '<div class="form-group" data-hr-toggle="{{buildName}}Error" data-hr-class-on="has-error">' +
            '<label class="control-label col-sm-2">{{title}}<span data-hr-view="{{buildName}}ErrorMessage" data-hr-toggle="{{buildName}}Error" data-hr-style-on="display:inline" style="display:none"> - {{{this}}}</span></label>' +
            '<div class="col-sm-10" data-hr-view="items" data-hr-view-component="hr.forms.horizontal-radiobutton"></div>' +
        '</div></div>'
    ));
    builder.addVariant("search", new VariantBuilder(
        `<div data-hr-toggle="{{buildName}}Hide" data-hr-style-on="display:none;">
            <div class="form-group" data-hr-toggle="{{buildName}}Error" data-hr-class-on="has-error">
                <label for="{{uniqueId}}" class="col-sm-2 control-label">
                    {{title}}<span data-hr-view="{{buildName}}ErrorMessage" data-hr-toggle="{{buildName}}Error" data-hr-style-on="display:inline" style="display:none"> - {{{this}}}</span>
                </label>
                <div class="col-sm-10" data-hr-on-focusout="stopSearch" data-hr-handle="searchFocusParent">
                    <input id="{{uniqueId}}" class="form-control" name="{{buildName}}" type="text" data-hr-on-input="updateSearch"/>
                    <div class="dropdown" data-hr-toggle="popup" data-hr-class-on="open">
                        <ul class="dropdown-menu" data-hr-view="results" data-hr-view-component="hr.forms.horizontal-searchResult">
                        </ul>
                    </div>
                </div>
            </div>
        </div>`
    ));
    component.register("hr.forms.horizontal", builder);

    component.register("hr.forms.horizontal-multicheckboxitem", new ComponentBuilder(
        '<div class="checkbox"><label><input type="checkbox" value="{{value}}" data-hr-handle="check" />&nbsp;{{label}}</label></div>'
    ));

    component.register("hr.forms.horizontal-radiobutton", new ComponentBuilder(
        '<div class="radio"><label><input type="radio" name="{{name}}" value="{{value}}" data-hr-handle="radio" />&nbsp;{{label}}</label></div>'
    ));

    component.register("hr.forms.horizontal-arrayEditorItem", new ComponentBuilder(
        '<div class="panel panel-default"><div class="panel-body"><button data-hr-on-click="remove" class="btn btn-default" data-hr-form-end>Remove</button></div></div>'
    ));

    component.register("hr.forms.horizontal-searchResult", new ComponentBuilder(
        '<li><a href="#" data-hr-on-click="selectItem">{{title}}</a></li>'
    ));
}