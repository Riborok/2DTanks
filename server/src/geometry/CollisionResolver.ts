import {IEntity} from "../polygon/entity/IEntity";
import {Point, Vector} from "./Point";
import {VectorUtils} from "./VectorUtils";
import {CollisionDetector} from "./CollisionDetector";

export class CollisionResolver {
    private constructor() {}

    private static readonly RESTITUTION_TANK_DYNAMIC: number = 0.32;
    /** Стены: заметный отскок назад при лобовом ударе */
    private static readonly RESTITUTION_TANK_STATIC: number = 0.58;
    private static readonly POSITIONAL_CORRECTION: number = 0.62;
    private static readonly OVERLAP_SLOP: number = 0.02;
    private static readonly FRICTION_COEFFICIENT: number = 0.14;

    public static resolveCollision(impartingEntity: IEntity, receivingEntity: IEntity): Point | null {
        const collisionResult = CollisionDetector.getCollisionResult(impartingEntity, receivingEntity);
        if (collisionResult === null)
            return null;

        const n = collisionResult.normal;
        const contact = collisionResult.collisionPoint;

        this.separateBodies(impartingEntity, receivingEntity, n, collisionResult.overlap);

        const rA = VectorUtils.subtract(contact, impartingEntity.calcCenter());
        const rB = VectorUtils.subtract(contact, receivingEntity.calcCenter());

        const invMassA = this.invMass(impartingEntity.mass);
        const invMassB = this.invMass(receivingEntity.mass);
        const invIA = this.invInertia(impartingEntity.momentOfInertia);
        const invIB = this.invInertia(receivingEntity.momentOfInertia);

        const vpa = this.velocityAtPoint(impartingEntity, contact);
        const vpb = this.velocityAtPoint(receivingEntity, contact);
        const vRel = VectorUtils.subtract(vpa, vpb);

        let vn = VectorUtils.dotProduct(vRel, n);
        // Статическая стена: ω и точка контакта иногда дают v_contact·n ≥ 0, хотя ЦМ всё ещё
        // движется в геометрию — тогда импульс не накладывается и танк «липнет». Берём минимум с проекцией v_ЦМ.
        if (invMassB === 0) {
            const vnCm = VectorUtils.dotProduct(impartingEntity.velocity, n);
            vn = Math.min(vn, vnCm);
        }

        const rnA = VectorUtils.crossProduct(rA, n);
        const rnB = VectorUtils.crossProduct(rB, n);
        const denomN = invMassA + invMassB + rnA * rnA * invIA + rnB * rnB * invIB;

        const e = invMassB === 0 ? this.RESTITUTION_TANK_STATIC : this.RESTITUTION_TANK_DYNAMIC;

        let jnApplied = 0;
        if (vn < -1e-6 && denomN > 1e-20) {
            jnApplied = -(1 + e) * vn / denomN;
            this.applyImpulsePair(impartingEntity, receivingEntity, rA, rB, n, jnApplied, invMassA, invMassB, invIA, invIB);
        }

        const t = new Vector(-n.y, n.x);
        const rtA = VectorUtils.crossProduct(rA, t);
        const rtB = VectorUtils.crossProduct(rB, t);
        const denomT = invMassA + invMassB + rtA * rtA * invIA + rtB * rtB * invIB;

        if (Math.abs(jnApplied) > 1e-10 && denomT > 1e-20) {
            const vpa2 = this.velocityAtPoint(impartingEntity, contact);
            const vpb2 = this.velocityAtPoint(receivingEntity, contact);
            const vRel2 = VectorUtils.subtract(vpa2, vpb2);
            const vt = VectorUtils.dotProduct(vRel2, t);

            let jf = -vt / denomT;
            const maxF = this.FRICTION_COEFFICIENT * Math.abs(jnApplied);
            jf = Math.max(-maxF, Math.min(maxF, jf));
            if (Math.abs(jf) > 1e-10)
                this.applyImpulsePair(impartingEntity, receivingEntity, rA, rB, t, jf, invMassA, invMassB, invIA, invIB);
        }

        return contact;
    }

    private static invMass(m: number): number {
        if (!isFinite(m) || m <= 0)
            return 0;
        return 1 / m;
    }

    private static invInertia(i: number): number {
        if (!isFinite(i) || i <= 0)
            return 0;
        return 1 / i;
    }

    private static velocityAtPoint(entity: IEntity, worldPoint: Point): Vector {
        const c = entity.calcCenter();
        const rx = worldPoint.x - c.x;
        const ry = worldPoint.y - c.y;
        const w = entity.angularVelocity;
        return new Vector(entity.velocity.x - w * ry, entity.velocity.y + w * rx);
    }

    private static applyImpulsePair(
        a: IEntity, b: IEntity, rA: Vector, rB: Vector, dir: Vector, j: number,
        invMassA: number, invMassB: number, invIA: number, invIB: number
    ): void {
        if (invMassA > 0)
            a.velocity.addVector(VectorUtils.scale(dir, j * invMassA));
        if (invMassB > 0)
            b.velocity.addVector(VectorUtils.scale(dir, -j * invMassB));
        if (invIA > 0)
            a.angularVelocity += j * VectorUtils.crossProduct(rA, dir) * invIA;
        if (invIB > 0)
            b.angularVelocity -= j * VectorUtils.crossProduct(rB, dir) * invIB;
    }

    private static separateBodies(a: IEntity, b: IEntity, n: Vector, overlap: number): void {
        const pen = Math.max(overlap - this.OVERLAP_SLOP, 0);
        if (pen <= 0)
            return;

        const invA = this.invMass(a.mass);
        const invB = this.invMass(b.mass);
        const invSum = invA + invB;
        if (invSum < 1e-15)
            return;

        const correction = pen * this.POSITIONAL_CORRECTION / invSum;
        const dxA = n.x * correction * invA;
        const dyA = n.y * correction * invA;
        const dxB = -n.x * correction * invB;
        const dyB = -n.y * correction * invB;

        for (const p of a.points)
            p.addToCoordinates(dxA, dyA);
        for (const p of b.points)
            p.addToCoordinates(dxB, dyB);
    }
}
