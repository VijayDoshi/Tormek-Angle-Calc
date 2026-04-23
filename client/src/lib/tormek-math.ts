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
  wheelDiameter: number;      // mm (D)
  projection: number;         // mm (P) - blade projection from top of USB to wheel contact
  targetAngle: number;        // degrees (α) - desired bevel angle
  usbHorizontalDist: number;  // mm (HV) - horizontal: wheel center to USB axis
  housingOffset?: number;     // mm (VV) - vertical: machine datum to wheel center
  usbDiameter?: number;       // mm (U) - diameter of the USB bar (default 12)
}

/**
 * Calculates the required USB Height for a Tormek T8 vertical USB mount.
 *
 * Source: TormekCalc2 spreadsheet — combines TormekCalc!G15 (effective
 * projection) with BevelCalc!C34 (USB height). Simplified for a knife
 * laid directly on the USB (no jig).
 *
 *   JG = P - U/2
 *   JC = U/2
 *   CG = sqrt(JC^2 + JG^2)
 *   DK = atan(JC / JG)
 *   H  = sqrt(CG^2 + R^2 + 2·CG·R·sin(α - DK) - HV^2) - VV + U/2
 *
 * Where:
 *   R  = wheel radius (D / 2)
 *   P  = blade projection from top of USB to wheel contact point
 *   α  = target bevel angle (degrees)
 *   U  = USB bar diameter (typically 12 mm)
 *   HV = horizontal distance from wheel center to USB axis (~50 mm)
 *   VV = vertical distance from the machine datum to the wheel center (~29 mm)
 *
 * The triangle (wheel center, USB top, contact point) gives the law of
 * cosines term CG² + R² + 2·CG·R·sin(α-DK); subtracting HV² and taking
 * the square root yields the vertical separation, then we adjust for the
 * machine datum (VV) and the USB radius (U/2).
 */
export function calculateUSBHeight(params: GeometryParams): number | null {
  const {
    wheelDiameter,
    projection,
    targetAngle,
    usbHorizontalDist,
    housingOffset = 0,
    usbDiameter = 12,
  } = params;

  const R = wheelDiameter / 2;
  const P = projection;
  const U = usbDiameter;
  const HV = usbHorizontalDist;
  const VV = housingOffset;
  const alpha = (targetAngle * Math.PI) / 180;

  try {
    const JG = P - U / 2;
    const JC = U / 2;
    if (JG <= 0) return null;

    const CG = Math.sqrt(JC * JC + JG * JG);
    const DK = Math.atan(JC / JG);

    const lawOfCosines =
      CG * CG + R * R + 2 * CG * R * Math.sin(alpha - DK);
    const radicand = lawOfCosines - HV * HV;
    if (radicand < 0) return null;

    return Math.sqrt(radicand) - VV + U / 2;
  } catch (e) {
    return null;
  }
}
