export const calculateDistance = (point1, point2) => {
  return Math.sqrt(
    Math.pow(point1.x - point2.x, 2) + 
    Math.pow(point1.y - point2.y, 2)
  );
};

export const snapToGrid = (value, gridSize = 20) => {
  return Math.round(value / gridSize) * gridSize;
};

export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};