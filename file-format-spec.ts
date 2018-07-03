// This file contains types which specify the speedscope file format.

export interface SerializedFrame {
  name: string
  file?: string
  line?: number
  col?: number
}

export interface SerializedNode {
  // Index into the frames array on the SerializedProfile
  frame: number

  // Index into the nodes array on the SerializedProfile
  parent?: number
}

export type WeightUnit =
  | 'none'
  | 'nanoseconds'
  | 'microseconds'
  | 'milliseconds'
  | 'seconds'
  | 'bytes'

export interface SerializedSamplingProfile {
  // Type of profile. This will future proof the file format to allow many
  // different kinds of profiles to be contained and each type to be part of
  // a discriminate union.
  type: 'SamplingProfile'

  // Name of the profile. Typically a filename for the source of the profile.
  name: string

  // List of all call frames
  frames: SerializedFrame[]

  // List of nodes in the call tree
  nodes: SerializedNode[]

  // List of indices into nodes, with -1 indicating that the call-stack
  // was empty at the time of the sample
  samples: number[]

  // The weight of the sample at the given index. Should have
  // the same length as the samples array.
  weights: number[]

  // Unit of the weights provided in the profile. If none provided,
  // the weights are assumed to be unit-less.
  weightUnit: WeightUnit
}

export interface SerializedSpeedscopeFile {
  version: string
  exporter: 'https://www.speedscope.app'
  profiles: SerializedSamplingProfile[]
}
