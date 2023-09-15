import {GRAVITY_ACCELERATION} from "../constants/gameConstants";

const FRAME_RATE: number = 17;

export class LandForcesCalculator {
    private constructor() { }
    public static calcAcceleration(thrust: number, resistanceCoeff: number, airResistanceCoeff: number, deltaTime: number,
                               speed: number, mass: number, lengthwiseArea: number): number {
        const frictionForce = resistanceCoeff * mass * GRAVITY_ACCELERATION;
        const airResistanceForce = airResistanceCoeff * speed * speed * lengthwiseArea;

        return ((thrust - frictionForce - airResistanceForce) / mass) * (deltaTime / FRAME_RATE);
    }
    public static calcAngularAcceleration(thrust: number, resistanceCoeff: number, airResistanceCoeff: number,
                                      deltaTime: number, speed: number, mass: number, lengthwiseArea: number,
                                          radiusLength: number): number {
        return this.calcAcceleration(thrust, resistanceCoeff, airResistanceCoeff, deltaTime, speed, mass,
            lengthwiseArea) / radiusLength;
    }
}

export class AirForcesCalculator {
    private constructor() { }

    public static calcAcceleration(thrust: number, airResistanceCoeff: number, deltaTime: number,
                                   speed: number, mass: number, lengthwiseArea: number): number {
        const airResistanceForce = airResistanceCoeff * speed * speed * lengthwiseArea;

        return ((thrust - airResistanceForce) / mass) * (deltaTime / FRAME_RATE);
    }
    public static calcAngularAcceleration(thrust: number, airResistanceCoeff: number, deltaTime: number,
                                          speed: number, mass: number, lengthwiseArea: number, radiusLength: number): number {
        return this.calcAcceleration(thrust, airResistanceCoeff, deltaTime, speed, mass,
            lengthwiseArea) / radiusLength;
    }
}