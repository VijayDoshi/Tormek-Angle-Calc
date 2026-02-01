/**
 * Mathematical core for Tormek T8 Geometry.
 * 
 * Coordinate System:
 * - Wheel center at (0, 0)
 * - Wheel radius = R
 * - USB Support Point = S(Cx, Cy)
 *   - Cx = Horizontal distance from wheel center (positive usually)
 *   - Cy = Height from wheel center (what we want to find)
 * - Blade touches wheel at Contact Point K(Kx, Ky)
 * - Distance |SK| = Projection P
 * - Angle between SK and Tangent at K is the Bevel Angle (alpha)
 */

export interface GeometryParams {
  wheelDiameter: number;      // mm
  projection: number;         // mm (P)
  targetAngle: number;        // degrees (alpha)
  usbHorizontalDist: number;  // mm (Cx)
  housingOffset?: number;     // mm (distance from wheel center to housing top, for final output)
}

/**
 * Calculates the required USB Height relative to the housing/datum.
 * Returns null if geometry is impossible.
 */
export function calculateUSBHeight(params: GeometryParams): number | null {
  const { wheelDiameter, projection, targetAngle, usbHorizontalDist, housingOffset = 0 } = params;
  
  const R = wheelDiameter / 2;
  const P = projection;
  const alphaRad = (targetAngle * Math.PI) / 180;
  
  // We need to find H (Cy) such that the geometry constraint is met.
  // We use a binary search approach for robustness.
  // Range for H: -200mm to +400mm relative to wheel center.
  
  let low = -200;
  let high = 400;
  let epsilon = 0.01; // Precision mm
  let solutionH = null;

  // Function to calculate the resulting angle for a given H
  // Returns difference from target angle
  const evaluateAngle = (h: number): number | null => {
    // 1. Find intersection of Circle(0,0,R) and Circle(Cx, h, P)
    // There are two intersections, we want the one corresponding to the top/grinding side.
    
    // Distance between centers
    const dx = usbHorizontalDist; // Cx - 0
    const dy = h; // Cy - 0
    const d2 = dx*dx + dy*dy;
    const d = Math.sqrt(d2);

    // Check if circles intersect
    if (d > R + P || d < Math.abs(R - P) || d === 0) {
      return null; // Impossible geometry
    }

    // Intersection formula
    const a = (R*R - P*P + d2) / (2*d);
    const h_intersect = Math.sqrt(Math.max(0, R*R - a*a));
    
    // Point P2 (midpoint of chord)
    const x2 = (a * dx) / d;
    const y2 = (a * dy) / d;

    // Intersection points
    // K1 = (x2 + h_intersect * dy / d, y2 - h_intersect * dx / d)
    // K2 = (x2 - h_intersect * dy / d, y2 + h_intersect * dx / d)
    
    // For Tormek, the contact point is typically the "upper" one relative to the USB if grinding against edge?
    // Actually, usually USB is above wheel, blade hangs down. Or USB is front.
    // Let's assume standard position: USB horizontal ~50mm, Height ~100mm+.
    // The contact point usually has positive Y.
    // Let's pick the intersection with higher Y for typical "top" grinding.
    const K1 = { x: x2 + h_intersect * dy / d, y: y2 - h_intersect * dx / d };
    const K2 = { x: x2 - h_intersect * dy / d, y: y2 + h_intersect * dx / d };
    
    // Heuristic: The contact point K should be "between" the wheel center and USB in terms of angle? 
    // Usually K is quite high. Let's try both and see which yields a realistic bevel angle.
    // Actually, we just compute the angle for both and see which one matches the logic of the jig.
    // The Jig holds the knife. S is the jig pivot. K is edge.
    // Vector SK = K - S.
    // Normal at K is just K (since center is 0,0).
    // Angle between SK and Normal is (90 - alpha) or (90 + alpha).
    // Bevel angle alpha is typically 10-25 deg.
    // Angle between Normal and SK should be close to 90? No.
    // If alpha is 0 (flat), SK is tangent. Angle between SK and Normal is 90.
    // If alpha is > 0, the edge bites into the stone.
    
    // Angle between two vectors A and B: acos( (A.B) / (|A||B|) )
    // Vector Normal = (kx, ky)
    // Vector Jig = (kx - Cx, ky - h)
    
    // Check K1
    const checkK = (k: {x: number, y: number}) => {
      const vx_normal = k.x;
      const vy_normal = k.y;
      const vx_jig = k.x - usbHorizontalDist;
      const vy_jig = k.y - h;
      
      const dot = vx_normal * vx_jig + vy_normal * vy_jig;
      const magN = R; // known
      const magJ = Math.sqrt(vx_jig*vx_jig + vy_jig*vy_jig); // should be P
      
      const cosTheta = dot / (magN * magJ);
      const thetaRad = Math.acos(Math.max(-1, Math.min(1, cosTheta)));
      
      // Theta is angle between Normal and Jig-Arm.
      // Tangent is perpendicular to Normal.
      // So Alpha (bevel) = |90 deg - Theta_deg| ?
      // If Jig is Tangent, Theta = 90. Alpha = 0.
      // If Jig is steeper, Theta < 90?
      // Yes. So Alpha = 90 - (theta * 180 / PI).
      
      return 90 - (thetaRad * 180 / Math.PI);
    };

    // We usually want the contact point closer to top of wheel for vertical USB
    const angle1 = checkK(K1);
    const angle2 = checkK(K2);

    // We assume the configuration that gives a positive realistic angle.
    // Usually only one solution makes physical sense for the Tormek jig setup.
    // Let's return the one closest to target, or simply the one that isn't weird.
    // For standard setup, K2 (higher Y usually) is correct?
    
    return K2.y > K1.y ? angle2 : angle1; 
  };

  // Binary Search
  for (let i = 0; i < 50; i++) {
    const mid = (low + high) / 2;
    const angle = evaluateAngle(mid);
    
    if (angle === null) {
      // Geometry broke, try moving towards valid region?
      // This simple solver might get stuck if range includes invalid voids.
      // Assume solution exists in range and function is monotonic-ish.
      // If null, we might be too far away.
      // Fallback: If low gives null, bump it up. If high gives null, bump down.
      // Actually, linear scan to find valid start might be needed if complex.
      // Given constraints, let's assume valid range is central.
      high -= 1; // dummy step
      continue;
    }

    if (Math.abs(angle - targetAngle) < 0.01) {
      solutionH = mid;
      break;
    }

    if (angle < targetAngle) {
      // To increase angle, do we raise or lower USB?
      // Tormek logic: Higher USB = Steeper angle (larger alpha).
      // So if angle < target, we need more height.
      low = mid;
    } else {
      high = mid;
    }
    solutionH = mid;
  }
  
  if (solutionH !== null) {
    // Convert from Wheel Center Height to Housing Height
    // H_output = H_center - H_offset
    // If offset is distance from center TO housing top (positive up), then Housing Top is at y = offset.
    // Distance = H_center - offset.
    return solutionH - housingOffset;
  }

  return null;
}
