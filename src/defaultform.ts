///<amd-module name="hr.defaultform"/>

import * as component from 'hr.components';
import {ComponentBuilder, VariantBuilder} from 'hr.componentbuilder';

//Register default components
if (!component.isDefined("hr.forms.default")) {
    var builder = new ComponentBuilder(
        '<div class="form-group" data-hr-toggle="{{buildName}}Error" data-hr-class-on="has-error"><label class="control-label">{{title}}<span data-hr-view="{{buildName}}ErrorMessage" data-hr-toggle="{{buildName}}Error" data-hr-style-on="display:inline" style="display:none"> - {{{this}}}</span></label><input class="form-control" name="{{buildName}}" type="{{buildType}}" /></div>'
    );
    builder.addVariant("date-time", new VariantBuilder(
        '<div class="form-group" data-hr-toggle="{{buildName}}Error" data-hr-class-on="has-error"><label class="control-label">{{title}}<span data-hr-view="{{buildName}}ErrorMessage" data-hr-toggle="{{buildName}}Error" data-hr-style-on="display:inline" style="display:none"> - {{{this}}}</span></label><input class="form-control" name="{{buildName}}" type="text" /></div>'
    ));
    builder.addVariant("date", new VariantBuilder(
        '<div class="form-group" data-hr-toggle="{{buildName}}Error" data-hr-class-on="has-error"><label class="control-label">{{title}}<span data-hr-view="{{buildName}}ErrorMessage" data-hr-toggle="{{buildName}}Error" data-hr-style-on="display:inline" style="display:none"> - {{{this}}}</span></label><input class="form-control" name="{{buildName}}" type="text" /></div>'
    ));
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
        '<div><label>{{title}}</label><div data-hr-view="items" data-hr-view-component="hr.forms.default-arrayEditorItem"></div><button class="btn btn-default" data-hr-on-click="add">Add</button></div>'
    ));
    component.register("hr.forms.default", builder);

    var arrayEditorItem = new ComponentBuilder(
        '<div><button data-hr-on-click="remove" class="btn btn-default" data-hr-form-end>Remove</button></div>'
    );
    component.register("hr.forms.default-arrayEditorItem", arrayEditorItem);
}

//Register horizontal form
if (!component.isDefined("hr.forms.horizontal")) {
    var builder = new ComponentBuilder(
        '<div class="form-group" data-hr-toggle="{{buildName}}Error" data-hr-class-on="has-error"><label class="col-sm-2 control-label">{{title}}<span data-hr-view="{{buildName}}ErrorMessage" data-hr-toggle="{{buildName}}Error" data-hr-style-on="display:inline" style="display:none"> - {{{this}}}</span></label><div class="col-sm-10"><input class="form-control" name="{{buildName}}" type="{{buildType}}" /></div></div>'
    );
    builder.addVariant("date-time", new VariantBuilder(
        '<div class="form-group" data-hr-toggle="{{buildName}}Error" data-hr-class-on="has-error"><label class="col-sm-2 control-label">{{title}}<span data-hr-view="{{buildName}}ErrorMessage" data-hr-toggle="{{buildName}}Error" data-hr-style-on="display:inline" style="display:none"> - {{{this}}}</span></label><div class="col-sm-10"><input class="form-control" name="{{buildName}}" type="text" /></div></div>'
    ));
    builder.addVariant("date", new VariantBuilder(
        '<div class="form-group" data-hr-toggle="{{buildName}}Error" data-hr-class-on="has-error"><label class="col-sm-2 control-label">{{title}}<span data-hr-view="{{buildName}}ErrorMessage" data-hr-toggle="{{buildName}}Error" data-hr-style-on="display:inline" style="display:none"> - {{{this}}}</span></label><div class="col-sm-10"><input class="form-control" name="{{buildName}}" type="text" /></div></div>'
    ));
    builder.addVariant("textarea", new VariantBuilder(
        '<div class="form-group" data-hr-toggle="{{buildName}}Error" data-hr-class-on="has-error"><label class="col-sm-2 control-label">{{title}}<span data-hr-view="{{buildName}}ErrorMessage" data-hr-toggle="{{buildName}}Error" data-hr-style-on="display:inline" style="display:none"> - {{{this}}}</span></label><div class="col-sm-10"><textarea class="form-control" name="{{buildName}}" rows="{{size}}" /></div></div>'
    ));
    builder.addVariant("checkbox", new VariantBuilder(
        '<div class="form-group"><div class="col-sm-offset-2 col-sm-10"><div class="checkbox"><label><input type="checkbox" name="{{buildName}}" value="{{buildValue}}" />&nbsp;{{title}}</label></div></div></div>'
    ));
    builder.addVariant("hidden", new VariantBuilder(
        '<input type="hidden" name="{{buildName}}" />'
    ));
    builder.addVariant("select", new VariantBuilder(
        '<div class="form-group" data-hr-toggle="{{buildName}}Error" data-hr-class-on="has-error"><label class="col-sm-2 control-label">{{title}}<span data-hr-view="{{buildName}}ErrorMessage" data-hr-toggle="{{buildName}}Error" data-hr-style-on="display:inline" style="display:none"> - {{{this}}}</span></label><div class="col-sm-10"><select class="form-control" name="{{buildName}}"/></div></div>'
    ));
    builder.addVariant("multiselect", new VariantBuilder(
        '<div class="form-group" data-hr-toggle="{{buildName}}Error" data-hr-class-on="has-error"><label class="col-sm-2 control-label">{{title}}<span data-hr-view="{{buildName}}ErrorMessage" data-hr-toggle="{{buildName}}Error" data-hr-style-on="display:inline" style="display:none"> - {{{this}}}</span></label><div class="col-sm-10"><select class="form-control" name="{{buildName}}" multiple size="{{size}}"/></div></div>'
    ));
    builder.addVariant("arrayEditor", new VariantBuilder(
        '<div><label>{{title}}</label><div data-hr-view="items" data-hr-view-component="hr.forms.horizontal-arrayEditorItem"></div><button class="btn btn-default" data-hr-on-click="add">Add</button></div>'
    ));
    component.register("hr.forms.horizontal", builder);

    var arrayEditorItem = new ComponentBuilder(
        '<div><button data-hr-on-click="remove" class="btn btn-default" data-hr-form-end>Remove</button></div>'
    );
    component.register("hr.forms.horizontal-arrayEditorItem", arrayEditorItem);
}