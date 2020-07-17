export interface BreakpointRange {
  start: number;
  end: number;
}

let _breakpoints: {
  small: BreakpointRange;
  medium: BreakpointRange;
  large: BreakpointRange;
  xlarge: BreakpointRange;
  xxlarge: BreakpointRange;
};

export function getBreakpoints() {
  if (!_breakpoints) {
    const small = 64;
    const medium = 128;
    const large = 256;
    const xlarge = 512;
    const xxlarge = 1024;

    _breakpoints = {
      small: { start: small, end: medium },
      medium: { start: medium, end: large },
      large: { start: large, end: xlarge },
      xlarge: { start: xlarge, end: xxlarge },
      xxlarge: { start: xxlarge, end: 999999999 },
    };
  }

  return _breakpoints;
}
