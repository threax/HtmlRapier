import * as formbuilder from './formbuilder';
import * as componentgatherer from './componentgatherer';

formbuilder.setup();
componentgatherer.gatherComponents();

export function setup() {
    return true;
}