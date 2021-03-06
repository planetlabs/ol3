import {nullFunction} from '../../../../src/ol/index.js';
import {getListeners} from '../../../../src/ol/events.js';
import LineString from '../../../../src/ol/geom/LineString.js';
import Point from '../../../../src/ol/geom/Point.js';
import Polygon from '../../../../src/ol/geom/Polygon.js';
import MultiLineString from '../../../../src/ol/geom/MultiLineString.js';
import MultiPoint from '../../../../src/ol/geom/MultiPoint.js';
import MultiPolygon from '../../../../src/ol/geom/MultiPolygon.js';
import CanvasReplayGroup from '../../../../src/ol/render/canvas/ReplayGroup.js';
import _ol_renderer_vector_ from '../../../../src/ol/renderer/vector.js';
import Fill from '../../../../src/ol/style/Fill.js';
import Icon from '../../../../src/ol/style/Icon.js';
import Stroke from '../../../../src/ol/style/Stroke.js';
import Style from '../../../../src/ol/style/Style.js';
import Feature from '../../../../src/ol/Feature.js';


describe('ol.renderer.vector', function() {
  describe('#renderFeature', function() {
    let replayGroup;
    let feature, iconStyle, style, squaredTolerance, listener, listenerThis;
    let iconStyleLoadSpy;

    beforeEach(function() {
      replayGroup = new CanvasReplayGroup(1);
      feature = new Feature();
      iconStyle = new Icon({
        src: 'http://example.com/icon.png'
      });
      style = new Style({
        image: iconStyle,
        fill: new Fill({}),
        stroke: new Stroke({})
      });
      squaredTolerance = 1;
      listener = function() {};
      listenerThis = {};
      iconStyleLoadSpy = sinon.stub(iconStyle, 'load').callsFake(function() {
        iconStyle.iconImage_.imageState_ = 1; // LOADING
      });
    });

    afterEach(function() {
      iconStyleLoadSpy.restore();
    });

    describe('call multiple times', function() {

      it('does not set multiple listeners', function() {
        let listeners;

        // call #1
        _ol_renderer_vector_.renderFeature(replayGroup, feature,
          style, squaredTolerance, listener, listenerThis);

        expect(iconStyleLoadSpy.calledOnce).to.be.ok();
        listeners = getListeners(
          iconStyle.iconImage_, 'change');
        expect(listeners.length).to.eql(1);

        // call #2
        _ol_renderer_vector_.renderFeature(replayGroup, feature,
          style, squaredTolerance, listener, listenerThis);

        expect(iconStyleLoadSpy.calledOnce).to.be.ok();
        listeners = getListeners(
          iconStyle.iconImage_, 'change');
        expect(listeners.length).to.eql(1);
      });

    });

    describe('call renderFeature with a loading icon', function() {

      it('does not render the point', function() {
        feature.setGeometry(new Point([0, 0]));
        const imageReplay = replayGroup.getReplay(
          style.getZIndex(), 'Image');
        const setImageStyleSpy = sinon.spy(imageReplay, 'setImageStyle');
        const drawPointSpy = sinon.stub(imageReplay, 'drawPoint').callsFake(nullFunction);
        _ol_renderer_vector_.renderFeature(replayGroup, feature,
          style, squaredTolerance, listener, listenerThis);
        expect(setImageStyleSpy.called).to.be(false);
        setImageStyleSpy.restore();
        drawPointSpy.restore();
      });

      it('does not render the multipoint', function() {
        feature.setGeometry(new MultiPoint([[0, 0], [1, 1]]));
        const imageReplay = replayGroup.getReplay(
          style.getZIndex(), 'Image');
        const setImageStyleSpy = sinon.spy(imageReplay, 'setImageStyle');
        const drawMultiPointSpy = sinon.stub(imageReplay, 'drawMultiPoint').callsFake(nullFunction);
        _ol_renderer_vector_.renderFeature(replayGroup, feature,
          style, squaredTolerance, listener, listenerThis);
        expect(setImageStyleSpy.called).to.be(false);
        setImageStyleSpy.restore();
        drawMultiPointSpy.restore();
      });

      it('does render the linestring', function() {
        feature.setGeometry(new LineString([[0, 0], [1, 1]]));
        const lineStringReplay = replayGroup.getReplay(
          style.getZIndex(), 'LineString');
        const setFillStrokeStyleSpy = sinon.spy(lineStringReplay,
          'setFillStrokeStyle');
        const drawLineStringSpy = sinon.stub(lineStringReplay, 'drawLineString').callsFake(nullFunction);
        _ol_renderer_vector_.renderFeature(replayGroup, feature,
          style, squaredTolerance, listener, listenerThis);
        expect(setFillStrokeStyleSpy.called).to.be(true);
        expect(drawLineStringSpy.called).to.be(true);
        setFillStrokeStyleSpy.restore();
        drawLineStringSpy.restore();
      });

      it('does render the multilinestring', function() {
        feature.setGeometry(new MultiLineString([[[0, 0], [1, 1]]]));
        const lineStringReplay = replayGroup.getReplay(
          style.getZIndex(), 'LineString');
        const setFillStrokeStyleSpy = sinon.spy(lineStringReplay,
          'setFillStrokeStyle');
        const drawMultiLineStringSpy = sinon.stub(lineStringReplay, 'drawMultiLineString').callsFake(nullFunction);
        _ol_renderer_vector_.renderFeature(replayGroup, feature,
          style, squaredTolerance, listener, listenerThis);
        expect(setFillStrokeStyleSpy.called).to.be(true);
        expect(drawMultiLineStringSpy.called).to.be(true);
        setFillStrokeStyleSpy.restore();
        drawMultiLineStringSpy.restore();
      });

      it('does render the polygon', function() {
        feature.setGeometry(new Polygon(
          [[[0, 0], [1, 1], [1, 0], [0, 0]]]));
        const polygonReplay = replayGroup.getReplay(
          style.getZIndex(), 'Polygon');
        const setFillStrokeStyleSpy = sinon.spy(polygonReplay,
          'setFillStrokeStyle');
        const drawPolygonSpy = sinon.stub(polygonReplay, 'drawPolygon').callsFake(nullFunction);
        _ol_renderer_vector_.renderFeature(replayGroup, feature,
          style, squaredTolerance, listener, listenerThis);
        expect(setFillStrokeStyleSpy.called).to.be(true);
        expect(drawPolygonSpy.called).to.be(true);
        setFillStrokeStyleSpy.restore();
        drawPolygonSpy.restore();
      });

      it('does render the multipolygon', function() {
        feature.setGeometry(new MultiPolygon(
          [[[[0, 0], [1, 1], [1, 0], [0, 0]]]]));
        const polygonReplay = replayGroup.getReplay(
          style.getZIndex(), 'Polygon');
        const setFillStrokeStyleSpy = sinon.spy(polygonReplay,
          'setFillStrokeStyle');
        const drawMultiPolygonSpy = sinon.stub(polygonReplay, 'drawMultiPolygon').callsFake(nullFunction);
        _ol_renderer_vector_.renderFeature(replayGroup, feature,
          style, squaredTolerance, listener, listenerThis);
        expect(setFillStrokeStyleSpy.called).to.be(true);
        expect(drawMultiPolygonSpy.called).to.be(true);
        setFillStrokeStyleSpy.restore();
        drawMultiPolygonSpy.restore();
      });
    });

  });
});
