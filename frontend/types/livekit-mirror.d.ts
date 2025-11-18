import type { ParticipantTileProps as ParticipantTilePropsBase } from "@livekit/components-react";

declare module "@livekit/components-react" {
  interface ParticipantTileProps extends ParticipantTilePropsBase {
    mirror?: boolean;
  }
}
