// THIS FILE WAS AUTOMATICALLY GENERATED. DO NOT MODIFY THIS FILE MANUALLY.
//
// To regenerate this file, run the following in the repository root:
//
//    node node_modules/protobufjs/cli/bin/pbjs -t static-module -w commonjs -o src/import/perfetto.proto.js src/import/perfetto.proto
//    node node_modules/protobufjs/cli/bin/pbts -o src/import/perfetto.proto.d.ts src/import/perfetto.proto.js
//
// Then prepend this comment to the result.
/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
"use strict";

var $protobuf = require("protobufjs/minimal");

// Common aliases
var $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
var $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

$root.perfetto = (function() {

    /**
     * Namespace perfetto.
     * @exports perfetto
     * @namespace
     */
    var perfetto = {};

    perfetto.protos = (function() {

        /**
         * Namespace protos.
         * @memberof perfetto
         * @namespace
         */
        var protos = {};

        protos.Trace = (function() {

            /**
             * Properties of a Trace.
             * @memberof perfetto.protos
             * @interface ITrace
             * @property {Array.<perfetto.protos.ITracePacket>|null} [packet] Trace packet
             */

            /**
             * Constructs a new Trace.
             * @memberof perfetto.protos
             * @classdesc Represents a Trace.
             * @implements ITrace
             * @constructor
             * @param {perfetto.protos.ITrace=} [properties] Properties to set
             */
            function Trace(properties) {
                this.packet = [];
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Trace packet.
             * @member {Array.<perfetto.protos.ITracePacket>} packet
             * @memberof perfetto.protos.Trace
             * @instance
             */
            Trace.prototype.packet = $util.emptyArray;

            /**
             * Creates a new Trace instance using the specified properties.
             * @function create
             * @memberof perfetto.protos.Trace
             * @static
             * @param {perfetto.protos.ITrace=} [properties] Properties to set
             * @returns {perfetto.protos.Trace} Trace instance
             */
            Trace.create = function create(properties) {
                return new Trace(properties);
            };

            /**
             * Encodes the specified Trace message. Does not implicitly {@link perfetto.protos.Trace.verify|verify} messages.
             * @function encode
             * @memberof perfetto.protos.Trace
             * @static
             * @param {perfetto.protos.ITrace} message Trace message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Trace.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.packet != null && message.packet.length)
                    for (var i = 0; i < message.packet.length; ++i)
                        $root.perfetto.protos.TracePacket.encode(message.packet[i], writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                return writer;
            };

            /**
             * Encodes the specified Trace message, length delimited. Does not implicitly {@link perfetto.protos.Trace.verify|verify} messages.
             * @function encodeDelimited
             * @memberof perfetto.protos.Trace
             * @static
             * @param {perfetto.protos.ITrace} message Trace message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Trace.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a Trace message from the specified reader or buffer.
             * @function decode
             * @memberof perfetto.protos.Trace
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {perfetto.protos.Trace} Trace
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Trace.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.perfetto.protos.Trace();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        if (!(message.packet && message.packet.length))
                            message.packet = [];
                        message.packet.push($root.perfetto.protos.TracePacket.decode(reader, reader.uint32()));
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a Trace message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof perfetto.protos.Trace
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {perfetto.protos.Trace} Trace
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Trace.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a Trace message.
             * @function verify
             * @memberof perfetto.protos.Trace
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            Trace.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.packet != null && message.hasOwnProperty("packet")) {
                    if (!Array.isArray(message.packet))
                        return "packet: array expected";
                    for (var i = 0; i < message.packet.length; ++i) {
                        var error = $root.perfetto.protos.TracePacket.verify(message.packet[i]);
                        if (error)
                            return "packet." + error;
                    }
                }
                return null;
            };

            /**
             * Creates a Trace message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof perfetto.protos.Trace
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {perfetto.protos.Trace} Trace
             */
            Trace.fromObject = function fromObject(object) {
                if (object instanceof $root.perfetto.protos.Trace)
                    return object;
                var message = new $root.perfetto.protos.Trace();
                if (object.packet) {
                    if (!Array.isArray(object.packet))
                        throw TypeError(".perfetto.protos.Trace.packet: array expected");
                    message.packet = [];
                    for (var i = 0; i < object.packet.length; ++i) {
                        if (typeof object.packet[i] !== "object")
                            throw TypeError(".perfetto.protos.Trace.packet: object expected");
                        message.packet[i] = $root.perfetto.protos.TracePacket.fromObject(object.packet[i]);
                    }
                }
                return message;
            };

            /**
             * Creates a plain object from a Trace message. Also converts values to other types if specified.
             * @function toObject
             * @memberof perfetto.protos.Trace
             * @static
             * @param {perfetto.protos.Trace} message Trace
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            Trace.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.arrays || options.defaults)
                    object.packet = [];
                if (message.packet && message.packet.length) {
                    object.packet = [];
                    for (var j = 0; j < message.packet.length; ++j)
                        object.packet[j] = $root.perfetto.protos.TracePacket.toObject(message.packet[j], options);
                }
                return object;
            };

            /**
             * Converts this Trace to JSON.
             * @function toJSON
             * @memberof perfetto.protos.Trace
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            Trace.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return Trace;
        })();

        protos.TracePacket = (function() {

            /**
             * Properties of a TracePacket.
             * @memberof perfetto.protos
             * @interface ITracePacket
             * @property {number|Long|null} [timestamp] TracePacket timestamp
             * @property {number|null} [timestampClockId] TracePacket timestampClockId
             * @property {number|null} [trustedUid] TracePacket trustedUid
             * @property {number|null} [trustedPacketSequenceId] TracePacket trustedPacketSequenceId
             * @property {number|null} [sequenceFlags] TracePacket sequenceFlags
             * @property {boolean|null} [previousPacketDropped] TracePacket previousPacketDropped
             * @property {boolean|null} [firstPacketOnSequence] TracePacket firstPacketOnSequence
             * @property {perfetto.protos.IPerfSample|null} [perfSample] TracePacket perfSample
             * @property {perfetto.protos.IProcessTree|null} [processTree] TracePacket processTree
             * @property {perfetto.protos.ITrackEvent|null} [trackEvent] TracePacket trackEvent
             * @property {perfetto.protos.IChromeEvents|null} [chromeEvents] TracePacket chromeEvents
             * @property {perfetto.protos.IClockSnapshot|null} [clockSnapshot] TracePacket clockSnapshot
             * @property {perfetto.protos.IFtraceEvents|null} [ftraceEvents] TracePacket ftraceEvents
             * @property {perfetto.protos.IInternedData|null} [internedData] TracePacket internedData
             * @property {perfetto.protos.ITracePacketDefaults|null} [tracePacketDefaults] TracePacket tracePacketDefaults
             */

            /**
             * Constructs a new TracePacket.
             * @memberof perfetto.protos
             * @classdesc Represents a TracePacket.
             * @implements ITracePacket
             * @constructor
             * @param {perfetto.protos.ITracePacket=} [properties] Properties to set
             */
            function TracePacket(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * TracePacket timestamp.
             * @member {number|Long} timestamp
             * @memberof perfetto.protos.TracePacket
             * @instance
             */
            TracePacket.prototype.timestamp = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

            /**
             * TracePacket timestampClockId.
             * @member {number} timestampClockId
             * @memberof perfetto.protos.TracePacket
             * @instance
             */
            TracePacket.prototype.timestampClockId = 0;

            /**
             * TracePacket trustedUid.
             * @member {number} trustedUid
             * @memberof perfetto.protos.TracePacket
             * @instance
             */
            TracePacket.prototype.trustedUid = 0;

            /**
             * TracePacket trustedPacketSequenceId.
             * @member {number} trustedPacketSequenceId
             * @memberof perfetto.protos.TracePacket
             * @instance
             */
            TracePacket.prototype.trustedPacketSequenceId = 0;

            /**
             * TracePacket sequenceFlags.
             * @member {number} sequenceFlags
             * @memberof perfetto.protos.TracePacket
             * @instance
             */
            TracePacket.prototype.sequenceFlags = 0;

            /**
             * TracePacket previousPacketDropped.
             * @member {boolean} previousPacketDropped
             * @memberof perfetto.protos.TracePacket
             * @instance
             */
            TracePacket.prototype.previousPacketDropped = false;

            /**
             * TracePacket firstPacketOnSequence.
             * @member {boolean} firstPacketOnSequence
             * @memberof perfetto.protos.TracePacket
             * @instance
             */
            TracePacket.prototype.firstPacketOnSequence = false;

            /**
             * TracePacket perfSample.
             * @member {perfetto.protos.IPerfSample|null|undefined} perfSample
             * @memberof perfetto.protos.TracePacket
             * @instance
             */
            TracePacket.prototype.perfSample = null;

            /**
             * TracePacket processTree.
             * @member {perfetto.protos.IProcessTree|null|undefined} processTree
             * @memberof perfetto.protos.TracePacket
             * @instance
             */
            TracePacket.prototype.processTree = null;

            /**
             * TracePacket trackEvent.
             * @member {perfetto.protos.ITrackEvent|null|undefined} trackEvent
             * @memberof perfetto.protos.TracePacket
             * @instance
             */
            TracePacket.prototype.trackEvent = null;

            /**
             * TracePacket chromeEvents.
             * @member {perfetto.protos.IChromeEvents|null|undefined} chromeEvents
             * @memberof perfetto.protos.TracePacket
             * @instance
             */
            TracePacket.prototype.chromeEvents = null;

            /**
             * TracePacket clockSnapshot.
             * @member {perfetto.protos.IClockSnapshot|null|undefined} clockSnapshot
             * @memberof perfetto.protos.TracePacket
             * @instance
             */
            TracePacket.prototype.clockSnapshot = null;

            /**
             * TracePacket ftraceEvents.
             * @member {perfetto.protos.IFtraceEvents|null|undefined} ftraceEvents
             * @memberof perfetto.protos.TracePacket
             * @instance
             */
            TracePacket.prototype.ftraceEvents = null;

            /**
             * TracePacket internedData.
             * @member {perfetto.protos.IInternedData|null|undefined} internedData
             * @memberof perfetto.protos.TracePacket
             * @instance
             */
            TracePacket.prototype.internedData = null;

            /**
             * TracePacket tracePacketDefaults.
             * @member {perfetto.protos.ITracePacketDefaults|null|undefined} tracePacketDefaults
             * @memberof perfetto.protos.TracePacket
             * @instance
             */
            TracePacket.prototype.tracePacketDefaults = null;

            // OneOf field names bound to virtual getters and setters
            var $oneOfFields;

            /**
             * TracePacket data.
             * @member {"perfSample"|"processTree"|"trackEvent"|"chromeEvents"|"clockSnapshot"|"ftraceEvents"|undefined} data
             * @memberof perfetto.protos.TracePacket
             * @instance
             */
            Object.defineProperty(TracePacket.prototype, "data", {
                get: $util.oneOfGetter($oneOfFields = ["perfSample", "processTree", "trackEvent", "chromeEvents", "clockSnapshot", "ftraceEvents"]),
                set: $util.oneOfSetter($oneOfFields)
            });

            /**
             * Creates a new TracePacket instance using the specified properties.
             * @function create
             * @memberof perfetto.protos.TracePacket
             * @static
             * @param {perfetto.protos.ITracePacket=} [properties] Properties to set
             * @returns {perfetto.protos.TracePacket} TracePacket instance
             */
            TracePacket.create = function create(properties) {
                return new TracePacket(properties);
            };

            /**
             * Encodes the specified TracePacket message. Does not implicitly {@link perfetto.protos.TracePacket.verify|verify} messages.
             * @function encode
             * @memberof perfetto.protos.TracePacket
             * @static
             * @param {perfetto.protos.ITracePacket} message TracePacket message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            TracePacket.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.ftraceEvents != null && message.hasOwnProperty("ftraceEvents"))
                    $root.perfetto.protos.FtraceEvents.encode(message.ftraceEvents, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                if (message.processTree != null && message.hasOwnProperty("processTree"))
                    $root.perfetto.protos.ProcessTree.encode(message.processTree, writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
                if (message.trustedUid != null && message.hasOwnProperty("trustedUid"))
                    writer.uint32(/* id 3, wireType 0 =*/24).int32(message.trustedUid);
                if (message.clockSnapshot != null && message.hasOwnProperty("clockSnapshot"))
                    $root.perfetto.protos.ClockSnapshot.encode(message.clockSnapshot, writer.uint32(/* id 6, wireType 2 =*/50).fork()).ldelim();
                if (message.timestamp != null && message.hasOwnProperty("timestamp"))
                    writer.uint32(/* id 8, wireType 0 =*/64).uint64(message.timestamp);
                if (message.trustedPacketSequenceId != null && message.hasOwnProperty("trustedPacketSequenceId"))
                    writer.uint32(/* id 10, wireType 0 =*/80).uint32(message.trustedPacketSequenceId);
                if (message.trackEvent != null && message.hasOwnProperty("trackEvent"))
                    $root.perfetto.protos.TrackEvent.encode(message.trackEvent, writer.uint32(/* id 11, wireType 2 =*/90).fork()).ldelim();
                if (message.internedData != null && message.hasOwnProperty("internedData"))
                    $root.perfetto.protos.InternedData.encode(message.internedData, writer.uint32(/* id 12, wireType 2 =*/98).fork()).ldelim();
                if (message.sequenceFlags != null && message.hasOwnProperty("sequenceFlags"))
                    writer.uint32(/* id 13, wireType 0 =*/104).uint32(message.sequenceFlags);
                if (message.previousPacketDropped != null && message.hasOwnProperty("previousPacketDropped"))
                    writer.uint32(/* id 42, wireType 0 =*/336).bool(message.previousPacketDropped);
                if (message.chromeEvents != null && message.hasOwnProperty("chromeEvents"))
                    $root.perfetto.protos.ChromeEvents.encode(message.chromeEvents, writer.uint32(/* id 49, wireType 2 =*/394).fork()).ldelim();
                if (message.timestampClockId != null && message.hasOwnProperty("timestampClockId"))
                    writer.uint32(/* id 58, wireType 0 =*/464).uint32(message.timestampClockId);
                if (message.tracePacketDefaults != null && message.hasOwnProperty("tracePacketDefaults"))
                    $root.perfetto.protos.TracePacketDefaults.encode(message.tracePacketDefaults, writer.uint32(/* id 59, wireType 2 =*/474).fork()).ldelim();
                if (message.perfSample != null && message.hasOwnProperty("perfSample"))
                    $root.perfetto.protos.PerfSample.encode(message.perfSample, writer.uint32(/* id 66, wireType 2 =*/530).fork()).ldelim();
                if (message.firstPacketOnSequence != null && message.hasOwnProperty("firstPacketOnSequence"))
                    writer.uint32(/* id 87, wireType 0 =*/696).bool(message.firstPacketOnSequence);
                return writer;
            };

            /**
             * Encodes the specified TracePacket message, length delimited. Does not implicitly {@link perfetto.protos.TracePacket.verify|verify} messages.
             * @function encodeDelimited
             * @memberof perfetto.protos.TracePacket
             * @static
             * @param {perfetto.protos.ITracePacket} message TracePacket message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            TracePacket.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a TracePacket message from the specified reader or buffer.
             * @function decode
             * @memberof perfetto.protos.TracePacket
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {perfetto.protos.TracePacket} TracePacket
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            TracePacket.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.perfetto.protos.TracePacket();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 8:
                        message.timestamp = reader.uint64();
                        break;
                    case 58:
                        message.timestampClockId = reader.uint32();
                        break;
                    case 3:
                        message.trustedUid = reader.int32();
                        break;
                    case 10:
                        message.trustedPacketSequenceId = reader.uint32();
                        break;
                    case 13:
                        message.sequenceFlags = reader.uint32();
                        break;
                    case 42:
                        message.previousPacketDropped = reader.bool();
                        break;
                    case 87:
                        message.firstPacketOnSequence = reader.bool();
                        break;
                    case 66:
                        message.perfSample = $root.perfetto.protos.PerfSample.decode(reader, reader.uint32());
                        break;
                    case 2:
                        message.processTree = $root.perfetto.protos.ProcessTree.decode(reader, reader.uint32());
                        break;
                    case 11:
                        message.trackEvent = $root.perfetto.protos.TrackEvent.decode(reader, reader.uint32());
                        break;
                    case 49:
                        message.chromeEvents = $root.perfetto.protos.ChromeEvents.decode(reader, reader.uint32());
                        break;
                    case 6:
                        message.clockSnapshot = $root.perfetto.protos.ClockSnapshot.decode(reader, reader.uint32());
                        break;
                    case 1:
                        message.ftraceEvents = $root.perfetto.protos.FtraceEvents.decode(reader, reader.uint32());
                        break;
                    case 12:
                        message.internedData = $root.perfetto.protos.InternedData.decode(reader, reader.uint32());
                        break;
                    case 59:
                        message.tracePacketDefaults = $root.perfetto.protos.TracePacketDefaults.decode(reader, reader.uint32());
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a TracePacket message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof perfetto.protos.TracePacket
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {perfetto.protos.TracePacket} TracePacket
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            TracePacket.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a TracePacket message.
             * @function verify
             * @memberof perfetto.protos.TracePacket
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            TracePacket.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                var properties = {};
                if (message.timestamp != null && message.hasOwnProperty("timestamp"))
                    if (!$util.isInteger(message.timestamp) && !(message.timestamp && $util.isInteger(message.timestamp.low) && $util.isInteger(message.timestamp.high)))
                        return "timestamp: integer|Long expected";
                if (message.timestampClockId != null && message.hasOwnProperty("timestampClockId"))
                    if (!$util.isInteger(message.timestampClockId))
                        return "timestampClockId: integer expected";
                if (message.trustedUid != null && message.hasOwnProperty("trustedUid"))
                    if (!$util.isInteger(message.trustedUid))
                        return "trustedUid: integer expected";
                if (message.trustedPacketSequenceId != null && message.hasOwnProperty("trustedPacketSequenceId"))
                    if (!$util.isInteger(message.trustedPacketSequenceId))
                        return "trustedPacketSequenceId: integer expected";
                if (message.sequenceFlags != null && message.hasOwnProperty("sequenceFlags"))
                    if (!$util.isInteger(message.sequenceFlags))
                        return "sequenceFlags: integer expected";
                if (message.previousPacketDropped != null && message.hasOwnProperty("previousPacketDropped"))
                    if (typeof message.previousPacketDropped !== "boolean")
                        return "previousPacketDropped: boolean expected";
                if (message.firstPacketOnSequence != null && message.hasOwnProperty("firstPacketOnSequence"))
                    if (typeof message.firstPacketOnSequence !== "boolean")
                        return "firstPacketOnSequence: boolean expected";
                if (message.perfSample != null && message.hasOwnProperty("perfSample")) {
                    properties.data = 1;
                    {
                        var error = $root.perfetto.protos.PerfSample.verify(message.perfSample);
                        if (error)
                            return "perfSample." + error;
                    }
                }
                if (message.processTree != null && message.hasOwnProperty("processTree")) {
                    if (properties.data === 1)
                        return "data: multiple values";
                    properties.data = 1;
                    {
                        var error = $root.perfetto.protos.ProcessTree.verify(message.processTree);
                        if (error)
                            return "processTree." + error;
                    }
                }
                if (message.trackEvent != null && message.hasOwnProperty("trackEvent")) {
                    if (properties.data === 1)
                        return "data: multiple values";
                    properties.data = 1;
                    {
                        var error = $root.perfetto.protos.TrackEvent.verify(message.trackEvent);
                        if (error)
                            return "trackEvent." + error;
                    }
                }
                if (message.chromeEvents != null && message.hasOwnProperty("chromeEvents")) {
                    if (properties.data === 1)
                        return "data: multiple values";
                    properties.data = 1;
                    {
                        var error = $root.perfetto.protos.ChromeEvents.verify(message.chromeEvents);
                        if (error)
                            return "chromeEvents." + error;
                    }
                }
                if (message.clockSnapshot != null && message.hasOwnProperty("clockSnapshot")) {
                    if (properties.data === 1)
                        return "data: multiple values";
                    properties.data = 1;
                    {
                        var error = $root.perfetto.protos.ClockSnapshot.verify(message.clockSnapshot);
                        if (error)
                            return "clockSnapshot." + error;
                    }
                }
                if (message.ftraceEvents != null && message.hasOwnProperty("ftraceEvents")) {
                    if (properties.data === 1)
                        return "data: multiple values";
                    properties.data = 1;
                    {
                        var error = $root.perfetto.protos.FtraceEvents.verify(message.ftraceEvents);
                        if (error)
                            return "ftraceEvents." + error;
                    }
                }
                if (message.internedData != null && message.hasOwnProperty("internedData")) {
                    var error = $root.perfetto.protos.InternedData.verify(message.internedData);
                    if (error)
                        return "internedData." + error;
                }
                if (message.tracePacketDefaults != null && message.hasOwnProperty("tracePacketDefaults")) {
                    var error = $root.perfetto.protos.TracePacketDefaults.verify(message.tracePacketDefaults);
                    if (error)
                        return "tracePacketDefaults." + error;
                }
                return null;
            };

            /**
             * Creates a TracePacket message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof perfetto.protos.TracePacket
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {perfetto.protos.TracePacket} TracePacket
             */
            TracePacket.fromObject = function fromObject(object) {
                if (object instanceof $root.perfetto.protos.TracePacket)
                    return object;
                var message = new $root.perfetto.protos.TracePacket();
                if (object.timestamp != null)
                    if ($util.Long)
                        (message.timestamp = $util.Long.fromValue(object.timestamp)).unsigned = true;
                    else if (typeof object.timestamp === "string")
                        message.timestamp = parseInt(object.timestamp, 10);
                    else if (typeof object.timestamp === "number")
                        message.timestamp = object.timestamp;
                    else if (typeof object.timestamp === "object")
                        message.timestamp = new $util.LongBits(object.timestamp.low >>> 0, object.timestamp.high >>> 0).toNumber(true);
                if (object.timestampClockId != null)
                    message.timestampClockId = object.timestampClockId >>> 0;
                if (object.trustedUid != null)
                    message.trustedUid = object.trustedUid | 0;
                if (object.trustedPacketSequenceId != null)
                    message.trustedPacketSequenceId = object.trustedPacketSequenceId >>> 0;
                if (object.sequenceFlags != null)
                    message.sequenceFlags = object.sequenceFlags >>> 0;
                if (object.previousPacketDropped != null)
                    message.previousPacketDropped = Boolean(object.previousPacketDropped);
                if (object.firstPacketOnSequence != null)
                    message.firstPacketOnSequence = Boolean(object.firstPacketOnSequence);
                if (object.perfSample != null) {
                    if (typeof object.perfSample !== "object")
                        throw TypeError(".perfetto.protos.TracePacket.perfSample: object expected");
                    message.perfSample = $root.perfetto.protos.PerfSample.fromObject(object.perfSample);
                }
                if (object.processTree != null) {
                    if (typeof object.processTree !== "object")
                        throw TypeError(".perfetto.protos.TracePacket.processTree: object expected");
                    message.processTree = $root.perfetto.protos.ProcessTree.fromObject(object.processTree);
                }
                if (object.trackEvent != null) {
                    if (typeof object.trackEvent !== "object")
                        throw TypeError(".perfetto.protos.TracePacket.trackEvent: object expected");
                    message.trackEvent = $root.perfetto.protos.TrackEvent.fromObject(object.trackEvent);
                }
                if (object.chromeEvents != null) {
                    if (typeof object.chromeEvents !== "object")
                        throw TypeError(".perfetto.protos.TracePacket.chromeEvents: object expected");
                    message.chromeEvents = $root.perfetto.protos.ChromeEvents.fromObject(object.chromeEvents);
                }
                if (object.clockSnapshot != null) {
                    if (typeof object.clockSnapshot !== "object")
                        throw TypeError(".perfetto.protos.TracePacket.clockSnapshot: object expected");
                    message.clockSnapshot = $root.perfetto.protos.ClockSnapshot.fromObject(object.clockSnapshot);
                }
                if (object.ftraceEvents != null) {
                    if (typeof object.ftraceEvents !== "object")
                        throw TypeError(".perfetto.protos.TracePacket.ftraceEvents: object expected");
                    message.ftraceEvents = $root.perfetto.protos.FtraceEvents.fromObject(object.ftraceEvents);
                }
                if (object.internedData != null) {
                    if (typeof object.internedData !== "object")
                        throw TypeError(".perfetto.protos.TracePacket.internedData: object expected");
                    message.internedData = $root.perfetto.protos.InternedData.fromObject(object.internedData);
                }
                if (object.tracePacketDefaults != null) {
                    if (typeof object.tracePacketDefaults !== "object")
                        throw TypeError(".perfetto.protos.TracePacket.tracePacketDefaults: object expected");
                    message.tracePacketDefaults = $root.perfetto.protos.TracePacketDefaults.fromObject(object.tracePacketDefaults);
                }
                return message;
            };

            /**
             * Creates a plain object from a TracePacket message. Also converts values to other types if specified.
             * @function toObject
             * @memberof perfetto.protos.TracePacket
             * @static
             * @param {perfetto.protos.TracePacket} message TracePacket
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            TracePacket.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults) {
                    object.trustedUid = 0;
                    if ($util.Long) {
                        var long = new $util.Long(0, 0, true);
                        object.timestamp = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                    } else
                        object.timestamp = options.longs === String ? "0" : 0;
                    object.trustedPacketSequenceId = 0;
                    object.internedData = null;
                    object.sequenceFlags = 0;
                    object.previousPacketDropped = false;
                    object.timestampClockId = 0;
                    object.tracePacketDefaults = null;
                    object.firstPacketOnSequence = false;
                }
                if (message.ftraceEvents != null && message.hasOwnProperty("ftraceEvents")) {
                    object.ftraceEvents = $root.perfetto.protos.FtraceEvents.toObject(message.ftraceEvents, options);
                    if (options.oneofs)
                        object.data = "ftraceEvents";
                }
                if (message.processTree != null && message.hasOwnProperty("processTree")) {
                    object.processTree = $root.perfetto.protos.ProcessTree.toObject(message.processTree, options);
                    if (options.oneofs)
                        object.data = "processTree";
                }
                if (message.trustedUid != null && message.hasOwnProperty("trustedUid"))
                    object.trustedUid = message.trustedUid;
                if (message.clockSnapshot != null && message.hasOwnProperty("clockSnapshot")) {
                    object.clockSnapshot = $root.perfetto.protos.ClockSnapshot.toObject(message.clockSnapshot, options);
                    if (options.oneofs)
                        object.data = "clockSnapshot";
                }
                if (message.timestamp != null && message.hasOwnProperty("timestamp"))
                    if (typeof message.timestamp === "number")
                        object.timestamp = options.longs === String ? String(message.timestamp) : message.timestamp;
                    else
                        object.timestamp = options.longs === String ? $util.Long.prototype.toString.call(message.timestamp) : options.longs === Number ? new $util.LongBits(message.timestamp.low >>> 0, message.timestamp.high >>> 0).toNumber(true) : message.timestamp;
                if (message.trustedPacketSequenceId != null && message.hasOwnProperty("trustedPacketSequenceId"))
                    object.trustedPacketSequenceId = message.trustedPacketSequenceId;
                if (message.trackEvent != null && message.hasOwnProperty("trackEvent")) {
                    object.trackEvent = $root.perfetto.protos.TrackEvent.toObject(message.trackEvent, options);
                    if (options.oneofs)
                        object.data = "trackEvent";
                }
                if (message.internedData != null && message.hasOwnProperty("internedData"))
                    object.internedData = $root.perfetto.protos.InternedData.toObject(message.internedData, options);
                if (message.sequenceFlags != null && message.hasOwnProperty("sequenceFlags"))
                    object.sequenceFlags = message.sequenceFlags;
                if (message.previousPacketDropped != null && message.hasOwnProperty("previousPacketDropped"))
                    object.previousPacketDropped = message.previousPacketDropped;
                if (message.chromeEvents != null && message.hasOwnProperty("chromeEvents")) {
                    object.chromeEvents = $root.perfetto.protos.ChromeEvents.toObject(message.chromeEvents, options);
                    if (options.oneofs)
                        object.data = "chromeEvents";
                }
                if (message.timestampClockId != null && message.hasOwnProperty("timestampClockId"))
                    object.timestampClockId = message.timestampClockId;
                if (message.tracePacketDefaults != null && message.hasOwnProperty("tracePacketDefaults"))
                    object.tracePacketDefaults = $root.perfetto.protos.TracePacketDefaults.toObject(message.tracePacketDefaults, options);
                if (message.perfSample != null && message.hasOwnProperty("perfSample")) {
                    object.perfSample = $root.perfetto.protos.PerfSample.toObject(message.perfSample, options);
                    if (options.oneofs)
                        object.data = "perfSample";
                }
                if (message.firstPacketOnSequence != null && message.hasOwnProperty("firstPacketOnSequence"))
                    object.firstPacketOnSequence = message.firstPacketOnSequence;
                return object;
            };

            /**
             * Converts this TracePacket to JSON.
             * @function toJSON
             * @memberof perfetto.protos.TracePacket
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            TracePacket.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return TracePacket;
        })();

        protos.PerfSample = (function() {

            /**
             * Properties of a PerfSample.
             * @memberof perfetto.protos
             * @interface IPerfSample
             * @property {number|null} [cpu] PerfSample cpu
             * @property {number|null} [pid] PerfSample pid
             * @property {number|null} [tid] PerfSample tid
             * @property {Array.<number|Long>|null} [callstackIid] PerfSample callstackIid
             * @property {number|Long|null} [timestamp] PerfSample timestamp
             */

            /**
             * Constructs a new PerfSample.
             * @memberof perfetto.protos
             * @classdesc Represents a PerfSample.
             * @implements IPerfSample
             * @constructor
             * @param {perfetto.protos.IPerfSample=} [properties] Properties to set
             */
            function PerfSample(properties) {
                this.callstackIid = [];
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * PerfSample cpu.
             * @member {number} cpu
             * @memberof perfetto.protos.PerfSample
             * @instance
             */
            PerfSample.prototype.cpu = 0;

            /**
             * PerfSample pid.
             * @member {number} pid
             * @memberof perfetto.protos.PerfSample
             * @instance
             */
            PerfSample.prototype.pid = 0;

            /**
             * PerfSample tid.
             * @member {number} tid
             * @memberof perfetto.protos.PerfSample
             * @instance
             */
            PerfSample.prototype.tid = 0;

            /**
             * PerfSample callstackIid.
             * @member {Array.<number|Long>} callstackIid
             * @memberof perfetto.protos.PerfSample
             * @instance
             */
            PerfSample.prototype.callstackIid = $util.emptyArray;

            /**
             * PerfSample timestamp.
             * @member {number|Long} timestamp
             * @memberof perfetto.protos.PerfSample
             * @instance
             */
            PerfSample.prototype.timestamp = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

            /**
             * Creates a new PerfSample instance using the specified properties.
             * @function create
             * @memberof perfetto.protos.PerfSample
             * @static
             * @param {perfetto.protos.IPerfSample=} [properties] Properties to set
             * @returns {perfetto.protos.PerfSample} PerfSample instance
             */
            PerfSample.create = function create(properties) {
                return new PerfSample(properties);
            };

            /**
             * Encodes the specified PerfSample message. Does not implicitly {@link perfetto.protos.PerfSample.verify|verify} messages.
             * @function encode
             * @memberof perfetto.protos.PerfSample
             * @static
             * @param {perfetto.protos.IPerfSample} message PerfSample message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            PerfSample.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.cpu != null && message.hasOwnProperty("cpu"))
                    writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.cpu);
                if (message.pid != null && message.hasOwnProperty("pid"))
                    writer.uint32(/* id 2, wireType 0 =*/16).uint32(message.pid);
                if (message.tid != null && message.hasOwnProperty("tid"))
                    writer.uint32(/* id 3, wireType 0 =*/24).uint32(message.tid);
                if (message.callstackIid != null && message.callstackIid.length)
                    for (var i = 0; i < message.callstackIid.length; ++i)
                        writer.uint32(/* id 4, wireType 0 =*/32).uint64(message.callstackIid[i]);
                if (message.timestamp != null && message.hasOwnProperty("timestamp"))
                    writer.uint32(/* id 5, wireType 0 =*/40).uint64(message.timestamp);
                return writer;
            };

            /**
             * Encodes the specified PerfSample message, length delimited. Does not implicitly {@link perfetto.protos.PerfSample.verify|verify} messages.
             * @function encodeDelimited
             * @memberof perfetto.protos.PerfSample
             * @static
             * @param {perfetto.protos.IPerfSample} message PerfSample message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            PerfSample.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a PerfSample message from the specified reader or buffer.
             * @function decode
             * @memberof perfetto.protos.PerfSample
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {perfetto.protos.PerfSample} PerfSample
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            PerfSample.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.perfetto.protos.PerfSample();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.cpu = reader.uint32();
                        break;
                    case 2:
                        message.pid = reader.uint32();
                        break;
                    case 3:
                        message.tid = reader.uint32();
                        break;
                    case 4:
                        if (!(message.callstackIid && message.callstackIid.length))
                            message.callstackIid = [];
                        if ((tag & 7) === 2) {
                            var end2 = reader.uint32() + reader.pos;
                            while (reader.pos < end2)
                                message.callstackIid.push(reader.uint64());
                        } else
                            message.callstackIid.push(reader.uint64());
                        break;
                    case 5:
                        message.timestamp = reader.uint64();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a PerfSample message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof perfetto.protos.PerfSample
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {perfetto.protos.PerfSample} PerfSample
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            PerfSample.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a PerfSample message.
             * @function verify
             * @memberof perfetto.protos.PerfSample
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            PerfSample.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.cpu != null && message.hasOwnProperty("cpu"))
                    if (!$util.isInteger(message.cpu))
                        return "cpu: integer expected";
                if (message.pid != null && message.hasOwnProperty("pid"))
                    if (!$util.isInteger(message.pid))
                        return "pid: integer expected";
                if (message.tid != null && message.hasOwnProperty("tid"))
                    if (!$util.isInteger(message.tid))
                        return "tid: integer expected";
                if (message.callstackIid != null && message.hasOwnProperty("callstackIid")) {
                    if (!Array.isArray(message.callstackIid))
                        return "callstackIid: array expected";
                    for (var i = 0; i < message.callstackIid.length; ++i)
                        if (!$util.isInteger(message.callstackIid[i]) && !(message.callstackIid[i] && $util.isInteger(message.callstackIid[i].low) && $util.isInteger(message.callstackIid[i].high)))
                            return "callstackIid: integer|Long[] expected";
                }
                if (message.timestamp != null && message.hasOwnProperty("timestamp"))
                    if (!$util.isInteger(message.timestamp) && !(message.timestamp && $util.isInteger(message.timestamp.low) && $util.isInteger(message.timestamp.high)))
                        return "timestamp: integer|Long expected";
                return null;
            };

            /**
             * Creates a PerfSample message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof perfetto.protos.PerfSample
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {perfetto.protos.PerfSample} PerfSample
             */
            PerfSample.fromObject = function fromObject(object) {
                if (object instanceof $root.perfetto.protos.PerfSample)
                    return object;
                var message = new $root.perfetto.protos.PerfSample();
                if (object.cpu != null)
                    message.cpu = object.cpu >>> 0;
                if (object.pid != null)
                    message.pid = object.pid >>> 0;
                if (object.tid != null)
                    message.tid = object.tid >>> 0;
                if (object.callstackIid) {
                    if (!Array.isArray(object.callstackIid))
                        throw TypeError(".perfetto.protos.PerfSample.callstackIid: array expected");
                    message.callstackIid = [];
                    for (var i = 0; i < object.callstackIid.length; ++i)
                        if ($util.Long)
                            (message.callstackIid[i] = $util.Long.fromValue(object.callstackIid[i])).unsigned = true;
                        else if (typeof object.callstackIid[i] === "string")
                            message.callstackIid[i] = parseInt(object.callstackIid[i], 10);
                        else if (typeof object.callstackIid[i] === "number")
                            message.callstackIid[i] = object.callstackIid[i];
                        else if (typeof object.callstackIid[i] === "object")
                            message.callstackIid[i] = new $util.LongBits(object.callstackIid[i].low >>> 0, object.callstackIid[i].high >>> 0).toNumber(true);
                }
                if (object.timestamp != null)
                    if ($util.Long)
                        (message.timestamp = $util.Long.fromValue(object.timestamp)).unsigned = true;
                    else if (typeof object.timestamp === "string")
                        message.timestamp = parseInt(object.timestamp, 10);
                    else if (typeof object.timestamp === "number")
                        message.timestamp = object.timestamp;
                    else if (typeof object.timestamp === "object")
                        message.timestamp = new $util.LongBits(object.timestamp.low >>> 0, object.timestamp.high >>> 0).toNumber(true);
                return message;
            };

            /**
             * Creates a plain object from a PerfSample message. Also converts values to other types if specified.
             * @function toObject
             * @memberof perfetto.protos.PerfSample
             * @static
             * @param {perfetto.protos.PerfSample} message PerfSample
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            PerfSample.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.arrays || options.defaults)
                    object.callstackIid = [];
                if (options.defaults) {
                    object.cpu = 0;
                    object.pid = 0;
                    object.tid = 0;
                    if ($util.Long) {
                        var long = new $util.Long(0, 0, true);
                        object.timestamp = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                    } else
                        object.timestamp = options.longs === String ? "0" : 0;
                }
                if (message.cpu != null && message.hasOwnProperty("cpu"))
                    object.cpu = message.cpu;
                if (message.pid != null && message.hasOwnProperty("pid"))
                    object.pid = message.pid;
                if (message.tid != null && message.hasOwnProperty("tid"))
                    object.tid = message.tid;
                if (message.callstackIid && message.callstackIid.length) {
                    object.callstackIid = [];
                    for (var j = 0; j < message.callstackIid.length; ++j)
                        if (typeof message.callstackIid[j] === "number")
                            object.callstackIid[j] = options.longs === String ? String(message.callstackIid[j]) : message.callstackIid[j];
                        else
                            object.callstackIid[j] = options.longs === String ? $util.Long.prototype.toString.call(message.callstackIid[j]) : options.longs === Number ? new $util.LongBits(message.callstackIid[j].low >>> 0, message.callstackIid[j].high >>> 0).toNumber(true) : message.callstackIid[j];
                }
                if (message.timestamp != null && message.hasOwnProperty("timestamp"))
                    if (typeof message.timestamp === "number")
                        object.timestamp = options.longs === String ? String(message.timestamp) : message.timestamp;
                    else
                        object.timestamp = options.longs === String ? $util.Long.prototype.toString.call(message.timestamp) : options.longs === Number ? new $util.LongBits(message.timestamp.low >>> 0, message.timestamp.high >>> 0).toNumber(true) : message.timestamp;
                return object;
            };

            /**
             * Converts this PerfSample to JSON.
             * @function toJSON
             * @memberof perfetto.protos.PerfSample
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            PerfSample.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return PerfSample;
        })();

        protos.ProcessTree = (function() {

            /**
             * Properties of a ProcessTree.
             * @memberof perfetto.protos
             * @interface IProcessTree
             * @property {Array.<perfetto.protos.IProcess>|null} [processes] ProcessTree processes
             * @property {Array.<perfetto.protos.IThread>|null} [threads] ProcessTree threads
             */

            /**
             * Constructs a new ProcessTree.
             * @memberof perfetto.protos
             * @classdesc Represents a ProcessTree.
             * @implements IProcessTree
             * @constructor
             * @param {perfetto.protos.IProcessTree=} [properties] Properties to set
             */
            function ProcessTree(properties) {
                this.processes = [];
                this.threads = [];
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * ProcessTree processes.
             * @member {Array.<perfetto.protos.IProcess>} processes
             * @memberof perfetto.protos.ProcessTree
             * @instance
             */
            ProcessTree.prototype.processes = $util.emptyArray;

            /**
             * ProcessTree threads.
             * @member {Array.<perfetto.protos.IThread>} threads
             * @memberof perfetto.protos.ProcessTree
             * @instance
             */
            ProcessTree.prototype.threads = $util.emptyArray;

            /**
             * Creates a new ProcessTree instance using the specified properties.
             * @function create
             * @memberof perfetto.protos.ProcessTree
             * @static
             * @param {perfetto.protos.IProcessTree=} [properties] Properties to set
             * @returns {perfetto.protos.ProcessTree} ProcessTree instance
             */
            ProcessTree.create = function create(properties) {
                return new ProcessTree(properties);
            };

            /**
             * Encodes the specified ProcessTree message. Does not implicitly {@link perfetto.protos.ProcessTree.verify|verify} messages.
             * @function encode
             * @memberof perfetto.protos.ProcessTree
             * @static
             * @param {perfetto.protos.IProcessTree} message ProcessTree message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ProcessTree.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.processes != null && message.processes.length)
                    for (var i = 0; i < message.processes.length; ++i)
                        $root.perfetto.protos.Process.encode(message.processes[i], writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                if (message.threads != null && message.threads.length)
                    for (var i = 0; i < message.threads.length; ++i)
                        $root.perfetto.protos.Thread.encode(message.threads[i], writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
                return writer;
            };

            /**
             * Encodes the specified ProcessTree message, length delimited. Does not implicitly {@link perfetto.protos.ProcessTree.verify|verify} messages.
             * @function encodeDelimited
             * @memberof perfetto.protos.ProcessTree
             * @static
             * @param {perfetto.protos.IProcessTree} message ProcessTree message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ProcessTree.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a ProcessTree message from the specified reader or buffer.
             * @function decode
             * @memberof perfetto.protos.ProcessTree
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {perfetto.protos.ProcessTree} ProcessTree
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ProcessTree.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.perfetto.protos.ProcessTree();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        if (!(message.processes && message.processes.length))
                            message.processes = [];
                        message.processes.push($root.perfetto.protos.Process.decode(reader, reader.uint32()));
                        break;
                    case 2:
                        if (!(message.threads && message.threads.length))
                            message.threads = [];
                        message.threads.push($root.perfetto.protos.Thread.decode(reader, reader.uint32()));
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a ProcessTree message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof perfetto.protos.ProcessTree
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {perfetto.protos.ProcessTree} ProcessTree
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ProcessTree.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a ProcessTree message.
             * @function verify
             * @memberof perfetto.protos.ProcessTree
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            ProcessTree.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.processes != null && message.hasOwnProperty("processes")) {
                    if (!Array.isArray(message.processes))
                        return "processes: array expected";
                    for (var i = 0; i < message.processes.length; ++i) {
                        var error = $root.perfetto.protos.Process.verify(message.processes[i]);
                        if (error)
                            return "processes." + error;
                    }
                }
                if (message.threads != null && message.hasOwnProperty("threads")) {
                    if (!Array.isArray(message.threads))
                        return "threads: array expected";
                    for (var i = 0; i < message.threads.length; ++i) {
                        var error = $root.perfetto.protos.Thread.verify(message.threads[i]);
                        if (error)
                            return "threads." + error;
                    }
                }
                return null;
            };

            /**
             * Creates a ProcessTree message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof perfetto.protos.ProcessTree
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {perfetto.protos.ProcessTree} ProcessTree
             */
            ProcessTree.fromObject = function fromObject(object) {
                if (object instanceof $root.perfetto.protos.ProcessTree)
                    return object;
                var message = new $root.perfetto.protos.ProcessTree();
                if (object.processes) {
                    if (!Array.isArray(object.processes))
                        throw TypeError(".perfetto.protos.ProcessTree.processes: array expected");
                    message.processes = [];
                    for (var i = 0; i < object.processes.length; ++i) {
                        if (typeof object.processes[i] !== "object")
                            throw TypeError(".perfetto.protos.ProcessTree.processes: object expected");
                        message.processes[i] = $root.perfetto.protos.Process.fromObject(object.processes[i]);
                    }
                }
                if (object.threads) {
                    if (!Array.isArray(object.threads))
                        throw TypeError(".perfetto.protos.ProcessTree.threads: array expected");
                    message.threads = [];
                    for (var i = 0; i < object.threads.length; ++i) {
                        if (typeof object.threads[i] !== "object")
                            throw TypeError(".perfetto.protos.ProcessTree.threads: object expected");
                        message.threads[i] = $root.perfetto.protos.Thread.fromObject(object.threads[i]);
                    }
                }
                return message;
            };

            /**
             * Creates a plain object from a ProcessTree message. Also converts values to other types if specified.
             * @function toObject
             * @memberof perfetto.protos.ProcessTree
             * @static
             * @param {perfetto.protos.ProcessTree} message ProcessTree
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            ProcessTree.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.arrays || options.defaults) {
                    object.processes = [];
                    object.threads = [];
                }
                if (message.processes && message.processes.length) {
                    object.processes = [];
                    for (var j = 0; j < message.processes.length; ++j)
                        object.processes[j] = $root.perfetto.protos.Process.toObject(message.processes[j], options);
                }
                if (message.threads && message.threads.length) {
                    object.threads = [];
                    for (var j = 0; j < message.threads.length; ++j)
                        object.threads[j] = $root.perfetto.protos.Thread.toObject(message.threads[j], options);
                }
                return object;
            };

            /**
             * Converts this ProcessTree to JSON.
             * @function toJSON
             * @memberof perfetto.protos.ProcessTree
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            ProcessTree.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return ProcessTree;
        })();

        protos.Process = (function() {

            /**
             * Properties of a Process.
             * @memberof perfetto.protos
             * @interface IProcess
             * @property {number|null} [pid] Process pid
             * @property {number|null} [ppid] Process ppid
             * @property {Array.<string>|null} [cmdline] Process cmdline
             */

            /**
             * Constructs a new Process.
             * @memberof perfetto.protos
             * @classdesc Represents a Process.
             * @implements IProcess
             * @constructor
             * @param {perfetto.protos.IProcess=} [properties] Properties to set
             */
            function Process(properties) {
                this.cmdline = [];
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Process pid.
             * @member {number} pid
             * @memberof perfetto.protos.Process
             * @instance
             */
            Process.prototype.pid = 0;

            /**
             * Process ppid.
             * @member {number} ppid
             * @memberof perfetto.protos.Process
             * @instance
             */
            Process.prototype.ppid = 0;

            /**
             * Process cmdline.
             * @member {Array.<string>} cmdline
             * @memberof perfetto.protos.Process
             * @instance
             */
            Process.prototype.cmdline = $util.emptyArray;

            /**
             * Creates a new Process instance using the specified properties.
             * @function create
             * @memberof perfetto.protos.Process
             * @static
             * @param {perfetto.protos.IProcess=} [properties] Properties to set
             * @returns {perfetto.protos.Process} Process instance
             */
            Process.create = function create(properties) {
                return new Process(properties);
            };

            /**
             * Encodes the specified Process message. Does not implicitly {@link perfetto.protos.Process.verify|verify} messages.
             * @function encode
             * @memberof perfetto.protos.Process
             * @static
             * @param {perfetto.protos.IProcess} message Process message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Process.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.pid != null && message.hasOwnProperty("pid"))
                    writer.uint32(/* id 1, wireType 0 =*/8).int32(message.pid);
                if (message.ppid != null && message.hasOwnProperty("ppid"))
                    writer.uint32(/* id 2, wireType 0 =*/16).int32(message.ppid);
                if (message.cmdline != null && message.cmdline.length)
                    for (var i = 0; i < message.cmdline.length; ++i)
                        writer.uint32(/* id 3, wireType 2 =*/26).string(message.cmdline[i]);
                return writer;
            };

            /**
             * Encodes the specified Process message, length delimited. Does not implicitly {@link perfetto.protos.Process.verify|verify} messages.
             * @function encodeDelimited
             * @memberof perfetto.protos.Process
             * @static
             * @param {perfetto.protos.IProcess} message Process message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Process.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a Process message from the specified reader or buffer.
             * @function decode
             * @memberof perfetto.protos.Process
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {perfetto.protos.Process} Process
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Process.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.perfetto.protos.Process();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.pid = reader.int32();
                        break;
                    case 2:
                        message.ppid = reader.int32();
                        break;
                    case 3:
                        if (!(message.cmdline && message.cmdline.length))
                            message.cmdline = [];
                        message.cmdline.push(reader.string());
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a Process message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof perfetto.protos.Process
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {perfetto.protos.Process} Process
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Process.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a Process message.
             * @function verify
             * @memberof perfetto.protos.Process
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            Process.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.pid != null && message.hasOwnProperty("pid"))
                    if (!$util.isInteger(message.pid))
                        return "pid: integer expected";
                if (message.ppid != null && message.hasOwnProperty("ppid"))
                    if (!$util.isInteger(message.ppid))
                        return "ppid: integer expected";
                if (message.cmdline != null && message.hasOwnProperty("cmdline")) {
                    if (!Array.isArray(message.cmdline))
                        return "cmdline: array expected";
                    for (var i = 0; i < message.cmdline.length; ++i)
                        if (!$util.isString(message.cmdline[i]))
                            return "cmdline: string[] expected";
                }
                return null;
            };

            /**
             * Creates a Process message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof perfetto.protos.Process
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {perfetto.protos.Process} Process
             */
            Process.fromObject = function fromObject(object) {
                if (object instanceof $root.perfetto.protos.Process)
                    return object;
                var message = new $root.perfetto.protos.Process();
                if (object.pid != null)
                    message.pid = object.pid | 0;
                if (object.ppid != null)
                    message.ppid = object.ppid | 0;
                if (object.cmdline) {
                    if (!Array.isArray(object.cmdline))
                        throw TypeError(".perfetto.protos.Process.cmdline: array expected");
                    message.cmdline = [];
                    for (var i = 0; i < object.cmdline.length; ++i)
                        message.cmdline[i] = String(object.cmdline[i]);
                }
                return message;
            };

            /**
             * Creates a plain object from a Process message. Also converts values to other types if specified.
             * @function toObject
             * @memberof perfetto.protos.Process
             * @static
             * @param {perfetto.protos.Process} message Process
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            Process.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.arrays || options.defaults)
                    object.cmdline = [];
                if (options.defaults) {
                    object.pid = 0;
                    object.ppid = 0;
                }
                if (message.pid != null && message.hasOwnProperty("pid"))
                    object.pid = message.pid;
                if (message.ppid != null && message.hasOwnProperty("ppid"))
                    object.ppid = message.ppid;
                if (message.cmdline && message.cmdline.length) {
                    object.cmdline = [];
                    for (var j = 0; j < message.cmdline.length; ++j)
                        object.cmdline[j] = message.cmdline[j];
                }
                return object;
            };

            /**
             * Converts this Process to JSON.
             * @function toJSON
             * @memberof perfetto.protos.Process
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            Process.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return Process;
        })();

        protos.Thread = (function() {

            /**
             * Properties of a Thread.
             * @memberof perfetto.protos
             * @interface IThread
             * @property {number|null} [tid] Thread tid
             * @property {number|null} [tgid] Thread tgid
             * @property {string|null} [name] Thread name
             */

            /**
             * Constructs a new Thread.
             * @memberof perfetto.protos
             * @classdesc Represents a Thread.
             * @implements IThread
             * @constructor
             * @param {perfetto.protos.IThread=} [properties] Properties to set
             */
            function Thread(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Thread tid.
             * @member {number} tid
             * @memberof perfetto.protos.Thread
             * @instance
             */
            Thread.prototype.tid = 0;

            /**
             * Thread tgid.
             * @member {number} tgid
             * @memberof perfetto.protos.Thread
             * @instance
             */
            Thread.prototype.tgid = 0;

            /**
             * Thread name.
             * @member {string} name
             * @memberof perfetto.protos.Thread
             * @instance
             */
            Thread.prototype.name = "";

            /**
             * Creates a new Thread instance using the specified properties.
             * @function create
             * @memberof perfetto.protos.Thread
             * @static
             * @param {perfetto.protos.IThread=} [properties] Properties to set
             * @returns {perfetto.protos.Thread} Thread instance
             */
            Thread.create = function create(properties) {
                return new Thread(properties);
            };

            /**
             * Encodes the specified Thread message. Does not implicitly {@link perfetto.protos.Thread.verify|verify} messages.
             * @function encode
             * @memberof perfetto.protos.Thread
             * @static
             * @param {perfetto.protos.IThread} message Thread message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Thread.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.tid != null && message.hasOwnProperty("tid"))
                    writer.uint32(/* id 1, wireType 0 =*/8).int32(message.tid);
                if (message.tgid != null && message.hasOwnProperty("tgid"))
                    writer.uint32(/* id 2, wireType 0 =*/16).int32(message.tgid);
                if (message.name != null && message.hasOwnProperty("name"))
                    writer.uint32(/* id 3, wireType 2 =*/26).string(message.name);
                return writer;
            };

            /**
             * Encodes the specified Thread message, length delimited. Does not implicitly {@link perfetto.protos.Thread.verify|verify} messages.
             * @function encodeDelimited
             * @memberof perfetto.protos.Thread
             * @static
             * @param {perfetto.protos.IThread} message Thread message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Thread.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a Thread message from the specified reader or buffer.
             * @function decode
             * @memberof perfetto.protos.Thread
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {perfetto.protos.Thread} Thread
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Thread.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.perfetto.protos.Thread();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.tid = reader.int32();
                        break;
                    case 2:
                        message.tgid = reader.int32();
                        break;
                    case 3:
                        message.name = reader.string();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a Thread message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof perfetto.protos.Thread
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {perfetto.protos.Thread} Thread
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Thread.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a Thread message.
             * @function verify
             * @memberof perfetto.protos.Thread
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            Thread.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.tid != null && message.hasOwnProperty("tid"))
                    if (!$util.isInteger(message.tid))
                        return "tid: integer expected";
                if (message.tgid != null && message.hasOwnProperty("tgid"))
                    if (!$util.isInteger(message.tgid))
                        return "tgid: integer expected";
                if (message.name != null && message.hasOwnProperty("name"))
                    if (!$util.isString(message.name))
                        return "name: string expected";
                return null;
            };

            /**
             * Creates a Thread message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof perfetto.protos.Thread
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {perfetto.protos.Thread} Thread
             */
            Thread.fromObject = function fromObject(object) {
                if (object instanceof $root.perfetto.protos.Thread)
                    return object;
                var message = new $root.perfetto.protos.Thread();
                if (object.tid != null)
                    message.tid = object.tid | 0;
                if (object.tgid != null)
                    message.tgid = object.tgid | 0;
                if (object.name != null)
                    message.name = String(object.name);
                return message;
            };

            /**
             * Creates a plain object from a Thread message. Also converts values to other types if specified.
             * @function toObject
             * @memberof perfetto.protos.Thread
             * @static
             * @param {perfetto.protos.Thread} message Thread
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            Thread.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults) {
                    object.tid = 0;
                    object.tgid = 0;
                    object.name = "";
                }
                if (message.tid != null && message.hasOwnProperty("tid"))
                    object.tid = message.tid;
                if (message.tgid != null && message.hasOwnProperty("tgid"))
                    object.tgid = message.tgid;
                if (message.name != null && message.hasOwnProperty("name"))
                    object.name = message.name;
                return object;
            };

            /**
             * Converts this Thread to JSON.
             * @function toJSON
             * @memberof perfetto.protos.Thread
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            Thread.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return Thread;
        })();

        protos.TrackEvent = (function() {

            /**
             * Properties of a TrackEvent.
             * @memberof perfetto.protos
             * @interface ITrackEvent
             * @property {number|Long|null} [trackUuid] TrackEvent trackUuid
             * @property {Array.<number|Long>|null} [categoryIids] TrackEvent categoryIids
             * @property {number|Long|null} [nameIid] TrackEvent nameIid
             * @property {perfetto.protos.TrackEvent.Type|null} [type] TrackEvent type
             * @property {number|Long|null} [trackEventDurationUs] TrackEvent trackEventDurationUs
             */

            /**
             * Constructs a new TrackEvent.
             * @memberof perfetto.protos
             * @classdesc Represents a TrackEvent.
             * @implements ITrackEvent
             * @constructor
             * @param {perfetto.protos.ITrackEvent=} [properties] Properties to set
             */
            function TrackEvent(properties) {
                this.categoryIids = [];
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * TrackEvent trackUuid.
             * @member {number|Long} trackUuid
             * @memberof perfetto.protos.TrackEvent
             * @instance
             */
            TrackEvent.prototype.trackUuid = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

            /**
             * TrackEvent categoryIids.
             * @member {Array.<number|Long>} categoryIids
             * @memberof perfetto.protos.TrackEvent
             * @instance
             */
            TrackEvent.prototype.categoryIids = $util.emptyArray;

            /**
             * TrackEvent nameIid.
             * @member {number|Long} nameIid
             * @memberof perfetto.protos.TrackEvent
             * @instance
             */
            TrackEvent.prototype.nameIid = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

            /**
             * TrackEvent type.
             * @member {perfetto.protos.TrackEvent.Type} type
             * @memberof perfetto.protos.TrackEvent
             * @instance
             */
            TrackEvent.prototype.type = 0;

            /**
             * TrackEvent trackEventDurationUs.
             * @member {number|Long} trackEventDurationUs
             * @memberof perfetto.protos.TrackEvent
             * @instance
             */
            TrackEvent.prototype.trackEventDurationUs = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

            /**
             * Creates a new TrackEvent instance using the specified properties.
             * @function create
             * @memberof perfetto.protos.TrackEvent
             * @static
             * @param {perfetto.protos.ITrackEvent=} [properties] Properties to set
             * @returns {perfetto.protos.TrackEvent} TrackEvent instance
             */
            TrackEvent.create = function create(properties) {
                return new TrackEvent(properties);
            };

            /**
             * Encodes the specified TrackEvent message. Does not implicitly {@link perfetto.protos.TrackEvent.verify|verify} messages.
             * @function encode
             * @memberof perfetto.protos.TrackEvent
             * @static
             * @param {perfetto.protos.ITrackEvent} message TrackEvent message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            TrackEvent.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.categoryIids != null && message.categoryIids.length)
                    for (var i = 0; i < message.categoryIids.length; ++i)
                        writer.uint32(/* id 3, wireType 0 =*/24).uint64(message.categoryIids[i]);
                if (message.type != null && message.hasOwnProperty("type"))
                    writer.uint32(/* id 9, wireType 0 =*/72).int32(message.type);
                if (message.nameIid != null && message.hasOwnProperty("nameIid"))
                    writer.uint32(/* id 10, wireType 0 =*/80).uint64(message.nameIid);
                if (message.trackUuid != null && message.hasOwnProperty("trackUuid"))
                    writer.uint32(/* id 11, wireType 0 =*/88).uint64(message.trackUuid);
                if (message.trackEventDurationUs != null && message.hasOwnProperty("trackEventDurationUs"))
                    writer.uint32(/* id 20, wireType 0 =*/160).int64(message.trackEventDurationUs);
                return writer;
            };

            /**
             * Encodes the specified TrackEvent message, length delimited. Does not implicitly {@link perfetto.protos.TrackEvent.verify|verify} messages.
             * @function encodeDelimited
             * @memberof perfetto.protos.TrackEvent
             * @static
             * @param {perfetto.protos.ITrackEvent} message TrackEvent message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            TrackEvent.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a TrackEvent message from the specified reader or buffer.
             * @function decode
             * @memberof perfetto.protos.TrackEvent
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {perfetto.protos.TrackEvent} TrackEvent
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            TrackEvent.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.perfetto.protos.TrackEvent();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 11:
                        message.trackUuid = reader.uint64();
                        break;
                    case 3:
                        if (!(message.categoryIids && message.categoryIids.length))
                            message.categoryIids = [];
                        if ((tag & 7) === 2) {
                            var end2 = reader.uint32() + reader.pos;
                            while (reader.pos < end2)
                                message.categoryIids.push(reader.uint64());
                        } else
                            message.categoryIids.push(reader.uint64());
                        break;
                    case 10:
                        message.nameIid = reader.uint64();
                        break;
                    case 9:
                        message.type = reader.int32();
                        break;
                    case 20:
                        message.trackEventDurationUs = reader.int64();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a TrackEvent message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof perfetto.protos.TrackEvent
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {perfetto.protos.TrackEvent} TrackEvent
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            TrackEvent.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a TrackEvent message.
             * @function verify
             * @memberof perfetto.protos.TrackEvent
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            TrackEvent.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.trackUuid != null && message.hasOwnProperty("trackUuid"))
                    if (!$util.isInteger(message.trackUuid) && !(message.trackUuid && $util.isInteger(message.trackUuid.low) && $util.isInteger(message.trackUuid.high)))
                        return "trackUuid: integer|Long expected";
                if (message.categoryIids != null && message.hasOwnProperty("categoryIids")) {
                    if (!Array.isArray(message.categoryIids))
                        return "categoryIids: array expected";
                    for (var i = 0; i < message.categoryIids.length; ++i)
                        if (!$util.isInteger(message.categoryIids[i]) && !(message.categoryIids[i] && $util.isInteger(message.categoryIids[i].low) && $util.isInteger(message.categoryIids[i].high)))
                            return "categoryIids: integer|Long[] expected";
                }
                if (message.nameIid != null && message.hasOwnProperty("nameIid"))
                    if (!$util.isInteger(message.nameIid) && !(message.nameIid && $util.isInteger(message.nameIid.low) && $util.isInteger(message.nameIid.high)))
                        return "nameIid: integer|Long expected";
                if (message.type != null && message.hasOwnProperty("type"))
                    switch (message.type) {
                    default:
                        return "type: enum value expected";
                    case 0:
                    case 1:
                    case 2:
                    case 3:
                    case 4:
                        break;
                    }
                if (message.trackEventDurationUs != null && message.hasOwnProperty("trackEventDurationUs"))
                    if (!$util.isInteger(message.trackEventDurationUs) && !(message.trackEventDurationUs && $util.isInteger(message.trackEventDurationUs.low) && $util.isInteger(message.trackEventDurationUs.high)))
                        return "trackEventDurationUs: integer|Long expected";
                return null;
            };

            /**
             * Creates a TrackEvent message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof perfetto.protos.TrackEvent
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {perfetto.protos.TrackEvent} TrackEvent
             */
            TrackEvent.fromObject = function fromObject(object) {
                if (object instanceof $root.perfetto.protos.TrackEvent)
                    return object;
                var message = new $root.perfetto.protos.TrackEvent();
                if (object.trackUuid != null)
                    if ($util.Long)
                        (message.trackUuid = $util.Long.fromValue(object.trackUuid)).unsigned = true;
                    else if (typeof object.trackUuid === "string")
                        message.trackUuid = parseInt(object.trackUuid, 10);
                    else if (typeof object.trackUuid === "number")
                        message.trackUuid = object.trackUuid;
                    else if (typeof object.trackUuid === "object")
                        message.trackUuid = new $util.LongBits(object.trackUuid.low >>> 0, object.trackUuid.high >>> 0).toNumber(true);
                if (object.categoryIids) {
                    if (!Array.isArray(object.categoryIids))
                        throw TypeError(".perfetto.protos.TrackEvent.categoryIids: array expected");
                    message.categoryIids = [];
                    for (var i = 0; i < object.categoryIids.length; ++i)
                        if ($util.Long)
                            (message.categoryIids[i] = $util.Long.fromValue(object.categoryIids[i])).unsigned = true;
                        else if (typeof object.categoryIids[i] === "string")
                            message.categoryIids[i] = parseInt(object.categoryIids[i], 10);
                        else if (typeof object.categoryIids[i] === "number")
                            message.categoryIids[i] = object.categoryIids[i];
                        else if (typeof object.categoryIids[i] === "object")
                            message.categoryIids[i] = new $util.LongBits(object.categoryIids[i].low >>> 0, object.categoryIids[i].high >>> 0).toNumber(true);
                }
                if (object.nameIid != null)
                    if ($util.Long)
                        (message.nameIid = $util.Long.fromValue(object.nameIid)).unsigned = true;
                    else if (typeof object.nameIid === "string")
                        message.nameIid = parseInt(object.nameIid, 10);
                    else if (typeof object.nameIid === "number")
                        message.nameIid = object.nameIid;
                    else if (typeof object.nameIid === "object")
                        message.nameIid = new $util.LongBits(object.nameIid.low >>> 0, object.nameIid.high >>> 0).toNumber(true);
                switch (object.type) {
                case "TYPE_UNSPECIFIED":
                case 0:
                    message.type = 0;
                    break;
                case "TYPE_SLICE_BEGIN":
                case 1:
                    message.type = 1;
                    break;
                case "TYPE_SLICE_END":
                case 2:
                    message.type = 2;
                    break;
                case "TYPE_INSTANT":
                case 3:
                    message.type = 3;
                    break;
                case "TYPE_COUNTER":
                case 4:
                    message.type = 4;
                    break;
                }
                if (object.trackEventDurationUs != null)
                    if ($util.Long)
                        (message.trackEventDurationUs = $util.Long.fromValue(object.trackEventDurationUs)).unsigned = false;
                    else if (typeof object.trackEventDurationUs === "string")
                        message.trackEventDurationUs = parseInt(object.trackEventDurationUs, 10);
                    else if (typeof object.trackEventDurationUs === "number")
                        message.trackEventDurationUs = object.trackEventDurationUs;
                    else if (typeof object.trackEventDurationUs === "object")
                        message.trackEventDurationUs = new $util.LongBits(object.trackEventDurationUs.low >>> 0, object.trackEventDurationUs.high >>> 0).toNumber();
                return message;
            };

            /**
             * Creates a plain object from a TrackEvent message. Also converts values to other types if specified.
             * @function toObject
             * @memberof perfetto.protos.TrackEvent
             * @static
             * @param {perfetto.protos.TrackEvent} message TrackEvent
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            TrackEvent.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.arrays || options.defaults)
                    object.categoryIids = [];
                if (options.defaults) {
                    object.type = options.enums === String ? "TYPE_UNSPECIFIED" : 0;
                    if ($util.Long) {
                        var long = new $util.Long(0, 0, true);
                        object.nameIid = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                    } else
                        object.nameIid = options.longs === String ? "0" : 0;
                    if ($util.Long) {
                        var long = new $util.Long(0, 0, true);
                        object.trackUuid = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                    } else
                        object.trackUuid = options.longs === String ? "0" : 0;
                    if ($util.Long) {
                        var long = new $util.Long(0, 0, false);
                        object.trackEventDurationUs = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                    } else
                        object.trackEventDurationUs = options.longs === String ? "0" : 0;
                }
                if (message.categoryIids && message.categoryIids.length) {
                    object.categoryIids = [];
                    for (var j = 0; j < message.categoryIids.length; ++j)
                        if (typeof message.categoryIids[j] === "number")
                            object.categoryIids[j] = options.longs === String ? String(message.categoryIids[j]) : message.categoryIids[j];
                        else
                            object.categoryIids[j] = options.longs === String ? $util.Long.prototype.toString.call(message.categoryIids[j]) : options.longs === Number ? new $util.LongBits(message.categoryIids[j].low >>> 0, message.categoryIids[j].high >>> 0).toNumber(true) : message.categoryIids[j];
                }
                if (message.type != null && message.hasOwnProperty("type"))
                    object.type = options.enums === String ? $root.perfetto.protos.TrackEvent.Type[message.type] : message.type;
                if (message.nameIid != null && message.hasOwnProperty("nameIid"))
                    if (typeof message.nameIid === "number")
                        object.nameIid = options.longs === String ? String(message.nameIid) : message.nameIid;
                    else
                        object.nameIid = options.longs === String ? $util.Long.prototype.toString.call(message.nameIid) : options.longs === Number ? new $util.LongBits(message.nameIid.low >>> 0, message.nameIid.high >>> 0).toNumber(true) : message.nameIid;
                if (message.trackUuid != null && message.hasOwnProperty("trackUuid"))
                    if (typeof message.trackUuid === "number")
                        object.trackUuid = options.longs === String ? String(message.trackUuid) : message.trackUuid;
                    else
                        object.trackUuid = options.longs === String ? $util.Long.prototype.toString.call(message.trackUuid) : options.longs === Number ? new $util.LongBits(message.trackUuid.low >>> 0, message.trackUuid.high >>> 0).toNumber(true) : message.trackUuid;
                if (message.trackEventDurationUs != null && message.hasOwnProperty("trackEventDurationUs"))
                    if (typeof message.trackEventDurationUs === "number")
                        object.trackEventDurationUs = options.longs === String ? String(message.trackEventDurationUs) : message.trackEventDurationUs;
                    else
                        object.trackEventDurationUs = options.longs === String ? $util.Long.prototype.toString.call(message.trackEventDurationUs) : options.longs === Number ? new $util.LongBits(message.trackEventDurationUs.low >>> 0, message.trackEventDurationUs.high >>> 0).toNumber() : message.trackEventDurationUs;
                return object;
            };

            /**
             * Converts this TrackEvent to JSON.
             * @function toJSON
             * @memberof perfetto.protos.TrackEvent
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            TrackEvent.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Type enum.
             * @name perfetto.protos.TrackEvent.Type
             * @enum {string}
             * @property {number} TYPE_UNSPECIFIED=0 TYPE_UNSPECIFIED value
             * @property {number} TYPE_SLICE_BEGIN=1 TYPE_SLICE_BEGIN value
             * @property {number} TYPE_SLICE_END=2 TYPE_SLICE_END value
             * @property {number} TYPE_INSTANT=3 TYPE_INSTANT value
             * @property {number} TYPE_COUNTER=4 TYPE_COUNTER value
             */
            TrackEvent.Type = (function() {
                var valuesById = {}, values = Object.create(valuesById);
                values[valuesById[0] = "TYPE_UNSPECIFIED"] = 0;
                values[valuesById[1] = "TYPE_SLICE_BEGIN"] = 1;
                values[valuesById[2] = "TYPE_SLICE_END"] = 2;
                values[valuesById[3] = "TYPE_INSTANT"] = 3;
                values[valuesById[4] = "TYPE_COUNTER"] = 4;
                return values;
            })();

            return TrackEvent;
        })();

        protos.ChromeEvents = (function() {

            /**
             * Properties of a ChromeEvents.
             * @memberof perfetto.protos
             * @interface IChromeEvents
             * @property {Array.<perfetto.protos.IChromeEvent>|null} [events] ChromeEvents events
             */

            /**
             * Constructs a new ChromeEvents.
             * @memberof perfetto.protos
             * @classdesc Represents a ChromeEvents.
             * @implements IChromeEvents
             * @constructor
             * @param {perfetto.protos.IChromeEvents=} [properties] Properties to set
             */
            function ChromeEvents(properties) {
                this.events = [];
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * ChromeEvents events.
             * @member {Array.<perfetto.protos.IChromeEvent>} events
             * @memberof perfetto.protos.ChromeEvents
             * @instance
             */
            ChromeEvents.prototype.events = $util.emptyArray;

            /**
             * Creates a new ChromeEvents instance using the specified properties.
             * @function create
             * @memberof perfetto.protos.ChromeEvents
             * @static
             * @param {perfetto.protos.IChromeEvents=} [properties] Properties to set
             * @returns {perfetto.protos.ChromeEvents} ChromeEvents instance
             */
            ChromeEvents.create = function create(properties) {
                return new ChromeEvents(properties);
            };

            /**
             * Encodes the specified ChromeEvents message. Does not implicitly {@link perfetto.protos.ChromeEvents.verify|verify} messages.
             * @function encode
             * @memberof perfetto.protos.ChromeEvents
             * @static
             * @param {perfetto.protos.IChromeEvents} message ChromeEvents message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ChromeEvents.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.events != null && message.events.length)
                    for (var i = 0; i < message.events.length; ++i)
                        $root.perfetto.protos.ChromeEvent.encode(message.events[i], writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                return writer;
            };

            /**
             * Encodes the specified ChromeEvents message, length delimited. Does not implicitly {@link perfetto.protos.ChromeEvents.verify|verify} messages.
             * @function encodeDelimited
             * @memberof perfetto.protos.ChromeEvents
             * @static
             * @param {perfetto.protos.IChromeEvents} message ChromeEvents message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ChromeEvents.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a ChromeEvents message from the specified reader or buffer.
             * @function decode
             * @memberof perfetto.protos.ChromeEvents
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {perfetto.protos.ChromeEvents} ChromeEvents
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ChromeEvents.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.perfetto.protos.ChromeEvents();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        if (!(message.events && message.events.length))
                            message.events = [];
                        message.events.push($root.perfetto.protos.ChromeEvent.decode(reader, reader.uint32()));
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a ChromeEvents message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof perfetto.protos.ChromeEvents
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {perfetto.protos.ChromeEvents} ChromeEvents
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ChromeEvents.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a ChromeEvents message.
             * @function verify
             * @memberof perfetto.protos.ChromeEvents
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            ChromeEvents.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.events != null && message.hasOwnProperty("events")) {
                    if (!Array.isArray(message.events))
                        return "events: array expected";
                    for (var i = 0; i < message.events.length; ++i) {
                        var error = $root.perfetto.protos.ChromeEvent.verify(message.events[i]);
                        if (error)
                            return "events." + error;
                    }
                }
                return null;
            };

            /**
             * Creates a ChromeEvents message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof perfetto.protos.ChromeEvents
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {perfetto.protos.ChromeEvents} ChromeEvents
             */
            ChromeEvents.fromObject = function fromObject(object) {
                if (object instanceof $root.perfetto.protos.ChromeEvents)
                    return object;
                var message = new $root.perfetto.protos.ChromeEvents();
                if (object.events) {
                    if (!Array.isArray(object.events))
                        throw TypeError(".perfetto.protos.ChromeEvents.events: array expected");
                    message.events = [];
                    for (var i = 0; i < object.events.length; ++i) {
                        if (typeof object.events[i] !== "object")
                            throw TypeError(".perfetto.protos.ChromeEvents.events: object expected");
                        message.events[i] = $root.perfetto.protos.ChromeEvent.fromObject(object.events[i]);
                    }
                }
                return message;
            };

            /**
             * Creates a plain object from a ChromeEvents message. Also converts values to other types if specified.
             * @function toObject
             * @memberof perfetto.protos.ChromeEvents
             * @static
             * @param {perfetto.protos.ChromeEvents} message ChromeEvents
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            ChromeEvents.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.arrays || options.defaults)
                    object.events = [];
                if (message.events && message.events.length) {
                    object.events = [];
                    for (var j = 0; j < message.events.length; ++j)
                        object.events[j] = $root.perfetto.protos.ChromeEvent.toObject(message.events[j], options);
                }
                return object;
            };

            /**
             * Converts this ChromeEvents to JSON.
             * @function toJSON
             * @memberof perfetto.protos.ChromeEvents
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            ChromeEvents.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return ChromeEvents;
        })();

        protos.ChromeEvent = (function() {

            /**
             * Properties of a ChromeEvent.
             * @memberof perfetto.protos
             * @interface IChromeEvent
             * @property {string|null} [name] ChromeEvent name
             * @property {string|null} [category] ChromeEvent category
             * @property {string|null} [phase] ChromeEvent phase
             * @property {number|Long|null} [timestamp] ChromeEvent timestamp
             * @property {number|Long|null} [duration] ChromeEvent duration
             * @property {number|null} [pid] ChromeEvent pid
             * @property {number|null} [tid] ChromeEvent tid
             */

            /**
             * Constructs a new ChromeEvent.
             * @memberof perfetto.protos
             * @classdesc Represents a ChromeEvent.
             * @implements IChromeEvent
             * @constructor
             * @param {perfetto.protos.IChromeEvent=} [properties] Properties to set
             */
            function ChromeEvent(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * ChromeEvent name.
             * @member {string} name
             * @memberof perfetto.protos.ChromeEvent
             * @instance
             */
            ChromeEvent.prototype.name = "";

            /**
             * ChromeEvent category.
             * @member {string} category
             * @memberof perfetto.protos.ChromeEvent
             * @instance
             */
            ChromeEvent.prototype.category = "";

            /**
             * ChromeEvent phase.
             * @member {string} phase
             * @memberof perfetto.protos.ChromeEvent
             * @instance
             */
            ChromeEvent.prototype.phase = "";

            /**
             * ChromeEvent timestamp.
             * @member {number|Long} timestamp
             * @memberof perfetto.protos.ChromeEvent
             * @instance
             */
            ChromeEvent.prototype.timestamp = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

            /**
             * ChromeEvent duration.
             * @member {number|Long} duration
             * @memberof perfetto.protos.ChromeEvent
             * @instance
             */
            ChromeEvent.prototype.duration = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

            /**
             * ChromeEvent pid.
             * @member {number} pid
             * @memberof perfetto.protos.ChromeEvent
             * @instance
             */
            ChromeEvent.prototype.pid = 0;

            /**
             * ChromeEvent tid.
             * @member {number} tid
             * @memberof perfetto.protos.ChromeEvent
             * @instance
             */
            ChromeEvent.prototype.tid = 0;

            /**
             * Creates a new ChromeEvent instance using the specified properties.
             * @function create
             * @memberof perfetto.protos.ChromeEvent
             * @static
             * @param {perfetto.protos.IChromeEvent=} [properties] Properties to set
             * @returns {perfetto.protos.ChromeEvent} ChromeEvent instance
             */
            ChromeEvent.create = function create(properties) {
                return new ChromeEvent(properties);
            };

            /**
             * Encodes the specified ChromeEvent message. Does not implicitly {@link perfetto.protos.ChromeEvent.verify|verify} messages.
             * @function encode
             * @memberof perfetto.protos.ChromeEvent
             * @static
             * @param {perfetto.protos.IChromeEvent} message ChromeEvent message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ChromeEvent.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.name != null && message.hasOwnProperty("name"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.name);
                if (message.category != null && message.hasOwnProperty("category"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.category);
                if (message.phase != null && message.hasOwnProperty("phase"))
                    writer.uint32(/* id 3, wireType 2 =*/26).string(message.phase);
                if (message.timestamp != null && message.hasOwnProperty("timestamp"))
                    writer.uint32(/* id 4, wireType 0 =*/32).uint64(message.timestamp);
                if (message.duration != null && message.hasOwnProperty("duration"))
                    writer.uint32(/* id 5, wireType 0 =*/40).uint64(message.duration);
                if (message.pid != null && message.hasOwnProperty("pid"))
                    writer.uint32(/* id 6, wireType 0 =*/48).uint32(message.pid);
                if (message.tid != null && message.hasOwnProperty("tid"))
                    writer.uint32(/* id 7, wireType 0 =*/56).uint32(message.tid);
                return writer;
            };

            /**
             * Encodes the specified ChromeEvent message, length delimited. Does not implicitly {@link perfetto.protos.ChromeEvent.verify|verify} messages.
             * @function encodeDelimited
             * @memberof perfetto.protos.ChromeEvent
             * @static
             * @param {perfetto.protos.IChromeEvent} message ChromeEvent message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ChromeEvent.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a ChromeEvent message from the specified reader or buffer.
             * @function decode
             * @memberof perfetto.protos.ChromeEvent
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {perfetto.protos.ChromeEvent} ChromeEvent
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ChromeEvent.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.perfetto.protos.ChromeEvent();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.name = reader.string();
                        break;
                    case 2:
                        message.category = reader.string();
                        break;
                    case 3:
                        message.phase = reader.string();
                        break;
                    case 4:
                        message.timestamp = reader.uint64();
                        break;
                    case 5:
                        message.duration = reader.uint64();
                        break;
                    case 6:
                        message.pid = reader.uint32();
                        break;
                    case 7:
                        message.tid = reader.uint32();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a ChromeEvent message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof perfetto.protos.ChromeEvent
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {perfetto.protos.ChromeEvent} ChromeEvent
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ChromeEvent.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a ChromeEvent message.
             * @function verify
             * @memberof perfetto.protos.ChromeEvent
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            ChromeEvent.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.name != null && message.hasOwnProperty("name"))
                    if (!$util.isString(message.name))
                        return "name: string expected";
                if (message.category != null && message.hasOwnProperty("category"))
                    if (!$util.isString(message.category))
                        return "category: string expected";
                if (message.phase != null && message.hasOwnProperty("phase"))
                    if (!$util.isString(message.phase))
                        return "phase: string expected";
                if (message.timestamp != null && message.hasOwnProperty("timestamp"))
                    if (!$util.isInteger(message.timestamp) && !(message.timestamp && $util.isInteger(message.timestamp.low) && $util.isInteger(message.timestamp.high)))
                        return "timestamp: integer|Long expected";
                if (message.duration != null && message.hasOwnProperty("duration"))
                    if (!$util.isInteger(message.duration) && !(message.duration && $util.isInteger(message.duration.low) && $util.isInteger(message.duration.high)))
                        return "duration: integer|Long expected";
                if (message.pid != null && message.hasOwnProperty("pid"))
                    if (!$util.isInteger(message.pid))
                        return "pid: integer expected";
                if (message.tid != null && message.hasOwnProperty("tid"))
                    if (!$util.isInteger(message.tid))
                        return "tid: integer expected";
                return null;
            };

            /**
             * Creates a ChromeEvent message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof perfetto.protos.ChromeEvent
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {perfetto.protos.ChromeEvent} ChromeEvent
             */
            ChromeEvent.fromObject = function fromObject(object) {
                if (object instanceof $root.perfetto.protos.ChromeEvent)
                    return object;
                var message = new $root.perfetto.protos.ChromeEvent();
                if (object.name != null)
                    message.name = String(object.name);
                if (object.category != null)
                    message.category = String(object.category);
                if (object.phase != null)
                    message.phase = String(object.phase);
                if (object.timestamp != null)
                    if ($util.Long)
                        (message.timestamp = $util.Long.fromValue(object.timestamp)).unsigned = true;
                    else if (typeof object.timestamp === "string")
                        message.timestamp = parseInt(object.timestamp, 10);
                    else if (typeof object.timestamp === "number")
                        message.timestamp = object.timestamp;
                    else if (typeof object.timestamp === "object")
                        message.timestamp = new $util.LongBits(object.timestamp.low >>> 0, object.timestamp.high >>> 0).toNumber(true);
                if (object.duration != null)
                    if ($util.Long)
                        (message.duration = $util.Long.fromValue(object.duration)).unsigned = true;
                    else if (typeof object.duration === "string")
                        message.duration = parseInt(object.duration, 10);
                    else if (typeof object.duration === "number")
                        message.duration = object.duration;
                    else if (typeof object.duration === "object")
                        message.duration = new $util.LongBits(object.duration.low >>> 0, object.duration.high >>> 0).toNumber(true);
                if (object.pid != null)
                    message.pid = object.pid >>> 0;
                if (object.tid != null)
                    message.tid = object.tid >>> 0;
                return message;
            };

            /**
             * Creates a plain object from a ChromeEvent message. Also converts values to other types if specified.
             * @function toObject
             * @memberof perfetto.protos.ChromeEvent
             * @static
             * @param {perfetto.protos.ChromeEvent} message ChromeEvent
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            ChromeEvent.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults) {
                    object.name = "";
                    object.category = "";
                    object.phase = "";
                    if ($util.Long) {
                        var long = new $util.Long(0, 0, true);
                        object.timestamp = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                    } else
                        object.timestamp = options.longs === String ? "0" : 0;
                    if ($util.Long) {
                        var long = new $util.Long(0, 0, true);
                        object.duration = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                    } else
                        object.duration = options.longs === String ? "0" : 0;
                    object.pid = 0;
                    object.tid = 0;
                }
                if (message.name != null && message.hasOwnProperty("name"))
                    object.name = message.name;
                if (message.category != null && message.hasOwnProperty("category"))
                    object.category = message.category;
                if (message.phase != null && message.hasOwnProperty("phase"))
                    object.phase = message.phase;
                if (message.timestamp != null && message.hasOwnProperty("timestamp"))
                    if (typeof message.timestamp === "number")
                        object.timestamp = options.longs === String ? String(message.timestamp) : message.timestamp;
                    else
                        object.timestamp = options.longs === String ? $util.Long.prototype.toString.call(message.timestamp) : options.longs === Number ? new $util.LongBits(message.timestamp.low >>> 0, message.timestamp.high >>> 0).toNumber(true) : message.timestamp;
                if (message.duration != null && message.hasOwnProperty("duration"))
                    if (typeof message.duration === "number")
                        object.duration = options.longs === String ? String(message.duration) : message.duration;
                    else
                        object.duration = options.longs === String ? $util.Long.prototype.toString.call(message.duration) : options.longs === Number ? new $util.LongBits(message.duration.low >>> 0, message.duration.high >>> 0).toNumber(true) : message.duration;
                if (message.pid != null && message.hasOwnProperty("pid"))
                    object.pid = message.pid;
                if (message.tid != null && message.hasOwnProperty("tid"))
                    object.tid = message.tid;
                return object;
            };

            /**
             * Converts this ChromeEvent to JSON.
             * @function toJSON
             * @memberof perfetto.protos.ChromeEvent
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            ChromeEvent.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return ChromeEvent;
        })();

        protos.ClockSnapshot = (function() {

            /**
             * Properties of a ClockSnapshot.
             * @memberof perfetto.protos
             * @interface IClockSnapshot
             * @property {Array.<perfetto.protos.IClock>|null} [clocks] ClockSnapshot clocks
             */

            /**
             * Constructs a new ClockSnapshot.
             * @memberof perfetto.protos
             * @classdesc Represents a ClockSnapshot.
             * @implements IClockSnapshot
             * @constructor
             * @param {perfetto.protos.IClockSnapshot=} [properties] Properties to set
             */
            function ClockSnapshot(properties) {
                this.clocks = [];
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * ClockSnapshot clocks.
             * @member {Array.<perfetto.protos.IClock>} clocks
             * @memberof perfetto.protos.ClockSnapshot
             * @instance
             */
            ClockSnapshot.prototype.clocks = $util.emptyArray;

            /**
             * Creates a new ClockSnapshot instance using the specified properties.
             * @function create
             * @memberof perfetto.protos.ClockSnapshot
             * @static
             * @param {perfetto.protos.IClockSnapshot=} [properties] Properties to set
             * @returns {perfetto.protos.ClockSnapshot} ClockSnapshot instance
             */
            ClockSnapshot.create = function create(properties) {
                return new ClockSnapshot(properties);
            };

            /**
             * Encodes the specified ClockSnapshot message. Does not implicitly {@link perfetto.protos.ClockSnapshot.verify|verify} messages.
             * @function encode
             * @memberof perfetto.protos.ClockSnapshot
             * @static
             * @param {perfetto.protos.IClockSnapshot} message ClockSnapshot message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ClockSnapshot.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.clocks != null && message.clocks.length)
                    for (var i = 0; i < message.clocks.length; ++i)
                        $root.perfetto.protos.Clock.encode(message.clocks[i], writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                return writer;
            };

            /**
             * Encodes the specified ClockSnapshot message, length delimited. Does not implicitly {@link perfetto.protos.ClockSnapshot.verify|verify} messages.
             * @function encodeDelimited
             * @memberof perfetto.protos.ClockSnapshot
             * @static
             * @param {perfetto.protos.IClockSnapshot} message ClockSnapshot message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ClockSnapshot.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a ClockSnapshot message from the specified reader or buffer.
             * @function decode
             * @memberof perfetto.protos.ClockSnapshot
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {perfetto.protos.ClockSnapshot} ClockSnapshot
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ClockSnapshot.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.perfetto.protos.ClockSnapshot();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        if (!(message.clocks && message.clocks.length))
                            message.clocks = [];
                        message.clocks.push($root.perfetto.protos.Clock.decode(reader, reader.uint32()));
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a ClockSnapshot message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof perfetto.protos.ClockSnapshot
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {perfetto.protos.ClockSnapshot} ClockSnapshot
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ClockSnapshot.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a ClockSnapshot message.
             * @function verify
             * @memberof perfetto.protos.ClockSnapshot
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            ClockSnapshot.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.clocks != null && message.hasOwnProperty("clocks")) {
                    if (!Array.isArray(message.clocks))
                        return "clocks: array expected";
                    for (var i = 0; i < message.clocks.length; ++i) {
                        var error = $root.perfetto.protos.Clock.verify(message.clocks[i]);
                        if (error)
                            return "clocks." + error;
                    }
                }
                return null;
            };

            /**
             * Creates a ClockSnapshot message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof perfetto.protos.ClockSnapshot
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {perfetto.protos.ClockSnapshot} ClockSnapshot
             */
            ClockSnapshot.fromObject = function fromObject(object) {
                if (object instanceof $root.perfetto.protos.ClockSnapshot)
                    return object;
                var message = new $root.perfetto.protos.ClockSnapshot();
                if (object.clocks) {
                    if (!Array.isArray(object.clocks))
                        throw TypeError(".perfetto.protos.ClockSnapshot.clocks: array expected");
                    message.clocks = [];
                    for (var i = 0; i < object.clocks.length; ++i) {
                        if (typeof object.clocks[i] !== "object")
                            throw TypeError(".perfetto.protos.ClockSnapshot.clocks: object expected");
                        message.clocks[i] = $root.perfetto.protos.Clock.fromObject(object.clocks[i]);
                    }
                }
                return message;
            };

            /**
             * Creates a plain object from a ClockSnapshot message. Also converts values to other types if specified.
             * @function toObject
             * @memberof perfetto.protos.ClockSnapshot
             * @static
             * @param {perfetto.protos.ClockSnapshot} message ClockSnapshot
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            ClockSnapshot.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.arrays || options.defaults)
                    object.clocks = [];
                if (message.clocks && message.clocks.length) {
                    object.clocks = [];
                    for (var j = 0; j < message.clocks.length; ++j)
                        object.clocks[j] = $root.perfetto.protos.Clock.toObject(message.clocks[j], options);
                }
                return object;
            };

            /**
             * Converts this ClockSnapshot to JSON.
             * @function toJSON
             * @memberof perfetto.protos.ClockSnapshot
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            ClockSnapshot.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return ClockSnapshot;
        })();

        protos.Clock = (function() {

            /**
             * Properties of a Clock.
             * @memberof perfetto.protos
             * @interface IClock
             * @property {number|null} [clockId] Clock clockId
             * @property {number|Long|null} [timestamp] Clock timestamp
             */

            /**
             * Constructs a new Clock.
             * @memberof perfetto.protos
             * @classdesc Represents a Clock.
             * @implements IClock
             * @constructor
             * @param {perfetto.protos.IClock=} [properties] Properties to set
             */
            function Clock(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Clock clockId.
             * @member {number} clockId
             * @memberof perfetto.protos.Clock
             * @instance
             */
            Clock.prototype.clockId = 0;

            /**
             * Clock timestamp.
             * @member {number|Long} timestamp
             * @memberof perfetto.protos.Clock
             * @instance
             */
            Clock.prototype.timestamp = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

            /**
             * Creates a new Clock instance using the specified properties.
             * @function create
             * @memberof perfetto.protos.Clock
             * @static
             * @param {perfetto.protos.IClock=} [properties] Properties to set
             * @returns {perfetto.protos.Clock} Clock instance
             */
            Clock.create = function create(properties) {
                return new Clock(properties);
            };

            /**
             * Encodes the specified Clock message. Does not implicitly {@link perfetto.protos.Clock.verify|verify} messages.
             * @function encode
             * @memberof perfetto.protos.Clock
             * @static
             * @param {perfetto.protos.IClock} message Clock message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Clock.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.clockId != null && message.hasOwnProperty("clockId"))
                    writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.clockId);
                if (message.timestamp != null && message.hasOwnProperty("timestamp"))
                    writer.uint32(/* id 2, wireType 0 =*/16).uint64(message.timestamp);
                return writer;
            };

            /**
             * Encodes the specified Clock message, length delimited. Does not implicitly {@link perfetto.protos.Clock.verify|verify} messages.
             * @function encodeDelimited
             * @memberof perfetto.protos.Clock
             * @static
             * @param {perfetto.protos.IClock} message Clock message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Clock.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a Clock message from the specified reader or buffer.
             * @function decode
             * @memberof perfetto.protos.Clock
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {perfetto.protos.Clock} Clock
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Clock.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.perfetto.protos.Clock();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.clockId = reader.uint32();
                        break;
                    case 2:
                        message.timestamp = reader.uint64();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a Clock message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof perfetto.protos.Clock
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {perfetto.protos.Clock} Clock
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Clock.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a Clock message.
             * @function verify
             * @memberof perfetto.protos.Clock
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            Clock.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.clockId != null && message.hasOwnProperty("clockId"))
                    if (!$util.isInteger(message.clockId))
                        return "clockId: integer expected";
                if (message.timestamp != null && message.hasOwnProperty("timestamp"))
                    if (!$util.isInteger(message.timestamp) && !(message.timestamp && $util.isInteger(message.timestamp.low) && $util.isInteger(message.timestamp.high)))
                        return "timestamp: integer|Long expected";
                return null;
            };

            /**
             * Creates a Clock message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof perfetto.protos.Clock
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {perfetto.protos.Clock} Clock
             */
            Clock.fromObject = function fromObject(object) {
                if (object instanceof $root.perfetto.protos.Clock)
                    return object;
                var message = new $root.perfetto.protos.Clock();
                if (object.clockId != null)
                    message.clockId = object.clockId >>> 0;
                if (object.timestamp != null)
                    if ($util.Long)
                        (message.timestamp = $util.Long.fromValue(object.timestamp)).unsigned = true;
                    else if (typeof object.timestamp === "string")
                        message.timestamp = parseInt(object.timestamp, 10);
                    else if (typeof object.timestamp === "number")
                        message.timestamp = object.timestamp;
                    else if (typeof object.timestamp === "object")
                        message.timestamp = new $util.LongBits(object.timestamp.low >>> 0, object.timestamp.high >>> 0).toNumber(true);
                return message;
            };

            /**
             * Creates a plain object from a Clock message. Also converts values to other types if specified.
             * @function toObject
             * @memberof perfetto.protos.Clock
             * @static
             * @param {perfetto.protos.Clock} message Clock
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            Clock.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults) {
                    object.clockId = 0;
                    if ($util.Long) {
                        var long = new $util.Long(0, 0, true);
                        object.timestamp = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                    } else
                        object.timestamp = options.longs === String ? "0" : 0;
                }
                if (message.clockId != null && message.hasOwnProperty("clockId"))
                    object.clockId = message.clockId;
                if (message.timestamp != null && message.hasOwnProperty("timestamp"))
                    if (typeof message.timestamp === "number")
                        object.timestamp = options.longs === String ? String(message.timestamp) : message.timestamp;
                    else
                        object.timestamp = options.longs === String ? $util.Long.prototype.toString.call(message.timestamp) : options.longs === Number ? new $util.LongBits(message.timestamp.low >>> 0, message.timestamp.high >>> 0).toNumber(true) : message.timestamp;
                return object;
            };

            /**
             * Converts this Clock to JSON.
             * @function toJSON
             * @memberof perfetto.protos.Clock
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            Clock.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return Clock;
        })();

        protos.FtraceEvents = (function() {

            /**
             * Properties of a FtraceEvents.
             * @memberof perfetto.protos
             * @interface IFtraceEvents
             * @property {number|null} [cpu] FtraceEvents cpu
             * @property {Array.<perfetto.protos.IFtraceEvent>|null} [event] FtraceEvents event
             */

            /**
             * Constructs a new FtraceEvents.
             * @memberof perfetto.protos
             * @classdesc Represents a FtraceEvents.
             * @implements IFtraceEvents
             * @constructor
             * @param {perfetto.protos.IFtraceEvents=} [properties] Properties to set
             */
            function FtraceEvents(properties) {
                this.event = [];
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * FtraceEvents cpu.
             * @member {number} cpu
             * @memberof perfetto.protos.FtraceEvents
             * @instance
             */
            FtraceEvents.prototype.cpu = 0;

            /**
             * FtraceEvents event.
             * @member {Array.<perfetto.protos.IFtraceEvent>} event
             * @memberof perfetto.protos.FtraceEvents
             * @instance
             */
            FtraceEvents.prototype.event = $util.emptyArray;

            /**
             * Creates a new FtraceEvents instance using the specified properties.
             * @function create
             * @memberof perfetto.protos.FtraceEvents
             * @static
             * @param {perfetto.protos.IFtraceEvents=} [properties] Properties to set
             * @returns {perfetto.protos.FtraceEvents} FtraceEvents instance
             */
            FtraceEvents.create = function create(properties) {
                return new FtraceEvents(properties);
            };

            /**
             * Encodes the specified FtraceEvents message. Does not implicitly {@link perfetto.protos.FtraceEvents.verify|verify} messages.
             * @function encode
             * @memberof perfetto.protos.FtraceEvents
             * @static
             * @param {perfetto.protos.IFtraceEvents} message FtraceEvents message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            FtraceEvents.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.cpu != null && message.hasOwnProperty("cpu"))
                    writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.cpu);
                if (message.event != null && message.event.length)
                    for (var i = 0; i < message.event.length; ++i)
                        $root.perfetto.protos.FtraceEvent.encode(message.event[i], writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
                return writer;
            };

            /**
             * Encodes the specified FtraceEvents message, length delimited. Does not implicitly {@link perfetto.protos.FtraceEvents.verify|verify} messages.
             * @function encodeDelimited
             * @memberof perfetto.protos.FtraceEvents
             * @static
             * @param {perfetto.protos.IFtraceEvents} message FtraceEvents message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            FtraceEvents.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a FtraceEvents message from the specified reader or buffer.
             * @function decode
             * @memberof perfetto.protos.FtraceEvents
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {perfetto.protos.FtraceEvents} FtraceEvents
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            FtraceEvents.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.perfetto.protos.FtraceEvents();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.cpu = reader.uint32();
                        break;
                    case 2:
                        if (!(message.event && message.event.length))
                            message.event = [];
                        message.event.push($root.perfetto.protos.FtraceEvent.decode(reader, reader.uint32()));
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a FtraceEvents message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof perfetto.protos.FtraceEvents
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {perfetto.protos.FtraceEvents} FtraceEvents
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            FtraceEvents.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a FtraceEvents message.
             * @function verify
             * @memberof perfetto.protos.FtraceEvents
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            FtraceEvents.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.cpu != null && message.hasOwnProperty("cpu"))
                    if (!$util.isInteger(message.cpu))
                        return "cpu: integer expected";
                if (message.event != null && message.hasOwnProperty("event")) {
                    if (!Array.isArray(message.event))
                        return "event: array expected";
                    for (var i = 0; i < message.event.length; ++i) {
                        var error = $root.perfetto.protos.FtraceEvent.verify(message.event[i]);
                        if (error)
                            return "event." + error;
                    }
                }
                return null;
            };

            /**
             * Creates a FtraceEvents message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof perfetto.protos.FtraceEvents
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {perfetto.protos.FtraceEvents} FtraceEvents
             */
            FtraceEvents.fromObject = function fromObject(object) {
                if (object instanceof $root.perfetto.protos.FtraceEvents)
                    return object;
                var message = new $root.perfetto.protos.FtraceEvents();
                if (object.cpu != null)
                    message.cpu = object.cpu >>> 0;
                if (object.event) {
                    if (!Array.isArray(object.event))
                        throw TypeError(".perfetto.protos.FtraceEvents.event: array expected");
                    message.event = [];
                    for (var i = 0; i < object.event.length; ++i) {
                        if (typeof object.event[i] !== "object")
                            throw TypeError(".perfetto.protos.FtraceEvents.event: object expected");
                        message.event[i] = $root.perfetto.protos.FtraceEvent.fromObject(object.event[i]);
                    }
                }
                return message;
            };

            /**
             * Creates a plain object from a FtraceEvents message. Also converts values to other types if specified.
             * @function toObject
             * @memberof perfetto.protos.FtraceEvents
             * @static
             * @param {perfetto.protos.FtraceEvents} message FtraceEvents
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            FtraceEvents.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.arrays || options.defaults)
                    object.event = [];
                if (options.defaults)
                    object.cpu = 0;
                if (message.cpu != null && message.hasOwnProperty("cpu"))
                    object.cpu = message.cpu;
                if (message.event && message.event.length) {
                    object.event = [];
                    for (var j = 0; j < message.event.length; ++j)
                        object.event[j] = $root.perfetto.protos.FtraceEvent.toObject(message.event[j], options);
                }
                return object;
            };

            /**
             * Converts this FtraceEvents to JSON.
             * @function toJSON
             * @memberof perfetto.protos.FtraceEvents
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            FtraceEvents.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return FtraceEvents;
        })();

        protos.FtraceEvent = (function() {

            /**
             * Properties of a FtraceEvent.
             * @memberof perfetto.protos
             * @interface IFtraceEvent
             * @property {number|Long|null} [timestamp] FtraceEvent timestamp
             * @property {number|null} [pid] FtraceEvent pid
             * @property {perfetto.protos.ISchedSwitchFtraceEvent|null} [schedSwitch] FtraceEvent schedSwitch
             * @property {perfetto.protos.ICpuIdleFtraceEvent|null} [cpuIdle] FtraceEvent cpuIdle
             */

            /**
             * Constructs a new FtraceEvent.
             * @memberof perfetto.protos
             * @classdesc Represents a FtraceEvent.
             * @implements IFtraceEvent
             * @constructor
             * @param {perfetto.protos.IFtraceEvent=} [properties] Properties to set
             */
            function FtraceEvent(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * FtraceEvent timestamp.
             * @member {number|Long} timestamp
             * @memberof perfetto.protos.FtraceEvent
             * @instance
             */
            FtraceEvent.prototype.timestamp = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

            /**
             * FtraceEvent pid.
             * @member {number} pid
             * @memberof perfetto.protos.FtraceEvent
             * @instance
             */
            FtraceEvent.prototype.pid = 0;

            /**
             * FtraceEvent schedSwitch.
             * @member {perfetto.protos.ISchedSwitchFtraceEvent|null|undefined} schedSwitch
             * @memberof perfetto.protos.FtraceEvent
             * @instance
             */
            FtraceEvent.prototype.schedSwitch = null;

            /**
             * FtraceEvent cpuIdle.
             * @member {perfetto.protos.ICpuIdleFtraceEvent|null|undefined} cpuIdle
             * @memberof perfetto.protos.FtraceEvent
             * @instance
             */
            FtraceEvent.prototype.cpuIdle = null;

            // OneOf field names bound to virtual getters and setters
            var $oneOfFields;

            /**
             * FtraceEvent event.
             * @member {"schedSwitch"|"cpuIdle"|undefined} event
             * @memberof perfetto.protos.FtraceEvent
             * @instance
             */
            Object.defineProperty(FtraceEvent.prototype, "event", {
                get: $util.oneOfGetter($oneOfFields = ["schedSwitch", "cpuIdle"]),
                set: $util.oneOfSetter($oneOfFields)
            });

            /**
             * Creates a new FtraceEvent instance using the specified properties.
             * @function create
             * @memberof perfetto.protos.FtraceEvent
             * @static
             * @param {perfetto.protos.IFtraceEvent=} [properties] Properties to set
             * @returns {perfetto.protos.FtraceEvent} FtraceEvent instance
             */
            FtraceEvent.create = function create(properties) {
                return new FtraceEvent(properties);
            };

            /**
             * Encodes the specified FtraceEvent message. Does not implicitly {@link perfetto.protos.FtraceEvent.verify|verify} messages.
             * @function encode
             * @memberof perfetto.protos.FtraceEvent
             * @static
             * @param {perfetto.protos.IFtraceEvent} message FtraceEvent message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            FtraceEvent.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.timestamp != null && message.hasOwnProperty("timestamp"))
                    writer.uint32(/* id 1, wireType 0 =*/8).uint64(message.timestamp);
                if (message.pid != null && message.hasOwnProperty("pid"))
                    writer.uint32(/* id 2, wireType 0 =*/16).uint32(message.pid);
                if (message.schedSwitch != null && message.hasOwnProperty("schedSwitch"))
                    $root.perfetto.protos.SchedSwitchFtraceEvent.encode(message.schedSwitch, writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
                if (message.cpuIdle != null && message.hasOwnProperty("cpuIdle"))
                    $root.perfetto.protos.CpuIdleFtraceEvent.encode(message.cpuIdle, writer.uint32(/* id 4, wireType 2 =*/34).fork()).ldelim();
                return writer;
            };

            /**
             * Encodes the specified FtraceEvent message, length delimited. Does not implicitly {@link perfetto.protos.FtraceEvent.verify|verify} messages.
             * @function encodeDelimited
             * @memberof perfetto.protos.FtraceEvent
             * @static
             * @param {perfetto.protos.IFtraceEvent} message FtraceEvent message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            FtraceEvent.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a FtraceEvent message from the specified reader or buffer.
             * @function decode
             * @memberof perfetto.protos.FtraceEvent
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {perfetto.protos.FtraceEvent} FtraceEvent
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            FtraceEvent.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.perfetto.protos.FtraceEvent();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.timestamp = reader.uint64();
                        break;
                    case 2:
                        message.pid = reader.uint32();
                        break;
                    case 3:
                        message.schedSwitch = $root.perfetto.protos.SchedSwitchFtraceEvent.decode(reader, reader.uint32());
                        break;
                    case 4:
                        message.cpuIdle = $root.perfetto.protos.CpuIdleFtraceEvent.decode(reader, reader.uint32());
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a FtraceEvent message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof perfetto.protos.FtraceEvent
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {perfetto.protos.FtraceEvent} FtraceEvent
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            FtraceEvent.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a FtraceEvent message.
             * @function verify
             * @memberof perfetto.protos.FtraceEvent
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            FtraceEvent.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                var properties = {};
                if (message.timestamp != null && message.hasOwnProperty("timestamp"))
                    if (!$util.isInteger(message.timestamp) && !(message.timestamp && $util.isInteger(message.timestamp.low) && $util.isInteger(message.timestamp.high)))
                        return "timestamp: integer|Long expected";
                if (message.pid != null && message.hasOwnProperty("pid"))
                    if (!$util.isInteger(message.pid))
                        return "pid: integer expected";
                if (message.schedSwitch != null && message.hasOwnProperty("schedSwitch")) {
                    properties.event = 1;
                    {
                        var error = $root.perfetto.protos.SchedSwitchFtraceEvent.verify(message.schedSwitch);
                        if (error)
                            return "schedSwitch." + error;
                    }
                }
                if (message.cpuIdle != null && message.hasOwnProperty("cpuIdle")) {
                    if (properties.event === 1)
                        return "event: multiple values";
                    properties.event = 1;
                    {
                        var error = $root.perfetto.protos.CpuIdleFtraceEvent.verify(message.cpuIdle);
                        if (error)
                            return "cpuIdle." + error;
                    }
                }
                return null;
            };

            /**
             * Creates a FtraceEvent message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof perfetto.protos.FtraceEvent
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {perfetto.protos.FtraceEvent} FtraceEvent
             */
            FtraceEvent.fromObject = function fromObject(object) {
                if (object instanceof $root.perfetto.protos.FtraceEvent)
                    return object;
                var message = new $root.perfetto.protos.FtraceEvent();
                if (object.timestamp != null)
                    if ($util.Long)
                        (message.timestamp = $util.Long.fromValue(object.timestamp)).unsigned = true;
                    else if (typeof object.timestamp === "string")
                        message.timestamp = parseInt(object.timestamp, 10);
                    else if (typeof object.timestamp === "number")
                        message.timestamp = object.timestamp;
                    else if (typeof object.timestamp === "object")
                        message.timestamp = new $util.LongBits(object.timestamp.low >>> 0, object.timestamp.high >>> 0).toNumber(true);
                if (object.pid != null)
                    message.pid = object.pid >>> 0;
                if (object.schedSwitch != null) {
                    if (typeof object.schedSwitch !== "object")
                        throw TypeError(".perfetto.protos.FtraceEvent.schedSwitch: object expected");
                    message.schedSwitch = $root.perfetto.protos.SchedSwitchFtraceEvent.fromObject(object.schedSwitch);
                }
                if (object.cpuIdle != null) {
                    if (typeof object.cpuIdle !== "object")
                        throw TypeError(".perfetto.protos.FtraceEvent.cpuIdle: object expected");
                    message.cpuIdle = $root.perfetto.protos.CpuIdleFtraceEvent.fromObject(object.cpuIdle);
                }
                return message;
            };

            /**
             * Creates a plain object from a FtraceEvent message. Also converts values to other types if specified.
             * @function toObject
             * @memberof perfetto.protos.FtraceEvent
             * @static
             * @param {perfetto.protos.FtraceEvent} message FtraceEvent
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            FtraceEvent.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults) {
                    if ($util.Long) {
                        var long = new $util.Long(0, 0, true);
                        object.timestamp = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                    } else
                        object.timestamp = options.longs === String ? "0" : 0;
                    object.pid = 0;
                }
                if (message.timestamp != null && message.hasOwnProperty("timestamp"))
                    if (typeof message.timestamp === "number")
                        object.timestamp = options.longs === String ? String(message.timestamp) : message.timestamp;
                    else
                        object.timestamp = options.longs === String ? $util.Long.prototype.toString.call(message.timestamp) : options.longs === Number ? new $util.LongBits(message.timestamp.low >>> 0, message.timestamp.high >>> 0).toNumber(true) : message.timestamp;
                if (message.pid != null && message.hasOwnProperty("pid"))
                    object.pid = message.pid;
                if (message.schedSwitch != null && message.hasOwnProperty("schedSwitch")) {
                    object.schedSwitch = $root.perfetto.protos.SchedSwitchFtraceEvent.toObject(message.schedSwitch, options);
                    if (options.oneofs)
                        object.event = "schedSwitch";
                }
                if (message.cpuIdle != null && message.hasOwnProperty("cpuIdle")) {
                    object.cpuIdle = $root.perfetto.protos.CpuIdleFtraceEvent.toObject(message.cpuIdle, options);
                    if (options.oneofs)
                        object.event = "cpuIdle";
                }
                return object;
            };

            /**
             * Converts this FtraceEvent to JSON.
             * @function toJSON
             * @memberof perfetto.protos.FtraceEvent
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            FtraceEvent.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return FtraceEvent;
        })();

        protos.SchedSwitchFtraceEvent = (function() {

            /**
             * Properties of a SchedSwitchFtraceEvent.
             * @memberof perfetto.protos
             * @interface ISchedSwitchFtraceEvent
             * @property {string|null} [prevComm] SchedSwitchFtraceEvent prevComm
             * @property {number|null} [prevPid] SchedSwitchFtraceEvent prevPid
             * @property {number|null} [prevPrio] SchedSwitchFtraceEvent prevPrio
             * @property {number|Long|null} [prevState] SchedSwitchFtraceEvent prevState
             * @property {string|null} [nextComm] SchedSwitchFtraceEvent nextComm
             * @property {number|null} [nextPid] SchedSwitchFtraceEvent nextPid
             * @property {number|null} [nextPrio] SchedSwitchFtraceEvent nextPrio
             */

            /**
             * Constructs a new SchedSwitchFtraceEvent.
             * @memberof perfetto.protos
             * @classdesc Represents a SchedSwitchFtraceEvent.
             * @implements ISchedSwitchFtraceEvent
             * @constructor
             * @param {perfetto.protos.ISchedSwitchFtraceEvent=} [properties] Properties to set
             */
            function SchedSwitchFtraceEvent(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * SchedSwitchFtraceEvent prevComm.
             * @member {string} prevComm
             * @memberof perfetto.protos.SchedSwitchFtraceEvent
             * @instance
             */
            SchedSwitchFtraceEvent.prototype.prevComm = "";

            /**
             * SchedSwitchFtraceEvent prevPid.
             * @member {number} prevPid
             * @memberof perfetto.protos.SchedSwitchFtraceEvent
             * @instance
             */
            SchedSwitchFtraceEvent.prototype.prevPid = 0;

            /**
             * SchedSwitchFtraceEvent prevPrio.
             * @member {number} prevPrio
             * @memberof perfetto.protos.SchedSwitchFtraceEvent
             * @instance
             */
            SchedSwitchFtraceEvent.prototype.prevPrio = 0;

            /**
             * SchedSwitchFtraceEvent prevState.
             * @member {number|Long} prevState
             * @memberof perfetto.protos.SchedSwitchFtraceEvent
             * @instance
             */
            SchedSwitchFtraceEvent.prototype.prevState = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

            /**
             * SchedSwitchFtraceEvent nextComm.
             * @member {string} nextComm
             * @memberof perfetto.protos.SchedSwitchFtraceEvent
             * @instance
             */
            SchedSwitchFtraceEvent.prototype.nextComm = "";

            /**
             * SchedSwitchFtraceEvent nextPid.
             * @member {number} nextPid
             * @memberof perfetto.protos.SchedSwitchFtraceEvent
             * @instance
             */
            SchedSwitchFtraceEvent.prototype.nextPid = 0;

            /**
             * SchedSwitchFtraceEvent nextPrio.
             * @member {number} nextPrio
             * @memberof perfetto.protos.SchedSwitchFtraceEvent
             * @instance
             */
            SchedSwitchFtraceEvent.prototype.nextPrio = 0;

            /**
             * Creates a new SchedSwitchFtraceEvent instance using the specified properties.
             * @function create
             * @memberof perfetto.protos.SchedSwitchFtraceEvent
             * @static
             * @param {perfetto.protos.ISchedSwitchFtraceEvent=} [properties] Properties to set
             * @returns {perfetto.protos.SchedSwitchFtraceEvent} SchedSwitchFtraceEvent instance
             */
            SchedSwitchFtraceEvent.create = function create(properties) {
                return new SchedSwitchFtraceEvent(properties);
            };

            /**
             * Encodes the specified SchedSwitchFtraceEvent message. Does not implicitly {@link perfetto.protos.SchedSwitchFtraceEvent.verify|verify} messages.
             * @function encode
             * @memberof perfetto.protos.SchedSwitchFtraceEvent
             * @static
             * @param {perfetto.protos.ISchedSwitchFtraceEvent} message SchedSwitchFtraceEvent message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            SchedSwitchFtraceEvent.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.prevComm != null && message.hasOwnProperty("prevComm"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.prevComm);
                if (message.prevPid != null && message.hasOwnProperty("prevPid"))
                    writer.uint32(/* id 2, wireType 0 =*/16).int32(message.prevPid);
                if (message.prevPrio != null && message.hasOwnProperty("prevPrio"))
                    writer.uint32(/* id 3, wireType 0 =*/24).int32(message.prevPrio);
                if (message.prevState != null && message.hasOwnProperty("prevState"))
                    writer.uint32(/* id 4, wireType 0 =*/32).int64(message.prevState);
                if (message.nextComm != null && message.hasOwnProperty("nextComm"))
                    writer.uint32(/* id 5, wireType 2 =*/42).string(message.nextComm);
                if (message.nextPid != null && message.hasOwnProperty("nextPid"))
                    writer.uint32(/* id 6, wireType 0 =*/48).int32(message.nextPid);
                if (message.nextPrio != null && message.hasOwnProperty("nextPrio"))
                    writer.uint32(/* id 7, wireType 0 =*/56).int32(message.nextPrio);
                return writer;
            };

            /**
             * Encodes the specified SchedSwitchFtraceEvent message, length delimited. Does not implicitly {@link perfetto.protos.SchedSwitchFtraceEvent.verify|verify} messages.
             * @function encodeDelimited
             * @memberof perfetto.protos.SchedSwitchFtraceEvent
             * @static
             * @param {perfetto.protos.ISchedSwitchFtraceEvent} message SchedSwitchFtraceEvent message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            SchedSwitchFtraceEvent.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a SchedSwitchFtraceEvent message from the specified reader or buffer.
             * @function decode
             * @memberof perfetto.protos.SchedSwitchFtraceEvent
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {perfetto.protos.SchedSwitchFtraceEvent} SchedSwitchFtraceEvent
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            SchedSwitchFtraceEvent.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.perfetto.protos.SchedSwitchFtraceEvent();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.prevComm = reader.string();
                        break;
                    case 2:
                        message.prevPid = reader.int32();
                        break;
                    case 3:
                        message.prevPrio = reader.int32();
                        break;
                    case 4:
                        message.prevState = reader.int64();
                        break;
                    case 5:
                        message.nextComm = reader.string();
                        break;
                    case 6:
                        message.nextPid = reader.int32();
                        break;
                    case 7:
                        message.nextPrio = reader.int32();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a SchedSwitchFtraceEvent message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof perfetto.protos.SchedSwitchFtraceEvent
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {perfetto.protos.SchedSwitchFtraceEvent} SchedSwitchFtraceEvent
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            SchedSwitchFtraceEvent.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a SchedSwitchFtraceEvent message.
             * @function verify
             * @memberof perfetto.protos.SchedSwitchFtraceEvent
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            SchedSwitchFtraceEvent.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.prevComm != null && message.hasOwnProperty("prevComm"))
                    if (!$util.isString(message.prevComm))
                        return "prevComm: string expected";
                if (message.prevPid != null && message.hasOwnProperty("prevPid"))
                    if (!$util.isInteger(message.prevPid))
                        return "prevPid: integer expected";
                if (message.prevPrio != null && message.hasOwnProperty("prevPrio"))
                    if (!$util.isInteger(message.prevPrio))
                        return "prevPrio: integer expected";
                if (message.prevState != null && message.hasOwnProperty("prevState"))
                    if (!$util.isInteger(message.prevState) && !(message.prevState && $util.isInteger(message.prevState.low) && $util.isInteger(message.prevState.high)))
                        return "prevState: integer|Long expected";
                if (message.nextComm != null && message.hasOwnProperty("nextComm"))
                    if (!$util.isString(message.nextComm))
                        return "nextComm: string expected";
                if (message.nextPid != null && message.hasOwnProperty("nextPid"))
                    if (!$util.isInteger(message.nextPid))
                        return "nextPid: integer expected";
                if (message.nextPrio != null && message.hasOwnProperty("nextPrio"))
                    if (!$util.isInteger(message.nextPrio))
                        return "nextPrio: integer expected";
                return null;
            };

            /**
             * Creates a SchedSwitchFtraceEvent message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof perfetto.protos.SchedSwitchFtraceEvent
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {perfetto.protos.SchedSwitchFtraceEvent} SchedSwitchFtraceEvent
             */
            SchedSwitchFtraceEvent.fromObject = function fromObject(object) {
                if (object instanceof $root.perfetto.protos.SchedSwitchFtraceEvent)
                    return object;
                var message = new $root.perfetto.protos.SchedSwitchFtraceEvent();
                if (object.prevComm != null)
                    message.prevComm = String(object.prevComm);
                if (object.prevPid != null)
                    message.prevPid = object.prevPid | 0;
                if (object.prevPrio != null)
                    message.prevPrio = object.prevPrio | 0;
                if (object.prevState != null)
                    if ($util.Long)
                        (message.prevState = $util.Long.fromValue(object.prevState)).unsigned = false;
                    else if (typeof object.prevState === "string")
                        message.prevState = parseInt(object.prevState, 10);
                    else if (typeof object.prevState === "number")
                        message.prevState = object.prevState;
                    else if (typeof object.prevState === "object")
                        message.prevState = new $util.LongBits(object.prevState.low >>> 0, object.prevState.high >>> 0).toNumber();
                if (object.nextComm != null)
                    message.nextComm = String(object.nextComm);
                if (object.nextPid != null)
                    message.nextPid = object.nextPid | 0;
                if (object.nextPrio != null)
                    message.nextPrio = object.nextPrio | 0;
                return message;
            };

            /**
             * Creates a plain object from a SchedSwitchFtraceEvent message. Also converts values to other types if specified.
             * @function toObject
             * @memberof perfetto.protos.SchedSwitchFtraceEvent
             * @static
             * @param {perfetto.protos.SchedSwitchFtraceEvent} message SchedSwitchFtraceEvent
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            SchedSwitchFtraceEvent.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults) {
                    object.prevComm = "";
                    object.prevPid = 0;
                    object.prevPrio = 0;
                    if ($util.Long) {
                        var long = new $util.Long(0, 0, false);
                        object.prevState = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                    } else
                        object.prevState = options.longs === String ? "0" : 0;
                    object.nextComm = "";
                    object.nextPid = 0;
                    object.nextPrio = 0;
                }
                if (message.prevComm != null && message.hasOwnProperty("prevComm"))
                    object.prevComm = message.prevComm;
                if (message.prevPid != null && message.hasOwnProperty("prevPid"))
                    object.prevPid = message.prevPid;
                if (message.prevPrio != null && message.hasOwnProperty("prevPrio"))
                    object.prevPrio = message.prevPrio;
                if (message.prevState != null && message.hasOwnProperty("prevState"))
                    if (typeof message.prevState === "number")
                        object.prevState = options.longs === String ? String(message.prevState) : message.prevState;
                    else
                        object.prevState = options.longs === String ? $util.Long.prototype.toString.call(message.prevState) : options.longs === Number ? new $util.LongBits(message.prevState.low >>> 0, message.prevState.high >>> 0).toNumber() : message.prevState;
                if (message.nextComm != null && message.hasOwnProperty("nextComm"))
                    object.nextComm = message.nextComm;
                if (message.nextPid != null && message.hasOwnProperty("nextPid"))
                    object.nextPid = message.nextPid;
                if (message.nextPrio != null && message.hasOwnProperty("nextPrio"))
                    object.nextPrio = message.nextPrio;
                return object;
            };

            /**
             * Converts this SchedSwitchFtraceEvent to JSON.
             * @function toJSON
             * @memberof perfetto.protos.SchedSwitchFtraceEvent
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            SchedSwitchFtraceEvent.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return SchedSwitchFtraceEvent;
        })();

        protos.CpuIdleFtraceEvent = (function() {

            /**
             * Properties of a CpuIdleFtraceEvent.
             * @memberof perfetto.protos
             * @interface ICpuIdleFtraceEvent
             * @property {number|null} [state] CpuIdleFtraceEvent state
             * @property {number|null} [cpuId] CpuIdleFtraceEvent cpuId
             */

            /**
             * Constructs a new CpuIdleFtraceEvent.
             * @memberof perfetto.protos
             * @classdesc Represents a CpuIdleFtraceEvent.
             * @implements ICpuIdleFtraceEvent
             * @constructor
             * @param {perfetto.protos.ICpuIdleFtraceEvent=} [properties] Properties to set
             */
            function CpuIdleFtraceEvent(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * CpuIdleFtraceEvent state.
             * @member {number} state
             * @memberof perfetto.protos.CpuIdleFtraceEvent
             * @instance
             */
            CpuIdleFtraceEvent.prototype.state = 0;

            /**
             * CpuIdleFtraceEvent cpuId.
             * @member {number} cpuId
             * @memberof perfetto.protos.CpuIdleFtraceEvent
             * @instance
             */
            CpuIdleFtraceEvent.prototype.cpuId = 0;

            /**
             * Creates a new CpuIdleFtraceEvent instance using the specified properties.
             * @function create
             * @memberof perfetto.protos.CpuIdleFtraceEvent
             * @static
             * @param {perfetto.protos.ICpuIdleFtraceEvent=} [properties] Properties to set
             * @returns {perfetto.protos.CpuIdleFtraceEvent} CpuIdleFtraceEvent instance
             */
            CpuIdleFtraceEvent.create = function create(properties) {
                return new CpuIdleFtraceEvent(properties);
            };

            /**
             * Encodes the specified CpuIdleFtraceEvent message. Does not implicitly {@link perfetto.protos.CpuIdleFtraceEvent.verify|verify} messages.
             * @function encode
             * @memberof perfetto.protos.CpuIdleFtraceEvent
             * @static
             * @param {perfetto.protos.ICpuIdleFtraceEvent} message CpuIdleFtraceEvent message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            CpuIdleFtraceEvent.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.state != null && message.hasOwnProperty("state"))
                    writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.state);
                if (message.cpuId != null && message.hasOwnProperty("cpuId"))
                    writer.uint32(/* id 2, wireType 0 =*/16).uint32(message.cpuId);
                return writer;
            };

            /**
             * Encodes the specified CpuIdleFtraceEvent message, length delimited. Does not implicitly {@link perfetto.protos.CpuIdleFtraceEvent.verify|verify} messages.
             * @function encodeDelimited
             * @memberof perfetto.protos.CpuIdleFtraceEvent
             * @static
             * @param {perfetto.protos.ICpuIdleFtraceEvent} message CpuIdleFtraceEvent message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            CpuIdleFtraceEvent.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a CpuIdleFtraceEvent message from the specified reader or buffer.
             * @function decode
             * @memberof perfetto.protos.CpuIdleFtraceEvent
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {perfetto.protos.CpuIdleFtraceEvent} CpuIdleFtraceEvent
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            CpuIdleFtraceEvent.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.perfetto.protos.CpuIdleFtraceEvent();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.state = reader.uint32();
                        break;
                    case 2:
                        message.cpuId = reader.uint32();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a CpuIdleFtraceEvent message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof perfetto.protos.CpuIdleFtraceEvent
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {perfetto.protos.CpuIdleFtraceEvent} CpuIdleFtraceEvent
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            CpuIdleFtraceEvent.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a CpuIdleFtraceEvent message.
             * @function verify
             * @memberof perfetto.protos.CpuIdleFtraceEvent
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            CpuIdleFtraceEvent.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.state != null && message.hasOwnProperty("state"))
                    if (!$util.isInteger(message.state))
                        return "state: integer expected";
                if (message.cpuId != null && message.hasOwnProperty("cpuId"))
                    if (!$util.isInteger(message.cpuId))
                        return "cpuId: integer expected";
                return null;
            };

            /**
             * Creates a CpuIdleFtraceEvent message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof perfetto.protos.CpuIdleFtraceEvent
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {perfetto.protos.CpuIdleFtraceEvent} CpuIdleFtraceEvent
             */
            CpuIdleFtraceEvent.fromObject = function fromObject(object) {
                if (object instanceof $root.perfetto.protos.CpuIdleFtraceEvent)
                    return object;
                var message = new $root.perfetto.protos.CpuIdleFtraceEvent();
                if (object.state != null)
                    message.state = object.state >>> 0;
                if (object.cpuId != null)
                    message.cpuId = object.cpuId >>> 0;
                return message;
            };

            /**
             * Creates a plain object from a CpuIdleFtraceEvent message. Also converts values to other types if specified.
             * @function toObject
             * @memberof perfetto.protos.CpuIdleFtraceEvent
             * @static
             * @param {perfetto.protos.CpuIdleFtraceEvent} message CpuIdleFtraceEvent
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            CpuIdleFtraceEvent.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults) {
                    object.state = 0;
                    object.cpuId = 0;
                }
                if (message.state != null && message.hasOwnProperty("state"))
                    object.state = message.state;
                if (message.cpuId != null && message.hasOwnProperty("cpuId"))
                    object.cpuId = message.cpuId;
                return object;
            };

            /**
             * Converts this CpuIdleFtraceEvent to JSON.
             * @function toJSON
             * @memberof perfetto.protos.CpuIdleFtraceEvent
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            CpuIdleFtraceEvent.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return CpuIdleFtraceEvent;
        })();

        protos.InternedData = (function() {

            /**
             * Properties of an InternedData.
             * @memberof perfetto.protos
             * @interface IInternedData
             * @property {Array.<perfetto.protos.IInternedString>|null} [eventNames] InternedData eventNames
             * @property {Array.<perfetto.protos.IInternedString>|null} [eventCategories] InternedData eventCategories
             * @property {Array.<perfetto.protos.ICallstack>|null} [callstacks] InternedData callstacks
             * @property {Array.<perfetto.protos.IFrame>|null} [frames] InternedData frames
             * @property {Array.<perfetto.protos.IFunctionName>|null} [functionNames] InternedData functionNames
             * @property {Array.<perfetto.protos.IMappingPath>|null} [mappingPaths] InternedData mappingPaths
             */

            /**
             * Constructs a new InternedData.
             * @memberof perfetto.protos
             * @classdesc Represents an InternedData.
             * @implements IInternedData
             * @constructor
             * @param {perfetto.protos.IInternedData=} [properties] Properties to set
             */
            function InternedData(properties) {
                this.eventNames = [];
                this.eventCategories = [];
                this.callstacks = [];
                this.frames = [];
                this.functionNames = [];
                this.mappingPaths = [];
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * InternedData eventNames.
             * @member {Array.<perfetto.protos.IInternedString>} eventNames
             * @memberof perfetto.protos.InternedData
             * @instance
             */
            InternedData.prototype.eventNames = $util.emptyArray;

            /**
             * InternedData eventCategories.
             * @member {Array.<perfetto.protos.IInternedString>} eventCategories
             * @memberof perfetto.protos.InternedData
             * @instance
             */
            InternedData.prototype.eventCategories = $util.emptyArray;

            /**
             * InternedData callstacks.
             * @member {Array.<perfetto.protos.ICallstack>} callstacks
             * @memberof perfetto.protos.InternedData
             * @instance
             */
            InternedData.prototype.callstacks = $util.emptyArray;

            /**
             * InternedData frames.
             * @member {Array.<perfetto.protos.IFrame>} frames
             * @memberof perfetto.protos.InternedData
             * @instance
             */
            InternedData.prototype.frames = $util.emptyArray;

            /**
             * InternedData functionNames.
             * @member {Array.<perfetto.protos.IFunctionName>} functionNames
             * @memberof perfetto.protos.InternedData
             * @instance
             */
            InternedData.prototype.functionNames = $util.emptyArray;

            /**
             * InternedData mappingPaths.
             * @member {Array.<perfetto.protos.IMappingPath>} mappingPaths
             * @memberof perfetto.protos.InternedData
             * @instance
             */
            InternedData.prototype.mappingPaths = $util.emptyArray;

            /**
             * Creates a new InternedData instance using the specified properties.
             * @function create
             * @memberof perfetto.protos.InternedData
             * @static
             * @param {perfetto.protos.IInternedData=} [properties] Properties to set
             * @returns {perfetto.protos.InternedData} InternedData instance
             */
            InternedData.create = function create(properties) {
                return new InternedData(properties);
            };

            /**
             * Encodes the specified InternedData message. Does not implicitly {@link perfetto.protos.InternedData.verify|verify} messages.
             * @function encode
             * @memberof perfetto.protos.InternedData
             * @static
             * @param {perfetto.protos.IInternedData} message InternedData message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            InternedData.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.eventCategories != null && message.eventCategories.length)
                    for (var i = 0; i < message.eventCategories.length; ++i)
                        $root.perfetto.protos.InternedString.encode(message.eventCategories[i], writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                if (message.eventNames != null && message.eventNames.length)
                    for (var i = 0; i < message.eventNames.length; ++i)
                        $root.perfetto.protos.InternedString.encode(message.eventNames[i], writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
                if (message.functionNames != null && message.functionNames.length)
                    for (var i = 0; i < message.functionNames.length; ++i)
                        $root.perfetto.protos.FunctionName.encode(message.functionNames[i], writer.uint32(/* id 5, wireType 2 =*/42).fork()).ldelim();
                if (message.mappingPaths != null && message.mappingPaths.length)
                    for (var i = 0; i < message.mappingPaths.length; ++i)
                        $root.perfetto.protos.MappingPath.encode(message.mappingPaths[i], writer.uint32(/* id 7, wireType 2 =*/58).fork()).ldelim();
                if (message.frames != null && message.frames.length)
                    for (var i = 0; i < message.frames.length; ++i)
                        $root.perfetto.protos.Frame.encode(message.frames[i], writer.uint32(/* id 16, wireType 2 =*/130).fork()).ldelim();
                if (message.callstacks != null && message.callstacks.length)
                    for (var i = 0; i < message.callstacks.length; ++i)
                        $root.perfetto.protos.Callstack.encode(message.callstacks[i], writer.uint32(/* id 17, wireType 2 =*/138).fork()).ldelim();
                return writer;
            };

            /**
             * Encodes the specified InternedData message, length delimited. Does not implicitly {@link perfetto.protos.InternedData.verify|verify} messages.
             * @function encodeDelimited
             * @memberof perfetto.protos.InternedData
             * @static
             * @param {perfetto.protos.IInternedData} message InternedData message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            InternedData.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes an InternedData message from the specified reader or buffer.
             * @function decode
             * @memberof perfetto.protos.InternedData
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {perfetto.protos.InternedData} InternedData
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            InternedData.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.perfetto.protos.InternedData();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 2:
                        if (!(message.eventNames && message.eventNames.length))
                            message.eventNames = [];
                        message.eventNames.push($root.perfetto.protos.InternedString.decode(reader, reader.uint32()));
                        break;
                    case 1:
                        if (!(message.eventCategories && message.eventCategories.length))
                            message.eventCategories = [];
                        message.eventCategories.push($root.perfetto.protos.InternedString.decode(reader, reader.uint32()));
                        break;
                    case 17:
                        if (!(message.callstacks && message.callstacks.length))
                            message.callstacks = [];
                        message.callstacks.push($root.perfetto.protos.Callstack.decode(reader, reader.uint32()));
                        break;
                    case 16:
                        if (!(message.frames && message.frames.length))
                            message.frames = [];
                        message.frames.push($root.perfetto.protos.Frame.decode(reader, reader.uint32()));
                        break;
                    case 5:
                        if (!(message.functionNames && message.functionNames.length))
                            message.functionNames = [];
                        message.functionNames.push($root.perfetto.protos.FunctionName.decode(reader, reader.uint32()));
                        break;
                    case 7:
                        if (!(message.mappingPaths && message.mappingPaths.length))
                            message.mappingPaths = [];
                        message.mappingPaths.push($root.perfetto.protos.MappingPath.decode(reader, reader.uint32()));
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes an InternedData message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof perfetto.protos.InternedData
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {perfetto.protos.InternedData} InternedData
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            InternedData.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies an InternedData message.
             * @function verify
             * @memberof perfetto.protos.InternedData
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            InternedData.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.eventNames != null && message.hasOwnProperty("eventNames")) {
                    if (!Array.isArray(message.eventNames))
                        return "eventNames: array expected";
                    for (var i = 0; i < message.eventNames.length; ++i) {
                        var error = $root.perfetto.protos.InternedString.verify(message.eventNames[i]);
                        if (error)
                            return "eventNames." + error;
                    }
                }
                if (message.eventCategories != null && message.hasOwnProperty("eventCategories")) {
                    if (!Array.isArray(message.eventCategories))
                        return "eventCategories: array expected";
                    for (var i = 0; i < message.eventCategories.length; ++i) {
                        var error = $root.perfetto.protos.InternedString.verify(message.eventCategories[i]);
                        if (error)
                            return "eventCategories." + error;
                    }
                }
                if (message.callstacks != null && message.hasOwnProperty("callstacks")) {
                    if (!Array.isArray(message.callstacks))
                        return "callstacks: array expected";
                    for (var i = 0; i < message.callstacks.length; ++i) {
                        var error = $root.perfetto.protos.Callstack.verify(message.callstacks[i]);
                        if (error)
                            return "callstacks." + error;
                    }
                }
                if (message.frames != null && message.hasOwnProperty("frames")) {
                    if (!Array.isArray(message.frames))
                        return "frames: array expected";
                    for (var i = 0; i < message.frames.length; ++i) {
                        var error = $root.perfetto.protos.Frame.verify(message.frames[i]);
                        if (error)
                            return "frames." + error;
                    }
                }
                if (message.functionNames != null && message.hasOwnProperty("functionNames")) {
                    if (!Array.isArray(message.functionNames))
                        return "functionNames: array expected";
                    for (var i = 0; i < message.functionNames.length; ++i) {
                        var error = $root.perfetto.protos.FunctionName.verify(message.functionNames[i]);
                        if (error)
                            return "functionNames." + error;
                    }
                }
                if (message.mappingPaths != null && message.hasOwnProperty("mappingPaths")) {
                    if (!Array.isArray(message.mappingPaths))
                        return "mappingPaths: array expected";
                    for (var i = 0; i < message.mappingPaths.length; ++i) {
                        var error = $root.perfetto.protos.MappingPath.verify(message.mappingPaths[i]);
                        if (error)
                            return "mappingPaths." + error;
                    }
                }
                return null;
            };

            /**
             * Creates an InternedData message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof perfetto.protos.InternedData
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {perfetto.protos.InternedData} InternedData
             */
            InternedData.fromObject = function fromObject(object) {
                if (object instanceof $root.perfetto.protos.InternedData)
                    return object;
                var message = new $root.perfetto.protos.InternedData();
                if (object.eventNames) {
                    if (!Array.isArray(object.eventNames))
                        throw TypeError(".perfetto.protos.InternedData.eventNames: array expected");
                    message.eventNames = [];
                    for (var i = 0; i < object.eventNames.length; ++i) {
                        if (typeof object.eventNames[i] !== "object")
                            throw TypeError(".perfetto.protos.InternedData.eventNames: object expected");
                        message.eventNames[i] = $root.perfetto.protos.InternedString.fromObject(object.eventNames[i]);
                    }
                }
                if (object.eventCategories) {
                    if (!Array.isArray(object.eventCategories))
                        throw TypeError(".perfetto.protos.InternedData.eventCategories: array expected");
                    message.eventCategories = [];
                    for (var i = 0; i < object.eventCategories.length; ++i) {
                        if (typeof object.eventCategories[i] !== "object")
                            throw TypeError(".perfetto.protos.InternedData.eventCategories: object expected");
                        message.eventCategories[i] = $root.perfetto.protos.InternedString.fromObject(object.eventCategories[i]);
                    }
                }
                if (object.callstacks) {
                    if (!Array.isArray(object.callstacks))
                        throw TypeError(".perfetto.protos.InternedData.callstacks: array expected");
                    message.callstacks = [];
                    for (var i = 0; i < object.callstacks.length; ++i) {
                        if (typeof object.callstacks[i] !== "object")
                            throw TypeError(".perfetto.protos.InternedData.callstacks: object expected");
                        message.callstacks[i] = $root.perfetto.protos.Callstack.fromObject(object.callstacks[i]);
                    }
                }
                if (object.frames) {
                    if (!Array.isArray(object.frames))
                        throw TypeError(".perfetto.protos.InternedData.frames: array expected");
                    message.frames = [];
                    for (var i = 0; i < object.frames.length; ++i) {
                        if (typeof object.frames[i] !== "object")
                            throw TypeError(".perfetto.protos.InternedData.frames: object expected");
                        message.frames[i] = $root.perfetto.protos.Frame.fromObject(object.frames[i]);
                    }
                }
                if (object.functionNames) {
                    if (!Array.isArray(object.functionNames))
                        throw TypeError(".perfetto.protos.InternedData.functionNames: array expected");
                    message.functionNames = [];
                    for (var i = 0; i < object.functionNames.length; ++i) {
                        if (typeof object.functionNames[i] !== "object")
                            throw TypeError(".perfetto.protos.InternedData.functionNames: object expected");
                        message.functionNames[i] = $root.perfetto.protos.FunctionName.fromObject(object.functionNames[i]);
                    }
                }
                if (object.mappingPaths) {
                    if (!Array.isArray(object.mappingPaths))
                        throw TypeError(".perfetto.protos.InternedData.mappingPaths: array expected");
                    message.mappingPaths = [];
                    for (var i = 0; i < object.mappingPaths.length; ++i) {
                        if (typeof object.mappingPaths[i] !== "object")
                            throw TypeError(".perfetto.protos.InternedData.mappingPaths: object expected");
                        message.mappingPaths[i] = $root.perfetto.protos.MappingPath.fromObject(object.mappingPaths[i]);
                    }
                }
                return message;
            };

            /**
             * Creates a plain object from an InternedData message. Also converts values to other types if specified.
             * @function toObject
             * @memberof perfetto.protos.InternedData
             * @static
             * @param {perfetto.protos.InternedData} message InternedData
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            InternedData.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.arrays || options.defaults) {
                    object.eventCategories = [];
                    object.eventNames = [];
                    object.functionNames = [];
                    object.mappingPaths = [];
                    object.frames = [];
                    object.callstacks = [];
                }
                if (message.eventCategories && message.eventCategories.length) {
                    object.eventCategories = [];
                    for (var j = 0; j < message.eventCategories.length; ++j)
                        object.eventCategories[j] = $root.perfetto.protos.InternedString.toObject(message.eventCategories[j], options);
                }
                if (message.eventNames && message.eventNames.length) {
                    object.eventNames = [];
                    for (var j = 0; j < message.eventNames.length; ++j)
                        object.eventNames[j] = $root.perfetto.protos.InternedString.toObject(message.eventNames[j], options);
                }
                if (message.functionNames && message.functionNames.length) {
                    object.functionNames = [];
                    for (var j = 0; j < message.functionNames.length; ++j)
                        object.functionNames[j] = $root.perfetto.protos.FunctionName.toObject(message.functionNames[j], options);
                }
                if (message.mappingPaths && message.mappingPaths.length) {
                    object.mappingPaths = [];
                    for (var j = 0; j < message.mappingPaths.length; ++j)
                        object.mappingPaths[j] = $root.perfetto.protos.MappingPath.toObject(message.mappingPaths[j], options);
                }
                if (message.frames && message.frames.length) {
                    object.frames = [];
                    for (var j = 0; j < message.frames.length; ++j)
                        object.frames[j] = $root.perfetto.protos.Frame.toObject(message.frames[j], options);
                }
                if (message.callstacks && message.callstacks.length) {
                    object.callstacks = [];
                    for (var j = 0; j < message.callstacks.length; ++j)
                        object.callstacks[j] = $root.perfetto.protos.Callstack.toObject(message.callstacks[j], options);
                }
                return object;
            };

            /**
             * Converts this InternedData to JSON.
             * @function toJSON
             * @memberof perfetto.protos.InternedData
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            InternedData.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return InternedData;
        })();

        protos.InternedString = (function() {

            /**
             * Properties of an InternedString.
             * @memberof perfetto.protos
             * @interface IInternedString
             * @property {number|Long|null} [iid] InternedString iid
             * @property {Uint8Array|null} [str] InternedString str
             */

            /**
             * Constructs a new InternedString.
             * @memberof perfetto.protos
             * @classdesc Represents an InternedString.
             * @implements IInternedString
             * @constructor
             * @param {perfetto.protos.IInternedString=} [properties] Properties to set
             */
            function InternedString(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * InternedString iid.
             * @member {number|Long} iid
             * @memberof perfetto.protos.InternedString
             * @instance
             */
            InternedString.prototype.iid = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

            /**
             * InternedString str.
             * @member {Uint8Array} str
             * @memberof perfetto.protos.InternedString
             * @instance
             */
            InternedString.prototype.str = $util.newBuffer([]);

            /**
             * Creates a new InternedString instance using the specified properties.
             * @function create
             * @memberof perfetto.protos.InternedString
             * @static
             * @param {perfetto.protos.IInternedString=} [properties] Properties to set
             * @returns {perfetto.protos.InternedString} InternedString instance
             */
            InternedString.create = function create(properties) {
                return new InternedString(properties);
            };

            /**
             * Encodes the specified InternedString message. Does not implicitly {@link perfetto.protos.InternedString.verify|verify} messages.
             * @function encode
             * @memberof perfetto.protos.InternedString
             * @static
             * @param {perfetto.protos.IInternedString} message InternedString message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            InternedString.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.iid != null && message.hasOwnProperty("iid"))
                    writer.uint32(/* id 1, wireType 0 =*/8).uint64(message.iid);
                if (message.str != null && message.hasOwnProperty("str"))
                    writer.uint32(/* id 2, wireType 2 =*/18).bytes(message.str);
                return writer;
            };

            /**
             * Encodes the specified InternedString message, length delimited. Does not implicitly {@link perfetto.protos.InternedString.verify|verify} messages.
             * @function encodeDelimited
             * @memberof perfetto.protos.InternedString
             * @static
             * @param {perfetto.protos.IInternedString} message InternedString message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            InternedString.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes an InternedString message from the specified reader or buffer.
             * @function decode
             * @memberof perfetto.protos.InternedString
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {perfetto.protos.InternedString} InternedString
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            InternedString.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.perfetto.protos.InternedString();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.iid = reader.uint64();
                        break;
                    case 2:
                        message.str = reader.bytes();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes an InternedString message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof perfetto.protos.InternedString
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {perfetto.protos.InternedString} InternedString
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            InternedString.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies an InternedString message.
             * @function verify
             * @memberof perfetto.protos.InternedString
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            InternedString.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.iid != null && message.hasOwnProperty("iid"))
                    if (!$util.isInteger(message.iid) && !(message.iid && $util.isInteger(message.iid.low) && $util.isInteger(message.iid.high)))
                        return "iid: integer|Long expected";
                if (message.str != null && message.hasOwnProperty("str"))
                    if (!(message.str && typeof message.str.length === "number" || $util.isString(message.str)))
                        return "str: buffer expected";
                return null;
            };

            /**
             * Creates an InternedString message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof perfetto.protos.InternedString
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {perfetto.protos.InternedString} InternedString
             */
            InternedString.fromObject = function fromObject(object) {
                if (object instanceof $root.perfetto.protos.InternedString)
                    return object;
                var message = new $root.perfetto.protos.InternedString();
                if (object.iid != null)
                    if ($util.Long)
                        (message.iid = $util.Long.fromValue(object.iid)).unsigned = true;
                    else if (typeof object.iid === "string")
                        message.iid = parseInt(object.iid, 10);
                    else if (typeof object.iid === "number")
                        message.iid = object.iid;
                    else if (typeof object.iid === "object")
                        message.iid = new $util.LongBits(object.iid.low >>> 0, object.iid.high >>> 0).toNumber(true);
                if (object.str != null)
                    if (typeof object.str === "string")
                        $util.base64.decode(object.str, message.str = $util.newBuffer($util.base64.length(object.str)), 0);
                    else if (object.str.length)
                        message.str = object.str;
                return message;
            };

            /**
             * Creates a plain object from an InternedString message. Also converts values to other types if specified.
             * @function toObject
             * @memberof perfetto.protos.InternedString
             * @static
             * @param {perfetto.protos.InternedString} message InternedString
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            InternedString.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults) {
                    if ($util.Long) {
                        var long = new $util.Long(0, 0, true);
                        object.iid = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                    } else
                        object.iid = options.longs === String ? "0" : 0;
                    if (options.bytes === String)
                        object.str = "";
                    else {
                        object.str = [];
                        if (options.bytes !== Array)
                            object.str = $util.newBuffer(object.str);
                    }
                }
                if (message.iid != null && message.hasOwnProperty("iid"))
                    if (typeof message.iid === "number")
                        object.iid = options.longs === String ? String(message.iid) : message.iid;
                    else
                        object.iid = options.longs === String ? $util.Long.prototype.toString.call(message.iid) : options.longs === Number ? new $util.LongBits(message.iid.low >>> 0, message.iid.high >>> 0).toNumber(true) : message.iid;
                if (message.str != null && message.hasOwnProperty("str"))
                    object.str = options.bytes === String ? $util.base64.encode(message.str, 0, message.str.length) : options.bytes === Array ? Array.prototype.slice.call(message.str) : message.str;
                return object;
            };

            /**
             * Converts this InternedString to JSON.
             * @function toJSON
             * @memberof perfetto.protos.InternedString
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            InternedString.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return InternedString;
        })();

        protos.Callstack = (function() {

            /**
             * Properties of a Callstack.
             * @memberof perfetto.protos
             * @interface ICallstack
             * @property {number|Long|null} [iid] Callstack iid
             * @property {Array.<number|Long>|null} [frameIds] Callstack frameIds
             */

            /**
             * Constructs a new Callstack.
             * @memberof perfetto.protos
             * @classdesc Represents a Callstack.
             * @implements ICallstack
             * @constructor
             * @param {perfetto.protos.ICallstack=} [properties] Properties to set
             */
            function Callstack(properties) {
                this.frameIds = [];
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Callstack iid.
             * @member {number|Long} iid
             * @memberof perfetto.protos.Callstack
             * @instance
             */
            Callstack.prototype.iid = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

            /**
             * Callstack frameIds.
             * @member {Array.<number|Long>} frameIds
             * @memberof perfetto.protos.Callstack
             * @instance
             */
            Callstack.prototype.frameIds = $util.emptyArray;

            /**
             * Creates a new Callstack instance using the specified properties.
             * @function create
             * @memberof perfetto.protos.Callstack
             * @static
             * @param {perfetto.protos.ICallstack=} [properties] Properties to set
             * @returns {perfetto.protos.Callstack} Callstack instance
             */
            Callstack.create = function create(properties) {
                return new Callstack(properties);
            };

            /**
             * Encodes the specified Callstack message. Does not implicitly {@link perfetto.protos.Callstack.verify|verify} messages.
             * @function encode
             * @memberof perfetto.protos.Callstack
             * @static
             * @param {perfetto.protos.ICallstack} message Callstack message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Callstack.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.iid != null && message.hasOwnProperty("iid"))
                    writer.uint32(/* id 1, wireType 0 =*/8).uint64(message.iid);
                if (message.frameIds != null && message.frameIds.length)
                    for (var i = 0; i < message.frameIds.length; ++i)
                        writer.uint32(/* id 2, wireType 0 =*/16).uint64(message.frameIds[i]);
                return writer;
            };

            /**
             * Encodes the specified Callstack message, length delimited. Does not implicitly {@link perfetto.protos.Callstack.verify|verify} messages.
             * @function encodeDelimited
             * @memberof perfetto.protos.Callstack
             * @static
             * @param {perfetto.protos.ICallstack} message Callstack message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Callstack.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a Callstack message from the specified reader or buffer.
             * @function decode
             * @memberof perfetto.protos.Callstack
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {perfetto.protos.Callstack} Callstack
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Callstack.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.perfetto.protos.Callstack();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.iid = reader.uint64();
                        break;
                    case 2:
                        if (!(message.frameIds && message.frameIds.length))
                            message.frameIds = [];
                        if ((tag & 7) === 2) {
                            var end2 = reader.uint32() + reader.pos;
                            while (reader.pos < end2)
                                message.frameIds.push(reader.uint64());
                        } else
                            message.frameIds.push(reader.uint64());
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a Callstack message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof perfetto.protos.Callstack
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {perfetto.protos.Callstack} Callstack
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Callstack.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a Callstack message.
             * @function verify
             * @memberof perfetto.protos.Callstack
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            Callstack.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.iid != null && message.hasOwnProperty("iid"))
                    if (!$util.isInteger(message.iid) && !(message.iid && $util.isInteger(message.iid.low) && $util.isInteger(message.iid.high)))
                        return "iid: integer|Long expected";
                if (message.frameIds != null && message.hasOwnProperty("frameIds")) {
                    if (!Array.isArray(message.frameIds))
                        return "frameIds: array expected";
                    for (var i = 0; i < message.frameIds.length; ++i)
                        if (!$util.isInteger(message.frameIds[i]) && !(message.frameIds[i] && $util.isInteger(message.frameIds[i].low) && $util.isInteger(message.frameIds[i].high)))
                            return "frameIds: integer|Long[] expected";
                }
                return null;
            };

            /**
             * Creates a Callstack message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof perfetto.protos.Callstack
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {perfetto.protos.Callstack} Callstack
             */
            Callstack.fromObject = function fromObject(object) {
                if (object instanceof $root.perfetto.protos.Callstack)
                    return object;
                var message = new $root.perfetto.protos.Callstack();
                if (object.iid != null)
                    if ($util.Long)
                        (message.iid = $util.Long.fromValue(object.iid)).unsigned = true;
                    else if (typeof object.iid === "string")
                        message.iid = parseInt(object.iid, 10);
                    else if (typeof object.iid === "number")
                        message.iid = object.iid;
                    else if (typeof object.iid === "object")
                        message.iid = new $util.LongBits(object.iid.low >>> 0, object.iid.high >>> 0).toNumber(true);
                if (object.frameIds) {
                    if (!Array.isArray(object.frameIds))
                        throw TypeError(".perfetto.protos.Callstack.frameIds: array expected");
                    message.frameIds = [];
                    for (var i = 0; i < object.frameIds.length; ++i)
                        if ($util.Long)
                            (message.frameIds[i] = $util.Long.fromValue(object.frameIds[i])).unsigned = true;
                        else if (typeof object.frameIds[i] === "string")
                            message.frameIds[i] = parseInt(object.frameIds[i], 10);
                        else if (typeof object.frameIds[i] === "number")
                            message.frameIds[i] = object.frameIds[i];
                        else if (typeof object.frameIds[i] === "object")
                            message.frameIds[i] = new $util.LongBits(object.frameIds[i].low >>> 0, object.frameIds[i].high >>> 0).toNumber(true);
                }
                return message;
            };

            /**
             * Creates a plain object from a Callstack message. Also converts values to other types if specified.
             * @function toObject
             * @memberof perfetto.protos.Callstack
             * @static
             * @param {perfetto.protos.Callstack} message Callstack
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            Callstack.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.arrays || options.defaults)
                    object.frameIds = [];
                if (options.defaults)
                    if ($util.Long) {
                        var long = new $util.Long(0, 0, true);
                        object.iid = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                    } else
                        object.iid = options.longs === String ? "0" : 0;
                if (message.iid != null && message.hasOwnProperty("iid"))
                    if (typeof message.iid === "number")
                        object.iid = options.longs === String ? String(message.iid) : message.iid;
                    else
                        object.iid = options.longs === String ? $util.Long.prototype.toString.call(message.iid) : options.longs === Number ? new $util.LongBits(message.iid.low >>> 0, message.iid.high >>> 0).toNumber(true) : message.iid;
                if (message.frameIds && message.frameIds.length) {
                    object.frameIds = [];
                    for (var j = 0; j < message.frameIds.length; ++j)
                        if (typeof message.frameIds[j] === "number")
                            object.frameIds[j] = options.longs === String ? String(message.frameIds[j]) : message.frameIds[j];
                        else
                            object.frameIds[j] = options.longs === String ? $util.Long.prototype.toString.call(message.frameIds[j]) : options.longs === Number ? new $util.LongBits(message.frameIds[j].low >>> 0, message.frameIds[j].high >>> 0).toNumber(true) : message.frameIds[j];
                }
                return object;
            };

            /**
             * Converts this Callstack to JSON.
             * @function toJSON
             * @memberof perfetto.protos.Callstack
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            Callstack.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return Callstack;
        })();

        protos.Frame = (function() {

            /**
             * Properties of a Frame.
             * @memberof perfetto.protos
             * @interface IFrame
             * @property {number|Long|null} [iid] Frame iid
             * @property {number|Long|null} [functionNameId] Frame functionNameId
             * @property {number|Long|null} [mappingId] Frame mappingId
             * @property {number|Long|null} [relPc] Frame relPc
             */

            /**
             * Constructs a new Frame.
             * @memberof perfetto.protos
             * @classdesc Represents a Frame.
             * @implements IFrame
             * @constructor
             * @param {perfetto.protos.IFrame=} [properties] Properties to set
             */
            function Frame(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Frame iid.
             * @member {number|Long} iid
             * @memberof perfetto.protos.Frame
             * @instance
             */
            Frame.prototype.iid = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

            /**
             * Frame functionNameId.
             * @member {number|Long} functionNameId
             * @memberof perfetto.protos.Frame
             * @instance
             */
            Frame.prototype.functionNameId = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

            /**
             * Frame mappingId.
             * @member {number|Long} mappingId
             * @memberof perfetto.protos.Frame
             * @instance
             */
            Frame.prototype.mappingId = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

            /**
             * Frame relPc.
             * @member {number|Long} relPc
             * @memberof perfetto.protos.Frame
             * @instance
             */
            Frame.prototype.relPc = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

            /**
             * Creates a new Frame instance using the specified properties.
             * @function create
             * @memberof perfetto.protos.Frame
             * @static
             * @param {perfetto.protos.IFrame=} [properties] Properties to set
             * @returns {perfetto.protos.Frame} Frame instance
             */
            Frame.create = function create(properties) {
                return new Frame(properties);
            };

            /**
             * Encodes the specified Frame message. Does not implicitly {@link perfetto.protos.Frame.verify|verify} messages.
             * @function encode
             * @memberof perfetto.protos.Frame
             * @static
             * @param {perfetto.protos.IFrame} message Frame message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Frame.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.iid != null && message.hasOwnProperty("iid"))
                    writer.uint32(/* id 1, wireType 0 =*/8).uint64(message.iid);
                if (message.functionNameId != null && message.hasOwnProperty("functionNameId"))
                    writer.uint32(/* id 2, wireType 0 =*/16).uint64(message.functionNameId);
                if (message.mappingId != null && message.hasOwnProperty("mappingId"))
                    writer.uint32(/* id 3, wireType 0 =*/24).uint64(message.mappingId);
                if (message.relPc != null && message.hasOwnProperty("relPc"))
                    writer.uint32(/* id 4, wireType 0 =*/32).uint64(message.relPc);
                return writer;
            };

            /**
             * Encodes the specified Frame message, length delimited. Does not implicitly {@link perfetto.protos.Frame.verify|verify} messages.
             * @function encodeDelimited
             * @memberof perfetto.protos.Frame
             * @static
             * @param {perfetto.protos.IFrame} message Frame message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Frame.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a Frame message from the specified reader or buffer.
             * @function decode
             * @memberof perfetto.protos.Frame
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {perfetto.protos.Frame} Frame
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Frame.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.perfetto.protos.Frame();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.iid = reader.uint64();
                        break;
                    case 2:
                        message.functionNameId = reader.uint64();
                        break;
                    case 3:
                        message.mappingId = reader.uint64();
                        break;
                    case 4:
                        message.relPc = reader.uint64();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a Frame message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof perfetto.protos.Frame
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {perfetto.protos.Frame} Frame
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Frame.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a Frame message.
             * @function verify
             * @memberof perfetto.protos.Frame
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            Frame.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.iid != null && message.hasOwnProperty("iid"))
                    if (!$util.isInteger(message.iid) && !(message.iid && $util.isInteger(message.iid.low) && $util.isInteger(message.iid.high)))
                        return "iid: integer|Long expected";
                if (message.functionNameId != null && message.hasOwnProperty("functionNameId"))
                    if (!$util.isInteger(message.functionNameId) && !(message.functionNameId && $util.isInteger(message.functionNameId.low) && $util.isInteger(message.functionNameId.high)))
                        return "functionNameId: integer|Long expected";
                if (message.mappingId != null && message.hasOwnProperty("mappingId"))
                    if (!$util.isInteger(message.mappingId) && !(message.mappingId && $util.isInteger(message.mappingId.low) && $util.isInteger(message.mappingId.high)))
                        return "mappingId: integer|Long expected";
                if (message.relPc != null && message.hasOwnProperty("relPc"))
                    if (!$util.isInteger(message.relPc) && !(message.relPc && $util.isInteger(message.relPc.low) && $util.isInteger(message.relPc.high)))
                        return "relPc: integer|Long expected";
                return null;
            };

            /**
             * Creates a Frame message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof perfetto.protos.Frame
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {perfetto.protos.Frame} Frame
             */
            Frame.fromObject = function fromObject(object) {
                if (object instanceof $root.perfetto.protos.Frame)
                    return object;
                var message = new $root.perfetto.protos.Frame();
                if (object.iid != null)
                    if ($util.Long)
                        (message.iid = $util.Long.fromValue(object.iid)).unsigned = true;
                    else if (typeof object.iid === "string")
                        message.iid = parseInt(object.iid, 10);
                    else if (typeof object.iid === "number")
                        message.iid = object.iid;
                    else if (typeof object.iid === "object")
                        message.iid = new $util.LongBits(object.iid.low >>> 0, object.iid.high >>> 0).toNumber(true);
                if (object.functionNameId != null)
                    if ($util.Long)
                        (message.functionNameId = $util.Long.fromValue(object.functionNameId)).unsigned = true;
                    else if (typeof object.functionNameId === "string")
                        message.functionNameId = parseInt(object.functionNameId, 10);
                    else if (typeof object.functionNameId === "number")
                        message.functionNameId = object.functionNameId;
                    else if (typeof object.functionNameId === "object")
                        message.functionNameId = new $util.LongBits(object.functionNameId.low >>> 0, object.functionNameId.high >>> 0).toNumber(true);
                if (object.mappingId != null)
                    if ($util.Long)
                        (message.mappingId = $util.Long.fromValue(object.mappingId)).unsigned = true;
                    else if (typeof object.mappingId === "string")
                        message.mappingId = parseInt(object.mappingId, 10);
                    else if (typeof object.mappingId === "number")
                        message.mappingId = object.mappingId;
                    else if (typeof object.mappingId === "object")
                        message.mappingId = new $util.LongBits(object.mappingId.low >>> 0, object.mappingId.high >>> 0).toNumber(true);
                if (object.relPc != null)
                    if ($util.Long)
                        (message.relPc = $util.Long.fromValue(object.relPc)).unsigned = true;
                    else if (typeof object.relPc === "string")
                        message.relPc = parseInt(object.relPc, 10);
                    else if (typeof object.relPc === "number")
                        message.relPc = object.relPc;
                    else if (typeof object.relPc === "object")
                        message.relPc = new $util.LongBits(object.relPc.low >>> 0, object.relPc.high >>> 0).toNumber(true);
                return message;
            };

            /**
             * Creates a plain object from a Frame message. Also converts values to other types if specified.
             * @function toObject
             * @memberof perfetto.protos.Frame
             * @static
             * @param {perfetto.protos.Frame} message Frame
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            Frame.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults) {
                    if ($util.Long) {
                        var long = new $util.Long(0, 0, true);
                        object.iid = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                    } else
                        object.iid = options.longs === String ? "0" : 0;
                    if ($util.Long) {
                        var long = new $util.Long(0, 0, true);
                        object.functionNameId = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                    } else
                        object.functionNameId = options.longs === String ? "0" : 0;
                    if ($util.Long) {
                        var long = new $util.Long(0, 0, true);
                        object.mappingId = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                    } else
                        object.mappingId = options.longs === String ? "0" : 0;
                    if ($util.Long) {
                        var long = new $util.Long(0, 0, true);
                        object.relPc = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                    } else
                        object.relPc = options.longs === String ? "0" : 0;
                }
                if (message.iid != null && message.hasOwnProperty("iid"))
                    if (typeof message.iid === "number")
                        object.iid = options.longs === String ? String(message.iid) : message.iid;
                    else
                        object.iid = options.longs === String ? $util.Long.prototype.toString.call(message.iid) : options.longs === Number ? new $util.LongBits(message.iid.low >>> 0, message.iid.high >>> 0).toNumber(true) : message.iid;
                if (message.functionNameId != null && message.hasOwnProperty("functionNameId"))
                    if (typeof message.functionNameId === "number")
                        object.functionNameId = options.longs === String ? String(message.functionNameId) : message.functionNameId;
                    else
                        object.functionNameId = options.longs === String ? $util.Long.prototype.toString.call(message.functionNameId) : options.longs === Number ? new $util.LongBits(message.functionNameId.low >>> 0, message.functionNameId.high >>> 0).toNumber(true) : message.functionNameId;
                if (message.mappingId != null && message.hasOwnProperty("mappingId"))
                    if (typeof message.mappingId === "number")
                        object.mappingId = options.longs === String ? String(message.mappingId) : message.mappingId;
                    else
                        object.mappingId = options.longs === String ? $util.Long.prototype.toString.call(message.mappingId) : options.longs === Number ? new $util.LongBits(message.mappingId.low >>> 0, message.mappingId.high >>> 0).toNumber(true) : message.mappingId;
                if (message.relPc != null && message.hasOwnProperty("relPc"))
                    if (typeof message.relPc === "number")
                        object.relPc = options.longs === String ? String(message.relPc) : message.relPc;
                    else
                        object.relPc = options.longs === String ? $util.Long.prototype.toString.call(message.relPc) : options.longs === Number ? new $util.LongBits(message.relPc.low >>> 0, message.relPc.high >>> 0).toNumber(true) : message.relPc;
                return object;
            };

            /**
             * Converts this Frame to JSON.
             * @function toJSON
             * @memberof perfetto.protos.Frame
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            Frame.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return Frame;
        })();

        protos.FunctionName = (function() {

            /**
             * Properties of a FunctionName.
             * @memberof perfetto.protos
             * @interface IFunctionName
             * @property {number|Long|null} [iid] FunctionName iid
             * @property {Uint8Array|null} [str] FunctionName str
             */

            /**
             * Constructs a new FunctionName.
             * @memberof perfetto.protos
             * @classdesc Represents a FunctionName.
             * @implements IFunctionName
             * @constructor
             * @param {perfetto.protos.IFunctionName=} [properties] Properties to set
             */
            function FunctionName(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * FunctionName iid.
             * @member {number|Long} iid
             * @memberof perfetto.protos.FunctionName
             * @instance
             */
            FunctionName.prototype.iid = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

            /**
             * FunctionName str.
             * @member {Uint8Array} str
             * @memberof perfetto.protos.FunctionName
             * @instance
             */
            FunctionName.prototype.str = $util.newBuffer([]);

            /**
             * Creates a new FunctionName instance using the specified properties.
             * @function create
             * @memberof perfetto.protos.FunctionName
             * @static
             * @param {perfetto.protos.IFunctionName=} [properties] Properties to set
             * @returns {perfetto.protos.FunctionName} FunctionName instance
             */
            FunctionName.create = function create(properties) {
                return new FunctionName(properties);
            };

            /**
             * Encodes the specified FunctionName message. Does not implicitly {@link perfetto.protos.FunctionName.verify|verify} messages.
             * @function encode
             * @memberof perfetto.protos.FunctionName
             * @static
             * @param {perfetto.protos.IFunctionName} message FunctionName message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            FunctionName.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.iid != null && message.hasOwnProperty("iid"))
                    writer.uint32(/* id 1, wireType 0 =*/8).uint64(message.iid);
                if (message.str != null && message.hasOwnProperty("str"))
                    writer.uint32(/* id 2, wireType 2 =*/18).bytes(message.str);
                return writer;
            };

            /**
             * Encodes the specified FunctionName message, length delimited. Does not implicitly {@link perfetto.protos.FunctionName.verify|verify} messages.
             * @function encodeDelimited
             * @memberof perfetto.protos.FunctionName
             * @static
             * @param {perfetto.protos.IFunctionName} message FunctionName message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            FunctionName.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a FunctionName message from the specified reader or buffer.
             * @function decode
             * @memberof perfetto.protos.FunctionName
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {perfetto.protos.FunctionName} FunctionName
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            FunctionName.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.perfetto.protos.FunctionName();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.iid = reader.uint64();
                        break;
                    case 2:
                        message.str = reader.bytes();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a FunctionName message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof perfetto.protos.FunctionName
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {perfetto.protos.FunctionName} FunctionName
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            FunctionName.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a FunctionName message.
             * @function verify
             * @memberof perfetto.protos.FunctionName
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            FunctionName.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.iid != null && message.hasOwnProperty("iid"))
                    if (!$util.isInteger(message.iid) && !(message.iid && $util.isInteger(message.iid.low) && $util.isInteger(message.iid.high)))
                        return "iid: integer|Long expected";
                if (message.str != null && message.hasOwnProperty("str"))
                    if (!(message.str && typeof message.str.length === "number" || $util.isString(message.str)))
                        return "str: buffer expected";
                return null;
            };

            /**
             * Creates a FunctionName message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof perfetto.protos.FunctionName
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {perfetto.protos.FunctionName} FunctionName
             */
            FunctionName.fromObject = function fromObject(object) {
                if (object instanceof $root.perfetto.protos.FunctionName)
                    return object;
                var message = new $root.perfetto.protos.FunctionName();
                if (object.iid != null)
                    if ($util.Long)
                        (message.iid = $util.Long.fromValue(object.iid)).unsigned = true;
                    else if (typeof object.iid === "string")
                        message.iid = parseInt(object.iid, 10);
                    else if (typeof object.iid === "number")
                        message.iid = object.iid;
                    else if (typeof object.iid === "object")
                        message.iid = new $util.LongBits(object.iid.low >>> 0, object.iid.high >>> 0).toNumber(true);
                if (object.str != null)
                    if (typeof object.str === "string")
                        $util.base64.decode(object.str, message.str = $util.newBuffer($util.base64.length(object.str)), 0);
                    else if (object.str.length)
                        message.str = object.str;
                return message;
            };

            /**
             * Creates a plain object from a FunctionName message. Also converts values to other types if specified.
             * @function toObject
             * @memberof perfetto.protos.FunctionName
             * @static
             * @param {perfetto.protos.FunctionName} message FunctionName
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            FunctionName.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults) {
                    if ($util.Long) {
                        var long = new $util.Long(0, 0, true);
                        object.iid = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                    } else
                        object.iid = options.longs === String ? "0" : 0;
                    if (options.bytes === String)
                        object.str = "";
                    else {
                        object.str = [];
                        if (options.bytes !== Array)
                            object.str = $util.newBuffer(object.str);
                    }
                }
                if (message.iid != null && message.hasOwnProperty("iid"))
                    if (typeof message.iid === "number")
                        object.iid = options.longs === String ? String(message.iid) : message.iid;
                    else
                        object.iid = options.longs === String ? $util.Long.prototype.toString.call(message.iid) : options.longs === Number ? new $util.LongBits(message.iid.low >>> 0, message.iid.high >>> 0).toNumber(true) : message.iid;
                if (message.str != null && message.hasOwnProperty("str"))
                    object.str = options.bytes === String ? $util.base64.encode(message.str, 0, message.str.length) : options.bytes === Array ? Array.prototype.slice.call(message.str) : message.str;
                return object;
            };

            /**
             * Converts this FunctionName to JSON.
             * @function toJSON
             * @memberof perfetto.protos.FunctionName
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            FunctionName.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return FunctionName;
        })();

        protos.MappingPath = (function() {

            /**
             * Properties of a MappingPath.
             * @memberof perfetto.protos
             * @interface IMappingPath
             * @property {number|Long|null} [iid] MappingPath iid
             * @property {Uint8Array|null} [str] MappingPath str
             */

            /**
             * Constructs a new MappingPath.
             * @memberof perfetto.protos
             * @classdesc Represents a MappingPath.
             * @implements IMappingPath
             * @constructor
             * @param {perfetto.protos.IMappingPath=} [properties] Properties to set
             */
            function MappingPath(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * MappingPath iid.
             * @member {number|Long} iid
             * @memberof perfetto.protos.MappingPath
             * @instance
             */
            MappingPath.prototype.iid = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

            /**
             * MappingPath str.
             * @member {Uint8Array} str
             * @memberof perfetto.protos.MappingPath
             * @instance
             */
            MappingPath.prototype.str = $util.newBuffer([]);

            /**
             * Creates a new MappingPath instance using the specified properties.
             * @function create
             * @memberof perfetto.protos.MappingPath
             * @static
             * @param {perfetto.protos.IMappingPath=} [properties] Properties to set
             * @returns {perfetto.protos.MappingPath} MappingPath instance
             */
            MappingPath.create = function create(properties) {
                return new MappingPath(properties);
            };

            /**
             * Encodes the specified MappingPath message. Does not implicitly {@link perfetto.protos.MappingPath.verify|verify} messages.
             * @function encode
             * @memberof perfetto.protos.MappingPath
             * @static
             * @param {perfetto.protos.IMappingPath} message MappingPath message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            MappingPath.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.iid != null && message.hasOwnProperty("iid"))
                    writer.uint32(/* id 1, wireType 0 =*/8).uint64(message.iid);
                if (message.str != null && message.hasOwnProperty("str"))
                    writer.uint32(/* id 2, wireType 2 =*/18).bytes(message.str);
                return writer;
            };

            /**
             * Encodes the specified MappingPath message, length delimited. Does not implicitly {@link perfetto.protos.MappingPath.verify|verify} messages.
             * @function encodeDelimited
             * @memberof perfetto.protos.MappingPath
             * @static
             * @param {perfetto.protos.IMappingPath} message MappingPath message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            MappingPath.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a MappingPath message from the specified reader or buffer.
             * @function decode
             * @memberof perfetto.protos.MappingPath
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {perfetto.protos.MappingPath} MappingPath
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            MappingPath.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.perfetto.protos.MappingPath();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.iid = reader.uint64();
                        break;
                    case 2:
                        message.str = reader.bytes();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a MappingPath message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof perfetto.protos.MappingPath
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {perfetto.protos.MappingPath} MappingPath
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            MappingPath.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a MappingPath message.
             * @function verify
             * @memberof perfetto.protos.MappingPath
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            MappingPath.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.iid != null && message.hasOwnProperty("iid"))
                    if (!$util.isInteger(message.iid) && !(message.iid && $util.isInteger(message.iid.low) && $util.isInteger(message.iid.high)))
                        return "iid: integer|Long expected";
                if (message.str != null && message.hasOwnProperty("str"))
                    if (!(message.str && typeof message.str.length === "number" || $util.isString(message.str)))
                        return "str: buffer expected";
                return null;
            };

            /**
             * Creates a MappingPath message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof perfetto.protos.MappingPath
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {perfetto.protos.MappingPath} MappingPath
             */
            MappingPath.fromObject = function fromObject(object) {
                if (object instanceof $root.perfetto.protos.MappingPath)
                    return object;
                var message = new $root.perfetto.protos.MappingPath();
                if (object.iid != null)
                    if ($util.Long)
                        (message.iid = $util.Long.fromValue(object.iid)).unsigned = true;
                    else if (typeof object.iid === "string")
                        message.iid = parseInt(object.iid, 10);
                    else if (typeof object.iid === "number")
                        message.iid = object.iid;
                    else if (typeof object.iid === "object")
                        message.iid = new $util.LongBits(object.iid.low >>> 0, object.iid.high >>> 0).toNumber(true);
                if (object.str != null)
                    if (typeof object.str === "string")
                        $util.base64.decode(object.str, message.str = $util.newBuffer($util.base64.length(object.str)), 0);
                    else if (object.str.length)
                        message.str = object.str;
                return message;
            };

            /**
             * Creates a plain object from a MappingPath message. Also converts values to other types if specified.
             * @function toObject
             * @memberof perfetto.protos.MappingPath
             * @static
             * @param {perfetto.protos.MappingPath} message MappingPath
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            MappingPath.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults) {
                    if ($util.Long) {
                        var long = new $util.Long(0, 0, true);
                        object.iid = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                    } else
                        object.iid = options.longs === String ? "0" : 0;
                    if (options.bytes === String)
                        object.str = "";
                    else {
                        object.str = [];
                        if (options.bytes !== Array)
                            object.str = $util.newBuffer(object.str);
                    }
                }
                if (message.iid != null && message.hasOwnProperty("iid"))
                    if (typeof message.iid === "number")
                        object.iid = options.longs === String ? String(message.iid) : message.iid;
                    else
                        object.iid = options.longs === String ? $util.Long.prototype.toString.call(message.iid) : options.longs === Number ? new $util.LongBits(message.iid.low >>> 0, message.iid.high >>> 0).toNumber(true) : message.iid;
                if (message.str != null && message.hasOwnProperty("str"))
                    object.str = options.bytes === String ? $util.base64.encode(message.str, 0, message.str.length) : options.bytes === Array ? Array.prototype.slice.call(message.str) : message.str;
                return object;
            };

            /**
             * Converts this MappingPath to JSON.
             * @function toJSON
             * @memberof perfetto.protos.MappingPath
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            MappingPath.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return MappingPath;
        })();

        protos.TracePacketDefaults = (function() {

            /**
             * Properties of a TracePacketDefaults.
             * @memberof perfetto.protos
             * @interface ITracePacketDefaults
             * @property {number|Long|null} [timestampClockId] TracePacketDefaults timestampClockId
             */

            /**
             * Constructs a new TracePacketDefaults.
             * @memberof perfetto.protos
             * @classdesc Represents a TracePacketDefaults.
             * @implements ITracePacketDefaults
             * @constructor
             * @param {perfetto.protos.ITracePacketDefaults=} [properties] Properties to set
             */
            function TracePacketDefaults(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * TracePacketDefaults timestampClockId.
             * @member {number|Long} timestampClockId
             * @memberof perfetto.protos.TracePacketDefaults
             * @instance
             */
            TracePacketDefaults.prototype.timestampClockId = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

            /**
             * Creates a new TracePacketDefaults instance using the specified properties.
             * @function create
             * @memberof perfetto.protos.TracePacketDefaults
             * @static
             * @param {perfetto.protos.ITracePacketDefaults=} [properties] Properties to set
             * @returns {perfetto.protos.TracePacketDefaults} TracePacketDefaults instance
             */
            TracePacketDefaults.create = function create(properties) {
                return new TracePacketDefaults(properties);
            };

            /**
             * Encodes the specified TracePacketDefaults message. Does not implicitly {@link perfetto.protos.TracePacketDefaults.verify|verify} messages.
             * @function encode
             * @memberof perfetto.protos.TracePacketDefaults
             * @static
             * @param {perfetto.protos.ITracePacketDefaults} message TracePacketDefaults message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            TracePacketDefaults.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.timestampClockId != null && message.hasOwnProperty("timestampClockId"))
                    writer.uint32(/* id 58, wireType 0 =*/464).uint64(message.timestampClockId);
                return writer;
            };

            /**
             * Encodes the specified TracePacketDefaults message, length delimited. Does not implicitly {@link perfetto.protos.TracePacketDefaults.verify|verify} messages.
             * @function encodeDelimited
             * @memberof perfetto.protos.TracePacketDefaults
             * @static
             * @param {perfetto.protos.ITracePacketDefaults} message TracePacketDefaults message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            TracePacketDefaults.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a TracePacketDefaults message from the specified reader or buffer.
             * @function decode
             * @memberof perfetto.protos.TracePacketDefaults
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {perfetto.protos.TracePacketDefaults} TracePacketDefaults
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            TracePacketDefaults.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.perfetto.protos.TracePacketDefaults();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 58:
                        message.timestampClockId = reader.uint64();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a TracePacketDefaults message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof perfetto.protos.TracePacketDefaults
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {perfetto.protos.TracePacketDefaults} TracePacketDefaults
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            TracePacketDefaults.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a TracePacketDefaults message.
             * @function verify
             * @memberof perfetto.protos.TracePacketDefaults
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            TracePacketDefaults.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.timestampClockId != null && message.hasOwnProperty("timestampClockId"))
                    if (!$util.isInteger(message.timestampClockId) && !(message.timestampClockId && $util.isInteger(message.timestampClockId.low) && $util.isInteger(message.timestampClockId.high)))
                        return "timestampClockId: integer|Long expected";
                return null;
            };

            /**
             * Creates a TracePacketDefaults message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof perfetto.protos.TracePacketDefaults
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {perfetto.protos.TracePacketDefaults} TracePacketDefaults
             */
            TracePacketDefaults.fromObject = function fromObject(object) {
                if (object instanceof $root.perfetto.protos.TracePacketDefaults)
                    return object;
                var message = new $root.perfetto.protos.TracePacketDefaults();
                if (object.timestampClockId != null)
                    if ($util.Long)
                        (message.timestampClockId = $util.Long.fromValue(object.timestampClockId)).unsigned = true;
                    else if (typeof object.timestampClockId === "string")
                        message.timestampClockId = parseInt(object.timestampClockId, 10);
                    else if (typeof object.timestampClockId === "number")
                        message.timestampClockId = object.timestampClockId;
                    else if (typeof object.timestampClockId === "object")
                        message.timestampClockId = new $util.LongBits(object.timestampClockId.low >>> 0, object.timestampClockId.high >>> 0).toNumber(true);
                return message;
            };

            /**
             * Creates a plain object from a TracePacketDefaults message. Also converts values to other types if specified.
             * @function toObject
             * @memberof perfetto.protos.TracePacketDefaults
             * @static
             * @param {perfetto.protos.TracePacketDefaults} message TracePacketDefaults
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            TracePacketDefaults.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults)
                    if ($util.Long) {
                        var long = new $util.Long(0, 0, true);
                        object.timestampClockId = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                    } else
                        object.timestampClockId = options.longs === String ? "0" : 0;
                if (message.timestampClockId != null && message.hasOwnProperty("timestampClockId"))
                    if (typeof message.timestampClockId === "number")
                        object.timestampClockId = options.longs === String ? String(message.timestampClockId) : message.timestampClockId;
                    else
                        object.timestampClockId = options.longs === String ? $util.Long.prototype.toString.call(message.timestampClockId) : options.longs === Number ? new $util.LongBits(message.timestampClockId.low >>> 0, message.timestampClockId.high >>> 0).toNumber(true) : message.timestampClockId;
                return object;
            };

            /**
             * Converts this TracePacketDefaults to JSON.
             * @function toJSON
             * @memberof perfetto.protos.TracePacketDefaults
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            TracePacketDefaults.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return TracePacketDefaults;
        })();

        return protos;
    })();

    return perfetto;
})();

module.exports = $root;
