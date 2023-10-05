import {IComponent} from "../../../components/IComponent";
import {
    HullModel0,
    HullModel1,
    HullModel2,
    HullModel3,
    HullModel4,
    HullModel5,
    HullModel6,
    HullModel7,
    IHull
} from "../../../components/tank parts/IHull";
import {ITrack, TrackModel0, TrackModel1, TrackModel2, TrackModel3} from "../../../components/tank parts/ITrack";
import {
    ITurret,
    TurretModel0,
    TurretModel1,
    TurretModel2,
    TurretModel3,
    TurretModel4,
    TurretModel5,
    TurretModel6,
    TurretModel7
} from "../../../components/tank parts/ITurret";
import {
    IWeapon,
    WeaponModel0,
    WeaponModel1,
    WeaponModel2,
    WeaponModel3,
    WeaponModel4,
    WeaponModel5,
    WeaponModel6,
    WeaponModel7
} from "../../../components/tank parts/IWeapon";
import {Control, TankInfo} from "../../../additionally/type";
import {
    VK_A,
    VK_B,
    VK_C,
    VK_COMMA,
    VK_D,
    VK_DOWN,
    VK_LEFT,
    VK_PERIOD,
    VK_RIGHT,
    VK_S,
    VK_SLASH,
    VK_UP,
    VK_V,
    VK_W
} from "../../../constants/keyCodes";

type GameStart = (attackerInfo: TankInfo, defenderInfo: TankInfo) => void;
export interface ITankChooseManager {
    start(gameStart: GameStart, buttons: NodeListOf<HTMLButtonElement>): void;
}

export class TankChooseManager implements ITankChooseManager {
    private static readonly DEFAULT_PATH: string = "./src/img/tanks";

    private readonly _hullKit: ComponentKit<IHull> = new ComponentKit<IHull>();
    private readonly _trackKit: ComponentKit<ITrack> = new ComponentKit<ITrack>();
    private readonly  _turretKit: ComponentKit<ITurret> = new ComponentKit<ITurret>();
    private readonly _weaponKit: ComponentKit<IWeapon> = new ComponentKit<IWeapon>();
    private readonly _colorKit: ComponentKit<string> = new ComponentKit<string>();

    private _gameStart: GameStart;

    private _hullPath: string;
    private _trackPath: string;
    private _turretPath: string;
    private _weaponPath: string;
    private _currTankIndex: number = 0;
    private _attackerTankInfo: TankInfo;

    private static get CONTROL_1(): Control {
        return {
            forwardKey: VK_W,
            backwardKey: VK_S,
            hullClockwiseKey: VK_D,
            hullCounterClockwiseKey: VK_A,
            turretClockwiseKey: VK_V,
            turretCounterClockwiseKey: VK_C,
            shootKey: VK_B
        }
    }
    private static get CONTROL_2(): Control {
        return {
            forwardKey: VK_UP,
            backwardKey: VK_DOWN,
            hullClockwiseKey: VK_RIGHT,
            hullCounterClockwiseKey: VK_LEFT,
            turretClockwiseKey: VK_PERIOD,
            turretCounterClockwiseKey: VK_COMMA,
            shootKey: VK_SLASH
        }
    }

    public start(gameStart: GameStart, buttons: NodeListOf<HTMLButtonElement>) {
        this._gameStart = gameStart;

        this.addHullsToKit();
        this.addTracksToKit();
        this.addTurretsToKit();
        this.addWeaponsToKit();
        this.addColorsToKit();

        this.attachAllClickHandlers(buttons);
        this.resetChooseToDefault();
        this.illustrateChoose();
    }

    private addHullsToKit(){
        this._hullKit.addComponent(new HullModel0());
        this._hullKit.addComponent(new HullModel1());
        this._hullKit.addComponent(new HullModel2());
        this._hullKit.addComponent(new HullModel3());
        this._hullKit.addComponent(new HullModel4());
        this._hullKit.addComponent(new HullModel5());
        this._hullKit.addComponent(new HullModel6());
        this._hullKit.addComponent(new HullModel7());
    }

    private addTracksToKit(){
        this._trackKit.addComponent(new TrackModel0());
        this._trackKit.addComponent(new TrackModel1());
        this._trackKit.addComponent(new TrackModel2());
        this._trackKit.addComponent(new TrackModel3());
    }

    private addTurretsToKit(){
        this._turretKit.addComponent(new TurretModel0());
        this._turretKit.addComponent(new TurretModel1());
        this._turretKit.addComponent(new TurretModel2());
        this._turretKit.addComponent(new TurretModel3());
        this._turretKit.addComponent(new TurretModel4());
        this._turretKit.addComponent(new TurretModel5());
        this._turretKit.addComponent(new TurretModel6());
        this._turretKit.addComponent(new TurretModel7());
    }

    private addWeaponsToKit(){
        this._weaponKit.addComponent(new WeaponModel0());
        this._weaponKit.addComponent(new WeaponModel1());
        this._weaponKit.addComponent(new WeaponModel2());
        this._weaponKit.addComponent(new WeaponModel3());
        this._weaponKit.addComponent(new WeaponModel4());
        this._weaponKit.addComponent(new WeaponModel5());
        this._weaponKit.addComponent(new WeaponModel6());
        this._weaponKit.addComponent(new WeaponModel7());
    }

    private addColorsToKit() {
        this._colorKit.addComponent('rgb(77, 90, 121)');
        this._colorKit.addComponent('rgb(120, 114, 77)');
        this._colorKit.addComponent('rgb(140, 89, 77)');
        this._colorKit.addComponent('rgb(82, 128, 124)');
    }

    private resetChooseToDefault(){
        this._hullKit.currComponentIndex = 0;
        this._trackKit.currComponentIndex = 0;
        this._turretKit.currComponentIndex = 0;
        this._weaponKit.currComponentIndex = 0;
        this._colorKit.currComponentIndex = 0;
    }

    private attachAllClickHandlers(buttons: NodeListOf<HTMLButtonElement>){
        for (const button of buttons){
            if (button.id.indexOf("prev") !== -1){
                if (button.id.indexOf("Hull") !== -1)
                    button.addEventListener("click", () => this.switchToPrev(this._hullKit));
                if (button.id.indexOf("Track") !== -1)
                    button.addEventListener("click", () => this.switchToPrev(this._trackKit));
                if (button.id.indexOf("Turret") !== -1)
                    button.addEventListener("click", () => this.switchToPrev(this._turretKit));
                if (button.id.indexOf("Weapon") !== -1)
                    button.addEventListener("click", () => this.switchToPrev(this._weaponKit));
                if (button.id.indexOf("Color") !== -1)
                    button.addEventListener("click", () => this.switchToPrev(this._colorKit));
            } else if (button.id.indexOf("next") !== -1) {
                if (button.id.indexOf("Hull") !== -1)
                    button.addEventListener("click", () => this.switchToNext(this._hullKit));
                if (button.id.indexOf("Track") !== -1)
                    button.addEventListener("click", () => this.switchToNext(this._trackKit));
                if (button.id.indexOf("Turret") !== -1)
                    button.addEventListener("click", () => this.switchToNext(this._turretKit));
                if (button.id.indexOf("Weapon") !== -1)
                    button.addEventListener("click", () => this.switchToNext(this._weaponKit));
                if (button.id.indexOf("Color") !== -1)
                    button.addEventListener("click", () => this.switchToNext(this._colorKit));
            } else if (button.id.indexOf("accept") !== -1) {
                button.addEventListener("click", () => this.acceptChoose())
            }
        }
    }

    private switchToPrev(kit: ComponentKit<IComponent | string>){
        kit.switchToPrevComponent();
        this.illustrateChoose();
    }

    private switchToNext(kit: ComponentKit<IComponent | string>){
        kit.switchToNextComponent();
        this.illustrateChoose();
    }

    private determinePaths(){
        this._hullPath = `${TankChooseManager.DEFAULT_PATH}/Hulls/Hull_${this._hullKit.currComponentIndex}/Hull_${this._colorKit.currComponentIndex}.png`
        this._trackPath = `${TankChooseManager.DEFAULT_PATH}/Tracks/Track_${this._trackKit.currComponentIndex}_Solo.png`
        this._turretPath = `${TankChooseManager.DEFAULT_PATH}/Turrets/Turret_${this._turretKit.currComponentIndex}/Turret_${this._colorKit.currComponentIndex}.png`;
        this._weaponPath = `${TankChooseManager.DEFAULT_PATH}/Weapons/Weapon_${this._weaponKit.currComponentIndex}.png`;
    }

    private illustrateChoose(){
        this.determinePaths();
        this.illustrateImages();
        this.illustrateCharacteristics();
    }

    private illustrateImages(){
        (document.querySelector('.hull') as HTMLImageElement).src = this._hullPath;
        (document.querySelector('.hull-view') as HTMLImageElement).src = this._hullPath;
        (document.querySelector('.track') as HTMLImageElement).src = this._trackPath;
        (document.querySelector('.track-bottom-view') as HTMLImageElement).src = this._trackPath;
        (document.querySelector('.track-top-view') as HTMLImageElement).src = this._trackPath;
        (document.querySelector('.turret') as HTMLImageElement).src = this._turretPath;
        (document.querySelector('.turret-view') as HTMLImageElement).src = this._turretPath;
        (document.querySelector('.weapon') as HTMLImageElement).src = this._weaponPath;
        (document.querySelector('.weapon-view') as HTMLImageElement).src = this._weaponPath;
        (document.querySelector('.color') as HTMLDivElement).style.backgroundColor = this._colorKit.currComponent;
    }

    private illustrateCharacteristics(){
        (document.getElementById('hullInfo') as HTMLParagraphElement).textContent = this.getHullCharacteristic();
        (document.getElementById('trackInfo') as HTMLParagraphElement).textContent = this.getTrackCharacteristic();
        (document.getElementById('turretInfo') as HTMLParagraphElement).textContent = this.getTurretCharacteristic();
        (document.getElementById('weaponInfo') as HTMLParagraphElement).textContent = this.getWeaponCharacteristic();
    }

    private getHullCharacteristic(): string{
        const hull = this._hullKit.currComponent;
        return `Mass: ${hull.mass} | Health: ${hull.health} | Armor: ${hull.armor} | Armor Strength: ${hull.armorStrength}`;
    }

    private getTrackCharacteristic(): string{
        const track = this._trackKit.currComponent;
        return `Max Forward Speed: ${track.forwardData.finishSpeed} | Forward Acceleration: ${track.forwardData.force} | 
                Max Backward Speed: ${track.backwardData.finishSpeed} | Backward Acceleration: ${track.backwardData.force} |
                Max Angular Speed: ${track.angularData.finishSpeed} | Angular Acceleration: ${track.angularData.force}`;
    }

    private getTurretCharacteristic(): string{
        const turret = this._turretKit.currComponent;
        return `Mass: ${turret.mass} | Angle Speed: ${turret.angleSpeed} | Bullet Capacity: ${turret.bulletCapacity}`;
    }

    private getWeaponCharacteristic(): string{
        const weapon = this._weaponKit.currComponent;
        return `Mass: ${weapon.mass} | Penetration: ${weapon.armorPenetrationCoeff} | Damage: ${weapon.damageCoeff} | Bullet Speed: ${weapon.startingSpeedCoeff} | Reload Speed: ${weapon.reloadSpeed}`;
    }

    private acceptChoose(){
        if (this._currTankIndex === 0) {
            this._currTankIndex++;
            this._attackerTankInfo = {
                color: this._colorKit.currComponentIndex,
                hullNum: this._hullKit.currComponentIndex,
                trackNum: this._trackKit.currComponentIndex,
                turretNum: this._turretKit.currComponentIndex,
                weaponNum: this._weaponKit.currComponentIndex,
                control: TankChooseManager.CONTROL_1,
            }

            this.resetChooseToDefault();
            this.illustrateChoose();
        }
        else if (this._currTankIndex === 1) {
            this._currTankIndex++;
            const defenderTankInfo = {
                color: this._colorKit.currComponentIndex,
                hullNum: this._hullKit.currComponentIndex,
                trackNum: this._trackKit.currComponentIndex,
                turretNum: this._turretKit.currComponentIndex,
                weaponNum: this._weaponKit.currComponentIndex,
                control: TankChooseManager.CONTROL_2,
            }

            this._gameStart(this._attackerTankInfo, defenderTankInfo);
        }
    }
}

class ComponentKit<T>{
    private _kit: T[] = [];
    private _size: number = 0;
    private _currComponentIndex: number = 0;
    public get currComponent(): T { return this._kit[this._currComponentIndex] }
    public get currComponentIndex (): number { return this._currComponentIndex }
    public set currComponentIndex (value: number) { this._currComponentIndex = value }
    public addComponent(component: T){ this._kit[this._size++] = component }
    public switchToPrevComponent(){
        this._currComponentIndex--;

        if (this._currComponentIndex < 0)
            this._currComponentIndex = this._size - 1;
    }
    public switchToNextComponent(){
        this._currComponentIndex++;

        if (this._currComponentIndex >= this._size)
            this._currComponentIndex = 0;
    }
}