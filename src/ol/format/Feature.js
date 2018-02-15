/**
 * @module ol/format/Feature
 */
import Geometry from '../geom/Geometry.js';
import GeometryType from '../geom/GeometryType.js';
import {assign} from '../obj.js';
import {get as getProjection, equivalent as equivalentProjection, transformExtent} from '../proj.js';

/**
 * @classdesc
 * Abstract base class; normally only used for creating subclasses and not
 * instantiated in apps.
 * Base class for feature formats.
 * {ol.format.Feature} subclasses provide the ability to decode and encode
 * {@link ol.Feature} objects from a variety of commonly used geospatial
 * file formats.  See the documentation for each format for more details.
 *
 * @constructor
 * @abstract
 * @api
 */
const FeatureFormat = function() {

  /**
   * @protected
   * @type {ol.proj.Projection}
   */
  this.defaultDataProjection = null;

  /**
   * @protected
   * @type {ol.proj.Projection}
   */
  this.defaultFeatureProjection = null;

};


/**
 * Adds the data projection to the read options.
 * @param {Document|Node|Object|string} source Source.
 * @param {olx.format.ReadOptions=} opt_options Options.
 * @return {olx.format.ReadOptions|undefined} Options.
 * @protected
 */
FeatureFormat.prototype.getReadOptions = function(source, opt_options) {
  let options;
  if (opt_options) {
    options = {
      dataProjection: opt_options.dataProjection ?
        opt_options.dataProjection : this.readProjection(source),
      featureProjection: opt_options.featureProjection
    };
  }
  return this.adaptOptions(options);
};


/**
 * Sets the `defaultDataProjection` on the options, if no `dataProjection`
 * is set.
 * @param {olx.format.WriteOptions|olx.format.ReadOptions|undefined} options
 *     Options.
 * @protected
 * @return {olx.format.WriteOptions|olx.format.ReadOptions|undefined}
 *     Updated options.
 */
FeatureFormat.prototype.adaptOptions = function(options) {
  return assign({
    dataProjection: this.defaultDataProjection,
    featureProjection: this.defaultFeatureProjection
  }, options);
};


/**
 * Get the extent from the source of the last {@link readFeatures} call.
 * @return {ol.Extent} Tile extent.
 */
FeatureFormat.prototype.getLastExtent = function() {
  return null;
};


/**
 * @abstract
 * @return {ol.format.FormatType} Format.
 */
FeatureFormat.prototype.getType = function() {};


/**
 * Read a single feature from a source.
 *
 * @abstract
 * @param {Document|Node|Object|string} source Source.
 * @param {olx.format.ReadOptions=} opt_options Read options.
 * @return {ol.Feature} Feature.
 */
FeatureFormat.prototype.readFeature = function(source, opt_options) {};


/**
 * Read all features from a source.
 *
 * @abstract
 * @param {Document|Node|ArrayBuffer|Object|string} source Source.
 * @param {olx.format.ReadOptions=} opt_options Read options.
 * @return {Array.<ol.Feature>} Features.
 */
FeatureFormat.prototype.readFeatures = function(source, opt_options) {};


/**
 * Read a single geometry from a source.
 *
 * @abstract
 * @param {Document|Node|Object|string} source Source.
 * @param {olx.format.ReadOptions=} opt_options Read options.
 * @return {ol.geom.Geometry} Geometry.
 */
FeatureFormat.prototype.readGeometry = function(source, opt_options) {};


/**
 * Read the projection from a source.
 *
 * @abstract
 * @param {Document|Node|Object|string} source Source.
 * @return {ol.proj.Projection} Projection.
 */
FeatureFormat.prototype.readProjection = function(source) {};


/**
 * Encode a feature in this format.
 *
 * @abstract
 * @param {ol.Feature} feature Feature.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @return {string} Result.
 */
FeatureFormat.prototype.writeFeature = function(feature, opt_options) {};


/**
 * Encode an array of features in this format.
 *
 * @abstract
 * @param {Array.<ol.Feature>} features Features.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @return {string} Result.
 */
FeatureFormat.prototype.writeFeatures = function(features, opt_options) {};


/**
 * Write a single geometry in this format.
 *
 * @abstract
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @return {string} Result.
 */
FeatureFormat.prototype.writeGeometry = function(geometry, opt_options) {};

export default FeatureFormat;

/**
 * @param {ol.geom.Geometry|ol.Extent} geometry Geometry.
 * @param {boolean} write Set to true for writing, false for reading.
 * @param {(olx.format.WriteOptions|olx.format.ReadOptions)=} opt_options
 *     Options.
 * @return {ol.geom.Geometry|ol.Extent} Transformed geometry.
 */
export function transformWithOptions(geometry, write, opt_options) {
  const featureProjection = opt_options ?
    getProjection(opt_options.featureProjection) : null;
  const dataProjection = opt_options ?
    getProjection(opt_options.dataProjection) : null;

  if (opt_options && opt_options.wrap) {
    if (write) {
      geometry = wrap(geometry, featureProjection);
    } else {
      geometry = unwrap(geometry, dataProjection);
    }
  }

  /**
   * @type {ol.geom.Geometry|ol.Extent}
   */
  let transformed;
  if (featureProjection && dataProjection &&
      !equivalentProjection(featureProjection, dataProjection)) {
    if (geometry instanceof Geometry) {

      transformed = (write ? geometry.clone() : geometry).transform(
        write ? featureProjection : dataProjection,
        write ? dataProjection : featureProjection);
    } else {
      // FIXME this is necessary because ol.format.GML treats extents
      // as geometries
      transformed = transformExtent(
        geometry,
        dataProjection,
        featureProjection);
    }
  } else {
    transformed = geometry;
  }
  if (write && opt_options && opt_options.decimals !== undefined) {
    const power = Math.pow(10, opt_options.decimals);
    // if decimals option on write, round each coordinate appropriately
    /**
     * @param {Array.<number>} coordinates Coordinates.
     * @return {Array.<number>} Transformed coordinates.
     */
    const transform = function(coordinates) {
      for (let i = 0, ii = coordinates.length; i < ii; ++i) {
        coordinates[i] = Math.round(coordinates[i] * power) / power;
      }
      return coordinates;
    };
    if (transformed === geometry) {
      transformed = transformed.clone();
    }
    transformed.applyTransform(transform);
  }
  return transformed;
}

/**
 * Takes a geometry that has been wrapped and unwraps it.
 *
 * A wrapped geometry has no longitude values that are greater
 * than 180 or less than -180.  In addition, any segment in a
 * wrapped geometry that spans more than 180 degrees is assumed
 * to cross the antimeridian.
 *
 * An unwrapped geometry may have longitude values that are
 * greater than 180 or less than -180.
 *
 * Example 1:
 * input: LINESTRING(179 0, -179 0)
 * output: LINESTRING(179 0, 181 0)
 *
 * Example 2:
 * input:  LINESTRING(-179 0, 179 0)
 * output: LINESTRING(-179 0, -181 0)
 *
 *
 * @param {ol.geom.Geometry} geometry The wrapped geometry.
 * @param {ol.proj.Projection} to The target geometry projection.
 * @return {ol.geom.Geometry} The unwrapped geometry.
 */
export function unwrap(geometry, to) {
  return geometry;
}

/**
 * Takes a coordinate and wraps it.
 *
 * A wrapped coordinate has no longitude values that are greater
 * than 180 or less than -180.
 *
 * An unwrapped coordinate may have longitude values that are
 * greater than 180 or less than -180.
 *
 * Example 1:
 * input: [181, 0]
 * output: [-179, 0]
 *
 * Example 2:
 * input: [-181, 0]
 * output: [179, 0]
 *
 * @param {ol.Coordinate} coordinate The coordinate.
 * @param {ol.Projection} from The projection. <= TODO: Is this correct?
 * @return {ol.geom.Geometry} The unwrapped geometry.
 */
export function wrapped(coordinate, from) {
  const longitude = coordinate[0] % 360;

  if (longitude > 180) {
    return [longitude - 360, coordinate[1]];
  } else if (longitude < -179) {
    return [longitude + 360, coordinate[1]];
  }

  return [longitude, coordinate[1]];
}

/**
 * Takes an unwrapped geometry and wraps it.
 *
 * An unwrapped geometry may have longitude values that are
 * greater than 180 or less than -180.  Any segment in an
 * unwrapped geometry that spans more than 180 degrees will
 * have a point inserted at the prime meridian.
 *
 * A wrapped geometry has no longitude values that are greater
 * than 180 or less than -180.  In addition, any segment in a
 * wrapped geometry that spans more than 180 degrees is assumed
 * to cross the antimeridian.
 *
 * Example 1:
 * input:  LINESTRING(179 0, 181 0)
 * output: LINESTRING(179 0, -179 0)
 *
 * Example 2:
 * input:  LINESTRING(-179 0, -181 0)
 * output: LINESTRING(-179 0, 179 0)
 *
 * Example 3:
 * input:  LINESTRING(-179 0, 179 0)
 * output: LINESTRING(-179 0, 0 0, 179 0)
 *
 * @param {ol.geom.Geometry} geometry The input geometry.
 * @param {ol.proj.Projection} from The source geometry projection.
 * @return {ol.geom.Geometry} The wrapped geometry.
 */
export function wrap(geometry, from) {
  // Need to get the extent of the world from "FROM" instead of assuming geographic coordinates
  // and 360
  // extent exports a function called "getWidth"

  switch (geometry.getType()) {
    case GeometryType.POINT: {

      const coordinates = geometry.getCoordinates();
      geometry.setCoordinates(wrapped(coordinates));

      return geometry;
    }

    case GeometryType.MULTI_POINT: {
      // TODO: DRY up this code
      const coordinates = geometry.getCoordinates().slice();

      const wrappedCoordinates = coordinates.map(coordinate =>
        wrapped(coordinate));

      geometry.setCoordinates(wrappedCoordinates);
      return geometry;
    }

    case GeometryType.LINE_STRING: {
      const coordinates = geometry.getCoordinates().slice();

      // TODO: could call wrap here too
      const wrappedCoordinates = coordinates.map(coordinate =>
        wrapped(coordinate));

      geometry.setCoordinates(wrappedCoordinates);

      geometry.forEachSegment(function(start, end) {
        // TODO: Check for segments that are > 180°
      });

      return geometry;
    }

    case GeometryType.MULTI_LINE_STRING: {
      const lineStrings = geometry.getLineStrings();
      const wrapped = lineStrings.map(lineString =>
        wrap(lineString).getCoordinates());

      geometry.setCoordinates(wrapped);
      return geometry;
    }

    case GeometryType.LINEAR_RING: {
      const coordinates = geometry.getCoordinates().slice();
      const wrappedCoordinates = coordinates.map(coordinate =>
        wrapped(coordinate));

      // NOTE: Will probably have to check segments here for > 180°

      geometry.setCoordinates(wrappedCoordinates);

      return geometry;
    }

    case GeometryType.POLYGON: {
      const rings = geometry.getLinearRings();
      const wrapped = rings.map(ring => wrap(ring).getCoordinates());

      geometry.setCoordinates(wrapped);

      return geometry;
    }

    case GeometryType.MULTI_POLYGON: {
      const polygons = geometry.getPolygons();
      const wrapped = polygons.map(polygon => wrap(polygon).getCoordinates());

      geometry.setCoordinates(wrapped);

      return geometry;
    }

    case GeometryType.GEOMETRY_COLLECTION: {
      // We get this for "free"
      return geometry;
    }

    case GeometryType.CIRCLE: {
      // TODO: Circle?
      return geometry;
    }

    default:
      throw new Error('Unexpected Geometry Type');
  }
}
