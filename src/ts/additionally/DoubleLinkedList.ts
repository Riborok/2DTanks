class DoubleLinkedListNode<T> {
    private readonly _value: T;
    private _prev: DoubleLinkedListNode<T> | null = null;
    private _next: DoubleLinkedListNode<T> | null = null;
    public get value(): T { return this._value }
    public get prev(): DoubleLinkedListNode<T> | null { return this._prev }
    public get next(): DoubleLinkedListNode<T> | null { return this._next }
    public set next(listNode: DoubleLinkedListNode<T> | null) { this._next = listNode }
    public set prev(listNode: DoubleLinkedListNode<T> | null) { this._prev = listNode }
    public constructor(value: T) {
        this._value = value;
    }
    public remove() {
        if (this._prev !== null)
            this._prev.next = this._next;

        if (this._next !== null)
            this._next.prev = this._prev;

        this._prev = null;
        this._next = null;
    }
}

export class DoubleLinkedList<T> implements Iterable<T> {
    private _head: DoubleLinkedListNode<T> | null = null;
    private _tail: DoubleLinkedListNode<T> | null = null;
    public get tail(): DoubleLinkedListNode<T> | null { return this._tail }
    public get head(): DoubleLinkedListNode<T> | null { return this._head }
    [Symbol.iterator](): Iterator<T> {
        let currentNode = this._tail;

        return {
            next: (): IteratorResult<T> => {
                if (currentNode !== null) {
                    const value = currentNode.value;
                    currentNode = currentNode.next;

                    return { done: false, value: value }
                }
                else
                    return { done: true, value: null }
            }
        };
    }
    public remove(node: DoubleLinkedListNode<T>) {
        if (node === this._head)
            this._head = node.prev;

        if (node === this._tail)
            this._tail = node.next;

        node.remove();
    }
    public addToTail(value: T) {
        const newNode = new DoubleLinkedListNode(value);

        if (this._tail === null) {
            this._head = newNode;
            this._tail = newNode;
        }
        else {
            newNode.next = this._tail;
            this._tail.prev = newNode;
            this._tail = newNode;
        }
    }
    public addToHead(value: T) {
        const newNode = new DoubleLinkedListNode(value);

        if (this._head === null) {
            this._head = newNode;
            this._tail = newNode;
        }
        else {
            newNode.prev = this._head;
            this._head.next = newNode;
            this._head = newNode;
        }
    }
    public removeFromHead() {
        if (this._head === null)
            return;

        if (this._head === this._tail) {
            this._head = null;
            this._tail = null;
        }
        else {
            this._head = this._head.prev;
            this._head.next = null;
        }
    }
    public removeFromTail() {
        if (this._tail === null)
            return;

        if (this._head === this._tail) {
            this._head = null;
            this._tail = null;
        }
        else {
            this._tail = this._tail.next;
            this._tail.prev = null;
        }
    }
    public moveToHead(value: T) {
        let currentNode = this._head;
        while (currentNode !== null) {
            if (currentNode.value === value) {
                if (currentNode !== this._head) {
                    const prevNode = currentNode.prev;
                    const nextNode = currentNode.next;
                    if (prevNode !== null)
                        prevNode.next = nextNode;
                    nextNode.prev = prevNode;

                    currentNode.next = null;
                    currentNode.prev = this._head;
                    this._head.next = currentNode;
                    this._head = currentNode;
                }
                return;
            }
            currentNode = currentNode.prev;
        }
    }
    public clear() {
        this._head = null;
        this._tail = null;
    }
}