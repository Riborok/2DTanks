import {TankModel} from "../../model/tank/TankModel";
import {TankSprite} from "../../sprite/tank/TankSprite";
import {TankPartsCreator} from "../../components/tank parts/TankPartsCreator";
import {TankSpritePartsCreator} from "../../sprite/tank/TankSpritePartsCreator";
import {IEntity, RectangularEntity} from "../../entitiy/IEntity";
import {ResolutionManager} from "../../constants/gameConstants";
import {ModelIDTracker} from "../id/ModelIDTracker";
import {Control} from "../../additionally/type";
import {Point} from "../../geometry/Point";
import {IElement} from "./IElement";
import {IStorage} from "../../entitiy/IEntityCollisionSystem";
import {Canvas} from "../Canvas";

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

        const tankParts = TankPartsCreator.create(hullNum, trackNum, turretNum, weaponNum);
        const rectangularEntity = new RectangularEntity(point,
            ResolutionManager.HULL_WIDTH[hullNum] + ResolutionManager.TRACK_INDENT,
            ResolutionManager.HULL_HEIGHT[hullNum] + (ResolutionManager.TRACK_INDENT << 1), angle,
            tankParts.turret.mass + tankParts.hull.mass + tankParts.weapon.mass, ModelIDTracker.tankId);
        this._model = new TankModel(tankParts, rectangularEntity);
        this._id = rectangularEntity.id;

        const track = tankParts.track;
        this._sprite = new TankSprite(TankSpritePartsCreator.create(color, hullNum, trackNum, turretNum, weaponNum),
            track.forwardData, track.backwardData);
    }
    public spawn(canvas: Canvas, entityStorage: IStorage<IEntity>) {
        const tankSpriteParts = this._sprite.tankSpriteParts;
        canvas.insert(tankSpriteParts.topTrackSprite);
        canvas.insert(tankSpriteParts.bottomTrackSprite);
        canvas.insert(tankSpriteParts.hullSprite);
        canvas.insert(tankSpriteParts.weaponSprite);
        canvas.insert(tankSpriteParts.turretSprite);

        const entity = this._model.entity;
        entityStorage.insert(entity);
        this._sprite.updateAfterAction(entity.points[0], entity.angle, this._model.turretAngle);
    }
    public vanish(canvas: Canvas, entityStorage: IStorage<IEntity>) {
        const tankSpriteParts = this._sprite.tankSpriteParts;
        this._sprite.tankTireTrack.vanishFullTrack();

        canvas.remove(tankSpriteParts.topTrackSprite);
        canvas.remove(tankSpriteParts.bottomTrackSprite);
        canvas.remove(tankSpriteParts.hullSprite);
        canvas.remove(tankSpriteParts.weaponSprite);
        canvas.remove(tankSpriteParts.turretSprite);

        entityStorage.remove(this._model.entity);
    }
}