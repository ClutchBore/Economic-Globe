const CODE_ALIASES = {
  KOS: 'XKX',
}

export function geoCountryCode(properties = {}) {
  const candidates = [
    properties.ISO_A3,
    properties.ADM0_A3,
    properties.WB_A3,
    properties.GU_A3,
    properties.SU_A3,
    properties.BRK_A3,
    properties.ADM0_A3_US,
    properties.ADM0_A3_IS,
  ]
  const code = candidates.find((candidate) => typeof candidate === 'string' && candidate.length === 3 && candidate !== '-99')
  return code ? (CODE_ALIASES[code] ?? code) : null
}
