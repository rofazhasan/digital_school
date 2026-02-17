import React from 'react';

// ArUco 4x4_50 markers (internal 4x4 grid + 1px black border = 6x6 total blocks)
// Bits for IDs 0, 1, 2, 3 in DICT_4X4_50 dictionary
const ARUCO_DATA = {
    0: [
        [0, 0, 0, 0, 0, 0],
        [0, 1, 0, 1, 1, 0],
        [0, 1, 0, 1, 1, 0],
        [0, 1, 0, 1, 1, 0],
        [0, 1, 0, 1, 1, 0],
        [0, 0, 0, 0, 0, 0]
    ],
    1: [
        [0, 0, 0, 0, 0, 0],
        [0, 1, 0, 1, 1, 0],
        [0, 0, 1, 0, 0, 0],
        [0, 1, 0, 1, 0, 0],
        [0, 1, 1, 0, 1, 0],
        [0, 0, 0, 0, 0, 0]
    ],
    2: [
        [0, 0, 0, 0, 0, 0],
        [0, 1, 0, 1, 1, 0],
        [0, 0, 1, 1, 1, 0],
        [0, 1, 1, 1, 1, 0],
        [0, 1, 1, 1, 1, 0],
        [0, 0, 0, 0, 0, 0]
    ],
    3: [
        [0, 0, 0, 0, 0, 0],
        [0, 1, 0, 1, 1, 0],
        [0, 1, 1, 0, 0, 0],
        [0, 1, 1, 1, 0, 0],
        [0, 0, 1, 0, 1, 0],
        [0, 0, 0, 0, 0, 0]
    ]
};

interface FiducialMarkerProps {
    id: 0 | 1 | 2 | 3;
    size?: number;
    className?: string;
}

const FiducialMarker: React.FC<FiducialMarkerProps> = ({ id, size = 100, className = "" }) => {
    const grid = ARUCO_DATA[id];
    const cellSize = size / 6;

    return (
        <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className={className}
            xmlns="http://www.w3.org/2000/svg"
        >
            <rect width={size} height={size} fill="white" />
            {grid.map((row, y) =>
                row.map((cell, x) => (
                    cell === 0 && (
                        <rect
                            key={`${x}-${y}`}
                            x={x * cellSize}
                            y={y * cellSize}
                            width={cellSize}
                            height={cellSize}
                            fill="black"
                        />
                    )
                ))
            )}
        </svg>
    );
};

export default FiducialMarker;
