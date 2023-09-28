import {IArmor, IExecutor, isImplementsIArmor} from "../../../additionally/type";
import {Point} from "../../../geometry/Point";
import {calcDistance} from "../../../geometry/additionalFunc";
import {IShapeAdder} from "../../processors/ICanvas";
import {
    ARMOR_BAR_COLOR,
    HEALTH_BAR_HIGH_HP_COLOR, HEALTH_BAR_LOW_HP_COLOR, HEALTH_BAR_MEDIUM_HP_COLOR,
    HEALTH_BAR_WIDTH_COEFF,
    ResolutionManager
} from "../../../constants/gameConstants";
import {Rectangle} from "../../processors/shapes/IRectangle";
import {Model} from "../../../model/Model";
import {IElement} from "../../elements/IElement";

export interface IHealthDrawManager extends IExecutor{
    add(model: Model): void;
    remove(model: Model): void;
}

export class HealthBarManager implements IHealthDrawManager {
    private readonly _drawList: Map<number, Model> = new Map<number, Model>();
    private readonly _shapeAdder: IShapeAdder;
    constructor(shapeAdder: IShapeAdder) {
        this._shapeAdder = shapeAdder;
    }
    public add(model: Model) {
        if (model.maxHealth !== Infinity)
            this._drawList.set(model.entity.id, model);
    }
    public remove(model: Model) {
        this._drawList.delete(model.entity.id);
    }
    public handle() {
        this.drawBars();
    }
    private drawBars() {
        for (const value of this._drawList.values()) {
            this.drawBar(value);
        }
    }
    private drawBar(model: Model) {
        const tankWidth = this.calculateTankWidth(model);
        const healthWidth = tankWidth / model.maxHealth * model.health;
        const tankHeight = calcDistance(model.entity.points[1], model.entity.points[2]);

        const center = model.entity.calcCenter();
        const healthPoint = new Point(
            center.x - healthWidth / 2,
            center.y - tankHeight * 1.5
        );

        this.drawHealthBar(healthPoint, healthWidth, this.getHealthColor(model));

        if (isImplementsIArmor(model))
            this.drawArmorBar(model, tankWidth, healthPoint);
    }
    private calculateTankWidth(model: Model): number {
        return calcDistance(model.entity.points[0], model.entity.points[1]) *
            HEALTH_BAR_WIDTH_COEFF;
    }
    private getHealthColor(model: Model): string{
        if (model.health > model.maxHealth * 0.4)
            return HEALTH_BAR_HIGH_HP_COLOR;
        else if (model.health > model.maxHealth * 0.15 && model.health <= model.maxHealth * 0.4)
            return HEALTH_BAR_MEDIUM_HP_COLOR;
        else
            return HEALTH_BAR_LOW_HP_COLOR;
    }
    private drawHealthBar(healthPoint: Point, healthWidth: number, healthColor: string) {
        this._shapeAdder.addRectangle(new Rectangle(
            healthPoint,
            healthWidth,
            ResolutionManager.HEALTH_BAR_HEIGHT,
            healthColor
        ));
    }
    private drawArmorBar(model: Model & IArmor, tankWidth: number, healthPoint: Point) {
        const armorWidth = tankWidth / model.maxArmor * model.armor;

        const center = model.entity.calcCenter();
        const armorPoint = new Point(
            center.x - armorWidth / 2,
            healthPoint.y + ResolutionManager.HEALTH_BAR_HEIGHT + ResolutionManager.HEALTH_ARMOR_BAR_INDENT_Y
        );

        this._shapeAdder.addRectangle(new Rectangle(
            armorPoint,
            armorWidth,
            ResolutionManager.ARMOR_BAR_HEIGHT,
            ARMOR_BAR_COLOR
        ));
    }
}