export function splitUnquotedString(
  input: string,
  delimiter: string
): string[] {
  if (input.startsWith(delimiter)) {
    return splitUnquotedString(input.substring(delimiter.length), delimiter);
  }
  if (input.startsWith('"')) {
    // the part inside the quotes should not be split, the rest should
    const closingQuoteIndex = input.indexOf('"', 1);
    if (closingQuoteIndex === -1) {
      // Unmatched quotes, just split it
      return input.split(delimiter);
    }
    if (closingQuoteIndex === input.length - 1) {
      return [input];
    } else {
      const remainder = input.substring(closingQuoteIndex + 1);
      const result = [input.substring(0, closingQuoteIndex + 1)];
      result.push(...splitUnquotedString(remainder, delimiter));
      return result;
    }
  } else {
    return input.split(delimiter);
  }
}
