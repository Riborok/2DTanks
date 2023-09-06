import {TankModel} from "../../model/tank/TankModel";
import {TankSprite} from "../../sprite/tank/TankSprite";
import {TankPartsCreator} from "../../model/tank/TankPartsCreator";
import {TankSpritePartsCreator} from "../../sprite/tank/TankSpritePartsCreator";
import {
    BottomSpriteAccelerationEffect,
    TopSpriteAccelerationEffect
} from "../../sprite/effects/SpriteAccelerationEffect";
import {IEntity, RectangularEntity} from "../../model/entitiy/IEntity";
import {HULL_HEIGHT, HULL_WIDTH, TRACK_INDENT} from "../../constants/gameConstants";
import {IDTracker} from "../id/IDTracker";
import {Control, IStorage} from "../../additionally/type";
import {Point} from "../../geometry/Point";
import {IElement} from "./IElement";

export class TankElement implements IElement {
    private readonly _model: TankModel;
    private readonly _sprite: TankSprite;
    private readonly _id: number;
    private _control: Control;
    public get model(): TankModel { return this._model }
    public get sprite(): TankSprite { return this._sprite }
    public get id(): number { return this._id }
    public get control(): Control { return this._control }
    public set control(newControl: Control) { this._control = newControl }
    public constructor(point: Point, angle: number, color: number,
                       hullNum: number, trackNum: number, turretNum: number, weaponNum: number,
                       control: Control) {
        this._control = control;

        const tankParts = TankPartsCreator.create(angle, hullNum, trackNum, turretNum, weaponNum);
        const rectangularEntity = new RectangularEntity(point,
            HULL_WIDTH[hullNum] + TRACK_INDENT, HULL_HEIGHT[hullNum] + (TRACK_INDENT << 1), angle,
            tankParts.turret.mass + tankParts.hull.mass + tankParts.weapon.mass, IDTracker.tankId);
        this._model = new TankModel(tankParts, rectangularEntity);
        this._id = rectangularEntity.id;

        const track = tankParts.track;
        this._sprite = new TankSprite(TankSpritePartsCreator.create(color, hullNum, trackNum, turretNum, weaponNum,
            track.forwardData, track.backwardData));
    }
    public spawn(canvas: Element, entityStorage: IStorage<IEntity>) {
        const tankSpriteParts = this._sprite.tankSpriteParts;
        const hullSprite = tankSpriteParts.hullSprite;
        canvas.appendChild(tankSpriteParts.topTrackSprite.sprite);
        canvas.appendChild(tankSpriteParts.bottomTrackSprite.sprite);
        canvas.appendChild(hullSprite.sprite);
        canvas.appendChild(tankSpriteParts.weaponSprite.sprite);
        canvas.appendChild(tankSpriteParts.turretSprite.sprite);


        tankSpriteParts.topSpriteAccelerationEffect = new TopSpriteAccelerationEffect(canvas,
            hullSprite.accelerationEffectIndentX, hullSprite.height);
        tankSpriteParts.bottomSpriteAccelerationEffect = new BottomSpriteAccelerationEffect(canvas,
            hullSprite.accelerationEffectIndentX, hullSprite.height);

        const entity = this._model.entity;

        entityStorage.insert(entity);

        this._sprite.updateAfterAction(entity.points[0], entity.angle, this._model.tankParts.turret.angle);
    }
}