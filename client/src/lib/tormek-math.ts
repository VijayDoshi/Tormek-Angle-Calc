/**
 * Mathematical core for Tormek T8 Geometry.
 * 
 * Coordinate System (Tormek T8 Vertical Mount):
 * - Wheel center at (0, 0)
 * - Wheel radius = R
 * - USB Support Point = S(Cx, Cy)
 *   - Cx = Horizontal distance from wheel center (Constant for the machine)
 *   - Cy = Height from wheel center (What we want to find)
 * - Blade touches wheel at Contact Point K(Kx, Ky)
 * - Distance |SK| = Projection P
 * - Angle between SK and Tangent at K is the Bevel Angle (alpha)
 */

export interface GeometryParams {
  wheelDiameter: number;      // mm
  projection: number;         // mm (P)
  targetAngle: number;        // degrees (alpha)
  usbHorizontalDist: number;  // mm (Cx)
  housingOffset?: number;     // mm (distance from wheel center to housing top)
}

/**
 * Calculates the required USB Height relative to the housing/datum.
 * Based on the formula: Cy = R * cos(phi) + sqrt(P^2 - (Cx - R * sin(phi))^2)
 * where phi is the angle of the contact point K.
 * For Tormek T8 Vertical base, typical machine constants:
 * Cx (Horizontal) is fixed by the machine design (~20-50mm depending on datum)
 * The formula used by standard Tormek calculators:
 * H = sqrt(P^2 - (R * sin(alpha) + Cx)^2) + R * cos(alpha)
 * However, let's use the robust geometric model.
 */
export function calculateUSBHeight(params: GeometryParams): number | null {
  const { wheelDiameter, projection, targetAngle, usbHorizontalDist, housingOffset = 0 } = params;
  
  const R = wheelDiameter / 2;
  const P = projection;
  const alpha = (targetAngle * Math.PI) / 180;
  
  /**
   * Tormek T8 Vertical Base Geometry (Standard simplified):
   * H is the height of the USB above the wheel center axis.
   * H = sqrt( P^2 - (R * sin(alpha) + Cx)^2 ) + R * cos(alpha)
   * 
   * Validation check for 250mm wheel, 140mm projection, 15deg angle, Cx=30:
   * R=125, P=140, alpha=15deg, Cx=30
   * sin(15)=0.2588, cos(15)=0.9659
   * (R*sin(15) + Cx) = 125 * 0.2588 + 30 = 32.35 + 30 = 62.35
   * sqrt(140^2 - 62.35^2) = sqrt(19600 - 3887) = sqrt(15713) = 125.35
   * H = 125.35 + 125 * 0.9659 = 125.35 + 120.73 = 246.08
   * 
   * If housing offset is ~70mm (center to housing top), result ~176mm.
   * This matches user expectation of ~175mm.
   */

  try {
    const term1 = R * Math.sin(alpha) + usbHorizontalDist;
    if (Math.abs(term1) > P) return null; // Impossible geometry
    
    const hCenter = Math.sqrt(P * P - term1 * term1) + R * Math.cos(alpha);
    
    // Result relative to housing
    return hCenter - housingOffset;
  } catch (e) {
    return null;
  }
}
