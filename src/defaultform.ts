///<amd-module name="hr.defaultform"/>

import * as component from 'hr.components';
import {ComponentBuilder, VariantBuilder} from 'hr.componentbuilder';

//Register default components
if(!component.isDefined("hr.defaultform")){
    var builder = new ComponentBuilder(
        '<div class="form-group" data-hr-toggle="{{buildName}}Error" data-hr-class-on="has-error"><label class="control-label">{{title}}<span data-hr-view="{{buildName}}ErrorMessage" data-hr-toggle="{{buildName}}Error" data-hr-style-on="display:inline" style="display:none"> - {{{this}}}</span></label><input class="form-control" name="{{buildName}}" type="{{buildType}}" /></div>'
    );
    builder.addVariant("textarea", new VariantBuilder(
        '<div class="form-group" data-hr-toggle="{{buildName}}Error" data-hr-class-on="has-error"><label class="control-label">{{title}}<span data-hr-view="{{buildName}}ErrorMessage" data-hr-toggle="{{buildName}}Error" data-hr-style-on="display:inline" style="display:none"> - {{{this}}}</span></label><textarea class="form-control" name="{{buildName}}" rows="{{size}}" /></div>'
    ));
    builder.addVariant("checkbox", new VariantBuilder(
        '<div class="checkbox"><label><input type="checkbox" name="{{buildName}}" value="{{buildValue}}" />&nbsp;{{title}}</label></div>'
    ));
    builder.addVariant("hidden", new VariantBuilder(
        '<input type="hidden" name="{{buildName}}" />'
    ));
    builder.addVariant("select", new VariantBuilder(
        '<div class="form-group" data-hr-toggle="{{buildName}}Error" data-hr-class-on="has-error"><label class="control-label">{{title}}<span data-hr-view="{{buildName}}ErrorMessage" data-hr-toggle="{{buildName}}Error" data-hr-style-on="display:inline" style="display:none"> - {{{this}}}</span></label><select class="form-control" name="{{buildName}}"/></div>'
    ));
    builder.addVariant("multiselect", new VariantBuilder(
        '<div class="form-group" data-hr-toggle="{{buildName}}Error" data-hr-class-on="has-error"><label class="control-label">{{title}}<span data-hr-view="{{buildName}}ErrorMessage" data-hr-toggle="{{buildName}}Error" data-hr-style-on="display:inline" style="display:none"> - {{{this}}}</span></label><select class="form-control" name="{{buildName}}" multiple size="{{size}}"/></div>'
    ));
    builder.addVariant("arrayEditor", new VariantBuilder(
        '<div><label>{{title}}</label><div data-hr-view="items" data-hr-view-component="hr.defaultform-arrayEditorItem"></div><button class="btn btn-default" data-hr-on-click="add">Add</button></div>'
    ));
    component.register("hr.defaultform", builder.getFactory());

    var arrayEditorItem = new ComponentBuilder(
        '<div><button data-hr-on-click="remove" class="btn btn-default" data-hr-form-end>Remove</button></div>'
    );
    component.register("hr.defaultform-arrayEditorItem", arrayEditorItem.getFactory());
}