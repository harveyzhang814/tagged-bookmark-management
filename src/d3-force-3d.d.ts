declare module 'd3-force-3d' {
  export function forceCollide<T = unknown>(
    radius?: number | ((node: T) => number)
  ): ForceCollide<T>;
  interface ForceCollide<T> {
    radius(value: number | ((node: T) => number)): ForceCollide<T>;
    strength(value: number): ForceCollide<T>;
    iterations(value: number): ForceCollide<T>;
  }

  export function forceX<T = unknown>(x?: number | ((node: T) => number)): ForceX<T>;
  interface ForceX<T> {
    x(value: number | ((node: T) => number)): ForceX<T>;
    strength(value: number): ForceX<T>;
  }

  export function forceY<T = unknown>(y?: number | ((node: T) => number)): ForceY<T>;
  interface ForceY<T> {
    y(value: number | ((node: T) => number)): ForceY<T>;
    strength(value: number): ForceY<T>;
  }
}
