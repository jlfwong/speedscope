import * as $protobuf from 'protobufjs'
/** Namespace perfetto. */
export namespace perfetto {
  /** Namespace protos. */
  namespace protos {
    /** Properties of a Trace. */
    interface ITrace {
      /** Trace packet */
      packet?: perfetto.protos.ITracePacket[] | null
    }

    /** Represents a Trace. */
    class Trace implements ITrace {
      /**
       * Constructs a new Trace.
       * @param [properties] Properties to set
       */
      constructor(properties?: perfetto.protos.ITrace)

      /** Trace packet. */
      public packet: perfetto.protos.ITracePacket[]

      /**
       * Creates a new Trace instance using the specified properties.
       * @param [properties] Properties to set
       * @returns Trace instance
       */
      public static create(properties?: perfetto.protos.ITrace): perfetto.protos.Trace

      /**
       * Encodes the specified Trace message. Does not implicitly {@link perfetto.protos.Trace.verify|verify} messages.
       * @param message Trace message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(
        message: perfetto.protos.ITrace,
        writer?: $protobuf.Writer,
      ): $protobuf.Writer

      /**
       * Encodes the specified Trace message, length delimited. Does not implicitly {@link perfetto.protos.Trace.verify|verify} messages.
       * @param message Trace message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(
        message: perfetto.protos.ITrace,
        writer?: $protobuf.Writer,
      ): $protobuf.Writer

      /**
       * Decodes a Trace message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns Trace
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(
        reader: $protobuf.Reader | Uint8Array,
        length?: number,
      ): perfetto.protos.Trace

      /**
       * Decodes a Trace message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns Trace
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(reader: $protobuf.Reader | Uint8Array): perfetto.protos.Trace

      /**
       * Verifies a Trace message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: {[k: string]: any}): string | null

      /**
       * Creates a Trace message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns Trace
       */
      public static fromObject(object: {[k: string]: any}): perfetto.protos.Trace

      /**
       * Creates a plain object from a Trace message. Also converts values to other types if specified.
       * @param message Trace
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(
        message: perfetto.protos.Trace,
        options?: $protobuf.IConversionOptions,
      ): {[k: string]: any}

      /**
       * Converts this Trace to JSON.
       * @returns JSON object
       */
      public toJSON(): {[k: string]: any}
    }

    /** Properties of a TracePacket. */
    interface ITracePacket {
      /** TracePacket timestamp */
      timestamp?: number | Long | null

      /** TracePacket timestampClockId */
      timestampClockId?: number | null

      /** TracePacket trustedUid */
      trustedUid?: number | null

      /** TracePacket trustedPacketSequenceId */
      trustedPacketSequenceId?: number | null

      /** TracePacket sequenceFlags */
      sequenceFlags?: number | null

      /** TracePacket previousPacketDropped */
      previousPacketDropped?: boolean | null

      /** TracePacket firstPacketOnSequence */
      firstPacketOnSequence?: boolean | null

      /** TracePacket perfSample */
      perfSample?: perfetto.protos.IPerfSample | null

      /** TracePacket processTree */
      processTree?: perfetto.protos.IProcessTree | null

      /** TracePacket trackEvent */
      trackEvent?: perfetto.protos.ITrackEvent | null

      /** TracePacket chromeEvents */
      chromeEvents?: perfetto.protos.IChromeEvents | null

      /** TracePacket clockSnapshot */
      clockSnapshot?: perfetto.protos.IClockSnapshot | null

      /** TracePacket ftraceEvents */
      ftraceEvents?: perfetto.protos.IFtraceEvents | null

      /** TracePacket internedData */
      internedData?: perfetto.protos.IInternedData | null

      /** TracePacket tracePacketDefaults */
      tracePacketDefaults?: perfetto.protos.ITracePacketDefaults | null
    }

    /** Represents a TracePacket. */
    class TracePacket implements ITracePacket {
      /**
       * Constructs a new TracePacket.
       * @param [properties] Properties to set
       */
      constructor(properties?: perfetto.protos.ITracePacket)

      /** TracePacket timestamp. */
      public timestamp: number | Long

      /** TracePacket timestampClockId. */
      public timestampClockId: number

      /** TracePacket trustedUid. */
      public trustedUid: number

      /** TracePacket trustedPacketSequenceId. */
      public trustedPacketSequenceId: number

      /** TracePacket sequenceFlags. */
      public sequenceFlags: number

      /** TracePacket previousPacketDropped. */
      public previousPacketDropped: boolean

      /** TracePacket firstPacketOnSequence. */
      public firstPacketOnSequence: boolean

      /** TracePacket perfSample. */
      public perfSample?: perfetto.protos.IPerfSample | null

      /** TracePacket processTree. */
      public processTree?: perfetto.protos.IProcessTree | null

      /** TracePacket trackEvent. */
      public trackEvent?: perfetto.protos.ITrackEvent | null

      /** TracePacket chromeEvents. */
      public chromeEvents?: perfetto.protos.IChromeEvents | null

      /** TracePacket clockSnapshot. */
      public clockSnapshot?: perfetto.protos.IClockSnapshot | null

      /** TracePacket ftraceEvents. */
      public ftraceEvents?: perfetto.protos.IFtraceEvents | null

      /** TracePacket internedData. */
      public internedData?: perfetto.protos.IInternedData | null

      /** TracePacket tracePacketDefaults. */
      public tracePacketDefaults?: perfetto.protos.ITracePacketDefaults | null

      /** TracePacket data. */
      public data?:
        | 'perfSample'
        | 'processTree'
        | 'trackEvent'
        | 'chromeEvents'
        | 'clockSnapshot'
        | 'ftraceEvents'

      /**
       * Creates a new TracePacket instance using the specified properties.
       * @param [properties] Properties to set
       * @returns TracePacket instance
       */
      public static create(properties?: perfetto.protos.ITracePacket): perfetto.protos.TracePacket

      /**
       * Encodes the specified TracePacket message. Does not implicitly {@link perfetto.protos.TracePacket.verify|verify} messages.
       * @param message TracePacket message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(
        message: perfetto.protos.ITracePacket,
        writer?: $protobuf.Writer,
      ): $protobuf.Writer

      /**
       * Encodes the specified TracePacket message, length delimited. Does not implicitly {@link perfetto.protos.TracePacket.verify|verify} messages.
       * @param message TracePacket message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(
        message: perfetto.protos.ITracePacket,
        writer?: $protobuf.Writer,
      ): $protobuf.Writer

      /**
       * Decodes a TracePacket message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns TracePacket
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(
        reader: $protobuf.Reader | Uint8Array,
        length?: number,
      ): perfetto.protos.TracePacket

      /**
       * Decodes a TracePacket message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns TracePacket
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(
        reader: $protobuf.Reader | Uint8Array,
      ): perfetto.protos.TracePacket

      /**
       * Verifies a TracePacket message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: {[k: string]: any}): string | null

      /**
       * Creates a TracePacket message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns TracePacket
       */
      public static fromObject(object: {[k: string]: any}): perfetto.protos.TracePacket

      /**
       * Creates a plain object from a TracePacket message. Also converts values to other types if specified.
       * @param message TracePacket
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(
        message: perfetto.protos.TracePacket,
        options?: $protobuf.IConversionOptions,
      ): {[k: string]: any}

      /**
       * Converts this TracePacket to JSON.
       * @returns JSON object
       */
      public toJSON(): {[k: string]: any}
    }

    /** Properties of a PerfSample. */
    interface IPerfSample {
      /** PerfSample cpu */
      cpu?: number | null

      /** PerfSample pid */
      pid?: number | null

      /** PerfSample tid */
      tid?: number | null

      /** PerfSample callstackIid */
      callstackIid?: (number | Long)[] | null

      /** PerfSample timestamp */
      timestamp?: number | Long | null
    }

    /** Represents a PerfSample. */
    class PerfSample implements IPerfSample {
      /**
       * Constructs a new PerfSample.
       * @param [properties] Properties to set
       */
      constructor(properties?: perfetto.protos.IPerfSample)

      /** PerfSample cpu. */
      public cpu: number

      /** PerfSample pid. */
      public pid: number

      /** PerfSample tid. */
      public tid: number

      /** PerfSample callstackIid. */
      public callstackIid: (number | Long)[]

      /** PerfSample timestamp. */
      public timestamp: number | Long

      /**
       * Creates a new PerfSample instance using the specified properties.
       * @param [properties] Properties to set
       * @returns PerfSample instance
       */
      public static create(properties?: perfetto.protos.IPerfSample): perfetto.protos.PerfSample

      /**
       * Encodes the specified PerfSample message. Does not implicitly {@link perfetto.protos.PerfSample.verify|verify} messages.
       * @param message PerfSample message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(
        message: perfetto.protos.IPerfSample,
        writer?: $protobuf.Writer,
      ): $protobuf.Writer

      /**
       * Encodes the specified PerfSample message, length delimited. Does not implicitly {@link perfetto.protos.PerfSample.verify|verify} messages.
       * @param message PerfSample message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(
        message: perfetto.protos.IPerfSample,
        writer?: $protobuf.Writer,
      ): $protobuf.Writer

      /**
       * Decodes a PerfSample message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns PerfSample
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(
        reader: $protobuf.Reader | Uint8Array,
        length?: number,
      ): perfetto.protos.PerfSample

      /**
       * Decodes a PerfSample message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns PerfSample
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(
        reader: $protobuf.Reader | Uint8Array,
      ): perfetto.protos.PerfSample

      /**
       * Verifies a PerfSample message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: {[k: string]: any}): string | null

      /**
       * Creates a PerfSample message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns PerfSample
       */
      public static fromObject(object: {[k: string]: any}): perfetto.protos.PerfSample

      /**
       * Creates a plain object from a PerfSample message. Also converts values to other types if specified.
       * @param message PerfSample
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(
        message: perfetto.protos.PerfSample,
        options?: $protobuf.IConversionOptions,
      ): {[k: string]: any}

      /**
       * Converts this PerfSample to JSON.
       * @returns JSON object
       */
      public toJSON(): {[k: string]: any}
    }

    /** Properties of a ProcessTree. */
    interface IProcessTree {
      /** ProcessTree processes */
      processes?: perfetto.protos.IProcess[] | null

      /** ProcessTree threads */
      threads?: perfetto.protos.IThread[] | null
    }

    /** Represents a ProcessTree. */
    class ProcessTree implements IProcessTree {
      /**
       * Constructs a new ProcessTree.
       * @param [properties] Properties to set
       */
      constructor(properties?: perfetto.protos.IProcessTree)

      /** ProcessTree processes. */
      public processes: perfetto.protos.IProcess[]

      /** ProcessTree threads. */
      public threads: perfetto.protos.IThread[]

      /**
       * Creates a new ProcessTree instance using the specified properties.
       * @param [properties] Properties to set
       * @returns ProcessTree instance
       */
      public static create(properties?: perfetto.protos.IProcessTree): perfetto.protos.ProcessTree

      /**
       * Encodes the specified ProcessTree message. Does not implicitly {@link perfetto.protos.ProcessTree.verify|verify} messages.
       * @param message ProcessTree message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(
        message: perfetto.protos.IProcessTree,
        writer?: $protobuf.Writer,
      ): $protobuf.Writer

      /**
       * Encodes the specified ProcessTree message, length delimited. Does not implicitly {@link perfetto.protos.ProcessTree.verify|verify} messages.
       * @param message ProcessTree message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(
        message: perfetto.protos.IProcessTree,
        writer?: $protobuf.Writer,
      ): $protobuf.Writer

      /**
       * Decodes a ProcessTree message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns ProcessTree
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(
        reader: $protobuf.Reader | Uint8Array,
        length?: number,
      ): perfetto.protos.ProcessTree

      /**
       * Decodes a ProcessTree message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns ProcessTree
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(
        reader: $protobuf.Reader | Uint8Array,
      ): perfetto.protos.ProcessTree

      /**
       * Verifies a ProcessTree message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: {[k: string]: any}): string | null

      /**
       * Creates a ProcessTree message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns ProcessTree
       */
      public static fromObject(object: {[k: string]: any}): perfetto.protos.ProcessTree

      /**
       * Creates a plain object from a ProcessTree message. Also converts values to other types if specified.
       * @param message ProcessTree
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(
        message: perfetto.protos.ProcessTree,
        options?: $protobuf.IConversionOptions,
      ): {[k: string]: any}

      /**
       * Converts this ProcessTree to JSON.
       * @returns JSON object
       */
      public toJSON(): {[k: string]: any}
    }

    /** Properties of a Process. */
    interface IProcess {
      /** Process pid */
      pid?: number | null

      /** Process ppid */
      ppid?: number | null

      /** Process cmdline */
      cmdline?: string[] | null
    }

    /** Represents a Process. */
    class Process implements IProcess {
      /**
       * Constructs a new Process.
       * @param [properties] Properties to set
       */
      constructor(properties?: perfetto.protos.IProcess)

      /** Process pid. */
      public pid: number

      /** Process ppid. */
      public ppid: number

      /** Process cmdline. */
      public cmdline: string[]

      /**
       * Creates a new Process instance using the specified properties.
       * @param [properties] Properties to set
       * @returns Process instance
       */
      public static create(properties?: perfetto.protos.IProcess): perfetto.protos.Process

      /**
       * Encodes the specified Process message. Does not implicitly {@link perfetto.protos.Process.verify|verify} messages.
       * @param message Process message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(
        message: perfetto.protos.IProcess,
        writer?: $protobuf.Writer,
      ): $protobuf.Writer

      /**
       * Encodes the specified Process message, length delimited. Does not implicitly {@link perfetto.protos.Process.verify|verify} messages.
       * @param message Process message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(
        message: perfetto.protos.IProcess,
        writer?: $protobuf.Writer,
      ): $protobuf.Writer

      /**
       * Decodes a Process message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns Process
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(
        reader: $protobuf.Reader | Uint8Array,
        length?: number,
      ): perfetto.protos.Process

      /**
       * Decodes a Process message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns Process
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(reader: $protobuf.Reader | Uint8Array): perfetto.protos.Process

      /**
       * Verifies a Process message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: {[k: string]: any}): string | null

      /**
       * Creates a Process message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns Process
       */
      public static fromObject(object: {[k: string]: any}): perfetto.protos.Process

      /**
       * Creates a plain object from a Process message. Also converts values to other types if specified.
       * @param message Process
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(
        message: perfetto.protos.Process,
        options?: $protobuf.IConversionOptions,
      ): {[k: string]: any}

      /**
       * Converts this Process to JSON.
       * @returns JSON object
       */
      public toJSON(): {[k: string]: any}
    }

    /** Properties of a Thread. */
    interface IThread {
      /** Thread tid */
      tid?: number | null

      /** Thread tgid */
      tgid?: number | null

      /** Thread name */
      name?: string | null
    }

    /** Represents a Thread. */
    class Thread implements IThread {
      /**
       * Constructs a new Thread.
       * @param [properties] Properties to set
       */
      constructor(properties?: perfetto.protos.IThread)

      /** Thread tid. */
      public tid: number

      /** Thread tgid. */
      public tgid: number

      /** Thread name. */
      public name: string

      /**
       * Creates a new Thread instance using the specified properties.
       * @param [properties] Properties to set
       * @returns Thread instance
       */
      public static create(properties?: perfetto.protos.IThread): perfetto.protos.Thread

      /**
       * Encodes the specified Thread message. Does not implicitly {@link perfetto.protos.Thread.verify|verify} messages.
       * @param message Thread message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(
        message: perfetto.protos.IThread,
        writer?: $protobuf.Writer,
      ): $protobuf.Writer

      /**
       * Encodes the specified Thread message, length delimited. Does not implicitly {@link perfetto.protos.Thread.verify|verify} messages.
       * @param message Thread message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(
        message: perfetto.protos.IThread,
        writer?: $protobuf.Writer,
      ): $protobuf.Writer

      /**
       * Decodes a Thread message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns Thread
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(
        reader: $protobuf.Reader | Uint8Array,
        length?: number,
      ): perfetto.protos.Thread

      /**
       * Decodes a Thread message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns Thread
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(reader: $protobuf.Reader | Uint8Array): perfetto.protos.Thread

      /**
       * Verifies a Thread message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: {[k: string]: any}): string | null

      /**
       * Creates a Thread message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns Thread
       */
      public static fromObject(object: {[k: string]: any}): perfetto.protos.Thread

      /**
       * Creates a plain object from a Thread message. Also converts values to other types if specified.
       * @param message Thread
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(
        message: perfetto.protos.Thread,
        options?: $protobuf.IConversionOptions,
      ): {[k: string]: any}

      /**
       * Converts this Thread to JSON.
       * @returns JSON object
       */
      public toJSON(): {[k: string]: any}
    }

    /** Properties of a TrackEvent. */
    interface ITrackEvent {
      /** TrackEvent trackUuid */
      trackUuid?: number | Long | null

      /** TrackEvent categoryIids */
      categoryIids?: (number | Long)[] | null

      /** TrackEvent nameIid */
      nameIid?: number | Long | null

      /** TrackEvent type */
      type?: perfetto.protos.TrackEvent.Type | null

      /** TrackEvent trackEventDurationUs */
      trackEventDurationUs?: number | Long | null
    }

    /** Represents a TrackEvent. */
    class TrackEvent implements ITrackEvent {
      /**
       * Constructs a new TrackEvent.
       * @param [properties] Properties to set
       */
      constructor(properties?: perfetto.protos.ITrackEvent)

      /** TrackEvent trackUuid. */
      public trackUuid: number | Long

      /** TrackEvent categoryIids. */
      public categoryIids: (number | Long)[]

      /** TrackEvent nameIid. */
      public nameIid: number | Long

      /** TrackEvent type. */
      public type: perfetto.protos.TrackEvent.Type

      /** TrackEvent trackEventDurationUs. */
      public trackEventDurationUs: number | Long

      /**
       * Creates a new TrackEvent instance using the specified properties.
       * @param [properties] Properties to set
       * @returns TrackEvent instance
       */
      public static create(properties?: perfetto.protos.ITrackEvent): perfetto.protos.TrackEvent

      /**
       * Encodes the specified TrackEvent message. Does not implicitly {@link perfetto.protos.TrackEvent.verify|verify} messages.
       * @param message TrackEvent message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(
        message: perfetto.protos.ITrackEvent,
        writer?: $protobuf.Writer,
      ): $protobuf.Writer

      /**
       * Encodes the specified TrackEvent message, length delimited. Does not implicitly {@link perfetto.protos.TrackEvent.verify|verify} messages.
       * @param message TrackEvent message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(
        message: perfetto.protos.ITrackEvent,
        writer?: $protobuf.Writer,
      ): $protobuf.Writer

      /**
       * Decodes a TrackEvent message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns TrackEvent
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(
        reader: $protobuf.Reader | Uint8Array,
        length?: number,
      ): perfetto.protos.TrackEvent

      /**
       * Decodes a TrackEvent message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns TrackEvent
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(
        reader: $protobuf.Reader | Uint8Array,
      ): perfetto.protos.TrackEvent

      /**
       * Verifies a TrackEvent message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: {[k: string]: any}): string | null

      /**
       * Creates a TrackEvent message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns TrackEvent
       */
      public static fromObject(object: {[k: string]: any}): perfetto.protos.TrackEvent

      /**
       * Creates a plain object from a TrackEvent message. Also converts values to other types if specified.
       * @param message TrackEvent
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(
        message: perfetto.protos.TrackEvent,
        options?: $protobuf.IConversionOptions,
      ): {[k: string]: any}

      /**
       * Converts this TrackEvent to JSON.
       * @returns JSON object
       */
      public toJSON(): {[k: string]: any}
    }

    namespace TrackEvent {
      /** Type enum. */
      enum Type {
        TYPE_UNSPECIFIED = 0,
        TYPE_SLICE_BEGIN = 1,
        TYPE_SLICE_END = 2,
        TYPE_INSTANT = 3,
        TYPE_COUNTER = 4,
      }
    }

    /** Properties of a ChromeEvents. */
    interface IChromeEvents {
      /** ChromeEvents events */
      events?: perfetto.protos.IChromeEvent[] | null
    }

    /** Represents a ChromeEvents. */
    class ChromeEvents implements IChromeEvents {
      /**
       * Constructs a new ChromeEvents.
       * @param [properties] Properties to set
       */
      constructor(properties?: perfetto.protos.IChromeEvents)

      /** ChromeEvents events. */
      public events: perfetto.protos.IChromeEvent[]

      /**
       * Creates a new ChromeEvents instance using the specified properties.
       * @param [properties] Properties to set
       * @returns ChromeEvents instance
       */
      public static create(properties?: perfetto.protos.IChromeEvents): perfetto.protos.ChromeEvents

      /**
       * Encodes the specified ChromeEvents message. Does not implicitly {@link perfetto.protos.ChromeEvents.verify|verify} messages.
       * @param message ChromeEvents message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(
        message: perfetto.protos.IChromeEvents,
        writer?: $protobuf.Writer,
      ): $protobuf.Writer

      /**
       * Encodes the specified ChromeEvents message, length delimited. Does not implicitly {@link perfetto.protos.ChromeEvents.verify|verify} messages.
       * @param message ChromeEvents message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(
        message: perfetto.protos.IChromeEvents,
        writer?: $protobuf.Writer,
      ): $protobuf.Writer

      /**
       * Decodes a ChromeEvents message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns ChromeEvents
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(
        reader: $protobuf.Reader | Uint8Array,
        length?: number,
      ): perfetto.protos.ChromeEvents

      /**
       * Decodes a ChromeEvents message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns ChromeEvents
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(
        reader: $protobuf.Reader | Uint8Array,
      ): perfetto.protos.ChromeEvents

      /**
       * Verifies a ChromeEvents message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: {[k: string]: any}): string | null

      /**
       * Creates a ChromeEvents message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns ChromeEvents
       */
      public static fromObject(object: {[k: string]: any}): perfetto.protos.ChromeEvents

      /**
       * Creates a plain object from a ChromeEvents message. Also converts values to other types if specified.
       * @param message ChromeEvents
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(
        message: perfetto.protos.ChromeEvents,
        options?: $protobuf.IConversionOptions,
      ): {[k: string]: any}

      /**
       * Converts this ChromeEvents to JSON.
       * @returns JSON object
       */
      public toJSON(): {[k: string]: any}
    }

    /** Properties of a ChromeEvent. */
    interface IChromeEvent {
      /** ChromeEvent name */
      name?: string | null

      /** ChromeEvent category */
      category?: string | null

      /** ChromeEvent phase */
      phase?: string | null

      /** ChromeEvent timestamp */
      timestamp?: number | Long | null

      /** ChromeEvent duration */
      duration?: number | Long | null

      /** ChromeEvent pid */
      pid?: number | null

      /** ChromeEvent tid */
      tid?: number | null
    }

    /** Represents a ChromeEvent. */
    class ChromeEvent implements IChromeEvent {
      /**
       * Constructs a new ChromeEvent.
       * @param [properties] Properties to set
       */
      constructor(properties?: perfetto.protos.IChromeEvent)

      /** ChromeEvent name. */
      public name: string

      /** ChromeEvent category. */
      public category: string

      /** ChromeEvent phase. */
      public phase: string

      /** ChromeEvent timestamp. */
      public timestamp: number | Long

      /** ChromeEvent duration. */
      public duration: number | Long

      /** ChromeEvent pid. */
      public pid: number

      /** ChromeEvent tid. */
      public tid: number

      /**
       * Creates a new ChromeEvent instance using the specified properties.
       * @param [properties] Properties to set
       * @returns ChromeEvent instance
       */
      public static create(properties?: perfetto.protos.IChromeEvent): perfetto.protos.ChromeEvent

      /**
       * Encodes the specified ChromeEvent message. Does not implicitly {@link perfetto.protos.ChromeEvent.verify|verify} messages.
       * @param message ChromeEvent message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(
        message: perfetto.protos.IChromeEvent,
        writer?: $protobuf.Writer,
      ): $protobuf.Writer

      /**
       * Encodes the specified ChromeEvent message, length delimited. Does not implicitly {@link perfetto.protos.ChromeEvent.verify|verify} messages.
       * @param message ChromeEvent message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(
        message: perfetto.protos.IChromeEvent,
        writer?: $protobuf.Writer,
      ): $protobuf.Writer

      /**
       * Decodes a ChromeEvent message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns ChromeEvent
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(
        reader: $protobuf.Reader | Uint8Array,
        length?: number,
      ): perfetto.protos.ChromeEvent

      /**
       * Decodes a ChromeEvent message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns ChromeEvent
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(
        reader: $protobuf.Reader | Uint8Array,
      ): perfetto.protos.ChromeEvent

      /**
       * Verifies a ChromeEvent message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: {[k: string]: any}): string | null

      /**
       * Creates a ChromeEvent message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns ChromeEvent
       */
      public static fromObject(object: {[k: string]: any}): perfetto.protos.ChromeEvent

      /**
       * Creates a plain object from a ChromeEvent message. Also converts values to other types if specified.
       * @param message ChromeEvent
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(
        message: perfetto.protos.ChromeEvent,
        options?: $protobuf.IConversionOptions,
      ): {[k: string]: any}

      /**
       * Converts this ChromeEvent to JSON.
       * @returns JSON object
       */
      public toJSON(): {[k: string]: any}
    }

    /** Properties of a ClockSnapshot. */
    interface IClockSnapshot {
      /** ClockSnapshot clocks */
      clocks?: perfetto.protos.IClock[] | null
    }

    /** Represents a ClockSnapshot. */
    class ClockSnapshot implements IClockSnapshot {
      /**
       * Constructs a new ClockSnapshot.
       * @param [properties] Properties to set
       */
      constructor(properties?: perfetto.protos.IClockSnapshot)

      /** ClockSnapshot clocks. */
      public clocks: perfetto.protos.IClock[]

      /**
       * Creates a new ClockSnapshot instance using the specified properties.
       * @param [properties] Properties to set
       * @returns ClockSnapshot instance
       */
      public static create(
        properties?: perfetto.protos.IClockSnapshot,
      ): perfetto.protos.ClockSnapshot

      /**
       * Encodes the specified ClockSnapshot message. Does not implicitly {@link perfetto.protos.ClockSnapshot.verify|verify} messages.
       * @param message ClockSnapshot message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(
        message: perfetto.protos.IClockSnapshot,
        writer?: $protobuf.Writer,
      ): $protobuf.Writer

      /**
       * Encodes the specified ClockSnapshot message, length delimited. Does not implicitly {@link perfetto.protos.ClockSnapshot.verify|verify} messages.
       * @param message ClockSnapshot message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(
        message: perfetto.protos.IClockSnapshot,
        writer?: $protobuf.Writer,
      ): $protobuf.Writer

      /**
       * Decodes a ClockSnapshot message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns ClockSnapshot
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(
        reader: $protobuf.Reader | Uint8Array,
        length?: number,
      ): perfetto.protos.ClockSnapshot

      /**
       * Decodes a ClockSnapshot message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns ClockSnapshot
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(
        reader: $protobuf.Reader | Uint8Array,
      ): perfetto.protos.ClockSnapshot

      /**
       * Verifies a ClockSnapshot message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: {[k: string]: any}): string | null

      /**
       * Creates a ClockSnapshot message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns ClockSnapshot
       */
      public static fromObject(object: {[k: string]: any}): perfetto.protos.ClockSnapshot

      /**
       * Creates a plain object from a ClockSnapshot message. Also converts values to other types if specified.
       * @param message ClockSnapshot
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(
        message: perfetto.protos.ClockSnapshot,
        options?: $protobuf.IConversionOptions,
      ): {[k: string]: any}

      /**
       * Converts this ClockSnapshot to JSON.
       * @returns JSON object
       */
      public toJSON(): {[k: string]: any}
    }

    /** Properties of a Clock. */
    interface IClock {
      /** Clock clockId */
      clockId?: number | null

      /** Clock timestamp */
      timestamp?: number | Long | null
    }

    /** Represents a Clock. */
    class Clock implements IClock {
      /**
       * Constructs a new Clock.
       * @param [properties] Properties to set
       */
      constructor(properties?: perfetto.protos.IClock)

      /** Clock clockId. */
      public clockId: number

      /** Clock timestamp. */
      public timestamp: number | Long

      /**
       * Creates a new Clock instance using the specified properties.
       * @param [properties] Properties to set
       * @returns Clock instance
       */
      public static create(properties?: perfetto.protos.IClock): perfetto.protos.Clock

      /**
       * Encodes the specified Clock message. Does not implicitly {@link perfetto.protos.Clock.verify|verify} messages.
       * @param message Clock message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(
        message: perfetto.protos.IClock,
        writer?: $protobuf.Writer,
      ): $protobuf.Writer

      /**
       * Encodes the specified Clock message, length delimited. Does not implicitly {@link perfetto.protos.Clock.verify|verify} messages.
       * @param message Clock message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(
        message: perfetto.protos.IClock,
        writer?: $protobuf.Writer,
      ): $protobuf.Writer

      /**
       * Decodes a Clock message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns Clock
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(
        reader: $protobuf.Reader | Uint8Array,
        length?: number,
      ): perfetto.protos.Clock

      /**
       * Decodes a Clock message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns Clock
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(reader: $protobuf.Reader | Uint8Array): perfetto.protos.Clock

      /**
       * Verifies a Clock message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: {[k: string]: any}): string | null

      /**
       * Creates a Clock message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns Clock
       */
      public static fromObject(object: {[k: string]: any}): perfetto.protos.Clock

      /**
       * Creates a plain object from a Clock message. Also converts values to other types if specified.
       * @param message Clock
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(
        message: perfetto.protos.Clock,
        options?: $protobuf.IConversionOptions,
      ): {[k: string]: any}

      /**
       * Converts this Clock to JSON.
       * @returns JSON object
       */
      public toJSON(): {[k: string]: any}
    }

    /** Properties of a FtraceEvents. */
    interface IFtraceEvents {
      /** FtraceEvents cpu */
      cpu?: number | null

      /** FtraceEvents event */
      event?: perfetto.protos.IFtraceEvent[] | null
    }

    /** Represents a FtraceEvents. */
    class FtraceEvents implements IFtraceEvents {
      /**
       * Constructs a new FtraceEvents.
       * @param [properties] Properties to set
       */
      constructor(properties?: perfetto.protos.IFtraceEvents)

      /** FtraceEvents cpu. */
      public cpu: number

      /** FtraceEvents event. */
      public event: perfetto.protos.IFtraceEvent[]

      /**
       * Creates a new FtraceEvents instance using the specified properties.
       * @param [properties] Properties to set
       * @returns FtraceEvents instance
       */
      public static create(properties?: perfetto.protos.IFtraceEvents): perfetto.protos.FtraceEvents

      /**
       * Encodes the specified FtraceEvents message. Does not implicitly {@link perfetto.protos.FtraceEvents.verify|verify} messages.
       * @param message FtraceEvents message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(
        message: perfetto.protos.IFtraceEvents,
        writer?: $protobuf.Writer,
      ): $protobuf.Writer

      /**
       * Encodes the specified FtraceEvents message, length delimited. Does not implicitly {@link perfetto.protos.FtraceEvents.verify|verify} messages.
       * @param message FtraceEvents message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(
        message: perfetto.protos.IFtraceEvents,
        writer?: $protobuf.Writer,
      ): $protobuf.Writer

      /**
       * Decodes a FtraceEvents message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns FtraceEvents
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(
        reader: $protobuf.Reader | Uint8Array,
        length?: number,
      ): perfetto.protos.FtraceEvents

      /**
       * Decodes a FtraceEvents message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns FtraceEvents
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(
        reader: $protobuf.Reader | Uint8Array,
      ): perfetto.protos.FtraceEvents

      /**
       * Verifies a FtraceEvents message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: {[k: string]: any}): string | null

      /**
       * Creates a FtraceEvents message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns FtraceEvents
       */
      public static fromObject(object: {[k: string]: any}): perfetto.protos.FtraceEvents

      /**
       * Creates a plain object from a FtraceEvents message. Also converts values to other types if specified.
       * @param message FtraceEvents
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(
        message: perfetto.protos.FtraceEvents,
        options?: $protobuf.IConversionOptions,
      ): {[k: string]: any}

      /**
       * Converts this FtraceEvents to JSON.
       * @returns JSON object
       */
      public toJSON(): {[k: string]: any}
    }

    /** Properties of a FtraceEvent. */
    interface IFtraceEvent {
      /** FtraceEvent timestamp */
      timestamp?: number | Long | null

      /** FtraceEvent pid */
      pid?: number | null

      /** FtraceEvent schedSwitch */
      schedSwitch?: perfetto.protos.ISchedSwitchFtraceEvent | null

      /** FtraceEvent cpuIdle */
      cpuIdle?: perfetto.protos.ICpuIdleFtraceEvent | null
    }

    /** Represents a FtraceEvent. */
    class FtraceEvent implements IFtraceEvent {
      /**
       * Constructs a new FtraceEvent.
       * @param [properties] Properties to set
       */
      constructor(properties?: perfetto.protos.IFtraceEvent)

      /** FtraceEvent timestamp. */
      public timestamp: number | Long

      /** FtraceEvent pid. */
      public pid: number

      /** FtraceEvent schedSwitch. */
      public schedSwitch?: perfetto.protos.ISchedSwitchFtraceEvent | null

      /** FtraceEvent cpuIdle. */
      public cpuIdle?: perfetto.protos.ICpuIdleFtraceEvent | null

      /** FtraceEvent event. */
      public event?: 'schedSwitch' | 'cpuIdle'

      /**
       * Creates a new FtraceEvent instance using the specified properties.
       * @param [properties] Properties to set
       * @returns FtraceEvent instance
       */
      public static create(properties?: perfetto.protos.IFtraceEvent): perfetto.protos.FtraceEvent

      /**
       * Encodes the specified FtraceEvent message. Does not implicitly {@link perfetto.protos.FtraceEvent.verify|verify} messages.
       * @param message FtraceEvent message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(
        message: perfetto.protos.IFtraceEvent,
        writer?: $protobuf.Writer,
      ): $protobuf.Writer

      /**
       * Encodes the specified FtraceEvent message, length delimited. Does not implicitly {@link perfetto.protos.FtraceEvent.verify|verify} messages.
       * @param message FtraceEvent message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(
        message: perfetto.protos.IFtraceEvent,
        writer?: $protobuf.Writer,
      ): $protobuf.Writer

      /**
       * Decodes a FtraceEvent message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns FtraceEvent
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(
        reader: $protobuf.Reader | Uint8Array,
        length?: number,
      ): perfetto.protos.FtraceEvent

      /**
       * Decodes a FtraceEvent message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns FtraceEvent
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(
        reader: $protobuf.Reader | Uint8Array,
      ): perfetto.protos.FtraceEvent

      /**
       * Verifies a FtraceEvent message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: {[k: string]: any}): string | null

      /**
       * Creates a FtraceEvent message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns FtraceEvent
       */
      public static fromObject(object: {[k: string]: any}): perfetto.protos.FtraceEvent

      /**
       * Creates a plain object from a FtraceEvent message. Also converts values to other types if specified.
       * @param message FtraceEvent
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(
        message: perfetto.protos.FtraceEvent,
        options?: $protobuf.IConversionOptions,
      ): {[k: string]: any}

      /**
       * Converts this FtraceEvent to JSON.
       * @returns JSON object
       */
      public toJSON(): {[k: string]: any}
    }

    /** Properties of a SchedSwitchFtraceEvent. */
    interface ISchedSwitchFtraceEvent {
      /** SchedSwitchFtraceEvent prevComm */
      prevComm?: string | null

      /** SchedSwitchFtraceEvent prevPid */
      prevPid?: number | null

      /** SchedSwitchFtraceEvent prevPrio */
      prevPrio?: number | null

      /** SchedSwitchFtraceEvent prevState */
      prevState?: number | Long | null

      /** SchedSwitchFtraceEvent nextComm */
      nextComm?: string | null

      /** SchedSwitchFtraceEvent nextPid */
      nextPid?: number | null

      /** SchedSwitchFtraceEvent nextPrio */
      nextPrio?: number | null
    }

    /** Represents a SchedSwitchFtraceEvent. */
    class SchedSwitchFtraceEvent implements ISchedSwitchFtraceEvent {
      /**
       * Constructs a new SchedSwitchFtraceEvent.
       * @param [properties] Properties to set
       */
      constructor(properties?: perfetto.protos.ISchedSwitchFtraceEvent)

      /** SchedSwitchFtraceEvent prevComm. */
      public prevComm: string

      /** SchedSwitchFtraceEvent prevPid. */
      public prevPid: number

      /** SchedSwitchFtraceEvent prevPrio. */
      public prevPrio: number

      /** SchedSwitchFtraceEvent prevState. */
      public prevState: number | Long

      /** SchedSwitchFtraceEvent nextComm. */
      public nextComm: string

      /** SchedSwitchFtraceEvent nextPid. */
      public nextPid: number

      /** SchedSwitchFtraceEvent nextPrio. */
      public nextPrio: number

      /**
       * Creates a new SchedSwitchFtraceEvent instance using the specified properties.
       * @param [properties] Properties to set
       * @returns SchedSwitchFtraceEvent instance
       */
      public static create(
        properties?: perfetto.protos.ISchedSwitchFtraceEvent,
      ): perfetto.protos.SchedSwitchFtraceEvent

      /**
       * Encodes the specified SchedSwitchFtraceEvent message. Does not implicitly {@link perfetto.protos.SchedSwitchFtraceEvent.verify|verify} messages.
       * @param message SchedSwitchFtraceEvent message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(
        message: perfetto.protos.ISchedSwitchFtraceEvent,
        writer?: $protobuf.Writer,
      ): $protobuf.Writer

      /**
       * Encodes the specified SchedSwitchFtraceEvent message, length delimited. Does not implicitly {@link perfetto.protos.SchedSwitchFtraceEvent.verify|verify} messages.
       * @param message SchedSwitchFtraceEvent message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(
        message: perfetto.protos.ISchedSwitchFtraceEvent,
        writer?: $protobuf.Writer,
      ): $protobuf.Writer

      /**
       * Decodes a SchedSwitchFtraceEvent message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns SchedSwitchFtraceEvent
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(
        reader: $protobuf.Reader | Uint8Array,
        length?: number,
      ): perfetto.protos.SchedSwitchFtraceEvent

      /**
       * Decodes a SchedSwitchFtraceEvent message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns SchedSwitchFtraceEvent
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(
        reader: $protobuf.Reader | Uint8Array,
      ): perfetto.protos.SchedSwitchFtraceEvent

      /**
       * Verifies a SchedSwitchFtraceEvent message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: {[k: string]: any}): string | null

      /**
       * Creates a SchedSwitchFtraceEvent message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns SchedSwitchFtraceEvent
       */
      public static fromObject(object: {[k: string]: any}): perfetto.protos.SchedSwitchFtraceEvent

      /**
       * Creates a plain object from a SchedSwitchFtraceEvent message. Also converts values to other types if specified.
       * @param message SchedSwitchFtraceEvent
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(
        message: perfetto.protos.SchedSwitchFtraceEvent,
        options?: $protobuf.IConversionOptions,
      ): {[k: string]: any}

      /**
       * Converts this SchedSwitchFtraceEvent to JSON.
       * @returns JSON object
       */
      public toJSON(): {[k: string]: any}
    }

    /** Properties of a CpuIdleFtraceEvent. */
    interface ICpuIdleFtraceEvent {
      /** CpuIdleFtraceEvent state */
      state?: number | null

      /** CpuIdleFtraceEvent cpuId */
      cpuId?: number | null
    }

    /** Represents a CpuIdleFtraceEvent. */
    class CpuIdleFtraceEvent implements ICpuIdleFtraceEvent {
      /**
       * Constructs a new CpuIdleFtraceEvent.
       * @param [properties] Properties to set
       */
      constructor(properties?: perfetto.protos.ICpuIdleFtraceEvent)

      /** CpuIdleFtraceEvent state. */
      public state: number

      /** CpuIdleFtraceEvent cpuId. */
      public cpuId: number

      /**
       * Creates a new CpuIdleFtraceEvent instance using the specified properties.
       * @param [properties] Properties to set
       * @returns CpuIdleFtraceEvent instance
       */
      public static create(
        properties?: perfetto.protos.ICpuIdleFtraceEvent,
      ): perfetto.protos.CpuIdleFtraceEvent

      /**
       * Encodes the specified CpuIdleFtraceEvent message. Does not implicitly {@link perfetto.protos.CpuIdleFtraceEvent.verify|verify} messages.
       * @param message CpuIdleFtraceEvent message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(
        message: perfetto.protos.ICpuIdleFtraceEvent,
        writer?: $protobuf.Writer,
      ): $protobuf.Writer

      /**
       * Encodes the specified CpuIdleFtraceEvent message, length delimited. Does not implicitly {@link perfetto.protos.CpuIdleFtraceEvent.verify|verify} messages.
       * @param message CpuIdleFtraceEvent message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(
        message: perfetto.protos.ICpuIdleFtraceEvent,
        writer?: $protobuf.Writer,
      ): $protobuf.Writer

      /**
       * Decodes a CpuIdleFtraceEvent message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns CpuIdleFtraceEvent
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(
        reader: $protobuf.Reader | Uint8Array,
        length?: number,
      ): perfetto.protos.CpuIdleFtraceEvent

      /**
       * Decodes a CpuIdleFtraceEvent message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns CpuIdleFtraceEvent
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(
        reader: $protobuf.Reader | Uint8Array,
      ): perfetto.protos.CpuIdleFtraceEvent

      /**
       * Verifies a CpuIdleFtraceEvent message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: {[k: string]: any}): string | null

      /**
       * Creates a CpuIdleFtraceEvent message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns CpuIdleFtraceEvent
       */
      public static fromObject(object: {[k: string]: any}): perfetto.protos.CpuIdleFtraceEvent

      /**
       * Creates a plain object from a CpuIdleFtraceEvent message. Also converts values to other types if specified.
       * @param message CpuIdleFtraceEvent
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(
        message: perfetto.protos.CpuIdleFtraceEvent,
        options?: $protobuf.IConversionOptions,
      ): {[k: string]: any}

      /**
       * Converts this CpuIdleFtraceEvent to JSON.
       * @returns JSON object
       */
      public toJSON(): {[k: string]: any}
    }

    /** Properties of an InternedData. */
    interface IInternedData {
      /** InternedData eventNames */
      eventNames?: perfetto.protos.IInternedString[] | null

      /** InternedData eventCategories */
      eventCategories?: perfetto.protos.IInternedString[] | null

      /** InternedData callstacks */
      callstacks?: perfetto.protos.ICallstack[] | null

      /** InternedData frames */
      frames?: perfetto.protos.IFrame[] | null

      /** InternedData functionNames */
      functionNames?: perfetto.protos.IFunctionName[] | null

      /** InternedData mappingPaths */
      mappingPaths?: perfetto.protos.IMappingPath[] | null
    }

    /** Represents an InternedData. */
    class InternedData implements IInternedData {
      /**
       * Constructs a new InternedData.
       * @param [properties] Properties to set
       */
      constructor(properties?: perfetto.protos.IInternedData)

      /** InternedData eventNames. */
      public eventNames: perfetto.protos.IInternedString[]

      /** InternedData eventCategories. */
      public eventCategories: perfetto.protos.IInternedString[]

      /** InternedData callstacks. */
      public callstacks: perfetto.protos.ICallstack[]

      /** InternedData frames. */
      public frames: perfetto.protos.IFrame[]

      /** InternedData functionNames. */
      public functionNames: perfetto.protos.IFunctionName[]

      /** InternedData mappingPaths. */
      public mappingPaths: perfetto.protos.IMappingPath[]

      /**
       * Creates a new InternedData instance using the specified properties.
       * @param [properties] Properties to set
       * @returns InternedData instance
       */
      public static create(properties?: perfetto.protos.IInternedData): perfetto.protos.InternedData

      /**
       * Encodes the specified InternedData message. Does not implicitly {@link perfetto.protos.InternedData.verify|verify} messages.
       * @param message InternedData message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(
        message: perfetto.protos.IInternedData,
        writer?: $protobuf.Writer,
      ): $protobuf.Writer

      /**
       * Encodes the specified InternedData message, length delimited. Does not implicitly {@link perfetto.protos.InternedData.verify|verify} messages.
       * @param message InternedData message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(
        message: perfetto.protos.IInternedData,
        writer?: $protobuf.Writer,
      ): $protobuf.Writer

      /**
       * Decodes an InternedData message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns InternedData
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(
        reader: $protobuf.Reader | Uint8Array,
        length?: number,
      ): perfetto.protos.InternedData

      /**
       * Decodes an InternedData message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns InternedData
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(
        reader: $protobuf.Reader | Uint8Array,
      ): perfetto.protos.InternedData

      /**
       * Verifies an InternedData message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: {[k: string]: any}): string | null

      /**
       * Creates an InternedData message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns InternedData
       */
      public static fromObject(object: {[k: string]: any}): perfetto.protos.InternedData

      /**
       * Creates a plain object from an InternedData message. Also converts values to other types if specified.
       * @param message InternedData
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(
        message: perfetto.protos.InternedData,
        options?: $protobuf.IConversionOptions,
      ): {[k: string]: any}

      /**
       * Converts this InternedData to JSON.
       * @returns JSON object
       */
      public toJSON(): {[k: string]: any}
    }

    /** Properties of an InternedString. */
    interface IInternedString {
      /** InternedString iid */
      iid?: number | Long | null

      /** InternedString str */
      str?: Uint8Array | null
    }

    /** Represents an InternedString. */
    class InternedString implements IInternedString {
      /**
       * Constructs a new InternedString.
       * @param [properties] Properties to set
       */
      constructor(properties?: perfetto.protos.IInternedString)

      /** InternedString iid. */
      public iid: number | Long

      /** InternedString str. */
      public str: Uint8Array

      /**
       * Creates a new InternedString instance using the specified properties.
       * @param [properties] Properties to set
       * @returns InternedString instance
       */
      public static create(
        properties?: perfetto.protos.IInternedString,
      ): perfetto.protos.InternedString

      /**
       * Encodes the specified InternedString message. Does not implicitly {@link perfetto.protos.InternedString.verify|verify} messages.
       * @param message InternedString message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(
        message: perfetto.protos.IInternedString,
        writer?: $protobuf.Writer,
      ): $protobuf.Writer

      /**
       * Encodes the specified InternedString message, length delimited. Does not implicitly {@link perfetto.protos.InternedString.verify|verify} messages.
       * @param message InternedString message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(
        message: perfetto.protos.IInternedString,
        writer?: $protobuf.Writer,
      ): $protobuf.Writer

      /**
       * Decodes an InternedString message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns InternedString
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(
        reader: $protobuf.Reader | Uint8Array,
        length?: number,
      ): perfetto.protos.InternedString

      /**
       * Decodes an InternedString message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns InternedString
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(
        reader: $protobuf.Reader | Uint8Array,
      ): perfetto.protos.InternedString

      /**
       * Verifies an InternedString message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: {[k: string]: any}): string | null

      /**
       * Creates an InternedString message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns InternedString
       */
      public static fromObject(object: {[k: string]: any}): perfetto.protos.InternedString

      /**
       * Creates a plain object from an InternedString message. Also converts values to other types if specified.
       * @param message InternedString
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(
        message: perfetto.protos.InternedString,
        options?: $protobuf.IConversionOptions,
      ): {[k: string]: any}

      /**
       * Converts this InternedString to JSON.
       * @returns JSON object
       */
      public toJSON(): {[k: string]: any}
    }

    /** Properties of a Callstack. */
    interface ICallstack {
      /** Callstack iid */
      iid?: number | Long | null

      /** Callstack frameIds */
      frameIds?: (number | Long)[] | null
    }

    /** Represents a Callstack. */
    class Callstack implements ICallstack {
      /**
       * Constructs a new Callstack.
       * @param [properties] Properties to set
       */
      constructor(properties?: perfetto.protos.ICallstack)

      /** Callstack iid. */
      public iid: number | Long

      /** Callstack frameIds. */
      public frameIds: (number | Long)[]

      /**
       * Creates a new Callstack instance using the specified properties.
       * @param [properties] Properties to set
       * @returns Callstack instance
       */
      public static create(properties?: perfetto.protos.ICallstack): perfetto.protos.Callstack

      /**
       * Encodes the specified Callstack message. Does not implicitly {@link perfetto.protos.Callstack.verify|verify} messages.
       * @param message Callstack message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(
        message: perfetto.protos.ICallstack,
        writer?: $protobuf.Writer,
      ): $protobuf.Writer

      /**
       * Encodes the specified Callstack message, length delimited. Does not implicitly {@link perfetto.protos.Callstack.verify|verify} messages.
       * @param message Callstack message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(
        message: perfetto.protos.ICallstack,
        writer?: $protobuf.Writer,
      ): $protobuf.Writer

      /**
       * Decodes a Callstack message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns Callstack
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(
        reader: $protobuf.Reader | Uint8Array,
        length?: number,
      ): perfetto.protos.Callstack

      /**
       * Decodes a Callstack message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns Callstack
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(
        reader: $protobuf.Reader | Uint8Array,
      ): perfetto.protos.Callstack

      /**
       * Verifies a Callstack message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: {[k: string]: any}): string | null

      /**
       * Creates a Callstack message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns Callstack
       */
      public static fromObject(object: {[k: string]: any}): perfetto.protos.Callstack

      /**
       * Creates a plain object from a Callstack message. Also converts values to other types if specified.
       * @param message Callstack
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(
        message: perfetto.protos.Callstack,
        options?: $protobuf.IConversionOptions,
      ): {[k: string]: any}

      /**
       * Converts this Callstack to JSON.
       * @returns JSON object
       */
      public toJSON(): {[k: string]: any}
    }

    /** Properties of a Frame. */
    interface IFrame {
      /** Frame iid */
      iid?: number | Long | null

      /** Frame functionNameId */
      functionNameId?: number | Long | null

      /** Frame mappingId */
      mappingId?: number | Long | null

      /** Frame relPc */
      relPc?: number | Long | null
    }

    /** Represents a Frame. */
    class Frame implements IFrame {
      /**
       * Constructs a new Frame.
       * @param [properties] Properties to set
       */
      constructor(properties?: perfetto.protos.IFrame)

      /** Frame iid. */
      public iid: number | Long

      /** Frame functionNameId. */
      public functionNameId: number | Long

      /** Frame mappingId. */
      public mappingId: number | Long

      /** Frame relPc. */
      public relPc: number | Long

      /**
       * Creates a new Frame instance using the specified properties.
       * @param [properties] Properties to set
       * @returns Frame instance
       */
      public static create(properties?: perfetto.protos.IFrame): perfetto.protos.Frame

      /**
       * Encodes the specified Frame message. Does not implicitly {@link perfetto.protos.Frame.verify|verify} messages.
       * @param message Frame message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(
        message: perfetto.protos.IFrame,
        writer?: $protobuf.Writer,
      ): $protobuf.Writer

      /**
       * Encodes the specified Frame message, length delimited. Does not implicitly {@link perfetto.protos.Frame.verify|verify} messages.
       * @param message Frame message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(
        message: perfetto.protos.IFrame,
        writer?: $protobuf.Writer,
      ): $protobuf.Writer

      /**
       * Decodes a Frame message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns Frame
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(
        reader: $protobuf.Reader | Uint8Array,
        length?: number,
      ): perfetto.protos.Frame

      /**
       * Decodes a Frame message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns Frame
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(reader: $protobuf.Reader | Uint8Array): perfetto.protos.Frame

      /**
       * Verifies a Frame message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: {[k: string]: any}): string | null

      /**
       * Creates a Frame message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns Frame
       */
      public static fromObject(object: {[k: string]: any}): perfetto.protos.Frame

      /**
       * Creates a plain object from a Frame message. Also converts values to other types if specified.
       * @param message Frame
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(
        message: perfetto.protos.Frame,
        options?: $protobuf.IConversionOptions,
      ): {[k: string]: any}

      /**
       * Converts this Frame to JSON.
       * @returns JSON object
       */
      public toJSON(): {[k: string]: any}
    }

    /** Properties of a FunctionName. */
    interface IFunctionName {
      /** FunctionName iid */
      iid?: number | Long | null

      /** FunctionName str */
      str?: Uint8Array | null
    }

    /** Represents a FunctionName. */
    class FunctionName implements IFunctionName {
      /**
       * Constructs a new FunctionName.
       * @param [properties] Properties to set
       */
      constructor(properties?: perfetto.protos.IFunctionName)

      /** FunctionName iid. */
      public iid: number | Long

      /** FunctionName str. */
      public str: Uint8Array

      /**
       * Creates a new FunctionName instance using the specified properties.
       * @param [properties] Properties to set
       * @returns FunctionName instance
       */
      public static create(properties?: perfetto.protos.IFunctionName): perfetto.protos.FunctionName

      /**
       * Encodes the specified FunctionName message. Does not implicitly {@link perfetto.protos.FunctionName.verify|verify} messages.
       * @param message FunctionName message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(
        message: perfetto.protos.IFunctionName,
        writer?: $protobuf.Writer,
      ): $protobuf.Writer

      /**
       * Encodes the specified FunctionName message, length delimited. Does not implicitly {@link perfetto.protos.FunctionName.verify|verify} messages.
       * @param message FunctionName message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(
        message: perfetto.protos.IFunctionName,
        writer?: $protobuf.Writer,
      ): $protobuf.Writer

      /**
       * Decodes a FunctionName message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns FunctionName
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(
        reader: $protobuf.Reader | Uint8Array,
        length?: number,
      ): perfetto.protos.FunctionName

      /**
       * Decodes a FunctionName message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns FunctionName
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(
        reader: $protobuf.Reader | Uint8Array,
      ): perfetto.protos.FunctionName

      /**
       * Verifies a FunctionName message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: {[k: string]: any}): string | null

      /**
       * Creates a FunctionName message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns FunctionName
       */
      public static fromObject(object: {[k: string]: any}): perfetto.protos.FunctionName

      /**
       * Creates a plain object from a FunctionName message. Also converts values to other types if specified.
       * @param message FunctionName
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(
        message: perfetto.protos.FunctionName,
        options?: $protobuf.IConversionOptions,
      ): {[k: string]: any}

      /**
       * Converts this FunctionName to JSON.
       * @returns JSON object
       */
      public toJSON(): {[k: string]: any}
    }

    /** Properties of a MappingPath. */
    interface IMappingPath {
      /** MappingPath iid */
      iid?: number | Long | null

      /** MappingPath str */
      str?: Uint8Array | null
    }

    /** Represents a MappingPath. */
    class MappingPath implements IMappingPath {
      /**
       * Constructs a new MappingPath.
       * @param [properties] Properties to set
       */
      constructor(properties?: perfetto.protos.IMappingPath)

      /** MappingPath iid. */
      public iid: number | Long

      /** MappingPath str. */
      public str: Uint8Array

      /**
       * Creates a new MappingPath instance using the specified properties.
       * @param [properties] Properties to set
       * @returns MappingPath instance
       */
      public static create(properties?: perfetto.protos.IMappingPath): perfetto.protos.MappingPath

      /**
       * Encodes the specified MappingPath message. Does not implicitly {@link perfetto.protos.MappingPath.verify|verify} messages.
       * @param message MappingPath message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(
        message: perfetto.protos.IMappingPath,
        writer?: $protobuf.Writer,
      ): $protobuf.Writer

      /**
       * Encodes the specified MappingPath message, length delimited. Does not implicitly {@link perfetto.protos.MappingPath.verify|verify} messages.
       * @param message MappingPath message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(
        message: perfetto.protos.IMappingPath,
        writer?: $protobuf.Writer,
      ): $protobuf.Writer

      /**
       * Decodes a MappingPath message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns MappingPath
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(
        reader: $protobuf.Reader | Uint8Array,
        length?: number,
      ): perfetto.protos.MappingPath

      /**
       * Decodes a MappingPath message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns MappingPath
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(
        reader: $protobuf.Reader | Uint8Array,
      ): perfetto.protos.MappingPath

      /**
       * Verifies a MappingPath message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: {[k: string]: any}): string | null

      /**
       * Creates a MappingPath message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns MappingPath
       */
      public static fromObject(object: {[k: string]: any}): perfetto.protos.MappingPath

      /**
       * Creates a plain object from a MappingPath message. Also converts values to other types if specified.
       * @param message MappingPath
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(
        message: perfetto.protos.MappingPath,
        options?: $protobuf.IConversionOptions,
      ): {[k: string]: any}

      /**
       * Converts this MappingPath to JSON.
       * @returns JSON object
       */
      public toJSON(): {[k: string]: any}
    }

    /** Properties of a TracePacketDefaults. */
    interface ITracePacketDefaults {
      /** TracePacketDefaults timestampClockId */
      timestampClockId?: number | Long | null
    }

    /** Represents a TracePacketDefaults. */
    class TracePacketDefaults implements ITracePacketDefaults {
      /**
       * Constructs a new TracePacketDefaults.
       * @param [properties] Properties to set
       */
      constructor(properties?: perfetto.protos.ITracePacketDefaults)

      /** TracePacketDefaults timestampClockId. */
      public timestampClockId: number | Long

      /**
       * Creates a new TracePacketDefaults instance using the specified properties.
       * @param [properties] Properties to set
       * @returns TracePacketDefaults instance
       */
      public static create(
        properties?: perfetto.protos.ITracePacketDefaults,
      ): perfetto.protos.TracePacketDefaults

      /**
       * Encodes the specified TracePacketDefaults message. Does not implicitly {@link perfetto.protos.TracePacketDefaults.verify|verify} messages.
       * @param message TracePacketDefaults message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(
        message: perfetto.protos.ITracePacketDefaults,
        writer?: $protobuf.Writer,
      ): $protobuf.Writer

      /**
       * Encodes the specified TracePacketDefaults message, length delimited. Does not implicitly {@link perfetto.protos.TracePacketDefaults.verify|verify} messages.
       * @param message TracePacketDefaults message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(
        message: perfetto.protos.ITracePacketDefaults,
        writer?: $protobuf.Writer,
      ): $protobuf.Writer

      /**
       * Decodes a TracePacketDefaults message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns TracePacketDefaults
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(
        reader: $protobuf.Reader | Uint8Array,
        length?: number,
      ): perfetto.protos.TracePacketDefaults

      /**
       * Decodes a TracePacketDefaults message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns TracePacketDefaults
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(
        reader: $protobuf.Reader | Uint8Array,
      ): perfetto.protos.TracePacketDefaults

      /**
       * Verifies a TracePacketDefaults message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: {[k: string]: any}): string | null

      /**
       * Creates a TracePacketDefaults message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns TracePacketDefaults
       */
      public static fromObject(object: {[k: string]: any}): perfetto.protos.TracePacketDefaults

      /**
       * Creates a plain object from a TracePacketDefaults message. Also converts values to other types if specified.
       * @param message TracePacketDefaults
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(
        message: perfetto.protos.TracePacketDefaults,
        options?: $protobuf.IConversionOptions,
      ): {[k: string]: any}

      /**
       * Converts this TracePacketDefaults to JSON.
       * @returns JSON object
       */
      public toJSON(): {[k: string]: any}
    }
  }
}
