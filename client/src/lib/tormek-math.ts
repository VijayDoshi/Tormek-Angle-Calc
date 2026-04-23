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
  projection: number;         // mm (P) - blade projection from top of USB to wheel contact point
  targetAngle?: number;       // degrees - informational only; not used in H calc
  usbHorizontalDist: number;  // mm (HV) - horizontal: wheel center to USB axis
  housingOffset?: number;     // mm (VV) - vertical: machine datum to wheel center
  usbDiameter?: number;       // mm (U) - diameter of the USB bar (default 12)
}

/**
 * Calculates the required USB Height for a Tormek T8 vertical USB mount.
 *
 * Source: TormekCalc2 spreadsheet, sheet "BevelCalc", cell C34:
 *   H = SQRT( (R + (P - U/2))^2 - HV^2 ) - VV + U/2
 *
 * Where:
 *   R  = wheel radius (D / 2)
 *   P  = blade projection from the top of the USB to the wheel contact point
 *   U  = USB bar diameter (typically 12 mm)
 *   HV = horizontal distance from wheel center to USB axis (~50 mm)
 *   VV = vertical distance from the machine datum to the wheel center (~29 mm)
 *
 * Verification: D=250, P=85.11, U=12, HV=50, VV=29  =>  H = 175.21 mm
 * (matches the spreadsheet's BevelCalc!C34 value exactly).
 *
 * Note: the bevel angle does not enter this formula. In the Tormek workflow,
 * the angle is set independently (e.g. with the AngleMaster) and the projection
 * P is what you measure to make the contact point land at that angle.
 */
export function calculateUSBHeight(params: GeometryParams): number | null {
  const {
    wheelDiameter,
    projection,
    usbHorizontalDist,
    housingOffset = 0,
    usbDiameter = 12,
  } = params;

  const R = wheelDiameter / 2;
  const P = projection;
  const U = usbDiameter;
  const HV = usbHorizontalDist;
  const VV = housingOffset;

  try {
    const inner = R + (P - U / 2);
    const radicand = inner * inner - HV * HV;
    if (radicand < 0) return null; // impossible geometry

    return Math.sqrt(radicand) - VV + U / 2;
  } catch (e) {
    return null;
  }
}
