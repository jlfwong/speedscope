// THIS FILE WAS AUTOMATICALLY GENERATED. DO NOT MODIFY THIS FILE MANUALLY.
//
// To regenerate this file, run the following in the repository root:
//
//    node node_modules/protobufjs/cli/bin/pbjs -t static-module -w commonjs -o src/import/profile.proto.js src/import/profile.proto
//
// Then prepend this comment to the result.
/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
'use strict'

var $protobuf = require('protobufjs/minimal')

// Common aliases
var $Reader = $protobuf.Reader,
  $Writer = $protobuf.Writer,
  $util = $protobuf.util

// Exported root namespace
var $root = $protobuf.roots['default'] || ($protobuf.roots['default'] = {})

$root.perftools = (function() {
  /**
   * Namespace perftools.
   * @exports perftools
   * @namespace
   */
  var perftools = {}

  perftools.profiles = (function() {
    /**
     * Namespace profiles.
     * @memberof perftools
     * @namespace
     */
    var profiles = {}

    profiles.Profile = (function() {
      /**
       * Properties of a Profile.
       * @memberof perftools.profiles
       * @interface IProfile
       * @property {Array.<perftools.profiles.IValueType>|null} [sampleType] Profile sampleType
       * @property {Array.<perftools.profiles.ISample>|null} [sample] Profile sample
       * @property {Array.<perftools.profiles.IMapping>|null} [mapping] Profile mapping
       * @property {Array.<perftools.profiles.ILocation>|null} [location] Profile location
       * @property {Array.<perftools.profiles.IFunction>|null} ["function"] Profile function
       * @property {Array.<string>|null} [stringTable] Profile stringTable
       * @property {number|Long|null} [dropFrames] Profile dropFrames
       * @property {number|Long|null} [keepFrames] Profile keepFrames
       * @property {number|Long|null} [timeNanos] Profile timeNanos
       * @property {number|Long|null} [durationNanos] Profile durationNanos
       * @property {perftools.profiles.IValueType|null} [periodType] Profile periodType
       * @property {number|Long|null} [period] Profile period
       * @property {Array.<number|Long>|null} [comment] Profile comment
       * @property {number|Long|null} [defaultSampleType] Profile defaultSampleType
       */

      /**
       * Constructs a new Profile.
       * @memberof perftools.profiles
       * @classdesc Represents a Profile.
       * @implements IProfile
       * @constructor
       * @param {perftools.profiles.IProfile=} [properties] Properties to set
       */
      function Profile(properties) {
        this.sampleType = []
        this.sample = []
        this.mapping = []
        this.location = []
        this['function'] = []
        this.stringTable = []
        this.comment = []
        if (properties)
          for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]]
      }

      /**
       * Profile sampleType.
       * @member {Array.<perftools.profiles.IValueType>} sampleType
       * @memberof perftools.profiles.Profile
       * @instance
       */
      Profile.prototype.sampleType = $util.emptyArray

      /**
       * Profile sample.
       * @member {Array.<perftools.profiles.ISample>} sample
       * @memberof perftools.profiles.Profile
       * @instance
       */
      Profile.prototype.sample = $util.emptyArray

      /**
       * Profile mapping.
       * @member {Array.<perftools.profiles.IMapping>} mapping
       * @memberof perftools.profiles.Profile
       * @instance
       */
      Profile.prototype.mapping = $util.emptyArray

      /**
       * Profile location.
       * @member {Array.<perftools.profiles.ILocation>} location
       * @memberof perftools.profiles.Profile
       * @instance
       */
      Profile.prototype.location = $util.emptyArray

      /**
       * Profile function.
       * @member {Array.<perftools.profiles.IFunction>} function
       * @memberof perftools.profiles.Profile
       * @instance
       */
      Profile.prototype['function'] = $util.emptyArray

      /**
       * Profile stringTable.
       * @member {Array.<string>} stringTable
       * @memberof perftools.profiles.Profile
       * @instance
       */
      Profile.prototype.stringTable = $util.emptyArray

      /**
       * Profile dropFrames.
       * @member {number|Long} dropFrames
       * @memberof perftools.profiles.Profile
       * @instance
       */
      Profile.prototype.dropFrames = $util.Long ? $util.Long.fromBits(0, 0, false) : 0

      /**
       * Profile keepFrames.
       * @member {number|Long} keepFrames
       * @memberof perftools.profiles.Profile
       * @instance
       */
      Profile.prototype.keepFrames = $util.Long ? $util.Long.fromBits(0, 0, false) : 0

      /**
       * Profile timeNanos.
       * @member {number|Long} timeNanos
       * @memberof perftools.profiles.Profile
       * @instance
       */
      Profile.prototype.timeNanos = $util.Long ? $util.Long.fromBits(0, 0, false) : 0

      /**
       * Profile durationNanos.
       * @member {number|Long} durationNanos
       * @memberof perftools.profiles.Profile
       * @instance
       */
      Profile.prototype.durationNanos = $util.Long ? $util.Long.fromBits(0, 0, false) : 0

      /**
       * Profile periodType.
       * @member {perftools.profiles.IValueType|null|undefined} periodType
       * @memberof perftools.profiles.Profile
       * @instance
       */
      Profile.prototype.periodType = null

      /**
       * Profile period.
       * @member {number|Long} period
       * @memberof perftools.profiles.Profile
       * @instance
       */
      Profile.prototype.period = $util.Long ? $util.Long.fromBits(0, 0, false) : 0

      /**
       * Profile comment.
       * @member {Array.<number|Long>} comment
       * @memberof perftools.profiles.Profile
       * @instance
       */
      Profile.prototype.comment = $util.emptyArray

      /**
       * Profile defaultSampleType.
       * @member {number|Long} defaultSampleType
       * @memberof perftools.profiles.Profile
       * @instance
       */
      Profile.prototype.defaultSampleType = $util.Long ? $util.Long.fromBits(0, 0, false) : 0

      /**
       * Creates a new Profile instance using the specified properties.
       * @function create
       * @memberof perftools.profiles.Profile
       * @static
       * @param {perftools.profiles.IProfile=} [properties] Properties to set
       * @returns {perftools.profiles.Profile} Profile instance
       */
      Profile.create = function create(properties) {
        return new Profile(properties)
      }

      /**
       * Encodes the specified Profile message. Does not implicitly {@link perftools.profiles.Profile.verify|verify} messages.
       * @function encode
       * @memberof perftools.profiles.Profile
       * @static
       * @param {perftools.profiles.IProfile} message Profile message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      Profile.encode = function encode(message, writer) {
        if (!writer) writer = $Writer.create()
        if (message.sampleType != null && message.sampleType.length)
          for (var i = 0; i < message.sampleType.length; ++i)
            $root.perftools.profiles.ValueType.encode(
              message.sampleType[i],
              writer.uint32(/* id 1, wireType 2 =*/ 10).fork(),
            ).ldelim()
        if (message.sample != null && message.sample.length)
          for (var i = 0; i < message.sample.length; ++i)
            $root.perftools.profiles.Sample.encode(
              message.sample[i],
              writer.uint32(/* id 2, wireType 2 =*/ 18).fork(),
            ).ldelim()
        if (message.mapping != null && message.mapping.length)
          for (var i = 0; i < message.mapping.length; ++i)
            $root.perftools.profiles.Mapping.encode(
              message.mapping[i],
              writer.uint32(/* id 3, wireType 2 =*/ 26).fork(),
            ).ldelim()
        if (message.location != null && message.location.length)
          for (var i = 0; i < message.location.length; ++i)
            $root.perftools.profiles.Location.encode(
              message.location[i],
              writer.uint32(/* id 4, wireType 2 =*/ 34).fork(),
            ).ldelim()
        if (message['function'] != null && message['function'].length)
          for (var i = 0; i < message['function'].length; ++i)
            $root.perftools.profiles.Function.encode(
              message['function'][i],
              writer.uint32(/* id 5, wireType 2 =*/ 42).fork(),
            ).ldelim()
        if (message.stringTable != null && message.stringTable.length)
          for (var i = 0; i < message.stringTable.length; ++i)
            writer.uint32(/* id 6, wireType 2 =*/ 50).string(message.stringTable[i])
        if (message.dropFrames != null && message.hasOwnProperty('dropFrames'))
          writer.uint32(/* id 7, wireType 0 =*/ 56).int64(message.dropFrames)
        if (message.keepFrames != null && message.hasOwnProperty('keepFrames'))
          writer.uint32(/* id 8, wireType 0 =*/ 64).int64(message.keepFrames)
        if (message.timeNanos != null && message.hasOwnProperty('timeNanos'))
          writer.uint32(/* id 9, wireType 0 =*/ 72).int64(message.timeNanos)
        if (message.durationNanos != null && message.hasOwnProperty('durationNanos'))
          writer.uint32(/* id 10, wireType 0 =*/ 80).int64(message.durationNanos)
        if (message.periodType != null && message.hasOwnProperty('periodType'))
          $root.perftools.profiles.ValueType.encode(
            message.periodType,
            writer.uint32(/* id 11, wireType 2 =*/ 90).fork(),
          ).ldelim()
        if (message.period != null && message.hasOwnProperty('period'))
          writer.uint32(/* id 12, wireType 0 =*/ 96).int64(message.period)
        if (message.comment != null && message.comment.length) {
          writer.uint32(/* id 13, wireType 2 =*/ 106).fork()
          for (var i = 0; i < message.comment.length; ++i) writer.int64(message.comment[i])
          writer.ldelim()
        }
        if (message.defaultSampleType != null && message.hasOwnProperty('defaultSampleType'))
          writer.uint32(/* id 14, wireType 0 =*/ 112).int64(message.defaultSampleType)
        return writer
      }

      /**
       * Encodes the specified Profile message, length delimited. Does not implicitly {@link perftools.profiles.Profile.verify|verify} messages.
       * @function encodeDelimited
       * @memberof perftools.profiles.Profile
       * @static
       * @param {perftools.profiles.IProfile} message Profile message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      Profile.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim()
      }

      /**
       * Decodes a Profile message from the specified reader or buffer.
       * @function decode
       * @memberof perftools.profiles.Profile
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @param {number} [length] Message length if known beforehand
       * @returns {perftools.profiles.Profile} Profile
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      Profile.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader)) reader = $Reader.create(reader)
        var end = length === undefined ? reader.len : reader.pos + length,
          message = new $root.perftools.profiles.Profile()
        while (reader.pos < end) {
          var tag = reader.uint32()
          switch (tag >>> 3) {
            case 1:
              if (!(message.sampleType && message.sampleType.length)) message.sampleType = []
              message.sampleType.push(
                $root.perftools.profiles.ValueType.decode(reader, reader.uint32()),
              )
              break
            case 2:
              if (!(message.sample && message.sample.length)) message.sample = []
              message.sample.push($root.perftools.profiles.Sample.decode(reader, reader.uint32()))
              break
            case 3:
              if (!(message.mapping && message.mapping.length)) message.mapping = []
              message.mapping.push($root.perftools.profiles.Mapping.decode(reader, reader.uint32()))
              break
            case 4:
              if (!(message.location && message.location.length)) message.location = []
              message.location.push(
                $root.perftools.profiles.Location.decode(reader, reader.uint32()),
              )
              break
            case 5:
              if (!(message['function'] && message['function'].length)) message['function'] = []
              message['function'].push(
                $root.perftools.profiles.Function.decode(reader, reader.uint32()),
              )
              break
            case 6:
              if (!(message.stringTable && message.stringTable.length)) message.stringTable = []
              message.stringTable.push(reader.string())
              break
            case 7:
              message.dropFrames = reader.int64()
              break
            case 8:
              message.keepFrames = reader.int64()
              break
            case 9:
              message.timeNanos = reader.int64()
              break
            case 10:
              message.durationNanos = reader.int64()
              break
            case 11:
              message.periodType = $root.perftools.profiles.ValueType.decode(
                reader,
                reader.uint32(),
              )
              break
            case 12:
              message.period = reader.int64()
              break
            case 13:
              if (!(message.comment && message.comment.length)) message.comment = []
              if ((tag & 7) === 2) {
                var end2 = reader.uint32() + reader.pos
                while (reader.pos < end2) message.comment.push(reader.int64())
              } else message.comment.push(reader.int64())
              break
            case 14:
              message.defaultSampleType = reader.int64()
              break
            default:
              reader.skipType(tag & 7)
              break
          }
        }
        return message
      }

      /**
       * Decodes a Profile message from the specified reader or buffer, length delimited.
       * @function decodeDelimited
       * @memberof perftools.profiles.Profile
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @returns {perftools.profiles.Profile} Profile
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      Profile.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader)) reader = new $Reader(reader)
        return this.decode(reader, reader.uint32())
      }

      /**
       * Verifies a Profile message.
       * @function verify
       * @memberof perftools.profiles.Profile
       * @static
       * @param {Object.<string,*>} message Plain object to verify
       * @returns {string|null} `null` if valid, otherwise the reason why it is not
       */
      Profile.verify = function verify(message) {
        if (typeof message !== 'object' || message === null) return 'object expected'
        if (message.sampleType != null && message.hasOwnProperty('sampleType')) {
          if (!Array.isArray(message.sampleType)) return 'sampleType: array expected'
          for (var i = 0; i < message.sampleType.length; ++i) {
            var error = $root.perftools.profiles.ValueType.verify(message.sampleType[i])
            if (error) return 'sampleType.' + error
          }
        }
        if (message.sample != null && message.hasOwnProperty('sample')) {
          if (!Array.isArray(message.sample)) return 'sample: array expected'
          for (var i = 0; i < message.sample.length; ++i) {
            var error = $root.perftools.profiles.Sample.verify(message.sample[i])
            if (error) return 'sample.' + error
          }
        }
        if (message.mapping != null && message.hasOwnProperty('mapping')) {
          if (!Array.isArray(message.mapping)) return 'mapping: array expected'
          for (var i = 0; i < message.mapping.length; ++i) {
            var error = $root.perftools.profiles.Mapping.verify(message.mapping[i])
            if (error) return 'mapping.' + error
          }
        }
        if (message.location != null && message.hasOwnProperty('location')) {
          if (!Array.isArray(message.location)) return 'location: array expected'
          for (var i = 0; i < message.location.length; ++i) {
            var error = $root.perftools.profiles.Location.verify(message.location[i])
            if (error) return 'location.' + error
          }
        }
        if (message['function'] != null && message.hasOwnProperty('function')) {
          if (!Array.isArray(message['function'])) return 'function: array expected'
          for (var i = 0; i < message['function'].length; ++i) {
            var error = $root.perftools.profiles.Function.verify(message['function'][i])
            if (error) return 'function.' + error
          }
        }
        if (message.stringTable != null && message.hasOwnProperty('stringTable')) {
          if (!Array.isArray(message.stringTable)) return 'stringTable: array expected'
          for (var i = 0; i < message.stringTable.length; ++i)
            if (!$util.isString(message.stringTable[i])) return 'stringTable: string[] expected'
        }
        if (message.dropFrames != null && message.hasOwnProperty('dropFrames'))
          if (
            !$util.isInteger(message.dropFrames) &&
            !(
              message.dropFrames &&
              $util.isInteger(message.dropFrames.low) &&
              $util.isInteger(message.dropFrames.high)
            )
          )
            return 'dropFrames: integer|Long expected'
        if (message.keepFrames != null && message.hasOwnProperty('keepFrames'))
          if (
            !$util.isInteger(message.keepFrames) &&
            !(
              message.keepFrames &&
              $util.isInteger(message.keepFrames.low) &&
              $util.isInteger(message.keepFrames.high)
            )
          )
            return 'keepFrames: integer|Long expected'
        if (message.timeNanos != null && message.hasOwnProperty('timeNanos'))
          if (
            !$util.isInteger(message.timeNanos) &&
            !(
              message.timeNanos &&
              $util.isInteger(message.timeNanos.low) &&
              $util.isInteger(message.timeNanos.high)
            )
          )
            return 'timeNanos: integer|Long expected'
        if (message.durationNanos != null && message.hasOwnProperty('durationNanos'))
          if (
            !$util.isInteger(message.durationNanos) &&
            !(
              message.durationNanos &&
              $util.isInteger(message.durationNanos.low) &&
              $util.isInteger(message.durationNanos.high)
            )
          )
            return 'durationNanos: integer|Long expected'
        if (message.periodType != null && message.hasOwnProperty('periodType')) {
          var error = $root.perftools.profiles.ValueType.verify(message.periodType)
          if (error) return 'periodType.' + error
        }
        if (message.period != null && message.hasOwnProperty('period'))
          if (
            !$util.isInteger(message.period) &&
            !(
              message.period &&
              $util.isInteger(message.period.low) &&
              $util.isInteger(message.period.high)
            )
          )
            return 'period: integer|Long expected'
        if (message.comment != null && message.hasOwnProperty('comment')) {
          if (!Array.isArray(message.comment)) return 'comment: array expected'
          for (var i = 0; i < message.comment.length; ++i)
            if (
              !$util.isInteger(message.comment[i]) &&
              !(
                message.comment[i] &&
                $util.isInteger(message.comment[i].low) &&
                $util.isInteger(message.comment[i].high)
              )
            )
              return 'comment: integer|Long[] expected'
        }
        if (message.defaultSampleType != null && message.hasOwnProperty('defaultSampleType'))
          if (
            !$util.isInteger(message.defaultSampleType) &&
            !(
              message.defaultSampleType &&
              $util.isInteger(message.defaultSampleType.low) &&
              $util.isInteger(message.defaultSampleType.high)
            )
          )
            return 'defaultSampleType: integer|Long expected'
        return null
      }

      /**
       * Creates a Profile message from a plain object. Also converts values to their respective internal types.
       * @function fromObject
       * @memberof perftools.profiles.Profile
       * @static
       * @param {Object.<string,*>} object Plain object
       * @returns {perftools.profiles.Profile} Profile
       */
      Profile.fromObject = function fromObject(object) {
        if (object instanceof $root.perftools.profiles.Profile) return object
        var message = new $root.perftools.profiles.Profile()
        if (object.sampleType) {
          if (!Array.isArray(object.sampleType))
            throw TypeError('.perftools.profiles.Profile.sampleType: array expected')
          message.sampleType = []
          for (var i = 0; i < object.sampleType.length; ++i) {
            if (typeof object.sampleType[i] !== 'object')
              throw TypeError('.perftools.profiles.Profile.sampleType: object expected')
            message.sampleType[i] = $root.perftools.profiles.ValueType.fromObject(
              object.sampleType[i],
            )
          }
        }
        if (object.sample) {
          if (!Array.isArray(object.sample))
            throw TypeError('.perftools.profiles.Profile.sample: array expected')
          message.sample = []
          for (var i = 0; i < object.sample.length; ++i) {
            if (typeof object.sample[i] !== 'object')
              throw TypeError('.perftools.profiles.Profile.sample: object expected')
            message.sample[i] = $root.perftools.profiles.Sample.fromObject(object.sample[i])
          }
        }
        if (object.mapping) {
          if (!Array.isArray(object.mapping))
            throw TypeError('.perftools.profiles.Profile.mapping: array expected')
          message.mapping = []
          for (var i = 0; i < object.mapping.length; ++i) {
            if (typeof object.mapping[i] !== 'object')
              throw TypeError('.perftools.profiles.Profile.mapping: object expected')
            message.mapping[i] = $root.perftools.profiles.Mapping.fromObject(object.mapping[i])
          }
        }
        if (object.location) {
          if (!Array.isArray(object.location))
            throw TypeError('.perftools.profiles.Profile.location: array expected')
          message.location = []
          for (var i = 0; i < object.location.length; ++i) {
            if (typeof object.location[i] !== 'object')
              throw TypeError('.perftools.profiles.Profile.location: object expected')
            message.location[i] = $root.perftools.profiles.Location.fromObject(object.location[i])
          }
        }
        if (object['function']) {
          if (!Array.isArray(object['function']))
            throw TypeError('.perftools.profiles.Profile.function: array expected')
          message['function'] = []
          for (var i = 0; i < object['function'].length; ++i) {
            if (typeof object['function'][i] !== 'object')
              throw TypeError('.perftools.profiles.Profile.function: object expected')
            message['function'][i] = $root.perftools.profiles.Function.fromObject(
              object['function'][i],
            )
          }
        }
        if (object.stringTable) {
          if (!Array.isArray(object.stringTable))
            throw TypeError('.perftools.profiles.Profile.stringTable: array expected')
          message.stringTable = []
          for (var i = 0; i < object.stringTable.length; ++i)
            message.stringTable[i] = String(object.stringTable[i])
        }
        if (object.dropFrames != null)
          if ($util.Long)
            (message.dropFrames = $util.Long.fromValue(object.dropFrames)).unsigned = false
          else if (typeof object.dropFrames === 'string')
            message.dropFrames = parseInt(object.dropFrames, 10)
          else if (typeof object.dropFrames === 'number') message.dropFrames = object.dropFrames
          else if (typeof object.dropFrames === 'object')
            message.dropFrames = new $util.LongBits(
              object.dropFrames.low >>> 0,
              object.dropFrames.high >>> 0,
            ).toNumber()
        if (object.keepFrames != null)
          if ($util.Long)
            (message.keepFrames = $util.Long.fromValue(object.keepFrames)).unsigned = false
          else if (typeof object.keepFrames === 'string')
            message.keepFrames = parseInt(object.keepFrames, 10)
          else if (typeof object.keepFrames === 'number') message.keepFrames = object.keepFrames
          else if (typeof object.keepFrames === 'object')
            message.keepFrames = new $util.LongBits(
              object.keepFrames.low >>> 0,
              object.keepFrames.high >>> 0,
            ).toNumber()
        if (object.timeNanos != null)
          if ($util.Long)
            (message.timeNanos = $util.Long.fromValue(object.timeNanos)).unsigned = false
          else if (typeof object.timeNanos === 'string')
            message.timeNanos = parseInt(object.timeNanos, 10)
          else if (typeof object.timeNanos === 'number') message.timeNanos = object.timeNanos
          else if (typeof object.timeNanos === 'object')
            message.timeNanos = new $util.LongBits(
              object.timeNanos.low >>> 0,
              object.timeNanos.high >>> 0,
            ).toNumber()
        if (object.durationNanos != null)
          if ($util.Long)
            (message.durationNanos = $util.Long.fromValue(object.durationNanos)).unsigned = false
          else if (typeof object.durationNanos === 'string')
            message.durationNanos = parseInt(object.durationNanos, 10)
          else if (typeof object.durationNanos === 'number')
            message.durationNanos = object.durationNanos
          else if (typeof object.durationNanos === 'object')
            message.durationNanos = new $util.LongBits(
              object.durationNanos.low >>> 0,
              object.durationNanos.high >>> 0,
            ).toNumber()
        if (object.periodType != null) {
          if (typeof object.periodType !== 'object')
            throw TypeError('.perftools.profiles.Profile.periodType: object expected')
          message.periodType = $root.perftools.profiles.ValueType.fromObject(object.periodType)
        }
        if (object.period != null)
          if ($util.Long) (message.period = $util.Long.fromValue(object.period)).unsigned = false
          else if (typeof object.period === 'string') message.period = parseInt(object.period, 10)
          else if (typeof object.period === 'number') message.period = object.period
          else if (typeof object.period === 'object')
            message.period = new $util.LongBits(
              object.period.low >>> 0,
              object.period.high >>> 0,
            ).toNumber()
        if (object.comment) {
          if (!Array.isArray(object.comment))
            throw TypeError('.perftools.profiles.Profile.comment: array expected')
          message.comment = []
          for (var i = 0; i < object.comment.length; ++i)
            if ($util.Long)
              (message.comment[i] = $util.Long.fromValue(object.comment[i])).unsigned = false
            else if (typeof object.comment[i] === 'string')
              message.comment[i] = parseInt(object.comment[i], 10)
            else if (typeof object.comment[i] === 'number') message.comment[i] = object.comment[i]
            else if (typeof object.comment[i] === 'object')
              message.comment[i] = new $util.LongBits(
                object.comment[i].low >>> 0,
                object.comment[i].high >>> 0,
              ).toNumber()
        }
        if (object.defaultSampleType != null)
          if ($util.Long)
            (message.defaultSampleType = $util.Long.fromValue(
              object.defaultSampleType,
            )).unsigned = false
          else if (typeof object.defaultSampleType === 'string')
            message.defaultSampleType = parseInt(object.defaultSampleType, 10)
          else if (typeof object.defaultSampleType === 'number')
            message.defaultSampleType = object.defaultSampleType
          else if (typeof object.defaultSampleType === 'object')
            message.defaultSampleType = new $util.LongBits(
              object.defaultSampleType.low >>> 0,
              object.defaultSampleType.high >>> 0,
            ).toNumber()
        return message
      }

      /**
       * Creates a plain object from a Profile message. Also converts values to other types if specified.
       * @function toObject
       * @memberof perftools.profiles.Profile
       * @static
       * @param {perftools.profiles.Profile} message Profile
       * @param {$protobuf.IConversionOptions} [options] Conversion options
       * @returns {Object.<string,*>} Plain object
       */
      Profile.toObject = function toObject(message, options) {
        if (!options) options = {}
        var object = {}
        if (options.arrays || options.defaults) {
          object.sampleType = []
          object.sample = []
          object.mapping = []
          object.location = []
          object['function'] = []
          object.stringTable = []
          object.comment = []
        }
        if (options.defaults) {
          if ($util.Long) {
            var long = new $util.Long(0, 0, false)
            object.dropFrames =
              options.longs === String
                ? long.toString()
                : options.longs === Number
                  ? long.toNumber()
                  : long
          } else object.dropFrames = options.longs === String ? '0' : 0
          if ($util.Long) {
            var long = new $util.Long(0, 0, false)
            object.keepFrames =
              options.longs === String
                ? long.toString()
                : options.longs === Number
                  ? long.toNumber()
                  : long
          } else object.keepFrames = options.longs === String ? '0' : 0
          if ($util.Long) {
            var long = new $util.Long(0, 0, false)
            object.timeNanos =
              options.longs === String
                ? long.toString()
                : options.longs === Number
                  ? long.toNumber()
                  : long
          } else object.timeNanos = options.longs === String ? '0' : 0
          if ($util.Long) {
            var long = new $util.Long(0, 0, false)
            object.durationNanos =
              options.longs === String
                ? long.toString()
                : options.longs === Number
                  ? long.toNumber()
                  : long
          } else object.durationNanos = options.longs === String ? '0' : 0
          object.periodType = null
          if ($util.Long) {
            var long = new $util.Long(0, 0, false)
            object.period =
              options.longs === String
                ? long.toString()
                : options.longs === Number
                  ? long.toNumber()
                  : long
          } else object.period = options.longs === String ? '0' : 0
          if ($util.Long) {
            var long = new $util.Long(0, 0, false)
            object.defaultSampleType =
              options.longs === String
                ? long.toString()
                : options.longs === Number
                  ? long.toNumber()
                  : long
          } else object.defaultSampleType = options.longs === String ? '0' : 0
        }
        if (message.sampleType && message.sampleType.length) {
          object.sampleType = []
          for (var j = 0; j < message.sampleType.length; ++j)
            object.sampleType[j] = $root.perftools.profiles.ValueType.toObject(
              message.sampleType[j],
              options,
            )
        }
        if (message.sample && message.sample.length) {
          object.sample = []
          for (var j = 0; j < message.sample.length; ++j)
            object.sample[j] = $root.perftools.profiles.Sample.toObject(message.sample[j], options)
        }
        if (message.mapping && message.mapping.length) {
          object.mapping = []
          for (var j = 0; j < message.mapping.length; ++j)
            object.mapping[j] = $root.perftools.profiles.Mapping.toObject(
              message.mapping[j],
              options,
            )
        }
        if (message.location && message.location.length) {
          object.location = []
          for (var j = 0; j < message.location.length; ++j)
            object.location[j] = $root.perftools.profiles.Location.toObject(
              message.location[j],
              options,
            )
        }
        if (message['function'] && message['function'].length) {
          object['function'] = []
          for (var j = 0; j < message['function'].length; ++j)
            object['function'][j] = $root.perftools.profiles.Function.toObject(
              message['function'][j],
              options,
            )
        }
        if (message.stringTable && message.stringTable.length) {
          object.stringTable = []
          for (var j = 0; j < message.stringTable.length; ++j)
            object.stringTable[j] = message.stringTable[j]
        }
        if (message.dropFrames != null && message.hasOwnProperty('dropFrames'))
          if (typeof message.dropFrames === 'number')
            object.dropFrames =
              options.longs === String ? String(message.dropFrames) : message.dropFrames
          else
            object.dropFrames =
              options.longs === String
                ? $util.Long.prototype.toString.call(message.dropFrames)
                : options.longs === Number
                  ? new $util.LongBits(
                      message.dropFrames.low >>> 0,
                      message.dropFrames.high >>> 0,
                    ).toNumber()
                  : message.dropFrames
        if (message.keepFrames != null && message.hasOwnProperty('keepFrames'))
          if (typeof message.keepFrames === 'number')
            object.keepFrames =
              options.longs === String ? String(message.keepFrames) : message.keepFrames
          else
            object.keepFrames =
              options.longs === String
                ? $util.Long.prototype.toString.call(message.keepFrames)
                : options.longs === Number
                  ? new $util.LongBits(
                      message.keepFrames.low >>> 0,
                      message.keepFrames.high >>> 0,
                    ).toNumber()
                  : message.keepFrames
        if (message.timeNanos != null && message.hasOwnProperty('timeNanos'))
          if (typeof message.timeNanos === 'number')
            object.timeNanos =
              options.longs === String ? String(message.timeNanos) : message.timeNanos
          else
            object.timeNanos =
              options.longs === String
                ? $util.Long.prototype.toString.call(message.timeNanos)
                : options.longs === Number
                  ? new $util.LongBits(
                      message.timeNanos.low >>> 0,
                      message.timeNanos.high >>> 0,
                    ).toNumber()
                  : message.timeNanos
        if (message.durationNanos != null && message.hasOwnProperty('durationNanos'))
          if (typeof message.durationNanos === 'number')
            object.durationNanos =
              options.longs === String ? String(message.durationNanos) : message.durationNanos
          else
            object.durationNanos =
              options.longs === String
                ? $util.Long.prototype.toString.call(message.durationNanos)
                : options.longs === Number
                  ? new $util.LongBits(
                      message.durationNanos.low >>> 0,
                      message.durationNanos.high >>> 0,
                    ).toNumber()
                  : message.durationNanos
        if (message.periodType != null && message.hasOwnProperty('periodType'))
          object.periodType = $root.perftools.profiles.ValueType.toObject(
            message.periodType,
            options,
          )
        if (message.period != null && message.hasOwnProperty('period'))
          if (typeof message.period === 'number')
            object.period = options.longs === String ? String(message.period) : message.period
          else
            object.period =
              options.longs === String
                ? $util.Long.prototype.toString.call(message.period)
                : options.longs === Number
                  ? new $util.LongBits(
                      message.period.low >>> 0,
                      message.period.high >>> 0,
                    ).toNumber()
                  : message.period
        if (message.comment && message.comment.length) {
          object.comment = []
          for (var j = 0; j < message.comment.length; ++j)
            if (typeof message.comment[j] === 'number')
              object.comment[j] =
                options.longs === String ? String(message.comment[j]) : message.comment[j]
            else
              object.comment[j] =
                options.longs === String
                  ? $util.Long.prototype.toString.call(message.comment[j])
                  : options.longs === Number
                    ? new $util.LongBits(
                        message.comment[j].low >>> 0,
                        message.comment[j].high >>> 0,
                      ).toNumber()
                    : message.comment[j]
        }
        if (message.defaultSampleType != null && message.hasOwnProperty('defaultSampleType'))
          if (typeof message.defaultSampleType === 'number')
            object.defaultSampleType =
              options.longs === String
                ? String(message.defaultSampleType)
                : message.defaultSampleType
          else
            object.defaultSampleType =
              options.longs === String
                ? $util.Long.prototype.toString.call(message.defaultSampleType)
                : options.longs === Number
                  ? new $util.LongBits(
                      message.defaultSampleType.low >>> 0,
                      message.defaultSampleType.high >>> 0,
                    ).toNumber()
                  : message.defaultSampleType
        return object
      }

      /**
       * Converts this Profile to JSON.
       * @function toJSON
       * @memberof perftools.profiles.Profile
       * @instance
       * @returns {Object.<string,*>} JSON object
       */
      Profile.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions)
      }

      return Profile
    })()

    profiles.ValueType = (function() {
      /**
       * Properties of a ValueType.
       * @memberof perftools.profiles
       * @interface IValueType
       * @property {number|Long|null} [type] ValueType type
       * @property {number|Long|null} [unit] ValueType unit
       */

      /**
       * Constructs a new ValueType.
       * @memberof perftools.profiles
       * @classdesc Represents a ValueType.
       * @implements IValueType
       * @constructor
       * @param {perftools.profiles.IValueType=} [properties] Properties to set
       */
      function ValueType(properties) {
        if (properties)
          for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]]
      }

      /**
       * ValueType type.
       * @member {number|Long} type
       * @memberof perftools.profiles.ValueType
       * @instance
       */
      ValueType.prototype.type = $util.Long ? $util.Long.fromBits(0, 0, false) : 0

      /**
       * ValueType unit.
       * @member {number|Long} unit
       * @memberof perftools.profiles.ValueType
       * @instance
       */
      ValueType.prototype.unit = $util.Long ? $util.Long.fromBits(0, 0, false) : 0

      /**
       * Creates a new ValueType instance using the specified properties.
       * @function create
       * @memberof perftools.profiles.ValueType
       * @static
       * @param {perftools.profiles.IValueType=} [properties] Properties to set
       * @returns {perftools.profiles.ValueType} ValueType instance
       */
      ValueType.create = function create(properties) {
        return new ValueType(properties)
      }

      /**
       * Encodes the specified ValueType message. Does not implicitly {@link perftools.profiles.ValueType.verify|verify} messages.
       * @function encode
       * @memberof perftools.profiles.ValueType
       * @static
       * @param {perftools.profiles.IValueType} message ValueType message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      ValueType.encode = function encode(message, writer) {
        if (!writer) writer = $Writer.create()
        if (message.type != null && message.hasOwnProperty('type'))
          writer.uint32(/* id 1, wireType 0 =*/ 8).int64(message.type)
        if (message.unit != null && message.hasOwnProperty('unit'))
          writer.uint32(/* id 2, wireType 0 =*/ 16).int64(message.unit)
        return writer
      }

      /**
       * Encodes the specified ValueType message, length delimited. Does not implicitly {@link perftools.profiles.ValueType.verify|verify} messages.
       * @function encodeDelimited
       * @memberof perftools.profiles.ValueType
       * @static
       * @param {perftools.profiles.IValueType} message ValueType message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      ValueType.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim()
      }

      /**
       * Decodes a ValueType message from the specified reader or buffer.
       * @function decode
       * @memberof perftools.profiles.ValueType
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @param {number} [length] Message length if known beforehand
       * @returns {perftools.profiles.ValueType} ValueType
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      ValueType.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader)) reader = $Reader.create(reader)
        var end = length === undefined ? reader.len : reader.pos + length,
          message = new $root.perftools.profiles.ValueType()
        while (reader.pos < end) {
          var tag = reader.uint32()
          switch (tag >>> 3) {
            case 1:
              message.type = reader.int64()
              break
            case 2:
              message.unit = reader.int64()
              break
            default:
              reader.skipType(tag & 7)
              break
          }
        }
        return message
      }

      /**
       * Decodes a ValueType message from the specified reader or buffer, length delimited.
       * @function decodeDelimited
       * @memberof perftools.profiles.ValueType
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @returns {perftools.profiles.ValueType} ValueType
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      ValueType.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader)) reader = new $Reader(reader)
        return this.decode(reader, reader.uint32())
      }

      /**
       * Verifies a ValueType message.
       * @function verify
       * @memberof perftools.profiles.ValueType
       * @static
       * @param {Object.<string,*>} message Plain object to verify
       * @returns {string|null} `null` if valid, otherwise the reason why it is not
       */
      ValueType.verify = function verify(message) {
        if (typeof message !== 'object' || message === null) return 'object expected'
        if (message.type != null && message.hasOwnProperty('type'))
          if (
            !$util.isInteger(message.type) &&
            !(
              message.type &&
              $util.isInteger(message.type.low) &&
              $util.isInteger(message.type.high)
            )
          )
            return 'type: integer|Long expected'
        if (message.unit != null && message.hasOwnProperty('unit'))
          if (
            !$util.isInteger(message.unit) &&
            !(
              message.unit &&
              $util.isInteger(message.unit.low) &&
              $util.isInteger(message.unit.high)
            )
          )
            return 'unit: integer|Long expected'
        return null
      }

      /**
       * Creates a ValueType message from a plain object. Also converts values to their respective internal types.
       * @function fromObject
       * @memberof perftools.profiles.ValueType
       * @static
       * @param {Object.<string,*>} object Plain object
       * @returns {perftools.profiles.ValueType} ValueType
       */
      ValueType.fromObject = function fromObject(object) {
        if (object instanceof $root.perftools.profiles.ValueType) return object
        var message = new $root.perftools.profiles.ValueType()
        if (object.type != null)
          if ($util.Long) (message.type = $util.Long.fromValue(object.type)).unsigned = false
          else if (typeof object.type === 'string') message.type = parseInt(object.type, 10)
          else if (typeof object.type === 'number') message.type = object.type
          else if (typeof object.type === 'object')
            message.type = new $util.LongBits(
              object.type.low >>> 0,
              object.type.high >>> 0,
            ).toNumber()
        if (object.unit != null)
          if ($util.Long) (message.unit = $util.Long.fromValue(object.unit)).unsigned = false
          else if (typeof object.unit === 'string') message.unit = parseInt(object.unit, 10)
          else if (typeof object.unit === 'number') message.unit = object.unit
          else if (typeof object.unit === 'object')
            message.unit = new $util.LongBits(
              object.unit.low >>> 0,
              object.unit.high >>> 0,
            ).toNumber()
        return message
      }

      /**
       * Creates a plain object from a ValueType message. Also converts values to other types if specified.
       * @function toObject
       * @memberof perftools.profiles.ValueType
       * @static
       * @param {perftools.profiles.ValueType} message ValueType
       * @param {$protobuf.IConversionOptions} [options] Conversion options
       * @returns {Object.<string,*>} Plain object
       */
      ValueType.toObject = function toObject(message, options) {
        if (!options) options = {}
        var object = {}
        if (options.defaults) {
          if ($util.Long) {
            var long = new $util.Long(0, 0, false)
            object.type =
              options.longs === String
                ? long.toString()
                : options.longs === Number
                  ? long.toNumber()
                  : long
          } else object.type = options.longs === String ? '0' : 0
          if ($util.Long) {
            var long = new $util.Long(0, 0, false)
            object.unit =
              options.longs === String
                ? long.toString()
                : options.longs === Number
                  ? long.toNumber()
                  : long
          } else object.unit = options.longs === String ? '0' : 0
        }
        if (message.type != null && message.hasOwnProperty('type'))
          if (typeof message.type === 'number')
            object.type = options.longs === String ? String(message.type) : message.type
          else
            object.type =
              options.longs === String
                ? $util.Long.prototype.toString.call(message.type)
                : options.longs === Number
                  ? new $util.LongBits(message.type.low >>> 0, message.type.high >>> 0).toNumber()
                  : message.type
        if (message.unit != null && message.hasOwnProperty('unit'))
          if (typeof message.unit === 'number')
            object.unit = options.longs === String ? String(message.unit) : message.unit
          else
            object.unit =
              options.longs === String
                ? $util.Long.prototype.toString.call(message.unit)
                : options.longs === Number
                  ? new $util.LongBits(message.unit.low >>> 0, message.unit.high >>> 0).toNumber()
                  : message.unit
        return object
      }

      /**
       * Converts this ValueType to JSON.
       * @function toJSON
       * @memberof perftools.profiles.ValueType
       * @instance
       * @returns {Object.<string,*>} JSON object
       */
      ValueType.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions)
      }

      return ValueType
    })()

    profiles.Sample = (function() {
      /**
       * Properties of a Sample.
       * @memberof perftools.profiles
       * @interface ISample
       * @property {Array.<number|Long>|null} [locationId] Sample locationId
       * @property {Array.<number|Long>|null} [value] Sample value
       * @property {Array.<perftools.profiles.ILabel>|null} [label] Sample label
       */

      /**
       * Constructs a new Sample.
       * @memberof perftools.profiles
       * @classdesc Represents a Sample.
       * @implements ISample
       * @constructor
       * @param {perftools.profiles.ISample=} [properties] Properties to set
       */
      function Sample(properties) {
        this.locationId = []
        this.value = []
        this.label = []
        if (properties)
          for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]]
      }

      /**
       * Sample locationId.
       * @member {Array.<number|Long>} locationId
       * @memberof perftools.profiles.Sample
       * @instance
       */
      Sample.prototype.locationId = $util.emptyArray

      /**
       * Sample value.
       * @member {Array.<number|Long>} value
       * @memberof perftools.profiles.Sample
       * @instance
       */
      Sample.prototype.value = $util.emptyArray

      /**
       * Sample label.
       * @member {Array.<perftools.profiles.ILabel>} label
       * @memberof perftools.profiles.Sample
       * @instance
       */
      Sample.prototype.label = $util.emptyArray

      /**
       * Creates a new Sample instance using the specified properties.
       * @function create
       * @memberof perftools.profiles.Sample
       * @static
       * @param {perftools.profiles.ISample=} [properties] Properties to set
       * @returns {perftools.profiles.Sample} Sample instance
       */
      Sample.create = function create(properties) {
        return new Sample(properties)
      }

      /**
       * Encodes the specified Sample message. Does not implicitly {@link perftools.profiles.Sample.verify|verify} messages.
       * @function encode
       * @memberof perftools.profiles.Sample
       * @static
       * @param {perftools.profiles.ISample} message Sample message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      Sample.encode = function encode(message, writer) {
        if (!writer) writer = $Writer.create()
        if (message.locationId != null && message.locationId.length) {
          writer.uint32(/* id 1, wireType 2 =*/ 10).fork()
          for (var i = 0; i < message.locationId.length; ++i) writer.uint64(message.locationId[i])
          writer.ldelim()
        }
        if (message.value != null && message.value.length) {
          writer.uint32(/* id 2, wireType 2 =*/ 18).fork()
          for (var i = 0; i < message.value.length; ++i) writer.int64(message.value[i])
          writer.ldelim()
        }
        if (message.label != null && message.label.length)
          for (var i = 0; i < message.label.length; ++i)
            $root.perftools.profiles.Label.encode(
              message.label[i],
              writer.uint32(/* id 3, wireType 2 =*/ 26).fork(),
            ).ldelim()
        return writer
      }

      /**
       * Encodes the specified Sample message, length delimited. Does not implicitly {@link perftools.profiles.Sample.verify|verify} messages.
       * @function encodeDelimited
       * @memberof perftools.profiles.Sample
       * @static
       * @param {perftools.profiles.ISample} message Sample message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      Sample.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim()
      }

      /**
       * Decodes a Sample message from the specified reader or buffer.
       * @function decode
       * @memberof perftools.profiles.Sample
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @param {number} [length] Message length if known beforehand
       * @returns {perftools.profiles.Sample} Sample
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      Sample.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader)) reader = $Reader.create(reader)
        var end = length === undefined ? reader.len : reader.pos + length,
          message = new $root.perftools.profiles.Sample()
        while (reader.pos < end) {
          var tag = reader.uint32()
          switch (tag >>> 3) {
            case 1:
              if (!(message.locationId && message.locationId.length)) message.locationId = []
              if ((tag & 7) === 2) {
                var end2 = reader.uint32() + reader.pos
                while (reader.pos < end2) message.locationId.push(reader.uint64())
              } else message.locationId.push(reader.uint64())
              break
            case 2:
              if (!(message.value && message.value.length)) message.value = []
              if ((tag & 7) === 2) {
                var end2 = reader.uint32() + reader.pos
                while (reader.pos < end2) message.value.push(reader.int64())
              } else message.value.push(reader.int64())
              break
            case 3:
              if (!(message.label && message.label.length)) message.label = []
              message.label.push($root.perftools.profiles.Label.decode(reader, reader.uint32()))
              break
            default:
              reader.skipType(tag & 7)
              break
          }
        }
        return message
      }

      /**
       * Decodes a Sample message from the specified reader or buffer, length delimited.
       * @function decodeDelimited
       * @memberof perftools.profiles.Sample
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @returns {perftools.profiles.Sample} Sample
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      Sample.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader)) reader = new $Reader(reader)
        return this.decode(reader, reader.uint32())
      }

      /**
       * Verifies a Sample message.
       * @function verify
       * @memberof perftools.profiles.Sample
       * @static
       * @param {Object.<string,*>} message Plain object to verify
       * @returns {string|null} `null` if valid, otherwise the reason why it is not
       */
      Sample.verify = function verify(message) {
        if (typeof message !== 'object' || message === null) return 'object expected'
        if (message.locationId != null && message.hasOwnProperty('locationId')) {
          if (!Array.isArray(message.locationId)) return 'locationId: array expected'
          for (var i = 0; i < message.locationId.length; ++i)
            if (
              !$util.isInteger(message.locationId[i]) &&
              !(
                message.locationId[i] &&
                $util.isInteger(message.locationId[i].low) &&
                $util.isInteger(message.locationId[i].high)
              )
            )
              return 'locationId: integer|Long[] expected'
        }
        if (message.value != null && message.hasOwnProperty('value')) {
          if (!Array.isArray(message.value)) return 'value: array expected'
          for (var i = 0; i < message.value.length; ++i)
            if (
              !$util.isInteger(message.value[i]) &&
              !(
                message.value[i] &&
                $util.isInteger(message.value[i].low) &&
                $util.isInteger(message.value[i].high)
              )
            )
              return 'value: integer|Long[] expected'
        }
        if (message.label != null && message.hasOwnProperty('label')) {
          if (!Array.isArray(message.label)) return 'label: array expected'
          for (var i = 0; i < message.label.length; ++i) {
            var error = $root.perftools.profiles.Label.verify(message.label[i])
            if (error) return 'label.' + error
          }
        }
        return null
      }

      /**
       * Creates a Sample message from a plain object. Also converts values to their respective internal types.
       * @function fromObject
       * @memberof perftools.profiles.Sample
       * @static
       * @param {Object.<string,*>} object Plain object
       * @returns {perftools.profiles.Sample} Sample
       */
      Sample.fromObject = function fromObject(object) {
        if (object instanceof $root.perftools.profiles.Sample) return object
        var message = new $root.perftools.profiles.Sample()
        if (object.locationId) {
          if (!Array.isArray(object.locationId))
            throw TypeError('.perftools.profiles.Sample.locationId: array expected')
          message.locationId = []
          for (var i = 0; i < object.locationId.length; ++i)
            if ($util.Long)
              (message.locationId[i] = $util.Long.fromValue(object.locationId[i])).unsigned = true
            else if (typeof object.locationId[i] === 'string')
              message.locationId[i] = parseInt(object.locationId[i], 10)
            else if (typeof object.locationId[i] === 'number')
              message.locationId[i] = object.locationId[i]
            else if (typeof object.locationId[i] === 'object')
              message.locationId[i] = new $util.LongBits(
                object.locationId[i].low >>> 0,
                object.locationId[i].high >>> 0,
              ).toNumber(true)
        }
        if (object.value) {
          if (!Array.isArray(object.value))
            throw TypeError('.perftools.profiles.Sample.value: array expected')
          message.value = []
          for (var i = 0; i < object.value.length; ++i)
            if ($util.Long)
              (message.value[i] = $util.Long.fromValue(object.value[i])).unsigned = false
            else if (typeof object.value[i] === 'string')
              message.value[i] = parseInt(object.value[i], 10)
            else if (typeof object.value[i] === 'number') message.value[i] = object.value[i]
            else if (typeof object.value[i] === 'object')
              message.value[i] = new $util.LongBits(
                object.value[i].low >>> 0,
                object.value[i].high >>> 0,
              ).toNumber()
        }
        if (object.label) {
          if (!Array.isArray(object.label))
            throw TypeError('.perftools.profiles.Sample.label: array expected')
          message.label = []
          for (var i = 0; i < object.label.length; ++i) {
            if (typeof object.label[i] !== 'object')
              throw TypeError('.perftools.profiles.Sample.label: object expected')
            message.label[i] = $root.perftools.profiles.Label.fromObject(object.label[i])
          }
        }
        return message
      }

      /**
       * Creates a plain object from a Sample message. Also converts values to other types if specified.
       * @function toObject
       * @memberof perftools.profiles.Sample
       * @static
       * @param {perftools.profiles.Sample} message Sample
       * @param {$protobuf.IConversionOptions} [options] Conversion options
       * @returns {Object.<string,*>} Plain object
       */
      Sample.toObject = function toObject(message, options) {
        if (!options) options = {}
        var object = {}
        if (options.arrays || options.defaults) {
          object.locationId = []
          object.value = []
          object.label = []
        }
        if (message.locationId && message.locationId.length) {
          object.locationId = []
          for (var j = 0; j < message.locationId.length; ++j)
            if (typeof message.locationId[j] === 'number')
              object.locationId[j] =
                options.longs === String ? String(message.locationId[j]) : message.locationId[j]
            else
              object.locationId[j] =
                options.longs === String
                  ? $util.Long.prototype.toString.call(message.locationId[j])
                  : options.longs === Number
                    ? new $util.LongBits(
                        message.locationId[j].low >>> 0,
                        message.locationId[j].high >>> 0,
                      ).toNumber(true)
                    : message.locationId[j]
        }
        if (message.value && message.value.length) {
          object.value = []
          for (var j = 0; j < message.value.length; ++j)
            if (typeof message.value[j] === 'number')
              object.value[j] =
                options.longs === String ? String(message.value[j]) : message.value[j]
            else
              object.value[j] =
                options.longs === String
                  ? $util.Long.prototype.toString.call(message.value[j])
                  : options.longs === Number
                    ? new $util.LongBits(
                        message.value[j].low >>> 0,
                        message.value[j].high >>> 0,
                      ).toNumber()
                    : message.value[j]
        }
        if (message.label && message.label.length) {
          object.label = []
          for (var j = 0; j < message.label.length; ++j)
            object.label[j] = $root.perftools.profiles.Label.toObject(message.label[j], options)
        }
        return object
      }

      /**
       * Converts this Sample to JSON.
       * @function toJSON
       * @memberof perftools.profiles.Sample
       * @instance
       * @returns {Object.<string,*>} JSON object
       */
      Sample.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions)
      }

      return Sample
    })()

    profiles.Label = (function() {
      /**
       * Properties of a Label.
       * @memberof perftools.profiles
       * @interface ILabel
       * @property {number|Long|null} [key] Label key
       * @property {number|Long|null} [str] Label str
       * @property {number|Long|null} [num] Label num
       * @property {number|Long|null} [numUnit] Label numUnit
       */

      /**
       * Constructs a new Label.
       * @memberof perftools.profiles
       * @classdesc Represents a Label.
       * @implements ILabel
       * @constructor
       * @param {perftools.profiles.ILabel=} [properties] Properties to set
       */
      function Label(properties) {
        if (properties)
          for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]]
      }

      /**
       * Label key.
       * @member {number|Long} key
       * @memberof perftools.profiles.Label
       * @instance
       */
      Label.prototype.key = $util.Long ? $util.Long.fromBits(0, 0, false) : 0

      /**
       * Label str.
       * @member {number|Long} str
       * @memberof perftools.profiles.Label
       * @instance
       */
      Label.prototype.str = $util.Long ? $util.Long.fromBits(0, 0, false) : 0

      /**
       * Label num.
       * @member {number|Long} num
       * @memberof perftools.profiles.Label
       * @instance
       */
      Label.prototype.num = $util.Long ? $util.Long.fromBits(0, 0, false) : 0

      /**
       * Label numUnit.
       * @member {number|Long} numUnit
       * @memberof perftools.profiles.Label
       * @instance
       */
      Label.prototype.numUnit = $util.Long ? $util.Long.fromBits(0, 0, false) : 0

      /**
       * Creates a new Label instance using the specified properties.
       * @function create
       * @memberof perftools.profiles.Label
       * @static
       * @param {perftools.profiles.ILabel=} [properties] Properties to set
       * @returns {perftools.profiles.Label} Label instance
       */
      Label.create = function create(properties) {
        return new Label(properties)
      }

      /**
       * Encodes the specified Label message. Does not implicitly {@link perftools.profiles.Label.verify|verify} messages.
       * @function encode
       * @memberof perftools.profiles.Label
       * @static
       * @param {perftools.profiles.ILabel} message Label message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      Label.encode = function encode(message, writer) {
        if (!writer) writer = $Writer.create()
        if (message.key != null && message.hasOwnProperty('key'))
          writer.uint32(/* id 1, wireType 0 =*/ 8).int64(message.key)
        if (message.str != null && message.hasOwnProperty('str'))
          writer.uint32(/* id 2, wireType 0 =*/ 16).int64(message.str)
        if (message.num != null && message.hasOwnProperty('num'))
          writer.uint32(/* id 3, wireType 0 =*/ 24).int64(message.num)
        if (message.numUnit != null && message.hasOwnProperty('numUnit'))
          writer.uint32(/* id 4, wireType 0 =*/ 32).int64(message.numUnit)
        return writer
      }

      /**
       * Encodes the specified Label message, length delimited. Does not implicitly {@link perftools.profiles.Label.verify|verify} messages.
       * @function encodeDelimited
       * @memberof perftools.profiles.Label
       * @static
       * @param {perftools.profiles.ILabel} message Label message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      Label.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim()
      }

      /**
       * Decodes a Label message from the specified reader or buffer.
       * @function decode
       * @memberof perftools.profiles.Label
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @param {number} [length] Message length if known beforehand
       * @returns {perftools.profiles.Label} Label
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      Label.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader)) reader = $Reader.create(reader)
        var end = length === undefined ? reader.len : reader.pos + length,
          message = new $root.perftools.profiles.Label()
        while (reader.pos < end) {
          var tag = reader.uint32()
          switch (tag >>> 3) {
            case 1:
              message.key = reader.int64()
              break
            case 2:
              message.str = reader.int64()
              break
            case 3:
              message.num = reader.int64()
              break
            case 4:
              message.numUnit = reader.int64()
              break
            default:
              reader.skipType(tag & 7)
              break
          }
        }
        return message
      }

      /**
       * Decodes a Label message from the specified reader or buffer, length delimited.
       * @function decodeDelimited
       * @memberof perftools.profiles.Label
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @returns {perftools.profiles.Label} Label
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      Label.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader)) reader = new $Reader(reader)
        return this.decode(reader, reader.uint32())
      }

      /**
       * Verifies a Label message.
       * @function verify
       * @memberof perftools.profiles.Label
       * @static
       * @param {Object.<string,*>} message Plain object to verify
       * @returns {string|null} `null` if valid, otherwise the reason why it is not
       */
      Label.verify = function verify(message) {
        if (typeof message !== 'object' || message === null) return 'object expected'
        if (message.key != null && message.hasOwnProperty('key'))
          if (
            !$util.isInteger(message.key) &&
            !(message.key && $util.isInteger(message.key.low) && $util.isInteger(message.key.high))
          )
            return 'key: integer|Long expected'
        if (message.str != null && message.hasOwnProperty('str'))
          if (
            !$util.isInteger(message.str) &&
            !(message.str && $util.isInteger(message.str.low) && $util.isInteger(message.str.high))
          )
            return 'str: integer|Long expected'
        if (message.num != null && message.hasOwnProperty('num'))
          if (
            !$util.isInteger(message.num) &&
            !(message.num && $util.isInteger(message.num.low) && $util.isInteger(message.num.high))
          )
            return 'num: integer|Long expected'
        if (message.numUnit != null && message.hasOwnProperty('numUnit'))
          if (
            !$util.isInteger(message.numUnit) &&
            !(
              message.numUnit &&
              $util.isInteger(message.numUnit.low) &&
              $util.isInteger(message.numUnit.high)
            )
          )
            return 'numUnit: integer|Long expected'
        return null
      }

      /**
       * Creates a Label message from a plain object. Also converts values to their respective internal types.
       * @function fromObject
       * @memberof perftools.profiles.Label
       * @static
       * @param {Object.<string,*>} object Plain object
       * @returns {perftools.profiles.Label} Label
       */
      Label.fromObject = function fromObject(object) {
        if (object instanceof $root.perftools.profiles.Label) return object
        var message = new $root.perftools.profiles.Label()
        if (object.key != null)
          if ($util.Long) (message.key = $util.Long.fromValue(object.key)).unsigned = false
          else if (typeof object.key === 'string') message.key = parseInt(object.key, 10)
          else if (typeof object.key === 'number') message.key = object.key
          else if (typeof object.key === 'object')
            message.key = new $util.LongBits(object.key.low >>> 0, object.key.high >>> 0).toNumber()
        if (object.str != null)
          if ($util.Long) (message.str = $util.Long.fromValue(object.str)).unsigned = false
          else if (typeof object.str === 'string') message.str = parseInt(object.str, 10)
          else if (typeof object.str === 'number') message.str = object.str
          else if (typeof object.str === 'object')
            message.str = new $util.LongBits(object.str.low >>> 0, object.str.high >>> 0).toNumber()
        if (object.num != null)
          if ($util.Long) (message.num = $util.Long.fromValue(object.num)).unsigned = false
          else if (typeof object.num === 'string') message.num = parseInt(object.num, 10)
          else if (typeof object.num === 'number') message.num = object.num
          else if (typeof object.num === 'object')
            message.num = new $util.LongBits(object.num.low >>> 0, object.num.high >>> 0).toNumber()
        if (object.numUnit != null)
          if ($util.Long) (message.numUnit = $util.Long.fromValue(object.numUnit)).unsigned = false
          else if (typeof object.numUnit === 'string')
            message.numUnit = parseInt(object.numUnit, 10)
          else if (typeof object.numUnit === 'number') message.numUnit = object.numUnit
          else if (typeof object.numUnit === 'object')
            message.numUnit = new $util.LongBits(
              object.numUnit.low >>> 0,
              object.numUnit.high >>> 0,
            ).toNumber()
        return message
      }

      /**
       * Creates a plain object from a Label message. Also converts values to other types if specified.
       * @function toObject
       * @memberof perftools.profiles.Label
       * @static
       * @param {perftools.profiles.Label} message Label
       * @param {$protobuf.IConversionOptions} [options] Conversion options
       * @returns {Object.<string,*>} Plain object
       */
      Label.toObject = function toObject(message, options) {
        if (!options) options = {}
        var object = {}
        if (options.defaults) {
          if ($util.Long) {
            var long = new $util.Long(0, 0, false)
            object.key =
              options.longs === String
                ? long.toString()
                : options.longs === Number
                  ? long.toNumber()
                  : long
          } else object.key = options.longs === String ? '0' : 0
          if ($util.Long) {
            var long = new $util.Long(0, 0, false)
            object.str =
              options.longs === String
                ? long.toString()
                : options.longs === Number
                  ? long.toNumber()
                  : long
          } else object.str = options.longs === String ? '0' : 0
          if ($util.Long) {
            var long = new $util.Long(0, 0, false)
            object.num =
              options.longs === String
                ? long.toString()
                : options.longs === Number
                  ? long.toNumber()
                  : long
          } else object.num = options.longs === String ? '0' : 0
          if ($util.Long) {
            var long = new $util.Long(0, 0, false)
            object.numUnit =
              options.longs === String
                ? long.toString()
                : options.longs === Number
                  ? long.toNumber()
                  : long
          } else object.numUnit = options.longs === String ? '0' : 0
        }
        if (message.key != null && message.hasOwnProperty('key'))
          if (typeof message.key === 'number')
            object.key = options.longs === String ? String(message.key) : message.key
          else
            object.key =
              options.longs === String
                ? $util.Long.prototype.toString.call(message.key)
                : options.longs === Number
                  ? new $util.LongBits(message.key.low >>> 0, message.key.high >>> 0).toNumber()
                  : message.key
        if (message.str != null && message.hasOwnProperty('str'))
          if (typeof message.str === 'number')
            object.str = options.longs === String ? String(message.str) : message.str
          else
            object.str =
              options.longs === String
                ? $util.Long.prototype.toString.call(message.str)
                : options.longs === Number
                  ? new $util.LongBits(message.str.low >>> 0, message.str.high >>> 0).toNumber()
                  : message.str
        if (message.num != null && message.hasOwnProperty('num'))
          if (typeof message.num === 'number')
            object.num = options.longs === String ? String(message.num) : message.num
          else
            object.num =
              options.longs === String
                ? $util.Long.prototype.toString.call(message.num)
                : options.longs === Number
                  ? new $util.LongBits(message.num.low >>> 0, message.num.high >>> 0).toNumber()
                  : message.num
        if (message.numUnit != null && message.hasOwnProperty('numUnit'))
          if (typeof message.numUnit === 'number')
            object.numUnit = options.longs === String ? String(message.numUnit) : message.numUnit
          else
            object.numUnit =
              options.longs === String
                ? $util.Long.prototype.toString.call(message.numUnit)
                : options.longs === Number
                  ? new $util.LongBits(
                      message.numUnit.low >>> 0,
                      message.numUnit.high >>> 0,
                    ).toNumber()
                  : message.numUnit
        return object
      }

      /**
       * Converts this Label to JSON.
       * @function toJSON
       * @memberof perftools.profiles.Label
       * @instance
       * @returns {Object.<string,*>} JSON object
       */
      Label.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions)
      }

      return Label
    })()

    profiles.Mapping = (function() {
      /**
       * Properties of a Mapping.
       * @memberof perftools.profiles
       * @interface IMapping
       * @property {number|Long|null} [id] Mapping id
       * @property {number|Long|null} [memoryStart] Mapping memoryStart
       * @property {number|Long|null} [memoryLimit] Mapping memoryLimit
       * @property {number|Long|null} [fileOffset] Mapping fileOffset
       * @property {number|Long|null} [filename] Mapping filename
       * @property {number|Long|null} [buildId] Mapping buildId
       * @property {boolean|null} [hasFunctions] Mapping hasFunctions
       * @property {boolean|null} [hasFilenames] Mapping hasFilenames
       * @property {boolean|null} [hasLineNumbers] Mapping hasLineNumbers
       * @property {boolean|null} [hasInlineFrames] Mapping hasInlineFrames
       */

      /**
       * Constructs a new Mapping.
       * @memberof perftools.profiles
       * @classdesc Represents a Mapping.
       * @implements IMapping
       * @constructor
       * @param {perftools.profiles.IMapping=} [properties] Properties to set
       */
      function Mapping(properties) {
        if (properties)
          for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]]
      }

      /**
       * Mapping id.
       * @member {number|Long} id
       * @memberof perftools.profiles.Mapping
       * @instance
       */
      Mapping.prototype.id = $util.Long ? $util.Long.fromBits(0, 0, true) : 0

      /**
       * Mapping memoryStart.
       * @member {number|Long} memoryStart
       * @memberof perftools.profiles.Mapping
       * @instance
       */
      Mapping.prototype.memoryStart = $util.Long ? $util.Long.fromBits(0, 0, true) : 0

      /**
       * Mapping memoryLimit.
       * @member {number|Long} memoryLimit
       * @memberof perftools.profiles.Mapping
       * @instance
       */
      Mapping.prototype.memoryLimit = $util.Long ? $util.Long.fromBits(0, 0, true) : 0

      /**
       * Mapping fileOffset.
       * @member {number|Long} fileOffset
       * @memberof perftools.profiles.Mapping
       * @instance
       */
      Mapping.prototype.fileOffset = $util.Long ? $util.Long.fromBits(0, 0, true) : 0

      /**
       * Mapping filename.
       * @member {number|Long} filename
       * @memberof perftools.profiles.Mapping
       * @instance
       */
      Mapping.prototype.filename = $util.Long ? $util.Long.fromBits(0, 0, false) : 0

      /**
       * Mapping buildId.
       * @member {number|Long} buildId
       * @memberof perftools.profiles.Mapping
       * @instance
       */
      Mapping.prototype.buildId = $util.Long ? $util.Long.fromBits(0, 0, false) : 0

      /**
       * Mapping hasFunctions.
       * @member {boolean} hasFunctions
       * @memberof perftools.profiles.Mapping
       * @instance
       */
      Mapping.prototype.hasFunctions = false

      /**
       * Mapping hasFilenames.
       * @member {boolean} hasFilenames
       * @memberof perftools.profiles.Mapping
       * @instance
       */
      Mapping.prototype.hasFilenames = false

      /**
       * Mapping hasLineNumbers.
       * @member {boolean} hasLineNumbers
       * @memberof perftools.profiles.Mapping
       * @instance
       */
      Mapping.prototype.hasLineNumbers = false

      /**
       * Mapping hasInlineFrames.
       * @member {boolean} hasInlineFrames
       * @memberof perftools.profiles.Mapping
       * @instance
       */
      Mapping.prototype.hasInlineFrames = false

      /**
       * Creates a new Mapping instance using the specified properties.
       * @function create
       * @memberof perftools.profiles.Mapping
       * @static
       * @param {perftools.profiles.IMapping=} [properties] Properties to set
       * @returns {perftools.profiles.Mapping} Mapping instance
       */
      Mapping.create = function create(properties) {
        return new Mapping(properties)
      }

      /**
       * Encodes the specified Mapping message. Does not implicitly {@link perftools.profiles.Mapping.verify|verify} messages.
       * @function encode
       * @memberof perftools.profiles.Mapping
       * @static
       * @param {perftools.profiles.IMapping} message Mapping message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      Mapping.encode = function encode(message, writer) {
        if (!writer) writer = $Writer.create()
        if (message.id != null && message.hasOwnProperty('id'))
          writer.uint32(/* id 1, wireType 0 =*/ 8).uint64(message.id)
        if (message.memoryStart != null && message.hasOwnProperty('memoryStart'))
          writer.uint32(/* id 2, wireType 0 =*/ 16).uint64(message.memoryStart)
        if (message.memoryLimit != null && message.hasOwnProperty('memoryLimit'))
          writer.uint32(/* id 3, wireType 0 =*/ 24).uint64(message.memoryLimit)
        if (message.fileOffset != null && message.hasOwnProperty('fileOffset'))
          writer.uint32(/* id 4, wireType 0 =*/ 32).uint64(message.fileOffset)
        if (message.filename != null && message.hasOwnProperty('filename'))
          writer.uint32(/* id 5, wireType 0 =*/ 40).int64(message.filename)
        if (message.buildId != null && message.hasOwnProperty('buildId'))
          writer.uint32(/* id 6, wireType 0 =*/ 48).int64(message.buildId)
        if (message.hasFunctions != null && message.hasOwnProperty('hasFunctions'))
          writer.uint32(/* id 7, wireType 0 =*/ 56).bool(message.hasFunctions)
        if (message.hasFilenames != null && message.hasOwnProperty('hasFilenames'))
          writer.uint32(/* id 8, wireType 0 =*/ 64).bool(message.hasFilenames)
        if (message.hasLineNumbers != null && message.hasOwnProperty('hasLineNumbers'))
          writer.uint32(/* id 9, wireType 0 =*/ 72).bool(message.hasLineNumbers)
        if (message.hasInlineFrames != null && message.hasOwnProperty('hasInlineFrames'))
          writer.uint32(/* id 10, wireType 0 =*/ 80).bool(message.hasInlineFrames)
        return writer
      }

      /**
       * Encodes the specified Mapping message, length delimited. Does not implicitly {@link perftools.profiles.Mapping.verify|verify} messages.
       * @function encodeDelimited
       * @memberof perftools.profiles.Mapping
       * @static
       * @param {perftools.profiles.IMapping} message Mapping message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      Mapping.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim()
      }

      /**
       * Decodes a Mapping message from the specified reader or buffer.
       * @function decode
       * @memberof perftools.profiles.Mapping
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @param {number} [length] Message length if known beforehand
       * @returns {perftools.profiles.Mapping} Mapping
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      Mapping.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader)) reader = $Reader.create(reader)
        var end = length === undefined ? reader.len : reader.pos + length,
          message = new $root.perftools.profiles.Mapping()
        while (reader.pos < end) {
          var tag = reader.uint32()
          switch (tag >>> 3) {
            case 1:
              message.id = reader.uint64()
              break
            case 2:
              message.memoryStart = reader.uint64()
              break
            case 3:
              message.memoryLimit = reader.uint64()
              break
            case 4:
              message.fileOffset = reader.uint64()
              break
            case 5:
              message.filename = reader.int64()
              break
            case 6:
              message.buildId = reader.int64()
              break
            case 7:
              message.hasFunctions = reader.bool()
              break
            case 8:
              message.hasFilenames = reader.bool()
              break
            case 9:
              message.hasLineNumbers = reader.bool()
              break
            case 10:
              message.hasInlineFrames = reader.bool()
              break
            default:
              reader.skipType(tag & 7)
              break
          }
        }
        return message
      }

      /**
       * Decodes a Mapping message from the specified reader or buffer, length delimited.
       * @function decodeDelimited
       * @memberof perftools.profiles.Mapping
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @returns {perftools.profiles.Mapping} Mapping
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      Mapping.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader)) reader = new $Reader(reader)
        return this.decode(reader, reader.uint32())
      }

      /**
       * Verifies a Mapping message.
       * @function verify
       * @memberof perftools.profiles.Mapping
       * @static
       * @param {Object.<string,*>} message Plain object to verify
       * @returns {string|null} `null` if valid, otherwise the reason why it is not
       */
      Mapping.verify = function verify(message) {
        if (typeof message !== 'object' || message === null) return 'object expected'
        if (message.id != null && message.hasOwnProperty('id'))
          if (
            !$util.isInteger(message.id) &&
            !(message.id && $util.isInteger(message.id.low) && $util.isInteger(message.id.high))
          )
            return 'id: integer|Long expected'
        if (message.memoryStart != null && message.hasOwnProperty('memoryStart'))
          if (
            !$util.isInteger(message.memoryStart) &&
            !(
              message.memoryStart &&
              $util.isInteger(message.memoryStart.low) &&
              $util.isInteger(message.memoryStart.high)
            )
          )
            return 'memoryStart: integer|Long expected'
        if (message.memoryLimit != null && message.hasOwnProperty('memoryLimit'))
          if (
            !$util.isInteger(message.memoryLimit) &&
            !(
              message.memoryLimit &&
              $util.isInteger(message.memoryLimit.low) &&
              $util.isInteger(message.memoryLimit.high)
            )
          )
            return 'memoryLimit: integer|Long expected'
        if (message.fileOffset != null && message.hasOwnProperty('fileOffset'))
          if (
            !$util.isInteger(message.fileOffset) &&
            !(
              message.fileOffset &&
              $util.isInteger(message.fileOffset.low) &&
              $util.isInteger(message.fileOffset.high)
            )
          )
            return 'fileOffset: integer|Long expected'
        if (message.filename != null && message.hasOwnProperty('filename'))
          if (
            !$util.isInteger(message.filename) &&
            !(
              message.filename &&
              $util.isInteger(message.filename.low) &&
              $util.isInteger(message.filename.high)
            )
          )
            return 'filename: integer|Long expected'
        if (message.buildId != null && message.hasOwnProperty('buildId'))
          if (
            !$util.isInteger(message.buildId) &&
            !(
              message.buildId &&
              $util.isInteger(message.buildId.low) &&
              $util.isInteger(message.buildId.high)
            )
          )
            return 'buildId: integer|Long expected'
        if (message.hasFunctions != null && message.hasOwnProperty('hasFunctions'))
          if (typeof message.hasFunctions !== 'boolean') return 'hasFunctions: boolean expected'
        if (message.hasFilenames != null && message.hasOwnProperty('hasFilenames'))
          if (typeof message.hasFilenames !== 'boolean') return 'hasFilenames: boolean expected'
        if (message.hasLineNumbers != null && message.hasOwnProperty('hasLineNumbers'))
          if (typeof message.hasLineNumbers !== 'boolean') return 'hasLineNumbers: boolean expected'
        if (message.hasInlineFrames != null && message.hasOwnProperty('hasInlineFrames'))
          if (typeof message.hasInlineFrames !== 'boolean')
            return 'hasInlineFrames: boolean expected'
        return null
      }

      /**
       * Creates a Mapping message from a plain object. Also converts values to their respective internal types.
       * @function fromObject
       * @memberof perftools.profiles.Mapping
       * @static
       * @param {Object.<string,*>} object Plain object
       * @returns {perftools.profiles.Mapping} Mapping
       */
      Mapping.fromObject = function fromObject(object) {
        if (object instanceof $root.perftools.profiles.Mapping) return object
        var message = new $root.perftools.profiles.Mapping()
        if (object.id != null)
          if ($util.Long) (message.id = $util.Long.fromValue(object.id)).unsigned = true
          else if (typeof object.id === 'string') message.id = parseInt(object.id, 10)
          else if (typeof object.id === 'number') message.id = object.id
          else if (typeof object.id === 'object')
            message.id = new $util.LongBits(object.id.low >>> 0, object.id.high >>> 0).toNumber(
              true,
            )
        if (object.memoryStart != null)
          if ($util.Long)
            (message.memoryStart = $util.Long.fromValue(object.memoryStart)).unsigned = true
          else if (typeof object.memoryStart === 'string')
            message.memoryStart = parseInt(object.memoryStart, 10)
          else if (typeof object.memoryStart === 'number') message.memoryStart = object.memoryStart
          else if (typeof object.memoryStart === 'object')
            message.memoryStart = new $util.LongBits(
              object.memoryStart.low >>> 0,
              object.memoryStart.high >>> 0,
            ).toNumber(true)
        if (object.memoryLimit != null)
          if ($util.Long)
            (message.memoryLimit = $util.Long.fromValue(object.memoryLimit)).unsigned = true
          else if (typeof object.memoryLimit === 'string')
            message.memoryLimit = parseInt(object.memoryLimit, 10)
          else if (typeof object.memoryLimit === 'number') message.memoryLimit = object.memoryLimit
          else if (typeof object.memoryLimit === 'object')
            message.memoryLimit = new $util.LongBits(
              object.memoryLimit.low >>> 0,
              object.memoryLimit.high >>> 0,
            ).toNumber(true)
        if (object.fileOffset != null)
          if ($util.Long)
            (message.fileOffset = $util.Long.fromValue(object.fileOffset)).unsigned = true
          else if (typeof object.fileOffset === 'string')
            message.fileOffset = parseInt(object.fileOffset, 10)
          else if (typeof object.fileOffset === 'number') message.fileOffset = object.fileOffset
          else if (typeof object.fileOffset === 'object')
            message.fileOffset = new $util.LongBits(
              object.fileOffset.low >>> 0,
              object.fileOffset.high >>> 0,
            ).toNumber(true)
        if (object.filename != null)
          if ($util.Long)
            (message.filename = $util.Long.fromValue(object.filename)).unsigned = false
          else if (typeof object.filename === 'string')
            message.filename = parseInt(object.filename, 10)
          else if (typeof object.filename === 'number') message.filename = object.filename
          else if (typeof object.filename === 'object')
            message.filename = new $util.LongBits(
              object.filename.low >>> 0,
              object.filename.high >>> 0,
            ).toNumber()
        if (object.buildId != null)
          if ($util.Long) (message.buildId = $util.Long.fromValue(object.buildId)).unsigned = false
          else if (typeof object.buildId === 'string')
            message.buildId = parseInt(object.buildId, 10)
          else if (typeof object.buildId === 'number') message.buildId = object.buildId
          else if (typeof object.buildId === 'object')
            message.buildId = new $util.LongBits(
              object.buildId.low >>> 0,
              object.buildId.high >>> 0,
            ).toNumber()
        if (object.hasFunctions != null) message.hasFunctions = Boolean(object.hasFunctions)
        if (object.hasFilenames != null) message.hasFilenames = Boolean(object.hasFilenames)
        if (object.hasLineNumbers != null) message.hasLineNumbers = Boolean(object.hasLineNumbers)
        if (object.hasInlineFrames != null)
          message.hasInlineFrames = Boolean(object.hasInlineFrames)
        return message
      }

      /**
       * Creates a plain object from a Mapping message. Also converts values to other types if specified.
       * @function toObject
       * @memberof perftools.profiles.Mapping
       * @static
       * @param {perftools.profiles.Mapping} message Mapping
       * @param {$protobuf.IConversionOptions} [options] Conversion options
       * @returns {Object.<string,*>} Plain object
       */
      Mapping.toObject = function toObject(message, options) {
        if (!options) options = {}
        var object = {}
        if (options.defaults) {
          if ($util.Long) {
            var long = new $util.Long(0, 0, true)
            object.id =
              options.longs === String
                ? long.toString()
                : options.longs === Number
                  ? long.toNumber()
                  : long
          } else object.id = options.longs === String ? '0' : 0
          if ($util.Long) {
            var long = new $util.Long(0, 0, true)
            object.memoryStart =
              options.longs === String
                ? long.toString()
                : options.longs === Number
                  ? long.toNumber()
                  : long
          } else object.memoryStart = options.longs === String ? '0' : 0
          if ($util.Long) {
            var long = new $util.Long(0, 0, true)
            object.memoryLimit =
              options.longs === String
                ? long.toString()
                : options.longs === Number
                  ? long.toNumber()
                  : long
          } else object.memoryLimit = options.longs === String ? '0' : 0
          if ($util.Long) {
            var long = new $util.Long(0, 0, true)
            object.fileOffset =
              options.longs === String
                ? long.toString()
                : options.longs === Number
                  ? long.toNumber()
                  : long
          } else object.fileOffset = options.longs === String ? '0' : 0
          if ($util.Long) {
            var long = new $util.Long(0, 0, false)
            object.filename =
              options.longs === String
                ? long.toString()
                : options.longs === Number
                  ? long.toNumber()
                  : long
          } else object.filename = options.longs === String ? '0' : 0
          if ($util.Long) {
            var long = new $util.Long(0, 0, false)
            object.buildId =
              options.longs === String
                ? long.toString()
                : options.longs === Number
                  ? long.toNumber()
                  : long
          } else object.buildId = options.longs === String ? '0' : 0
          object.hasFunctions = false
          object.hasFilenames = false
          object.hasLineNumbers = false
          object.hasInlineFrames = false
        }
        if (message.id != null && message.hasOwnProperty('id'))
          if (typeof message.id === 'number')
            object.id = options.longs === String ? String(message.id) : message.id
          else
            object.id =
              options.longs === String
                ? $util.Long.prototype.toString.call(message.id)
                : options.longs === Number
                  ? new $util.LongBits(message.id.low >>> 0, message.id.high >>> 0).toNumber(true)
                  : message.id
        if (message.memoryStart != null && message.hasOwnProperty('memoryStart'))
          if (typeof message.memoryStart === 'number')
            object.memoryStart =
              options.longs === String ? String(message.memoryStart) : message.memoryStart
          else
            object.memoryStart =
              options.longs === String
                ? $util.Long.prototype.toString.call(message.memoryStart)
                : options.longs === Number
                  ? new $util.LongBits(
                      message.memoryStart.low >>> 0,
                      message.memoryStart.high >>> 0,
                    ).toNumber(true)
                  : message.memoryStart
        if (message.memoryLimit != null && message.hasOwnProperty('memoryLimit'))
          if (typeof message.memoryLimit === 'number')
            object.memoryLimit =
              options.longs === String ? String(message.memoryLimit) : message.memoryLimit
          else
            object.memoryLimit =
              options.longs === String
                ? $util.Long.prototype.toString.call(message.memoryLimit)
                : options.longs === Number
                  ? new $util.LongBits(
                      message.memoryLimit.low >>> 0,
                      message.memoryLimit.high >>> 0,
                    ).toNumber(true)
                  : message.memoryLimit
        if (message.fileOffset != null && message.hasOwnProperty('fileOffset'))
          if (typeof message.fileOffset === 'number')
            object.fileOffset =
              options.longs === String ? String(message.fileOffset) : message.fileOffset
          else
            object.fileOffset =
              options.longs === String
                ? $util.Long.prototype.toString.call(message.fileOffset)
                : options.longs === Number
                  ? new $util.LongBits(
                      message.fileOffset.low >>> 0,
                      message.fileOffset.high >>> 0,
                    ).toNumber(true)
                  : message.fileOffset
        if (message.filename != null && message.hasOwnProperty('filename'))
          if (typeof message.filename === 'number')
            object.filename = options.longs === String ? String(message.filename) : message.filename
          else
            object.filename =
              options.longs === String
                ? $util.Long.prototype.toString.call(message.filename)
                : options.longs === Number
                  ? new $util.LongBits(
                      message.filename.low >>> 0,
                      message.filename.high >>> 0,
                    ).toNumber()
                  : message.filename
        if (message.buildId != null && message.hasOwnProperty('buildId'))
          if (typeof message.buildId === 'number')
            object.buildId = options.longs === String ? String(message.buildId) : message.buildId
          else
            object.buildId =
              options.longs === String
                ? $util.Long.prototype.toString.call(message.buildId)
                : options.longs === Number
                  ? new $util.LongBits(
                      message.buildId.low >>> 0,
                      message.buildId.high >>> 0,
                    ).toNumber()
                  : message.buildId
        if (message.hasFunctions != null && message.hasOwnProperty('hasFunctions'))
          object.hasFunctions = message.hasFunctions
        if (message.hasFilenames != null && message.hasOwnProperty('hasFilenames'))
          object.hasFilenames = message.hasFilenames
        if (message.hasLineNumbers != null && message.hasOwnProperty('hasLineNumbers'))
          object.hasLineNumbers = message.hasLineNumbers
        if (message.hasInlineFrames != null && message.hasOwnProperty('hasInlineFrames'))
          object.hasInlineFrames = message.hasInlineFrames
        return object
      }

      /**
       * Converts this Mapping to JSON.
       * @function toJSON
       * @memberof perftools.profiles.Mapping
       * @instance
       * @returns {Object.<string,*>} JSON object
       */
      Mapping.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions)
      }

      return Mapping
    })()

    profiles.Location = (function() {
      /**
       * Properties of a Location.
       * @memberof perftools.profiles
       * @interface ILocation
       * @property {number|Long|null} [id] Location id
       * @property {number|Long|null} [mappingId] Location mappingId
       * @property {number|Long|null} [address] Location address
       * @property {Array.<perftools.profiles.ILine>|null} [line] Location line
       * @property {boolean|null} [isFolded] Location isFolded
       */

      /**
       * Constructs a new Location.
       * @memberof perftools.profiles
       * @classdesc Represents a Location.
       * @implements ILocation
       * @constructor
       * @param {perftools.profiles.ILocation=} [properties] Properties to set
       */
      function Location(properties) {
        this.line = []
        if (properties)
          for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]]
      }

      /**
       * Location id.
       * @member {number|Long} id
       * @memberof perftools.profiles.Location
       * @instance
       */
      Location.prototype.id = $util.Long ? $util.Long.fromBits(0, 0, true) : 0

      /**
       * Location mappingId.
       * @member {number|Long} mappingId
       * @memberof perftools.profiles.Location
       * @instance
       */
      Location.prototype.mappingId = $util.Long ? $util.Long.fromBits(0, 0, true) : 0

      /**
       * Location address.
       * @member {number|Long} address
       * @memberof perftools.profiles.Location
       * @instance
       */
      Location.prototype.address = $util.Long ? $util.Long.fromBits(0, 0, true) : 0

      /**
       * Location line.
       * @member {Array.<perftools.profiles.ILine>} line
       * @memberof perftools.profiles.Location
       * @instance
       */
      Location.prototype.line = $util.emptyArray

      /**
       * Location isFolded.
       * @member {boolean} isFolded
       * @memberof perftools.profiles.Location
       * @instance
       */
      Location.prototype.isFolded = false

      /**
       * Creates a new Location instance using the specified properties.
       * @function create
       * @memberof perftools.profiles.Location
       * @static
       * @param {perftools.profiles.ILocation=} [properties] Properties to set
       * @returns {perftools.profiles.Location} Location instance
       */
      Location.create = function create(properties) {
        return new Location(properties)
      }

      /**
       * Encodes the specified Location message. Does not implicitly {@link perftools.profiles.Location.verify|verify} messages.
       * @function encode
       * @memberof perftools.profiles.Location
       * @static
       * @param {perftools.profiles.ILocation} message Location message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      Location.encode = function encode(message, writer) {
        if (!writer) writer = $Writer.create()
        if (message.id != null && message.hasOwnProperty('id'))
          writer.uint32(/* id 1, wireType 0 =*/ 8).uint64(message.id)
        if (message.mappingId != null && message.hasOwnProperty('mappingId'))
          writer.uint32(/* id 2, wireType 0 =*/ 16).uint64(message.mappingId)
        if (message.address != null && message.hasOwnProperty('address'))
          writer.uint32(/* id 3, wireType 0 =*/ 24).uint64(message.address)
        if (message.line != null && message.line.length)
          for (var i = 0; i < message.line.length; ++i)
            $root.perftools.profiles.Line.encode(
              message.line[i],
              writer.uint32(/* id 4, wireType 2 =*/ 34).fork(),
            ).ldelim()
        if (message.isFolded != null && message.hasOwnProperty('isFolded'))
          writer.uint32(/* id 5, wireType 0 =*/ 40).bool(message.isFolded)
        return writer
      }

      /**
       * Encodes the specified Location message, length delimited. Does not implicitly {@link perftools.profiles.Location.verify|verify} messages.
       * @function encodeDelimited
       * @memberof perftools.profiles.Location
       * @static
       * @param {perftools.profiles.ILocation} message Location message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      Location.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim()
      }

      /**
       * Decodes a Location message from the specified reader or buffer.
       * @function decode
       * @memberof perftools.profiles.Location
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @param {number} [length] Message length if known beforehand
       * @returns {perftools.profiles.Location} Location
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      Location.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader)) reader = $Reader.create(reader)
        var end = length === undefined ? reader.len : reader.pos + length,
          message = new $root.perftools.profiles.Location()
        while (reader.pos < end) {
          var tag = reader.uint32()
          switch (tag >>> 3) {
            case 1:
              message.id = reader.uint64()
              break
            case 2:
              message.mappingId = reader.uint64()
              break
            case 3:
              message.address = reader.uint64()
              break
            case 4:
              if (!(message.line && message.line.length)) message.line = []
              message.line.push($root.perftools.profiles.Line.decode(reader, reader.uint32()))
              break
            case 5:
              message.isFolded = reader.bool()
              break
            default:
              reader.skipType(tag & 7)
              break
          }
        }
        return message
      }

      /**
       * Decodes a Location message from the specified reader or buffer, length delimited.
       * @function decodeDelimited
       * @memberof perftools.profiles.Location
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @returns {perftools.profiles.Location} Location
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      Location.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader)) reader = new $Reader(reader)
        return this.decode(reader, reader.uint32())
      }

      /**
       * Verifies a Location message.
       * @function verify
       * @memberof perftools.profiles.Location
       * @static
       * @param {Object.<string,*>} message Plain object to verify
       * @returns {string|null} `null` if valid, otherwise the reason why it is not
       */
      Location.verify = function verify(message) {
        if (typeof message !== 'object' || message === null) return 'object expected'
        if (message.id != null && message.hasOwnProperty('id'))
          if (
            !$util.isInteger(message.id) &&
            !(message.id && $util.isInteger(message.id.low) && $util.isInteger(message.id.high))
          )
            return 'id: integer|Long expected'
        if (message.mappingId != null && message.hasOwnProperty('mappingId'))
          if (
            !$util.isInteger(message.mappingId) &&
            !(
              message.mappingId &&
              $util.isInteger(message.mappingId.low) &&
              $util.isInteger(message.mappingId.high)
            )
          )
            return 'mappingId: integer|Long expected'
        if (message.address != null && message.hasOwnProperty('address'))
          if (
            !$util.isInteger(message.address) &&
            !(
              message.address &&
              $util.isInteger(message.address.low) &&
              $util.isInteger(message.address.high)
            )
          )
            return 'address: integer|Long expected'
        if (message.line != null && message.hasOwnProperty('line')) {
          if (!Array.isArray(message.line)) return 'line: array expected'
          for (var i = 0; i < message.line.length; ++i) {
            var error = $root.perftools.profiles.Line.verify(message.line[i])
            if (error) return 'line.' + error
          }
        }
        if (message.isFolded != null && message.hasOwnProperty('isFolded'))
          if (typeof message.isFolded !== 'boolean') return 'isFolded: boolean expected'
        return null
      }

      /**
       * Creates a Location message from a plain object. Also converts values to their respective internal types.
       * @function fromObject
       * @memberof perftools.profiles.Location
       * @static
       * @param {Object.<string,*>} object Plain object
       * @returns {perftools.profiles.Location} Location
       */
      Location.fromObject = function fromObject(object) {
        if (object instanceof $root.perftools.profiles.Location) return object
        var message = new $root.perftools.profiles.Location()
        if (object.id != null)
          if ($util.Long) (message.id = $util.Long.fromValue(object.id)).unsigned = true
          else if (typeof object.id === 'string') message.id = parseInt(object.id, 10)
          else if (typeof object.id === 'number') message.id = object.id
          else if (typeof object.id === 'object')
            message.id = new $util.LongBits(object.id.low >>> 0, object.id.high >>> 0).toNumber(
              true,
            )
        if (object.mappingId != null)
          if ($util.Long)
            (message.mappingId = $util.Long.fromValue(object.mappingId)).unsigned = true
          else if (typeof object.mappingId === 'string')
            message.mappingId = parseInt(object.mappingId, 10)
          else if (typeof object.mappingId === 'number') message.mappingId = object.mappingId
          else if (typeof object.mappingId === 'object')
            message.mappingId = new $util.LongBits(
              object.mappingId.low >>> 0,
              object.mappingId.high >>> 0,
            ).toNumber(true)
        if (object.address != null)
          if ($util.Long) (message.address = $util.Long.fromValue(object.address)).unsigned = true
          else if (typeof object.address === 'string')
            message.address = parseInt(object.address, 10)
          else if (typeof object.address === 'number') message.address = object.address
          else if (typeof object.address === 'object')
            message.address = new $util.LongBits(
              object.address.low >>> 0,
              object.address.high >>> 0,
            ).toNumber(true)
        if (object.line) {
          if (!Array.isArray(object.line))
            throw TypeError('.perftools.profiles.Location.line: array expected')
          message.line = []
          for (var i = 0; i < object.line.length; ++i) {
            if (typeof object.line[i] !== 'object')
              throw TypeError('.perftools.profiles.Location.line: object expected')
            message.line[i] = $root.perftools.profiles.Line.fromObject(object.line[i])
          }
        }
        if (object.isFolded != null) message.isFolded = Boolean(object.isFolded)
        return message
      }

      /**
       * Creates a plain object from a Location message. Also converts values to other types if specified.
       * @function toObject
       * @memberof perftools.profiles.Location
       * @static
       * @param {perftools.profiles.Location} message Location
       * @param {$protobuf.IConversionOptions} [options] Conversion options
       * @returns {Object.<string,*>} Plain object
       */
      Location.toObject = function toObject(message, options) {
        if (!options) options = {}
        var object = {}
        if (options.arrays || options.defaults) object.line = []
        if (options.defaults) {
          if ($util.Long) {
            var long = new $util.Long(0, 0, true)
            object.id =
              options.longs === String
                ? long.toString()
                : options.longs === Number
                  ? long.toNumber()
                  : long
          } else object.id = options.longs === String ? '0' : 0
          if ($util.Long) {
            var long = new $util.Long(0, 0, true)
            object.mappingId =
              options.longs === String
                ? long.toString()
                : options.longs === Number
                  ? long.toNumber()
                  : long
          } else object.mappingId = options.longs === String ? '0' : 0
          if ($util.Long) {
            var long = new $util.Long(0, 0, true)
            object.address =
              options.longs === String
                ? long.toString()
                : options.longs === Number
                  ? long.toNumber()
                  : long
          } else object.address = options.longs === String ? '0' : 0
          object.isFolded = false
        }
        if (message.id != null && message.hasOwnProperty('id'))
          if (typeof message.id === 'number')
            object.id = options.longs === String ? String(message.id) : message.id
          else
            object.id =
              options.longs === String
                ? $util.Long.prototype.toString.call(message.id)
                : options.longs === Number
                  ? new $util.LongBits(message.id.low >>> 0, message.id.high >>> 0).toNumber(true)
                  : message.id
        if (message.mappingId != null && message.hasOwnProperty('mappingId'))
          if (typeof message.mappingId === 'number')
            object.mappingId =
              options.longs === String ? String(message.mappingId) : message.mappingId
          else
            object.mappingId =
              options.longs === String
                ? $util.Long.prototype.toString.call(message.mappingId)
                : options.longs === Number
                  ? new $util.LongBits(
                      message.mappingId.low >>> 0,
                      message.mappingId.high >>> 0,
                    ).toNumber(true)
                  : message.mappingId
        if (message.address != null && message.hasOwnProperty('address'))
          if (typeof message.address === 'number')
            object.address = options.longs === String ? String(message.address) : message.address
          else
            object.address =
              options.longs === String
                ? $util.Long.prototype.toString.call(message.address)
                : options.longs === Number
                  ? new $util.LongBits(
                      message.address.low >>> 0,
                      message.address.high >>> 0,
                    ).toNumber(true)
                  : message.address
        if (message.line && message.line.length) {
          object.line = []
          for (var j = 0; j < message.line.length; ++j)
            object.line[j] = $root.perftools.profiles.Line.toObject(message.line[j], options)
        }
        if (message.isFolded != null && message.hasOwnProperty('isFolded'))
          object.isFolded = message.isFolded
        return object
      }

      /**
       * Converts this Location to JSON.
       * @function toJSON
       * @memberof perftools.profiles.Location
       * @instance
       * @returns {Object.<string,*>} JSON object
       */
      Location.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions)
      }

      return Location
    })()

    profiles.Line = (function() {
      /**
       * Properties of a Line.
       * @memberof perftools.profiles
       * @interface ILine
       * @property {number|Long|null} [functionId] Line functionId
       * @property {number|Long|null} [line] Line line
       */

      /**
       * Constructs a new Line.
       * @memberof perftools.profiles
       * @classdesc Represents a Line.
       * @implements ILine
       * @constructor
       * @param {perftools.profiles.ILine=} [properties] Properties to set
       */
      function Line(properties) {
        if (properties)
          for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]]
      }

      /**
       * Line functionId.
       * @member {number|Long} functionId
       * @memberof perftools.profiles.Line
       * @instance
       */
      Line.prototype.functionId = $util.Long ? $util.Long.fromBits(0, 0, true) : 0

      /**
       * Line line.
       * @member {number|Long} line
       * @memberof perftools.profiles.Line
       * @instance
       */
      Line.prototype.line = $util.Long ? $util.Long.fromBits(0, 0, false) : 0

      /**
       * Creates a new Line instance using the specified properties.
       * @function create
       * @memberof perftools.profiles.Line
       * @static
       * @param {perftools.profiles.ILine=} [properties] Properties to set
       * @returns {perftools.profiles.Line} Line instance
       */
      Line.create = function create(properties) {
        return new Line(properties)
      }

      /**
       * Encodes the specified Line message. Does not implicitly {@link perftools.profiles.Line.verify|verify} messages.
       * @function encode
       * @memberof perftools.profiles.Line
       * @static
       * @param {perftools.profiles.ILine} message Line message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      Line.encode = function encode(message, writer) {
        if (!writer) writer = $Writer.create()
        if (message.functionId != null && message.hasOwnProperty('functionId'))
          writer.uint32(/* id 1, wireType 0 =*/ 8).uint64(message.functionId)
        if (message.line != null && message.hasOwnProperty('line'))
          writer.uint32(/* id 2, wireType 0 =*/ 16).int64(message.line)
        return writer
      }

      /**
       * Encodes the specified Line message, length delimited. Does not implicitly {@link perftools.profiles.Line.verify|verify} messages.
       * @function encodeDelimited
       * @memberof perftools.profiles.Line
       * @static
       * @param {perftools.profiles.ILine} message Line message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      Line.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim()
      }

      /**
       * Decodes a Line message from the specified reader or buffer.
       * @function decode
       * @memberof perftools.profiles.Line
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @param {number} [length] Message length if known beforehand
       * @returns {perftools.profiles.Line} Line
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      Line.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader)) reader = $Reader.create(reader)
        var end = length === undefined ? reader.len : reader.pos + length,
          message = new $root.perftools.profiles.Line()
        while (reader.pos < end) {
          var tag = reader.uint32()
          switch (tag >>> 3) {
            case 1:
              message.functionId = reader.uint64()
              break
            case 2:
              message.line = reader.int64()
              break
            default:
              reader.skipType(tag & 7)
              break
          }
        }
        return message
      }

      /**
       * Decodes a Line message from the specified reader or buffer, length delimited.
       * @function decodeDelimited
       * @memberof perftools.profiles.Line
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @returns {perftools.profiles.Line} Line
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      Line.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader)) reader = new $Reader(reader)
        return this.decode(reader, reader.uint32())
      }

      /**
       * Verifies a Line message.
       * @function verify
       * @memberof perftools.profiles.Line
       * @static
       * @param {Object.<string,*>} message Plain object to verify
       * @returns {string|null} `null` if valid, otherwise the reason why it is not
       */
      Line.verify = function verify(message) {
        if (typeof message !== 'object' || message === null) return 'object expected'
        if (message.functionId != null && message.hasOwnProperty('functionId'))
          if (
            !$util.isInteger(message.functionId) &&
            !(
              message.functionId &&
              $util.isInteger(message.functionId.low) &&
              $util.isInteger(message.functionId.high)
            )
          )
            return 'functionId: integer|Long expected'
        if (message.line != null && message.hasOwnProperty('line'))
          if (
            !$util.isInteger(message.line) &&
            !(
              message.line &&
              $util.isInteger(message.line.low) &&
              $util.isInteger(message.line.high)
            )
          )
            return 'line: integer|Long expected'
        return null
      }

      /**
       * Creates a Line message from a plain object. Also converts values to their respective internal types.
       * @function fromObject
       * @memberof perftools.profiles.Line
       * @static
       * @param {Object.<string,*>} object Plain object
       * @returns {perftools.profiles.Line} Line
       */
      Line.fromObject = function fromObject(object) {
        if (object instanceof $root.perftools.profiles.Line) return object
        var message = new $root.perftools.profiles.Line()
        if (object.functionId != null)
          if ($util.Long)
            (message.functionId = $util.Long.fromValue(object.functionId)).unsigned = true
          else if (typeof object.functionId === 'string')
            message.functionId = parseInt(object.functionId, 10)
          else if (typeof object.functionId === 'number') message.functionId = object.functionId
          else if (typeof object.functionId === 'object')
            message.functionId = new $util.LongBits(
              object.functionId.low >>> 0,
              object.functionId.high >>> 0,
            ).toNumber(true)
        if (object.line != null)
          if ($util.Long) (message.line = $util.Long.fromValue(object.line)).unsigned = false
          else if (typeof object.line === 'string') message.line = parseInt(object.line, 10)
          else if (typeof object.line === 'number') message.line = object.line
          else if (typeof object.line === 'object')
            message.line = new $util.LongBits(
              object.line.low >>> 0,
              object.line.high >>> 0,
            ).toNumber()
        return message
      }

      /**
       * Creates a plain object from a Line message. Also converts values to other types if specified.
       * @function toObject
       * @memberof perftools.profiles.Line
       * @static
       * @param {perftools.profiles.Line} message Line
       * @param {$protobuf.IConversionOptions} [options] Conversion options
       * @returns {Object.<string,*>} Plain object
       */
      Line.toObject = function toObject(message, options) {
        if (!options) options = {}
        var object = {}
        if (options.defaults) {
          if ($util.Long) {
            var long = new $util.Long(0, 0, true)
            object.functionId =
              options.longs === String
                ? long.toString()
                : options.longs === Number
                  ? long.toNumber()
                  : long
          } else object.functionId = options.longs === String ? '0' : 0
          if ($util.Long) {
            var long = new $util.Long(0, 0, false)
            object.line =
              options.longs === String
                ? long.toString()
                : options.longs === Number
                  ? long.toNumber()
                  : long
          } else object.line = options.longs === String ? '0' : 0
        }
        if (message.functionId != null && message.hasOwnProperty('functionId'))
          if (typeof message.functionId === 'number')
            object.functionId =
              options.longs === String ? String(message.functionId) : message.functionId
          else
            object.functionId =
              options.longs === String
                ? $util.Long.prototype.toString.call(message.functionId)
                : options.longs === Number
                  ? new $util.LongBits(
                      message.functionId.low >>> 0,
                      message.functionId.high >>> 0,
                    ).toNumber(true)
                  : message.functionId
        if (message.line != null && message.hasOwnProperty('line'))
          if (typeof message.line === 'number')
            object.line = options.longs === String ? String(message.line) : message.line
          else
            object.line =
              options.longs === String
                ? $util.Long.prototype.toString.call(message.line)
                : options.longs === Number
                  ? new $util.LongBits(message.line.low >>> 0, message.line.high >>> 0).toNumber()
                  : message.line
        return object
      }

      /**
       * Converts this Line to JSON.
       * @function toJSON
       * @memberof perftools.profiles.Line
       * @instance
       * @returns {Object.<string,*>} JSON object
       */
      Line.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions)
      }

      return Line
    })()

    profiles.Function = (function() {
      /**
       * Properties of a Function.
       * @memberof perftools.profiles
       * @interface IFunction
       * @property {number|Long|null} [id] Function id
       * @property {number|Long|null} [name] Function name
       * @property {number|Long|null} [systemName] Function systemName
       * @property {number|Long|null} [filename] Function filename
       * @property {number|Long|null} [startLine] Function startLine
       */

      /**
       * Constructs a new Function.
       * @memberof perftools.profiles
       * @classdesc Represents a Function.
       * @implements IFunction
       * @constructor
       * @param {perftools.profiles.IFunction=} [properties] Properties to set
       */
      function Function(properties) {
        if (properties)
          for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]]
      }

      /**
       * Function id.
       * @member {number|Long} id
       * @memberof perftools.profiles.Function
       * @instance
       */
      Function.prototype.id = $util.Long ? $util.Long.fromBits(0, 0, true) : 0

      /**
       * Function name.
       * @member {number|Long} name
       * @memberof perftools.profiles.Function
       * @instance
       */
      Function.prototype.name = $util.Long ? $util.Long.fromBits(0, 0, false) : 0

      /**
       * Function systemName.
       * @member {number|Long} systemName
       * @memberof perftools.profiles.Function
       * @instance
       */
      Function.prototype.systemName = $util.Long ? $util.Long.fromBits(0, 0, false) : 0

      /**
       * Function filename.
       * @member {number|Long} filename
       * @memberof perftools.profiles.Function
       * @instance
       */
      Function.prototype.filename = $util.Long ? $util.Long.fromBits(0, 0, false) : 0

      /**
       * Function startLine.
       * @member {number|Long} startLine
       * @memberof perftools.profiles.Function
       * @instance
       */
      Function.prototype.startLine = $util.Long ? $util.Long.fromBits(0, 0, false) : 0

      /**
       * Creates a new Function instance using the specified properties.
       * @function create
       * @memberof perftools.profiles.Function
       * @static
       * @param {perftools.profiles.IFunction=} [properties] Properties to set
       * @returns {perftools.profiles.Function} Function instance
       */
      Function.create = function create(properties) {
        return new Function(properties)
      }

      /**
       * Encodes the specified Function message. Does not implicitly {@link perftools.profiles.Function.verify|verify} messages.
       * @function encode
       * @memberof perftools.profiles.Function
       * @static
       * @param {perftools.profiles.IFunction} message Function message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      Function.encode = function encode(message, writer) {
        if (!writer) writer = $Writer.create()
        if (message.id != null && message.hasOwnProperty('id'))
          writer.uint32(/* id 1, wireType 0 =*/ 8).uint64(message.id)
        if (message.name != null && message.hasOwnProperty('name'))
          writer.uint32(/* id 2, wireType 0 =*/ 16).int64(message.name)
        if (message.systemName != null && message.hasOwnProperty('systemName'))
          writer.uint32(/* id 3, wireType 0 =*/ 24).int64(message.systemName)
        if (message.filename != null && message.hasOwnProperty('filename'))
          writer.uint32(/* id 4, wireType 0 =*/ 32).int64(message.filename)
        if (message.startLine != null && message.hasOwnProperty('startLine'))
          writer.uint32(/* id 5, wireType 0 =*/ 40).int64(message.startLine)
        return writer
      }

      /**
       * Encodes the specified Function message, length delimited. Does not implicitly {@link perftools.profiles.Function.verify|verify} messages.
       * @function encodeDelimited
       * @memberof perftools.profiles.Function
       * @static
       * @param {perftools.profiles.IFunction} message Function message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      Function.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim()
      }

      /**
       * Decodes a Function message from the specified reader or buffer.
       * @function decode
       * @memberof perftools.profiles.Function
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @param {number} [length] Message length if known beforehand
       * @returns {perftools.profiles.Function} Function
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      Function.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader)) reader = $Reader.create(reader)
        var end = length === undefined ? reader.len : reader.pos + length,
          message = new $root.perftools.profiles.Function()
        while (reader.pos < end) {
          var tag = reader.uint32()
          switch (tag >>> 3) {
            case 1:
              message.id = reader.uint64()
              break
            case 2:
              message.name = reader.int64()
              break
            case 3:
              message.systemName = reader.int64()
              break
            case 4:
              message.filename = reader.int64()
              break
            case 5:
              message.startLine = reader.int64()
              break
            default:
              reader.skipType(tag & 7)
              break
          }
        }
        return message
      }

      /**
       * Decodes a Function message from the specified reader or buffer, length delimited.
       * @function decodeDelimited
       * @memberof perftools.profiles.Function
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @returns {perftools.profiles.Function} Function
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      Function.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader)) reader = new $Reader(reader)
        return this.decode(reader, reader.uint32())
      }

      /**
       * Verifies a Function message.
       * @function verify
       * @memberof perftools.profiles.Function
       * @static
       * @param {Object.<string,*>} message Plain object to verify
       * @returns {string|null} `null` if valid, otherwise the reason why it is not
       */
      Function.verify = function verify(message) {
        if (typeof message !== 'object' || message === null) return 'object expected'
        if (message.id != null && message.hasOwnProperty('id'))
          if (
            !$util.isInteger(message.id) &&
            !(message.id && $util.isInteger(message.id.low) && $util.isInteger(message.id.high))
          )
            return 'id: integer|Long expected'
        if (message.name != null && message.hasOwnProperty('name'))
          if (
            !$util.isInteger(message.name) &&
            !(
              message.name &&
              $util.isInteger(message.name.low) &&
              $util.isInteger(message.name.high)
            )
          )
            return 'name: integer|Long expected'
        if (message.systemName != null && message.hasOwnProperty('systemName'))
          if (
            !$util.isInteger(message.systemName) &&
            !(
              message.systemName &&
              $util.isInteger(message.systemName.low) &&
              $util.isInteger(message.systemName.high)
            )
          )
            return 'systemName: integer|Long expected'
        if (message.filename != null && message.hasOwnProperty('filename'))
          if (
            !$util.isInteger(message.filename) &&
            !(
              message.filename &&
              $util.isInteger(message.filename.low) &&
              $util.isInteger(message.filename.high)
            )
          )
            return 'filename: integer|Long expected'
        if (message.startLine != null && message.hasOwnProperty('startLine'))
          if (
            !$util.isInteger(message.startLine) &&
            !(
              message.startLine &&
              $util.isInteger(message.startLine.low) &&
              $util.isInteger(message.startLine.high)
            )
          )
            return 'startLine: integer|Long expected'
        return null
      }

      /**
       * Creates a Function message from a plain object. Also converts values to their respective internal types.
       * @function fromObject
       * @memberof perftools.profiles.Function
       * @static
       * @param {Object.<string,*>} object Plain object
       * @returns {perftools.profiles.Function} Function
       */
      Function.fromObject = function fromObject(object) {
        if (object instanceof $root.perftools.profiles.Function) return object
        var message = new $root.perftools.profiles.Function()
        if (object.id != null)
          if ($util.Long) (message.id = $util.Long.fromValue(object.id)).unsigned = true
          else if (typeof object.id === 'string') message.id = parseInt(object.id, 10)
          else if (typeof object.id === 'number') message.id = object.id
          else if (typeof object.id === 'object')
            message.id = new $util.LongBits(object.id.low >>> 0, object.id.high >>> 0).toNumber(
              true,
            )
        if (object.name != null)
          if ($util.Long) (message.name = $util.Long.fromValue(object.name)).unsigned = false
          else if (typeof object.name === 'string') message.name = parseInt(object.name, 10)
          else if (typeof object.name === 'number') message.name = object.name
          else if (typeof object.name === 'object')
            message.name = new $util.LongBits(
              object.name.low >>> 0,
              object.name.high >>> 0,
            ).toNumber()
        if (object.systemName != null)
          if ($util.Long)
            (message.systemName = $util.Long.fromValue(object.systemName)).unsigned = false
          else if (typeof object.systemName === 'string')
            message.systemName = parseInt(object.systemName, 10)
          else if (typeof object.systemName === 'number') message.systemName = object.systemName
          else if (typeof object.systemName === 'object')
            message.systemName = new $util.LongBits(
              object.systemName.low >>> 0,
              object.systemName.high >>> 0,
            ).toNumber()
        if (object.filename != null)
          if ($util.Long)
            (message.filename = $util.Long.fromValue(object.filename)).unsigned = false
          else if (typeof object.filename === 'string')
            message.filename = parseInt(object.filename, 10)
          else if (typeof object.filename === 'number') message.filename = object.filename
          else if (typeof object.filename === 'object')
            message.filename = new $util.LongBits(
              object.filename.low >>> 0,
              object.filename.high >>> 0,
            ).toNumber()
        if (object.startLine != null)
          if ($util.Long)
            (message.startLine = $util.Long.fromValue(object.startLine)).unsigned = false
          else if (typeof object.startLine === 'string')
            message.startLine = parseInt(object.startLine, 10)
          else if (typeof object.startLine === 'number') message.startLine = object.startLine
          else if (typeof object.startLine === 'object')
            message.startLine = new $util.LongBits(
              object.startLine.low >>> 0,
              object.startLine.high >>> 0,
            ).toNumber()
        return message
      }

      /**
       * Creates a plain object from a Function message. Also converts values to other types if specified.
       * @function toObject
       * @memberof perftools.profiles.Function
       * @static
       * @param {perftools.profiles.Function} message Function
       * @param {$protobuf.IConversionOptions} [options] Conversion options
       * @returns {Object.<string,*>} Plain object
       */
      Function.toObject = function toObject(message, options) {
        if (!options) options = {}
        var object = {}
        if (options.defaults) {
          if ($util.Long) {
            var long = new $util.Long(0, 0, true)
            object.id =
              options.longs === String
                ? long.toString()
                : options.longs === Number
                  ? long.toNumber()
                  : long
          } else object.id = options.longs === String ? '0' : 0
          if ($util.Long) {
            var long = new $util.Long(0, 0, false)
            object.name =
              options.longs === String
                ? long.toString()
                : options.longs === Number
                  ? long.toNumber()
                  : long
          } else object.name = options.longs === String ? '0' : 0
          if ($util.Long) {
            var long = new $util.Long(0, 0, false)
            object.systemName =
              options.longs === String
                ? long.toString()
                : options.longs === Number
                  ? long.toNumber()
                  : long
          } else object.systemName = options.longs === String ? '0' : 0
          if ($util.Long) {
            var long = new $util.Long(0, 0, false)
            object.filename =
              options.longs === String
                ? long.toString()
                : options.longs === Number
                  ? long.toNumber()
                  : long
          } else object.filename = options.longs === String ? '0' : 0
          if ($util.Long) {
            var long = new $util.Long(0, 0, false)
            object.startLine =
              options.longs === String
                ? long.toString()
                : options.longs === Number
                  ? long.toNumber()
                  : long
          } else object.startLine = options.longs === String ? '0' : 0
        }
        if (message.id != null && message.hasOwnProperty('id'))
          if (typeof message.id === 'number')
            object.id = options.longs === String ? String(message.id) : message.id
          else
            object.id =
              options.longs === String
                ? $util.Long.prototype.toString.call(message.id)
                : options.longs === Number
                  ? new $util.LongBits(message.id.low >>> 0, message.id.high >>> 0).toNumber(true)
                  : message.id
        if (message.name != null && message.hasOwnProperty('name'))
          if (typeof message.name === 'number')
            object.name = options.longs === String ? String(message.name) : message.name
          else
            object.name =
              options.longs === String
                ? $util.Long.prototype.toString.call(message.name)
                : options.longs === Number
                  ? new $util.LongBits(message.name.low >>> 0, message.name.high >>> 0).toNumber()
                  : message.name
        if (message.systemName != null && message.hasOwnProperty('systemName'))
          if (typeof message.systemName === 'number')
            object.systemName =
              options.longs === String ? String(message.systemName) : message.systemName
          else
            object.systemName =
              options.longs === String
                ? $util.Long.prototype.toString.call(message.systemName)
                : options.longs === Number
                  ? new $util.LongBits(
                      message.systemName.low >>> 0,
                      message.systemName.high >>> 0,
                    ).toNumber()
                  : message.systemName
        if (message.filename != null && message.hasOwnProperty('filename'))
          if (typeof message.filename === 'number')
            object.filename = options.longs === String ? String(message.filename) : message.filename
          else
            object.filename =
              options.longs === String
                ? $util.Long.prototype.toString.call(message.filename)
                : options.longs === Number
                  ? new $util.LongBits(
                      message.filename.low >>> 0,
                      message.filename.high >>> 0,
                    ).toNumber()
                  : message.filename
        if (message.startLine != null && message.hasOwnProperty('startLine'))
          if (typeof message.startLine === 'number')
            object.startLine =
              options.longs === String ? String(message.startLine) : message.startLine
          else
            object.startLine =
              options.longs === String
                ? $util.Long.prototype.toString.call(message.startLine)
                : options.longs === Number
                  ? new $util.LongBits(
                      message.startLine.low >>> 0,
                      message.startLine.high >>> 0,
                    ).toNumber()
                  : message.startLine
        return object
      }

      /**
       * Converts this Function to JSON.
       * @function toJSON
       * @memberof perftools.profiles.Function
       * @instance
       * @returns {Object.<string,*>} JSON object
       */
      Function.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions)
      }

      return Function
    })()

    return profiles
  })()

  return perftools
})()

module.exports = $root
