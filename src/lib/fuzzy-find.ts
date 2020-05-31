/**
 * This file contains an implementation of fuzzy string matching.
 */

export interface FuzzyMatch {
  // List of [start, end] indices in the haystack string that match the needle string
  matchedRanges: [number, number][]

  // The score of the match for relative ranking. Higher scores indicate
  // "better" matches.
  score: number
}

export function fuzzyMatchStrings(text: string, pattern: string): FuzzyMatch | null {
  return fzfFuzzyMatchV1(text, pattern)
}

// The implementation here is based on FuzzyMatchV1, as described here:
// https://github.com/junegunn/fzf/blob/f81feb1e69e5cb75797d50817752ddfe4933cd68/src/algo/algo.go#L8-L15
//
// This is a hand-port to better understand what the code is doing and for added
// clarity.
//
// Capitalized letters only match capitalized letters, but lower-case letters
// match both.
//
// Note: fzf includes a normalization table for homoglyphs. I'm going to ignore that too
// https://github.com/junegunn/fzf/blob/master/src/algo/normalize.go
const charCodeLowerA = 'a'.charCodeAt(0)
const charCodeLowerZ = 'z'.charCodeAt(0)
const charCodeUpperA = 'A'.charCodeAt(0)
const charCodeUpperZ = 'Z'.charCodeAt(0)
const charCodeDigit0 = '0'.charCodeAt(0)
const charCodeDigit9 = '9'.charCodeAt(0)

enum fzfCharClass {
  charNonWord,
  charLower,
  charUpper,
  charNumber,
}

function fzfCharClassOf(char: string): fzfCharClass {
  const code = char.charCodeAt(0)
  if (charCodeLowerA <= code && code <= charCodeLowerZ) {
    return fzfCharClass.charLower
  } else if (charCodeUpperA <= code && code <= charCodeUpperZ) {
    return fzfCharClass.charUpper
  } else if (charCodeDigit0 <= code && code <= charCodeDigit9) {
    return fzfCharClass.charNumber
  }
  return fzfCharClass.charNonWord
}

function charsMatch(textChar: string, patternChar: string): boolean {
  if (textChar === patternChar) return true

  const patternCharCode = patternChar.charCodeAt(0)
  if (charCodeLowerA <= patternCharCode && patternCharCode <= charCodeLowerZ) {
    return textChar.charCodeAt(0) === patternCharCode - charCodeLowerA + charCodeUpperA
  }
  return false
}

function fzfFuzzyMatchV1(text: string, pattern: string): FuzzyMatch | null {
  if (pattern.length == 0) {
    return {matchedRanges: [], score: 0}
  }

  // I removed the fzfAsciiFuzzyIndex code because it's not actually clear to
  // me that it's a very helpful optimization.

  let pidx = 0
  let sidx = -1
  let eidx = -1

  let lenRunes = text.length
  let lenPattern = pattern.length

  // Forward pass: scan over the text pattern, identifying the earliest start
  // and the latest end to consider.
  for (let index = 0; index < lenRunes; index++) {
    let char = text[index]
    let pchar = pattern[pidx]
    if (charsMatch(char, pchar)) {
      if (sidx < 0) {
        sidx = index
      }
      pidx++
      if (pidx == lenPattern) {
        // We found the last character in the pattern! eidx is exclusive, so
        // we'll set it to the current index + 1.
        eidx = index + 1
        break
      }
    }
  }

  if (eidx == -1) {
    // We couldn't find all the characters in the pattern. No match.
    return null
  }

  // Assuming we found all the characters in the pattern, perform the backwards
  // pass.
  pidx--
  for (let index = eidx - 1; index >= sidx; index--) {
    const char = text[index]
    const pchar = pattern[pidx]
    if (charsMatch(char, pchar)) {
      pidx--
      if (pidx < 0) {
        // We found the first character of the pattern, scanning
        // backwards. This *may* have narrowed the match further.
        // For example, for the following inputs:
        //
        //    text = "xxx a b c abc xxx"
        // pattern = "abc"
        //
        // For the forward pass, you get:
        //
        //    "xxx a b c abc xxx"
        //    start^        ^end
        //
        // But after the backward pass, we can narrow this to:
        //
        //    "xxx a b c abc xxx"
        //          start^  ^end
        sidx = index
        return fzfCalculateScore(text, pattern, sidx, eidx)
      }
    }
  }

  // This should be unreachable.
  throw new Error('Implementation error. This must be a bug in fzfFuzzyMatchV1')
}

const fzfScoreMatch = 16
const fzfScoreGapStart = -3
const fzfScoreGapExtension = -1
const fzfBonusBoundary = fzfScoreMatch / 2
const fzfBonusNonWord = fzfScoreMatch / 2
const fzfBonusCamel123 = fzfBonusBoundary + fzfScoreGapExtension
const fzfBonusConsecutive = -(fzfScoreGapStart + fzfScoreGapExtension)
const fzfBonusFirstCharMultiplier = 2

function bonusFor(prevClass: fzfCharClass, curClass: fzfCharClass): number {
  if (prevClass === fzfCharClass.charNonWord && curClass !== fzfCharClass.charNonWord) {
    // Prefer matching at word boundaries
    //
    // This should prefer "a c" over "abc" for a pattern of "ac".
    return fzfBonusBoundary
  }

  if (
    (prevClass === fzfCharClass.charLower && curClass == fzfCharClass.charUpper) ||
    (prevClass !== fzfCharClass.charNumber && curClass == fzfCharClass.charNumber)
  ) {
    // Prefer matching at the transition point between lower & upper for camelCase,
    // and from transition from letter to number for identifiers like letter123.
    //
    // This should prefer "OutNode" over "phone" for a pattern of "n",
    // and "abc123" over "x211" for a pattern of "1".
    return fzfBonusCamel123
  }

  if (curClass === fzfCharClass.charNonWord) {
    return fzfBonusNonWord
  }
  return 0
}

function fzfCalculateScore(text: string, pattern: string, sidx: number, eidx: number): FuzzyMatch {
  let pidx = 0
  let score = 0
  let inGap = false
  let consecutive = 0
  let firstBonus = 0
  let pos: number[] = new Array(pattern.length)
  let prevClass = fzfCharClass.charNonWord

  if (sidx > 0) {
    prevClass = fzfCharClassOf(text[sidx - 1])
  }
  for (let idx = sidx; idx < eidx; idx++) {
    let char = text[idx]
    let curClass = fzfCharClassOf(char)
    if (charsMatch(char, pattern[pidx])) {
      pos[pidx] = idx
      score += fzfScoreMatch
      let bonus = bonusFor(prevClass, curClass)
      if (consecutive == 0) {
        firstBonus = bonus
      } else {
        // Break consecutive chunk
        if (bonus === fzfBonusBoundary) {
          firstBonus = bonus
        }
        bonus = Math.max(bonus, firstBonus, fzfBonusConsecutive)
      }
      if (pidx === 0) {
        score += bonus * fzfBonusFirstCharMultiplier
      } else {
        score += bonus
      }
      inGap = false
      consecutive++
      pidx++
    } else {
      if (inGap) {
        // Penalize gaps (this bonus is negative)
        score += fzfScoreGapExtension
      } else {
        // Penalize the beginning of gaps more harshly
        score += fzfScoreGapStart
      }
      inGap = true
      consecutive = 0
      firstBonus = 0
    }
    prevClass = curClass
  }

  if (pidx !== pattern.length) {
    throw new Error(
      'fzfCalculateScore should only be called when pattern is found between sidx and eidx',
    )
  }

  let matchedRanges: [number, number][] = [[pos[0], pos[0] + 1]]
  for (let i = 1; i < pos.length; i++) {
    const curPos = pos[i]
    const curRange = matchedRanges[matchedRanges.length - 1]
    if (curRange[1] === curPos) {
      curRange[1] = curPos + 1
    } else {
      matchedRanges.push([curPos, curPos + 1])
    }
  }

  return {
    score,
    matchedRanges,
  }
}
