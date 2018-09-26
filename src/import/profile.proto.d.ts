// THIS FILE WAS AUTOMATICALLY GENERATED. DO NOT MODIFY THIS FILE MANUALLY.
//
// To regenerate this file, run the following in the repository root:
//
//    node node_modules/protobufjs/cli/bin/pbts -o src/import/profile.proto.d.ts src/import/profile.proto.j
//
// Then prepend this comment to the result.
import * as $protobuf from 'protobufjs'
/** Namespace perftools. */
export namespace perftools {
  /** Namespace profiles. */
  namespace profiles {
    /** Properties of a Profile. */
    interface IProfile {
      /** Profile sampleType */
      sampleType?: perftools.profiles.IValueType[] | null

      /** Profile sample */
      sample?: perftools.profiles.ISample[] | null

      /** Profile mapping */
      mapping?: perftools.profiles.IMapping[] | null

      /** Profile location */
      location?: perftools.profiles.ILocation[] | null

      /** Profile function */
      function?: perftools.profiles.IFunction[] | null

      /** Profile stringTable */
      stringTable?: string[] | null

      /** Profile dropFrames */
      dropFrames?: number | Long | null

      /** Profile keepFrames */
      keepFrames?: number | Long | null

      /** Profile timeNanos */
      timeNanos?: number | Long | null

      /** Profile durationNanos */
      durationNanos?: number | Long | null

      /** Profile periodType */
      periodType?: perftools.profiles.IValueType | null

      /** Profile period */
      period?: number | Long | null

      /** Profile comment */
      comment?: (number | Long)[] | null

      /** Profile defaultSampleType */
      defaultSampleType?: number | Long | null
    }

    /** Represents a Profile. */
    class Profile implements IProfile {
      /**
       * Constructs a new Profile.
       * @param [properties] Properties to set
       */
      constructor(properties?: perftools.profiles.IProfile)

      /** Profile sampleType. */
      public sampleType: perftools.profiles.IValueType[]

      /** Profile sample. */
      public sample: perftools.profiles.ISample[]

      /** Profile mapping. */
      public mapping: perftools.profiles.IMapping[]

      /** Profile location. */
      public location: perftools.profiles.ILocation[]

      /** Profile function. */
      public function: perftools.profiles.IFunction[]

      /** Profile stringTable. */
      public stringTable: string[]

      /** Profile dropFrames. */
      public dropFrames: number | Long

      /** Profile keepFrames. */
      public keepFrames: number | Long

      /** Profile timeNanos. */
      public timeNanos: number | Long

      /** Profile durationNanos. */
      public durationNanos: number | Long

      /** Profile periodType. */
      public periodType?: perftools.profiles.IValueType | null

      /** Profile period. */
      public period: number | Long

      /** Profile comment. */
      public comment: (number | Long)[]

      /** Profile defaultSampleType. */
      public defaultSampleType: number | Long

      /**
       * Creates a new Profile instance using the specified properties.
       * @param [properties] Properties to set
       * @returns Profile instance
       */
      public static create(properties?: perftools.profiles.IProfile): perftools.profiles.Profile

      /**
       * Encodes the specified Profile message. Does not implicitly {@link perftools.profiles.Profile.verify|verify} messages.
       * @param message Profile message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(
        message: perftools.profiles.IProfile,
        writer?: $protobuf.Writer,
      ): $protobuf.Writer

      /**
       * Encodes the specified Profile message, length delimited. Does not implicitly {@link perftools.profiles.Profile.verify|verify} messages.
       * @param message Profile message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(
        message: perftools.profiles.IProfile,
        writer?: $protobuf.Writer,
      ): $protobuf.Writer

      /**
       * Decodes a Profile message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns Profile
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(
        reader: $protobuf.Reader | Uint8Array,
        length?: number,
      ): perftools.profiles.Profile

      /**
       * Decodes a Profile message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns Profile
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(
        reader: $protobuf.Reader | Uint8Array,
      ): perftools.profiles.Profile

      /**
       * Verifies a Profile message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: {[k: string]: any}): string | null

      /**
       * Creates a Profile message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns Profile
       */
      public static fromObject(object: {[k: string]: any}): perftools.profiles.Profile

      /**
       * Creates a plain object from a Profile message. Also converts values to other types if specified.
       * @param message Profile
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(
        message: perftools.profiles.Profile,
        options?: $protobuf.IConversionOptions,
      ): {[k: string]: any}

      /**
       * Converts this Profile to JSON.
       * @returns JSON object
       */
      public toJSON(): {[k: string]: any}
    }

    /** Properties of a ValueType. */
    interface IValueType {
      /** ValueType type */
      type?: number | Long | null

      /** ValueType unit */
      unit?: number | Long | null
    }

    /** Represents a ValueType. */
    class ValueType implements IValueType {
      /**
       * Constructs a new ValueType.
       * @param [properties] Properties to set
       */
      constructor(properties?: perftools.profiles.IValueType)

      /** ValueType type. */
      public type: number | Long

      /** ValueType unit. */
      public unit: number | Long

      /**
       * Creates a new ValueType instance using the specified properties.
       * @param [properties] Properties to set
       * @returns ValueType instance
       */
      public static create(properties?: perftools.profiles.IValueType): perftools.profiles.ValueType

      /**
       * Encodes the specified ValueType message. Does not implicitly {@link perftools.profiles.ValueType.verify|verify} messages.
       * @param message ValueType message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(
        message: perftools.profiles.IValueType,
        writer?: $protobuf.Writer,
      ): $protobuf.Writer

      /**
       * Encodes the specified ValueType message, length delimited. Does not implicitly {@link perftools.profiles.ValueType.verify|verify} messages.
       * @param message ValueType message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(
        message: perftools.profiles.IValueType,
        writer?: $protobuf.Writer,
      ): $protobuf.Writer

      /**
       * Decodes a ValueType message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns ValueType
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(
        reader: $protobuf.Reader | Uint8Array,
        length?: number,
      ): perftools.profiles.ValueType

      /**
       * Decodes a ValueType message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns ValueType
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(
        reader: $protobuf.Reader | Uint8Array,
      ): perftools.profiles.ValueType

      /**
       * Verifies a ValueType message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: {[k: string]: any}): string | null

      /**
       * Creates a ValueType message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns ValueType
       */
      public static fromObject(object: {[k: string]: any}): perftools.profiles.ValueType

      /**
       * Creates a plain object from a ValueType message. Also converts values to other types if specified.
       * @param message ValueType
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(
        message: perftools.profiles.ValueType,
        options?: $protobuf.IConversionOptions,
      ): {[k: string]: any}

      /**
       * Converts this ValueType to JSON.
       * @returns JSON object
       */
      public toJSON(): {[k: string]: any}
    }

    /** Properties of a Sample. */
    interface ISample {
      /** Sample locationId */
      locationId?: (number | Long)[] | null

      /** Sample value */
      value?: (number | Long)[] | null

      /** Sample label */
      label?: perftools.profiles.ILabel[] | null
    }

    /** Represents a Sample. */
    class Sample implements ISample {
      /**
       * Constructs a new Sample.
       * @param [properties] Properties to set
       */
      constructor(properties?: perftools.profiles.ISample)

      /** Sample locationId. */
      public locationId: (number | Long)[]

      /** Sample value. */
      public value: (number | Long)[]

      /** Sample label. */
      public label: perftools.profiles.ILabel[]

      /**
       * Creates a new Sample instance using the specified properties.
       * @param [properties] Properties to set
       * @returns Sample instance
       */
      public static create(properties?: perftools.profiles.ISample): perftools.profiles.Sample

      /**
       * Encodes the specified Sample message. Does not implicitly {@link perftools.profiles.Sample.verify|verify} messages.
       * @param message Sample message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(
        message: perftools.profiles.ISample,
        writer?: $protobuf.Writer,
      ): $protobuf.Writer

      /**
       * Encodes the specified Sample message, length delimited. Does not implicitly {@link perftools.profiles.Sample.verify|verify} messages.
       * @param message Sample message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(
        message: perftools.profiles.ISample,
        writer?: $protobuf.Writer,
      ): $protobuf.Writer

      /**
       * Decodes a Sample message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns Sample
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(
        reader: $protobuf.Reader | Uint8Array,
        length?: number,
      ): perftools.profiles.Sample

      /**
       * Decodes a Sample message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns Sample
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(
        reader: $protobuf.Reader | Uint8Array,
      ): perftools.profiles.Sample

      /**
       * Verifies a Sample message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: {[k: string]: any}): string | null

      /**
       * Creates a Sample message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns Sample
       */
      public static fromObject(object: {[k: string]: any}): perftools.profiles.Sample

      /**
       * Creates a plain object from a Sample message. Also converts values to other types if specified.
       * @param message Sample
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(
        message: perftools.profiles.Sample,
        options?: $protobuf.IConversionOptions,
      ): {[k: string]: any}

      /**
       * Converts this Sample to JSON.
       * @returns JSON object
       */
      public toJSON(): {[k: string]: any}
    }

    /** Properties of a Label. */
    interface ILabel {
      /** Label key */
      key?: number | Long | null

      /** Label str */
      str?: number | Long | null

      /** Label num */
      num?: number | Long | null

      /** Label numUnit */
      numUnit?: number | Long | null
    }

    /** Represents a Label. */
    class Label implements ILabel {
      /**
       * Constructs a new Label.
       * @param [properties] Properties to set
       */
      constructor(properties?: perftools.profiles.ILabel)

      /** Label key. */
      public key: number | Long

      /** Label str. */
      public str: number | Long

      /** Label num. */
      public num: number | Long

      /** Label numUnit. */
      public numUnit: number | Long

      /**
       * Creates a new Label instance using the specified properties.
       * @param [properties] Properties to set
       * @returns Label instance
       */
      public static create(properties?: perftools.profiles.ILabel): perftools.profiles.Label

      /**
       * Encodes the specified Label message. Does not implicitly {@link perftools.profiles.Label.verify|verify} messages.
       * @param message Label message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(
        message: perftools.profiles.ILabel,
        writer?: $protobuf.Writer,
      ): $protobuf.Writer

      /**
       * Encodes the specified Label message, length delimited. Does not implicitly {@link perftools.profiles.Label.verify|verify} messages.
       * @param message Label message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(
        message: perftools.profiles.ILabel,
        writer?: $protobuf.Writer,
      ): $protobuf.Writer

      /**
       * Decodes a Label message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns Label
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(
        reader: $protobuf.Reader | Uint8Array,
        length?: number,
      ): perftools.profiles.Label

      /**
       * Decodes a Label message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns Label
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(reader: $protobuf.Reader | Uint8Array): perftools.profiles.Label

      /**
       * Verifies a Label message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: {[k: string]: any}): string | null

      /**
       * Creates a Label message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns Label
       */
      public static fromObject(object: {[k: string]: any}): perftools.profiles.Label

      /**
       * Creates a plain object from a Label message. Also converts values to other types if specified.
       * @param message Label
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(
        message: perftools.profiles.Label,
        options?: $protobuf.IConversionOptions,
      ): {[k: string]: any}

      /**
       * Converts this Label to JSON.
       * @returns JSON object
       */
      public toJSON(): {[k: string]: any}
    }

    /** Properties of a Mapping. */
    interface IMapping {
      /** Mapping id */
      id?: number | Long | null

      /** Mapping memoryStart */
      memoryStart?: number | Long | null

      /** Mapping memoryLimit */
      memoryLimit?: number | Long | null

      /** Mapping fileOffset */
      fileOffset?: number | Long | null

      /** Mapping filename */
      filename?: number | Long | null

      /** Mapping buildId */
      buildId?: number | Long | null

      /** Mapping hasFunctions */
      hasFunctions?: boolean | null

      /** Mapping hasFilenames */
      hasFilenames?: boolean | null

      /** Mapping hasLineNumbers */
      hasLineNumbers?: boolean | null

      /** Mapping hasInlineFrames */
      hasInlineFrames?: boolean | null
    }

    /** Represents a Mapping. */
    class Mapping implements IMapping {
      /**
       * Constructs a new Mapping.
       * @param [properties] Properties to set
       */
      constructor(properties?: perftools.profiles.IMapping)

      /** Mapping id. */
      public id: number | Long

      /** Mapping memoryStart. */
      public memoryStart: number | Long

      /** Mapping memoryLimit. */
      public memoryLimit: number | Long

      /** Mapping fileOffset. */
      public fileOffset: number | Long

      /** Mapping filename. */
      public filename: number | Long

      /** Mapping buildId. */
      public buildId: number | Long

      /** Mapping hasFunctions. */
      public hasFunctions: boolean

      /** Mapping hasFilenames. */
      public hasFilenames: boolean

      /** Mapping hasLineNumbers. */
      public hasLineNumbers: boolean

      /** Mapping hasInlineFrames. */
      public hasInlineFrames: boolean

      /**
       * Creates a new Mapping instance using the specified properties.
       * @param [properties] Properties to set
       * @returns Mapping instance
       */
      public static create(properties?: perftools.profiles.IMapping): perftools.profiles.Mapping

      /**
       * Encodes the specified Mapping message. Does not implicitly {@link perftools.profiles.Mapping.verify|verify} messages.
       * @param message Mapping message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(
        message: perftools.profiles.IMapping,
        writer?: $protobuf.Writer,
      ): $protobuf.Writer

      /**
       * Encodes the specified Mapping message, length delimited. Does not implicitly {@link perftools.profiles.Mapping.verify|verify} messages.
       * @param message Mapping message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(
        message: perftools.profiles.IMapping,
        writer?: $protobuf.Writer,
      ): $protobuf.Writer

      /**
       * Decodes a Mapping message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns Mapping
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(
        reader: $protobuf.Reader | Uint8Array,
        length?: number,
      ): perftools.profiles.Mapping

      /**
       * Decodes a Mapping message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns Mapping
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(
        reader: $protobuf.Reader | Uint8Array,
      ): perftools.profiles.Mapping

      /**
       * Verifies a Mapping message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: {[k: string]: any}): string | null

      /**
       * Creates a Mapping message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns Mapping
       */
      public static fromObject(object: {[k: string]: any}): perftools.profiles.Mapping

      /**
       * Creates a plain object from a Mapping message. Also converts values to other types if specified.
       * @param message Mapping
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(
        message: perftools.profiles.Mapping,
        options?: $protobuf.IConversionOptions,
      ): {[k: string]: any}

      /**
       * Converts this Mapping to JSON.
       * @returns JSON object
       */
      public toJSON(): {[k: string]: any}
    }

    /** Properties of a Location. */
    interface ILocation {
      /** Location id */
      id?: number | Long | null

      /** Location mappingId */
      mappingId?: number | Long | null

      /** Location address */
      address?: number | Long | null

      /** Location line */
      line?: perftools.profiles.ILine[] | null

      /** Location isFolded */
      isFolded?: boolean | null
    }

    /** Represents a Location. */
    class Location implements ILocation {
      /**
       * Constructs a new Location.
       * @param [properties] Properties to set
       */
      constructor(properties?: perftools.profiles.ILocation)

      /** Location id. */
      public id: number | Long

      /** Location mappingId. */
      public mappingId: number | Long

      /** Location address. */
      public address: number | Long

      /** Location line. */
      public line: perftools.profiles.ILine[]

      /** Location isFolded. */
      public isFolded: boolean

      /**
       * Creates a new Location instance using the specified properties.
       * @param [properties] Properties to set
       * @returns Location instance
       */
      public static create(properties?: perftools.profiles.ILocation): perftools.profiles.Location

      /**
       * Encodes the specified Location message. Does not implicitly {@link perftools.profiles.Location.verify|verify} messages.
       * @param message Location message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(
        message: perftools.profiles.ILocation,
        writer?: $protobuf.Writer,
      ): $protobuf.Writer

      /**
       * Encodes the specified Location message, length delimited. Does not implicitly {@link perftools.profiles.Location.verify|verify} messages.
       * @param message Location message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(
        message: perftools.profiles.ILocation,
        writer?: $protobuf.Writer,
      ): $protobuf.Writer

      /**
       * Decodes a Location message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns Location
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(
        reader: $protobuf.Reader | Uint8Array,
        length?: number,
      ): perftools.profiles.Location

      /**
       * Decodes a Location message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns Location
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(
        reader: $protobuf.Reader | Uint8Array,
      ): perftools.profiles.Location

      /**
       * Verifies a Location message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: {[k: string]: any}): string | null

      /**
       * Creates a Location message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns Location
       */
      public static fromObject(object: {[k: string]: any}): perftools.profiles.Location

      /**
       * Creates a plain object from a Location message. Also converts values to other types if specified.
       * @param message Location
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(
        message: perftools.profiles.Location,
        options?: $protobuf.IConversionOptions,
      ): {[k: string]: any}

      /**
       * Converts this Location to JSON.
       * @returns JSON object
       */
      public toJSON(): {[k: string]: any}
    }

    /** Properties of a Line. */
    interface ILine {
      /** Line functionId */
      functionId?: number | Long | null

      /** Line line */
      line?: number | Long | null
    }

    /** Represents a Line. */
    class Line implements ILine {
      /**
       * Constructs a new Line.
       * @param [properties] Properties to set
       */
      constructor(properties?: perftools.profiles.ILine)

      /** Line functionId. */
      public functionId: number | Long

      /** Line line. */
      public line: number | Long

      /**
       * Creates a new Line instance using the specified properties.
       * @param [properties] Properties to set
       * @returns Line instance
       */
      public static create(properties?: perftools.profiles.ILine): perftools.profiles.Line

      /**
       * Encodes the specified Line message. Does not implicitly {@link perftools.profiles.Line.verify|verify} messages.
       * @param message Line message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(
        message: perftools.profiles.ILine,
        writer?: $protobuf.Writer,
      ): $protobuf.Writer

      /**
       * Encodes the specified Line message, length delimited. Does not implicitly {@link perftools.profiles.Line.verify|verify} messages.
       * @param message Line message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(
        message: perftools.profiles.ILine,
        writer?: $protobuf.Writer,
      ): $protobuf.Writer

      /**
       * Decodes a Line message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns Line
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(
        reader: $protobuf.Reader | Uint8Array,
        length?: number,
      ): perftools.profiles.Line

      /**
       * Decodes a Line message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns Line
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(reader: $protobuf.Reader | Uint8Array): perftools.profiles.Line

      /**
       * Verifies a Line message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: {[k: string]: any}): string | null

      /**
       * Creates a Line message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns Line
       */
      public static fromObject(object: {[k: string]: any}): perftools.profiles.Line

      /**
       * Creates a plain object from a Line message. Also converts values to other types if specified.
       * @param message Line
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(
        message: perftools.profiles.Line,
        options?: $protobuf.IConversionOptions,
      ): {[k: string]: any}

      /**
       * Converts this Line to JSON.
       * @returns JSON object
       */
      public toJSON(): {[k: string]: any}
    }

    /** Properties of a Function. */
    interface IFunction {
      /** Function id */
      id?: number | Long | null

      /** Function name */
      name?: number | Long | null

      /** Function systemName */
      systemName?: number | Long | null

      /** Function filename */
      filename?: number | Long | null

      /** Function startLine */
      startLine?: number | Long | null
    }

    /** Represents a Function. */
    class Function implements IFunction {
      /**
       * Constructs a new Function.
       * @param [properties] Properties to set
       */
      constructor(properties?: perftools.profiles.IFunction)

      /** Function id. */
      public id: number | Long

      /** Function name. */
      public name: number | Long

      /** Function systemName. */
      public systemName: number | Long

      /** Function filename. */
      public filename: number | Long

      /** Function startLine. */
      public startLine: number | Long

      /**
       * Creates a new Function instance using the specified properties.
       * @param [properties] Properties to set
       * @returns Function instance
       */
      public static create(properties?: perftools.profiles.IFunction): perftools.profiles.Function

      /**
       * Encodes the specified Function message. Does not implicitly {@link perftools.profiles.Function.verify|verify} messages.
       * @param message Function message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(
        message: perftools.profiles.IFunction,
        writer?: $protobuf.Writer,
      ): $protobuf.Writer

      /**
       * Encodes the specified Function message, length delimited. Does not implicitly {@link perftools.profiles.Function.verify|verify} messages.
       * @param message Function message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(
        message: perftools.profiles.IFunction,
        writer?: $protobuf.Writer,
      ): $protobuf.Writer

      /**
       * Decodes a Function message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns Function
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(
        reader: $protobuf.Reader | Uint8Array,
        length?: number,
      ): perftools.profiles.Function

      /**
       * Decodes a Function message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns Function
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(
        reader: $protobuf.Reader | Uint8Array,
      ): perftools.profiles.Function

      /**
       * Verifies a Function message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: {[k: string]: any}): string | null

      /**
       * Creates a Function message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns Function
       */
      public static fromObject(object: {[k: string]: any}): perftools.profiles.Function

      /**
       * Creates a plain object from a Function message. Also converts values to other types if specified.
       * @param message Function
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(
        message: perftools.profiles.Function,
        options?: $protobuf.IConversionOptions,
      ): {[k: string]: any}

      /**
       * Converts this Function to JSON.
       * @returns JSON object
       */
      public toJSON(): {[k: string]: any}
    }
  }
}
