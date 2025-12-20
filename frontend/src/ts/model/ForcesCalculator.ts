import {GRAVITY_ACCELERATION} from "../constants/gameConstants";

const FRAME_RATE: number = 17;

/**
 * Class provides methods to calculate acceleration and angular acceleration for land-based entities.
 */
export class LandForcesCalculator {
    private constructor() { }
    /**
     * Calculate acceleration for a land-based entities.
     * @param thrust The thrust force applied.
     * @param resistanceCoeff The coefficient of resistance.
     * @param airResistanceCoeff The coefficient of air resistance.
     * @param deltaTime The time step for the calculation.
     * @param speed The current speed of the entities.
     * @param mass The mass of the entities.
     * @param lengthwiseArea The lengthwise cross-sectional area.
     * @returns The calculated acceleration.
     */
    public static calcAcceleration(thrust: number, resistanceCoeff: number, airResistanceCoeff: number, deltaTime: number,
                               speed: number, mass: number, lengthwiseArea: number): number {
        const frictionForce = resistanceCoeff * mass * GRAVITY_ACCELERATION;
        const airResistanceForce = airResistanceCoeff * speed * speed * lengthwiseArea;

        return ((thrust - frictionForce - airResistanceForce) / mass) * (deltaTime / FRAME_RATE);
    }

    /**
     * Calculate angular acceleration for a land-based entities.
     * @param thrust The thrust force applied.
     * @param resistanceCoeff The coefficient of resistance.
     * @param airResistanceCoeff The coefficient of air resistance.
     * @param deltaTime The time step for the calculation.
     * @param speed The current speed of the entities.
     * @param mass The mass of the entities.
     * @param lengthwiseArea The lengthwise cross-sectional area.
     * @param radiusLength The radius length for angular calculations.
     * @returns The calculated angular acceleration.
     */
    public static calcAngularAcceleration(thrust: number, resistanceCoeff: number, airResistanceCoeff: number,
                                      deltaTime: number, speed: number, mass: number, lengthwiseArea: number,
                                          radiusLength: number): number {
        return this.calcAcceleration(thrust, resistanceCoeff, airResistanceCoeff, deltaTime, speed, mass,
            lengthwiseArea) / radiusLength;
    }
}

/**
 * Class provides methods to calculate acceleration and angular acceleration for air-based entities.
 */
export class AirForcesCalculator {
    private constructor() { }

    /**
     * Calculate acceleration for an air-based entities.
     * @param thrust The thrust force applied.
     * @param airResistanceCoeff The coefficient of air resistance.
     * @param deltaTime The time step for the calculation.
     * @param speed The current speed of the entities.
     * @param mass The mass of the entities.
     * @param lengthwiseArea The lengthwise cross-sectional area.
     * @returns The calculated acceleration.
     */
    public static calcAcceleration(thrust: number, airResistanceCoeff: number, deltaTime: number,
                                   speed: number, mass: number, lengthwiseArea: number): number {
        const airResistanceForce = airResistanceCoeff * speed * speed * lengthwiseArea;

        return ((thrust - airResistanceForce) / mass) * (deltaTime / FRAME_RATE);
    }

    /**
     * Calculate angular acceleration for an air-based entities.
     * @param thrust The thrust force applied.
     * @param airResistanceCoeff The coefficient of air resistance.
     * @param deltaTime The time step for the calculation.
     * @param speed The current speed of the entities.
     * @param mass The mass of the entities.
     * @param lengthwiseArea The lengthwise cross-sectional area.
     * @param radiusLength The radius length for angular calculations.
     * @returns The calculated angular acceleration.
     */
    public static calcAngularAcceleration(thrust: number, airResistanceCoeff: number, deltaTime: number,
                                          speed: number, mass: number, lengthwiseArea: number, radiusLength: number): number {
        return this.calcAcceleration(thrust, airResistanceCoeff, deltaTime, speed, mass,
            lengthwiseArea) / radiusLength;
    }
}