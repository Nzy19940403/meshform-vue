// Augment MeshFieldSchema to allow arbitrary x-* extension properties.
// Remove this file after upgrading to @meshflow/form >= 0.4.0.
declare module '@meshflow/form' {
  interface MeshFieldSchema {
    [key: `x-${string}`]: any
  }
}
