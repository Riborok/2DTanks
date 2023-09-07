class LinkedListNode<T> {
    private readonly _value: T;
    private _next: LinkedListNode<T> | null = null;
    public get value(): T { return this._value }
    public get next(): LinkedListNode<T> | null { return this._next }
    public set next(listNode: LinkedListNode<T> | null) { this._next = listNode }
    public constructor(value: T) {
        this._value = value;
    }
}

export interface ILinkedList<T> extends Iterable<T> {
    get head(): LinkedListNode<T> | null;
    addToHead(t: T): void;
    remove(t: T): void;
    removeFromHead(): void;
    clear(): void;
    isEmpty(): boolean;
}

export class LinkedList<T> implements ILinkedList<T> {
    private _head: LinkedListNode<T> | null = null;
    public get head(): LinkedListNode<T> | null { return this._head }
    *[Symbol.iterator](): Iterator<T> {
        let currentNode = this._head;

        while (currentNode !== null) {
            yield currentNode.value;
            currentNode = currentNode.next;
        }
    }
    public isEmpty(): boolean { return this._head === null }
    public addToHead(t: T) {
        const newNode = new LinkedListNode(t);
        newNode.next = this._head;
        this._head = newNode;
    }
    public remove(t: T) {
        let current = this._head;
        let prev = this._head;

        while (current !== null) {
            if (current.value === t) {
                if (prev === current)
                    this._head = this._head.next;
                else
                    prev.next = current.next;
                return;
            }
            prev = current;
            current = current.next;
        }
    }
    public removeFromHead() {
        if (this._head !== null)
            this._head = this._head.next;
    }
    public clear() {
        this._head = null;
    }
}