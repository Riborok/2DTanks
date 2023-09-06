const RED: boolean = true;
const BLACK: boolean = false;
class RedBlackTreeNode<T> {
    private _value: T;
    private _left: RedBlackTreeNode<T> | null = null;
    private _right: RedBlackTreeNode<T> | null = null;
    private _color: boolean = RED;

    public get value(): T { return this._value }
    public set value(value: T) { this._value = value }

    public get left(): RedBlackTreeNode<T> | null { return this._left }
    public set left(value: RedBlackTreeNode<T> | null) { this._left = value }

    public get right(): RedBlackTreeNode<T> | null { return this._right }
    public set right(value: RedBlackTreeNode<T> | null) { this._right = value }

    public get color(): boolean { return this._color }
    public set color(value: boolean) { this._color = value }

    constructor(value: T) { this._value = value }
}

class RedBlackBST<T> {
    private _root: RedBlackTreeNode<T> | null = null;
    private readonly _comparator: (a: T, b: T) => number;
    public constructor(comparator: (a: T, b: T) => number) { this._comparator = comparator }
    public clear() {
        this._root = null;
    }
    public get(t: T): T {
        let node = this._root;
        while (node !== null) {
            const cmp = this._comparator(t, node.value);
            if (cmp < 0)
                node = node.left;
            else if (cmp > 0)
                node = node.right;
            else if (cmp === 0)
                return node.value;
        }
        return null;
    }
    public insert(t: T) {
        this._root = this.put(this._root, t);
    }
    private put(node: RedBlackTreeNode<T>, t: T): RedBlackTreeNode<T> {
        if (node === null)
            return new RedBlackTreeNode(t);

        const cmp = this._comparator(t, node.value);

        if (cmp < 0)
            node.left = this.put(node.left, t);
        else if (cmp > 0)
            node.right = this.put(node.right, t);
        else if (cmp === 0)
            node.value = t;

        if (RedBlackBST.isRed(node.right) && !RedBlackBST.isRed(node.left))
            node = RedBlackBST.rotateLeft(node);
        if (RedBlackBST.isRed(node.left) && !RedBlackBST.isRed(node.left.left))
            node = RedBlackBST.rotateRight(node);
        if (RedBlackBST.isRed(node.right) && RedBlackBST.isRed(node.left))
            RedBlackBST.flipColors(node);

        return node;
    }
    private static isRed<T>(node: RedBlackTreeNode<T>) : boolean {
        return node === null ? false : node.color === RED;
    }
    private static rotateLeft<T>(node: RedBlackTreeNode<T>): RedBlackTreeNode<T> {
        const rightNode = node.right;
        node.right = rightNode.left;
        rightNode.left = node;
        rightNode.color = node.color;
        node.color = RED;
        return rightNode;
    }
    private static rotateRight<T>(node: RedBlackTreeNode<T>): RedBlackTreeNode<T> {
        const leftNode = node.left;
        node.left = leftNode.right;
        leftNode.right = node;
        leftNode.color = node.color;
        node.color = RED;
        return leftNode;
    }
    private static flipColors<T>(node: RedBlackTreeNode<T>) {
        node.color = RED;
        node.left.color = BLACK;
        node.right.color = BLACK;
    }
}