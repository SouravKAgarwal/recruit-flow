import React from "react";
import { Row, ThemeSegment } from "../primitives";

export function AppearanceTab() {
  return (
    <div>
      <Row label="Theme" hint="Select your preferred color theme">
        <ThemeSegment />
      </Row>
      <Row label="Compact mode" hint="Reduce whitespace in the interface">
        <span className="text-xs text-muted-foreground px-2 py-1 rounded bg-muted">
          Coming soon
        </span>
      </Row>
      <Row label="Show avatars" hint="Display recruiter avatars in lists">
        <span className="text-xs text-muted-foreground px-2 py-1 rounded bg-muted">
          Coming soon
        </span>
      </Row>
    </div>
  );
}
