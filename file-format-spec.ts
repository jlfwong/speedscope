// This file contains types which specify the speedscope file format.

export namespace FileFormat {
  export interface Frame {
    name: string
    file?: string
    line?: number
    col?: number
  }

  export enum EventType {
    OPEN_FRAME = 'O',
    CLOSE_FRAME = 'C',
  }

  interface IEvent {
    type: EventType
    at: number
  }

  // Indicates a stack frame opened. Every opened stack frame must have a
  // corresponding close frame event, and the ordering must be balanced.
  interface OpenFrameEvent extends IEvent {
    type: EventType.OPEN_FRAME
    // An index into the frames array in the shared data within the profile
    frame: number
  }

  interface CloseFrameEvent extends IEvent {
    type: EventType.CLOSE_FRAME
    // An index into the frames array in the shared data within the profile
    frame: number
  }

  export type Event = OpenFrameEvent | CloseFrameEvent

  export type ValueUnit =
    | 'none'
    | 'nanoseconds'
    | 'microseconds'
    | 'milliseconds'
    | 'seconds'
    | 'bytes'

  export enum ProfileType {
    EVENTED = 'evented',
  }

  export interface IProfile {
    type: ProfileType
  }

  export interface SerializedEventedProfile extends IProfile {
    // Type of profile. This will future proof the file format to allow many
    // different kinds of profiles to be contained and each type to be part of
    // a discriminated union.
    type: ProfileType.EVENTED

    // Name of the profile. Typically a filename for the source of the profile.
    name: string

    // Unit which all value are specified using in the profile.
    unit: ValueUnit

    // The starting value of the profile. This will typically be a timestamp.
    // All event values will be relative to this startValue.
    startValue: number

    // The final value of the profile. This will typically be a timestamp. This
    // must be greater than or equal to the startValue. This is useful in
    // situations where the recorded profile extends past the end of the recorded
    // events, which may happen if nothing was happening at the end of the
    // profile.
    endValue: number

    // List of events that occured as part of this profile.
    // The "at" field of every event must be in non-decreasing order.
    events: Event[]
  }

  export type Profile = SerializedEventedProfile

  export interface File {
    version: string
    exporter: 'https://www.speedscope.app'
    shared: {
      frames: Frame[]
    }
    profiles: Profile[]
  }
}
