import {TankModel} from "../../model/tank/TankModel";
import {TankSprite} from "../../sprite/tank/TankSprite";
import {TankPartsCreator} from "../../components/tank parts/TankPartsCreator";
import {TankSpritePartsCreator} from "../../sprite/tank/TankSpritePartsCreator";
import {IEntity, RectangularEntity} from "../../polygon/entity/IEntity";
import {ResolutionManager} from "../../constants/gameConstants";
import {ModelIDTracker} from "../id/ModelIDTracker";
import {IPositionAdjustable, IStorage, TankInfo} from "../../additionally/type";
import {Point} from "../../geometry/Point";
import {IElement} from "./IElement";
import {ISprite} from "../../sprite/ISprite";

export class TankElement implements IElement, IPositionAdjustable {
    private readonly _model: TankModel;
    private readonly _sprite: TankSprite;
    private _tankInfo: TankInfo;
    public get model(): TankModel { return this._model }
    public get sprite(): TankSprite { return this._sprite }
    public get id(): number { return this._model.entity.id }
    public get tankInfo(): TankInfo { return this._tankInfo }
    public set tankInfo(newTankInfo: TankInfo) { this._tankInfo = newTankInfo }
    public constructor(point: Point, angle: number, tankInfo: TankInfo) {
        this._tankInfo = tankInfo;

        const tankParts = TankPartsCreator.create(tankInfo.hullNum, tankInfo.trackNum,
            tankInfo.turretNum, tankInfo.weaponNum);
        const rectangularEntity = new RectangularEntity(point,
            ResolutionManager.getTankEntityWidth(tankInfo.hullNum),
            ResolutionManager.getTankEntityHeight(tankInfo.hullNum), angle,
            tankParts.turret.mass + tankParts.hull.mass + tankParts.weapon.mass, ModelIDTracker.tankId);
        this._model = new TankModel(tankParts, rectangularEntity);

        const track = tankParts.track;
        this._sprite = new TankSprite(TankSpritePartsCreator.create(tankInfo.color, tankInfo.hullNum,
                tankInfo.trackNum, tankInfo.turretNum, tankInfo.weaponNum),
            track.forwardData, track.backwardData);
    }
    public spawn(spriteStorage: IStorage<ISprite>, entityStorage: IStorage<IEntity>) {
        const tankSpriteParts = this._sprite.tankSpriteParts;
        spriteStorage.insert(tankSpriteParts.topTrackSprite);
        spriteStorage.insert(tankSpriteParts.bottomTrackSprite);
        spriteStorage.insert(tankSpriteParts.hullSprite);
        spriteStorage.insert(tankSpriteParts.weaponSprite);
        spriteStorage.insert(tankSpriteParts.turretSprite);

        const entity = this._model.entity;
        entityStorage.insert(entity);
        this._sprite.updateAfterAction(entity.points[0], entity.angle, this._model.turretAngle);
    }
    public terminate(spriteStorage: IStorage<ISprite>, entityStorage: IStorage<IEntity>) {
        const tankSpriteParts = this._sprite.tankSpriteParts;
        this._sprite.tankTireTrack.vanishFullTrack();

        spriteStorage.remove(tankSpriteParts.topTrackSprite);
        spriteStorage.remove(tankSpriteParts.bottomTrackSprite);
        spriteStorage.remove(tankSpriteParts.hullSprite);
        spriteStorage.remove(tankSpriteParts.weaponSprite);
        spriteStorage.remove(tankSpriteParts.turretSprite);

        entityStorage.remove(this._model.entity);
    }
    public adjustPosition(point: Point, angle: number) {
        this.model.entity.adjustPolygon(point,
            ResolutionManager.getTankEntityWidth(this._tankInfo.hullNum),
            ResolutionManager.getTankEntityHeight(this._tankInfo.hullNum),
            angle);
    }
}