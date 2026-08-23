export interface Point {
  x: number;
  y: number;
}

export const calculateDistance = (point1: Point, point2: Point): number => {
  return Math.hypot(point1.x - point2.x, point1.y - point2.y);
};

export const snapToGrid = (value: number, gridSize = 20): number => {
  return Math.round(value / gridSize) * gridSize;
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};
