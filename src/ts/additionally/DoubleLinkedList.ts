import {IStorage} from "./type";

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

export class DoubleLinkedList<T> implements Iterable<T>, IStorage<T> {
    private _tail: DoubleLinkedListNode<T> | null = null;
    private _head: DoubleLinkedListNode<T> | null = null;
    public get head(): DoubleLinkedListNode<T> | null { return this._head }
    public get tail(): DoubleLinkedListNode<T> | null { return this._tail }
    [Symbol.iterator](): Iterator<T> {
        let currentNode = this._head;

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
    public insert(value: T) {
        this.addToTail(value);
    }
    public remove(value: T) {
        let currentNode = this._head;
        while (currentNode !== null) {
            if (currentNode.value === value) {
                this.removeNode(currentNode);
                return;
            }
            currentNode = currentNode.next;
        }
    }
    public removeNode(node: DoubleLinkedListNode<T>) {
        if (node === this._tail)
            this._tail = node.prev;

        if (node === this._head)
            this._head = node.next;

        node.remove();
    }
    public addToHead(value: T) {
        const newNode = new DoubleLinkedListNode(value);

        if (this._head === null) {
            this._tail = newNode;
            this._head = newNode;
        }
        else {
            newNode.next = this._head;
            this._head.prev = newNode;
            this._head = newNode;
        }
    }
    public addToTail(value: T) {
        const newNode = new DoubleLinkedListNode(value);

        if (this._tail === null) {
            this._tail = newNode;
            this._head = newNode;
        }
        else {
            newNode.prev = this._tail;
            this._tail.next = newNode;
            this._tail = newNode;
        }
    }
    public removeFromTail() {
        if (this._tail === null)
            return;

        if (this._tail === this._head) {
            this._tail = null;
            this._head = null;
        }
        else {
            this._tail = this._tail.prev;
            this._tail.next = null;
        }
    }
    public removeFromHead() {
        if (this._head === null)
            return;

        if (this._tail === this._head) {
            this._tail = null;
            this._head = null;
        }
        else {
            this._head = this._head.next;
            this._head.prev = null;
        }
    }
    public moveToTail(value: T) {
        let currentNode = this._tail;
        while (currentNode !== null) {
            if (currentNode.value === value) {
                if (currentNode !== this._tail) {
                    const prevNode = currentNode.prev;
                    const nextNode = currentNode.next;

                    if (prevNode !== null)
                        prevNode.next = nextNode;
                    if (nextNode !== null)
                        nextNode.prev = prevNode;

                    currentNode.next = null;
                    currentNode.prev = this._tail;
                    this._tail.next = currentNode;
                    this._tail = currentNode;
                }
                return;
            }
            currentNode = currentNode.prev;
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
                    if (nextNode !== null)
                        nextNode.prev = prevNode;

                    currentNode.next = this._head;
                    currentNode.prev = null;
                    this._head.prev = currentNode;
                    this._head = currentNode;
                }
                return;
            }
            currentNode = currentNode.next;
        }
    }
    public clear() {
        this._tail = this._head = null;
    }
}