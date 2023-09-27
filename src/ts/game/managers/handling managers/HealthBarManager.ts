import {IArmor, IExecutor, IRectangle} from "../../../additionally/type";
import {DoublyLinkedList} from "../../../additionally/data structures/IDoublyLinkedList";
import {IElement} from "../../elements/IElement";
import {Point} from "../../../geometry/Point";
import {calcDistance} from "../../../geometry/additionalFunc";
import {ICanvas} from "../../processors/ICanvas";
import {
    ARMOR_BAR_COLOR,
    HEALTH_BAR_COLOR,
    HEALTH_BAR_WIDTH_COEFF,
    ResolutionManager
} from "../../../constants/gameConstants";

export class Rectangle implements IRectangle{
    private readonly _point: Point;
    private readonly _width: number;
    private readonly _height: number;
    private readonly _color: string;
    public get point(): Point { return this._point }
    public get width(): number { return this._width }
    public get height(): number { return this._height }
    public get color(): string { return this._color }
    public constructor(point: Point, width: number, height: number, color: string) {
        this._point = point;
        this._width = width;
        this._height = height;
        this._color = color;
    }
}

export function isImplementsIArmor(obj: any): obj is IArmor{
    return (
        'armor' in obj &&
        'armorStrength' in obj
    );
}

export interface IHealthDrawManager extends IExecutor{
    addToList(element: IElement): void;
    isInTheList(element: IElement): boolean;
    removeFromList(element: IElement): boolean;
}

export class HealthBarManager implements IHealthDrawManager{
    private readonly _drawList: DoublyLinkedList<IElement> = new DoublyLinkedList<IElement>();
    private readonly _canvas: ICanvas;

    constructor(canvas: ICanvas) {
        this._canvas = canvas;
    }
    public isInTheList(element: IElement): boolean{
        for (const node of this._drawList){
            if (node.id === element.id){
                return true;
            }
        }

        return false;
    }
    public addToList(element: IElement){
        this._drawList.addToTail(element);
    }
    public removeFromList(element: IElement): boolean{
        for (const node of this._drawList) {
            if (node.id === element.id){
                this._drawList.remove(element);
                return true;
            }
        }

        return false;
    }
    handle(deltaTime: number): void {
        this.drawAllHealth();
    }
    private drawAllHealth(){
        for (const node of this._drawList){
            this.drawElementHealth(node);
        }
    }
    private drawElementHealth(element: IElement){
        let tankWidth = calcDistance(element.model.entity.points[0], element.model.entity.points[1]) *
            HEALTH_BAR_WIDTH_COEFF;
        const healthWidth = tankWidth / element.model.maxHealth * element.model.health;

        const tankHeight = calcDistance(element.model.entity.points[1], element.model.entity.points[2]);

        let healthPoint: Point = element.model.entity.calcCenter();
        healthPoint = new Point(
            healthPoint.x - healthWidth / 2,
            healthPoint.y - tankHeight * 1.5
        );

        this._canvas.addRectangle(new Rectangle(
                healthPoint,
                healthWidth,
                ResolutionManager.HEALTH_BAR_HEIGHT,
                HEALTH_BAR_COLOR
            )
        );

        if (isImplementsIArmor(element)){
            const armorWidth = tankWidth / element.maxArmor * element.armor;

            let armorPoint: Point = element.model.entity.calcCenter();
            armorPoint = new Point(
                armorPoint.x - armorWidth / 2,
                healthPoint.y + ResolutionManager.HEALTH_BAR_HEIGHT + ResolutionManager.HEALTH_ARMOR_BAR_INDENT_Y
            );

            this._canvas.addRectangle(new Rectangle(
                    armorPoint,
                    armorWidth,
                    ResolutionManager.ARMOR_BAR_HEIGHT,
                    ARMOR_BAR_COLOR
                )
            );
        }
    }
}