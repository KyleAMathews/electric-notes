import * as decoding from "lib0/decoding"

export const parseToDecoder = (data: { op: string }) => {
  return {
    ...data,
    op: decoding.createDecoder(Buffer.from(data.op, "base64")),
  }
}
