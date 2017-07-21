///<amd-module name="hr.observablelist"/>

import * as EventDispatcher from 'hr.eventdispatcher';
import * as Iterable from 'hr.iterable';

/**
 * This class provides a list of items with events when they are added and removed.
 */
export class ObservableList<T>{
    private items:T[] = [];
    private itemAddedEvent = new EventDispatcher.ActionEventDispatcher<T>();
    private itemRemovedEvent = new EventDispatcher.ActionEventDispatcher<T>();

    /**
     * Add an item to the collection.
     */
    add(value:T){
        this.items.push(value);
        this.itemAddedEvent.fire(value);
    }

    /**
     * Remove an item from the collection.
     */
    remove(value:T){
        var index = this.items.indexOf(value);
        if(index !== -1){
            var item = this.items.splice(index, 1);
            this.itemRemovedEvent.fire(item[0]);
        }
    }

    /**
     * Clear the collection.
     */
    clear(fireEvents:boolean = true){
        if(fireEvents){
            for(var i = 0; i < this.items.length; ++i){
                this.itemRemovedEvent.fire(this.items[i]);
            }
        }
        this.items = [];
    }

    /**
     * The item added event. Fires when items are added.
     */
    get itemAdded(){
        return this.itemAddedEvent.modifier;
    }

    /**
     * The item removed event. Fires when items are removed.
     */
    get itemRemoved(){
        return this.itemRemovedEvent.modifier;
    }

    /**
     * Get an item at the specified index.
     */
    getItem(index:number){
        return this.items[index];
    }

    /**
     * The total number of items.
     */
    get count(){
        return this.items.length;
    }

    /**
     * An iterator over the items in the collection.
     */
    get iter(): Iterable.IterableInterface<T>{
        return new Iterable.Iterable(this.items);
    }
}