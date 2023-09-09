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

export interface IDoubleLinkedList<T> extends Iterable<T> {
    get head(): DoubleLinkedListNode<T> | null;
    get tail(): DoubleLinkedListNode<T> | null;
    get length(): number;
    remove(value: T): void;
    removeNode(node: DoubleLinkedListNode<T>): void;
    addToHead(value: T): void;
    addToTail(value: T): void;
    removeFromTail(): void;
    removeFromHead(): void;
    moveToTail(value: T): void;
    moveToHead(value: T): void;
    clear(): void;
    isEmpty(): boolean;
    merge(otherList: IDoubleLinkedList<T>): void
}

export class DoubleLinkedList<T> implements IDoubleLinkedList<T> {
    private _tail: DoubleLinkedListNode<T> | null = null;
    private _head: DoubleLinkedListNode<T> | null = null;
    private _length: number = 0;
    public get head(): DoubleLinkedListNode<T> | null { return this._head }
    public get tail(): DoubleLinkedListNode<T> | null { return this._tail }
    public get length(): number { return this._length }
    *[Symbol.iterator](): Iterator<T> {
        let currentNode = this._head;

        while (currentNode !== null) {
            yield currentNode.value;
            currentNode = currentNode.next;
        }
    }
    public isEmpty(): boolean { return this._length === 0 }
    public merge(otherList: IDoubleLinkedList<T>): void {
        if (otherList.isEmpty())
            return;

        if (this.isEmpty()) {
            this._head = otherList.head;
            this._tail = otherList.tail;
        }
        else {
            this._tail.next = otherList.head;
            otherList.head.prev = this._tail;
            this._tail = otherList.tail;
        }

        this._length += otherList.length;
        otherList.clear();
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

        this._length--;
    }
    public removeNode(node: DoubleLinkedListNode<T>) {
        if (node === this._tail)
            this._tail = node.prev;

        if (node === this._head)
            this._head = node.next;

        this._length--;
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

        this._length++;
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

        this._length++;
    }
    public removeFromTail() {
        if (this._tail === this._head) {
            this.clear();
        }
        else {
            this._tail = this._tail.prev;
            this._tail.next = null;
        }

        this._length--;
    }
    public removeFromHead() {
        if (this._tail === this._head) {
            this.clear();
        }
        else {
            this._head = this._head.next;
            this._head.prev = null;
        }

        this._length--;
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
        this._length = 0;
    }
}