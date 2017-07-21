///<amd-module name="hr.ignored"/>

"use strict";

import * as domQuery from 'hr.domquery';

//This module defines html nodes that are ignored and a way to check to see if a node is ignored or the
//child of an ignored node. Ignored nodes are defined with the data-hr-ignored attribute.
var ignoredNodes = domQuery.all('[data-hr-ignored]');

export function isIgnored(node) {
    for (var i = 0; i < ignoredNodes.length; ++i) {
        if (ignoredNodes[i].contains(node)) {
            return true;
        }
    }
    return false;
}