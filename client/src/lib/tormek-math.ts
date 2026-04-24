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
  jigDiameter?: number;       // mm (J) - diameter of the knife jig resting on the USB bar (default 12)
}

/**
 * Calculates the required USB Height for a Tormek T8 vertical USB mount.
 *
 * Source: TormekCalc2 spreadsheet — combines TormekCalc!G15 (effective
 * projection) with BevelCalc!C34 (USB height). Accounts for a round jig
 * resting on the USB bar (the blade rides on top of the jig).
 *
 *   JG = P - U/2
 *   JC = U/2 + J/2          ← corrects for USB radius + jig radius
 *   CG = sqrt(JC^2 + JG^2)
 *   DK = atan(JC / JG)
 *   H  = sqrt(CG^2 + R^2 + 2·CG·R·sin(α − DK) − HV^2) − VV + U/2
 *
 * Where:
 *   R  = wheel radius (D / 2)
 *   P  = blade projection from top of USB to wheel contact point
 *   α  = target bevel angle (degrees)
 *   U  = USB bar diameter (typically 12 mm)
 *   J  = jig diameter (typically 12 mm; use 0 if blade rests directly on USB)
 *   HV = horizontal distance from wheel center to USB axis (~50 mm)
 *   VV = vertical distance from the machine datum to the wheel center (~29 mm)
 */
export function calculateUSBHeight(params: GeometryParams): number | null {
  const {
    wheelDiameter,
    projection,
    targetAngle,
    usbHorizontalDist,
    housingOffset = 0,
    usbDiameter = 12,
    jigDiameter = 12,
  } = params;

  const R = wheelDiameter / 2;
  const P = projection;
  const U = usbDiameter;
  const J = jigDiameter;
  const HV = usbHorizontalDist;
  const VV = housingOffset;
  const alpha = (targetAngle * Math.PI) / 180;

  try {
    const JG = P - U / 2;
    const JC = U / 2 + J / 2;
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

export interface ProjectionParams {
  wheelDiameter: number;      // mm (D)
  usbHeight: number;          // mm (H) - measured USB height (from datum)
  targetAngle: number;        // degrees (α)
  usbHorizontalDist: number;  // mm (HV)
  housingOffset?: number;     // mm (VV)
  usbDiameter?: number;       // mm (U)
  jigDiameter?: number;       // mm (J)
}

/**
 * Inverse of calculateUSBHeight: given a fixed USB height H, solve for the
 * blade projection P that produces the target bevel angle α.
 *
 * Derivation: starting from
 *   (H + VV - U/2)^2 + HV^2 = CG^2 + R^2 + 2·R·CG·sin(α - DK)
 * and noting that CG·sin(α - DK) = (P - U/2)·sinα - (U/2 + J/2)·cosα and
 * CG^2 = (U/2 + J/2)^2 + (P - U/2)^2, this becomes a quadratic in q = P - U/2:
 *   q^2 + 2R·sinα·q + [(U/2 + J/2)^2 + R^2 - 2R·(U/2 + J/2)·cosα - LHS] = 0
 * Taking the positive root and adding U/2 back:
 *   P = U/2 - R·sinα + sqrt( LHS - (R·cosα - (U/2 + J/2))^2 )
 */
export function calculateProjection(params: ProjectionParams): number | null {
  const {
    wheelDiameter,
    usbHeight,
    targetAngle,
    usbHorizontalDist,
    housingOffset = 0,
    usbDiameter = 12,
    jigDiameter = 12,
  } = params;

  const R = wheelDiameter / 2;
  const U = usbDiameter;
  const J = jigDiameter;
  const HV = usbHorizontalDist;
  const VV = housingOffset;
  const alpha = (targetAngle * Math.PI) / 180;

  try {
    const lhs = Math.pow(usbHeight + VV - U / 2, 2) + HV * HV;
    const k = R * Math.cos(alpha) - (U / 2 + J / 2);
    const radicand = lhs - k * k;
    if (radicand < 0) return null;

    const P = U / 2 - R * Math.sin(alpha) + Math.sqrt(radicand);
    if (P <= U / 2) return null;
    return P;
  } catch (e) {
    return null;
  }
}
