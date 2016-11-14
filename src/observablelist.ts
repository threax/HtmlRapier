import * as EventDispatcher from 'hr.eventdispatcher';

export class ObservableList<T>{
    private items:T[] = [];
    private itemAddedEvent = new EventDispatcher.ActionEventDispatcher<T>();
    private itemRemovedEvent = new EventDispatcher.ActionEventDispatcher<T>();

    add(value:T){
        this.items.push(value);
        this.itemAddedEvent.fire(value);
    }

    remove(value:T){
        var index = this.items.indexOf(value);
        if(index !== -1){
            var item = this.items.splice(index, 1);
            this.itemRemovedEvent.fire(item[0]);
        }
    }

    get itemAdded(){
        return this.itemAddedEvent.modifier;
    }

    get itemRemoved(){
        return this.itemRemovedEvent.modifier;
    }

    getItem(index:number){
        return this.items[index];
    }
}