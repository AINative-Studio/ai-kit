// Mock tiktoken for browser - token counting not needed for UI demos
export function encoding_for_model() {
  return {
    encode: (text: string) => new Uint32Array(text.length),
    decode: (_tokens: Uint32Array) => '',
    free: () => {},
  }
}

export function get_encoding() {
  return encoding_for_model()
}

export default { encoding_for_model, get_encoding }
