class DoublyLinkedListNode<T> {
    private readonly _value: T;
    private _prev: DoublyLinkedListNode<T> | null = null;
    private _next: DoublyLinkedListNode<T> | null = null;
    public get value(): T { return this._value }
    public get prev(): DoublyLinkedListNode<T> | null { return this._prev }
    public get next(): DoublyLinkedListNode<T> | null { return this._next }
    public set next(listNode: DoublyLinkedListNode<T> | null) { this._next = listNode }
    public set prev(listNode: DoublyLinkedListNode<T> | null) { this._prev = listNode }
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

export interface IDoublyLinkedList<T> extends Iterable<T> {
    get head(): T | null;
    get tail(): T | null;
    get length(): number;
    remove(value: T): void;
    removeNode(node: DoublyLinkedListNode<T>): void;
    addToHead(value: T): void;
    addToTail(value: T): void;
    removeFromTail(): void;
    removeFromHead(): void;
    moveToTail(value: T): void;
    moveToHead(value: T): void;
    clear(): void;
    isEmpty(): boolean;
    applyAndRemove(action: (t: T) => void, condition: (t: T) => boolean): void;
}

export class DoublyLinkedList<T> implements IDoublyLinkedList<T> {
    private _tail: DoublyLinkedListNode<T> | null = null;
    private _head: DoublyLinkedListNode<T> | null = null;
    private _length: number = 0;
    public get head(): T | null { return this._head !== null ? this._head.value : null }
    public get tail(): T | null { return this._tail !== null ? this._tail.value : null }
    public get length(): number { return this._length }
    *[Symbol.iterator](): Iterator<T> {
        let currentNode = this._head;

        for (let i = this._length; i > 0; i--) {
            yield currentNode.value;
            currentNode = currentNode.next;
        }
    }
    public applyAndRemove(action: (t: T) => void, condition: (t: T) => boolean) {
        let currNode = this._head;
        while (currNode !== null) {
            action(currNode.value);
            if (condition(currNode.value))
                currNode = currNode.next;
            else {
                const prevNode = currNode;
                currNode = currNode.next;
                this.removeNode(prevNode);
            }
        }
    }
    public isEmpty(): boolean { return this._length === 0 }
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
    public removeNode(node: DoublyLinkedListNode<T>) {
        if (node === this._tail)
            this._tail = node.prev;

        if (node === this._head)
            this._head = node.next;

        this._length--;
        node.remove();
    }
    public addToHead(value: T) {
        const newNode = new DoublyLinkedListNode(value);

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
        const newNode = new DoublyLinkedListNode(value);

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
            this._length--;
        }
    }
    public removeFromHead() {
        if (this._tail === this._head) {
            this.clear();
        }
        else {
            this._head = this._head.next;
            this._head.prev = null;
            this._length--;
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
        this._length = 0;
    }
}