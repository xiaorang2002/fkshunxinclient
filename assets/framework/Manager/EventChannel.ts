import { Delegate } from './ListenerManager';

export class EventChannel {
    private static instance: EventChannel;
    private clientEventMap = new Map<number, Map<any, Delegate[]>>();

    public static getInstance(): EventChannel {
        if (this.instance == null)
            this.instance = new EventChannel();

        return this.instance;
    }

    private addListener(type: number, caller: any, listener: Function, ...argArray: any[]): void {
        let delegate = this.find(type, caller, listener);
        if (delegate) {
            delegate.isOnce = false;
        }
        else {
            let delegate = new Delegate(listener, argArray, false);
            this.clientEventMap.get(type).get(caller).push(delegate);
        }
    }

    public add(type: number, caller: any, listener: Function, ...argArray: any[]): void {
        this.addListener(type, caller, listener, false, ...argArray);
    }

    private find(type: number, caller: any, listener: Function): Delegate {
        if (!type) {
            return null;
        }

        if (!caller) {
            return null;
        }
        if (!listener) {
            return null;
        }

        let listenerMap: Map<any, Delegate[]>;
        if (this.clientEventMap.has(type)) {
            listenerMap = this.clientEventMap.get(type);
        }
        else {
            listenerMap = new Map<any, Delegate[]>();
            this.clientEventMap.set(type, listenerMap);
        }

        let listenerList: Delegate[];
        if (listenerMap.has(caller)) {
            listenerList = listenerMap.get(caller);
        }
        else {
            listenerList = [];
            listenerMap.set(caller, listenerList);
        }

        for (let delegate of listenerList) {
            if (delegate.mListener === listener) {
                return delegate;
            }
        }

        return null;
    }

    public trigger(type: number, ...argArray: any[]): boolean {
        if (!type) {
            return false;
        }

        let delegateList: Delegate[] = [];
        let callerList: any[] = [];
        let listenerMap = this.clientEventMap.get(type);
        if (listenerMap) {
            listenerMap.forEach((listenerList, caller) => {
                for (let delegate of listenerList) {
                    delegateList.push(delegate);
                    callerList.push(caller);
                }
                for (let index = listenerList.length - 1; index >= 0; --index) {
                    if (listenerList[index].isOnce) {
                        listenerList.splice(index, 1);
                    }
                }
                if (listenerList.length <= 0) {
                    listenerMap.delete(caller);
                }
            });
            if (listenerMap.size <= 0) {
                this.clientEventMap.delete(type);
            }
        }

        let length = delegateList.length;
        for (let index = 0; index < length; index++) {
            let delegate: Delegate = delegateList[index];
            delegate.listener.call(callerList[index], ...delegate.argArray, ...argArray);
        }
        return length > 0;
    }

    public removeAll(caller: any): void {
        this.clientEventMap.forEach((listenerMap, type) => {
            listenerMap.delete(caller);
            if (listenerMap.size <= 0) {
                this.clientEventMap.delete(type);
            }
        });
    }

}

