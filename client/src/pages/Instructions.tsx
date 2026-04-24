import { Layout } from "@/components/ui/Layout";
import { ExternalLink, Ruler, Wrench, Target, CheckCircle2 } from "lucide-react";

const STEPS = [
  {
    icon: Wrench,
    title: "Mount the Knife in the Jig",
    body:
      "Clamp the blade in your KJ-45 / SVM-45 jig with the spine resting against the stop. Tighten the knob firmly so the blade cannot shift while sharpening.",
  },
  {
    icon: Ruler,
    title: "Set a Fixed Projection",
    body:
      "Measure from the front of the knob to the cutting edge of the blade. This is your projection (P). Use the same projection every time — typically 139 mm — for repeatable results.",
  },
  {
    icon: Target,
    title: "Dial in the Bevel Angle",
    body:
      "Open the calculator, choose your wheel, and enter your target bevel angle (e.g. 18° per side for a chef's knife) and your projection. The app computes the exact USB height for that angle on your current wheel diameter.",
  },
  {
    icon: CheckCircle2,
    title: "Set the USB and Sharpen",
    body:
      "Adjust the Universal Support Bar to the calculated height (measured from the base to the top of the bar) on both sides. Sharpen one side, flip the jig, and repeat for a perfectly symmetrical edge.",
  },
];

export default function Instructions() {
  return (
    <Layout title="Instructions">
      <div className="space-y-6">
        <div className="steel-card rounded-2xl p-6">
          <h2 className="stencil text-base text-primary mb-2">Fixed Projection Method</h2>
          <p className="text-sm text-foreground/80 leading-relaxed">
            The fixed-projection method is the fastest, most repeatable way to sharpen knives on a Tormek.
            Once your jig projection is locked in, this app gives you the exact USB height for any bevel
            angle on any wheel diameter — no protractor, no guesswork.
          </p>
        </div>

        <div className="space-y-3">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <div
              key={i}
              className="steel-card rounded-2xl p-5 flex gap-4"
              data-testid={`step-${i + 1}`}
            >
              <div className="flex-shrink-0">
                <div className="h-11 w-11 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="stencil text-[10px] text-muted-foreground text-center mt-1">
                  Step {i + 1}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-semibold text-foreground mb-1">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>

        <a
          href="https://magnoliaknife.com/products/tormek-kj-45-adjustable-retrofit"
          target="_blank"
          rel="noopener noreferrer"
          className="block group"
          data-testid="link-kj45-retrofit"
        >
          <div className="ember-card rounded-2xl p-6 text-primary-foreground transition-transform duration-200 group-hover:-translate-y-0.5">
            <div className="stencil text-[11px] text-primary-foreground/80 mb-1">
              Recommended Upgrade
            </div>
            <h3 className="font-display font-bold text-2xl mb-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
              Tormek KJ-45 / 140 Adjustable Retrofit
            </h3>
            <p className="text-sm text-primary-foreground/85 leading-relaxed mb-4">
              Brings back the adjustability of the discontinued SVM-45 with a longer aluminum shaft for
              wider blades and finer micro-adjustments — ideal for the fixed-projection method.
            </p>
            <div className="inline-flex items-center gap-1.5 text-sm font-medium bg-black/25 rounded-full px-3 py-1.5 border border-white/20">
              Buy at Magnolia Knife
              <ExternalLink className="h-3.5 w-3.5" />
            </div>
          </div>
        </a>

        <p className="text-xs text-muted-foreground text-center pt-2">
          Tip: Set your projection once, then use this app to switch angles freely as your wheel wears down.
        </p>
      </div>
    </Layout>
  );
}
