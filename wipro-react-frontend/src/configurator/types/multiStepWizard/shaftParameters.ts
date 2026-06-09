export type LiftSpecificationType = 'CAPACITY' | 'SHAFT_DIMENSIONS';

export type LiftPurposeType = 'PASSENGER' | 'FREIGHT_PASSENGER' | 'HOSPITAL' | 'FIRE';

export type AccessDiagramType = string;

export type float = string;

export interface FormShaftTempParameters {
    liftSpecification: LiftSpecificationType;
    liftCapacity?: float;
    shaftLen?: float;
    shaftDep?: float;
}

export interface FormShaftParameters {
    elevatorId: number;
    elevatorUdzwig: number;
    stopDoorsCount: number;
    accessCount: number;
    liftingHeight: number;
    liftPurpose: LiftPurposeType;
    accessDiagram: AccessDiagramType;
    ei30DoorsCount: number;
    ei60DoorsCount: number;
    pitDepth?: float;
    headroom?: float;
    leftSideMechanic: boolean;
}