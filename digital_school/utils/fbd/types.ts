/**
 * Free Body Diagram (FBD) Type Definitions
 * Global types for FBD rendering across the application
 */

export type ForceType = 'normal' | 'friction' | 'tension' | 'weight' | 'applied' | 'custom' | 'component';
export type PointType = 'fixed' | 'pivot' | 'free';
export type BodyType = 'point' | 'rectangle' | 'circle' | 'triangle' | 'custom';
export type MomentDirection = 'cw' | 'ccw';

export interface FBDPoint {
    id: string;
    x: number;
    y: number;
    label?: string;
    type?: PointType;
}

export interface FBDForce {
    id: string;
    pointId: string;
    magnitude: number;
    angle: number; // degrees from positive x-axis (0° = right, 90° = up)
    label: string;
    color?: string;
    type?: ForceType;
}

export interface FBDMoment {
    id: string;
    pointId: string;
    magnitude: number;
    direction: MomentDirection;
    label: string;
    radius?: number;
}

export interface FBDBody {
    type: BodyType;
    centerX: number;
    centerY: number;
    width?: number;
    height?: number;
    radius?: number;
    points?: { x: number; y: number }[];
    fill?: string;
    stroke?: string;
    angle?: number; // Rotation in degrees
}

export interface FBDDiagram {
    id: string;
    width: number;
    height: number;
    points: FBDPoint[];
    forces: FBDForce[];
    moments?: FBDMoment[];
    body?: FBDBody;
    bodies?: FBDBody[];
    showAxes?: boolean;
    showGrid?: boolean;
    showAngles?: boolean;
    backgroundColor?: string;
    backgroundSVG?: string; // Static background layer (e.g. incline base)
    customSVG?: string; // Final compiled SVG content
}

export interface FBDConfig {
    forceColors: Record<ForceType, string>;
    defaultArrowWidth: number;
    defaultArrowHeadSize: number;
    gridSize: number;
    snapAngles: number[];
    axesColor: string;
    gridColor: string;
}

export const DEFAULT_FBD_CONFIG: FBDConfig = {
    forceColors: {
        weight: '#3B82F6',      // blue
        normal: '#10B981',      // green
        friction: '#EF4444',    // red
        tension: '#8B5CF6',     // purple
        applied: '#F59E0B',     // amber
        custom: '#6B7280',      // gray
        component: '#9CA3AF',   // light gray for components
    },
    defaultArrowWidth: 2.5,
    defaultArrowHeadSize: 10,
    gridSize: 20,
    snapAngles: [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330],
    axesColor: '#374151',
    gridColor: '#E5E7EB',
};
