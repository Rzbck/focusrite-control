'use strict'

// Use interior values for functional gain probes. The 18i20 hardware has
// demonstrated that an advertised lower boundary can be server-normalized
// (for example, a requested -128 reported back as -127) even when the write
// path itself is useful. Boundary normalization must not be misclassified as
// a no-effect control.
const OUTPUT_GAIN_PROBE = Object.freeze({
  low: -127,
  high: -126,
})

module.exports = {
  OUTPUT_GAIN_PROBE,
}
