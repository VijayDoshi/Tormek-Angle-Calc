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
 */
export function calculateUSBHeight(params: GeometryParams): number | null {
  const { wheelDiameter, projection, targetAngle, usbHorizontalDist, housingOffset = 0 } = params;
  
  const R = wheelDiameter / 2;
  const P = projection;
  const alphaRad = (targetAngle * Math.PI) / 180;
  
  /**
   * Geometry logic for Tormek T8 Vertical Mount:
   * Let contact point K = (R*cos(phi), R*sin(phi))
   * The USB S = (Cx, Cy)
   * Distance SK = P => (Cx - R*cos(phi))^2 + (Cy - R*sin(phi))^2 = P^2
   * 
   * The vector from S to K is V = (R*cos(phi) - Cx, R*sin(phi) - Cy)
   * The normal at K is N = (cos(phi), sin(phi))
   * The angle between V and N is theta.
   * Bevel angle alpha = 90 - theta => theta = 90 - alpha
   * cos(theta) = sin(alpha)
   * cos(theta) = (V . N) / (|V| * |N|)
   * sin(alpha) = ((R*cos(phi) - Cx)*cos(phi) + (R*sin(phi) - Cy)*sin(phi)) / P
   * P * sin(alpha) = R - Cx*cos(phi) - Cy*sin(phi)
   * 
   * We have a system of two equations with two unknowns (phi, Cy):
   * 1) (Cx - R*cos(phi))^2 + (Cy - R*sin(phi))^2 = P^2
   * 2) Cy*sin(phi) = R - P*sin(alpha) - Cx*cos(phi)
   * 
   * From (2): Cy = (R - P*sin(alpha) - Cx*cos(phi)) / sin(phi)
   * Substitute into (1) and solve for phi, then Cy.
   * 
   * Tormek T8 typical phi is in the upper quadrant (grinding on top).
   */

  let solutionCy = null;
  
  // Search for the contact angle phi (radians)
  // Usually the contact point is near the top (phi around 70-110 degrees)
  for (let phiDeg = 0; phiDeg < 180; phiDeg += 0.1) {
    const phi = (phiDeg * Math.PI) / 180;
    const s = Math.sin(phi);
    const c = Math.cos(phi);
    
    if (Math.abs(s) < 0.001) continue;
    
    // Calculate Cy from the angle condition
    const cy = (R - P * Math.sin(alphaRad) - usbHorizontalDist * c) / s;
    
    // Check if this Cy satisfies the distance condition |SK| = P
    const distSq = Math.pow(usbHorizontalDist - R * c, 2) + Math.pow(cy - R * s, 2);
    const diff = Math.abs(Math.sqrt(distSq) - P);
    
    if (diff < 0.1) {
      solutionCy = cy;
      break;
    }
  }

  if (solutionCy !== null) {
    // For Tormek T8, the housing top is typically BELOW the wheel center.
    // So housingOffset (center to top) might be negative if top is below.
    // Result = Height above housing = solutionCy - housingOffset
    return solutionCy - housingOffset;
  }

  return null;
}
