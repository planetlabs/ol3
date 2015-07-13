goog.provide('ol.test.TileQueue');

describe

('ol.TileQueue', function() {

  function addRandomPriorityTiles(tq, num) {
    var i, tile, priority;
    for (i = 0; i < num; i++) {
      tile = new ol.Tile();
      priority = Math.floor(Math.random() * 100);
      tq.elements_.push([tile, '', [0, 0]]);
      tq.priorities_.push(priority);
      tq.queuedElements_[tile.getKey()] = true;
    }
  }

  var tileId = 0;
  function createImageTile() {
    ++tileId;
    var tileCoord = [tileId, tileId, tileId];
    var state = ol.TileState.IDLE;
    var src = 'data:image/gif;base64,R0lGODlhAQABAPAAAP8AAP///' +
        'yH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==#' + tileId;

    return new ol.ImageTile(tileCoord, state, src, null,
        ol.source.Image.defaultImageLoadFunction);
  }

  describe('enqueue()', function() {

    var noop = function() {};

    it('Enqueues the tiles and loads them', function(done) {
      var q = new ol.TileQueue(noop, noop);

      var numTiles = 20;
      var maxLoading = 2;
      var maxNewLoads = 2;

      q.loadMoreTiles(maxLoading, maxNewLoads);

      for (var i = 0; i < numTiles; ++i) {
        var tile = createImageTile();
        q.enqueue([tile]);
      }

      expect(q.getCount()).to.equal(numTiles - Math.min(maxLoading, maxNewLoads));
      expect(q.getTilesLoading()).to.equal(Math.min(maxLoading, maxNewLoads));

      setTimeout(function() {

        expect(q.getCount()).to.equal(0);
        expect(q.getTilesLoading()).to.equal(0);

        done();
      }, 20);
    });
  });

  describe('#loadMoreTiles()', function() {
    var noop = function() {};

    it('works when tile queues share tiles', function(done) {
      var q1 = new ol.TileQueue(noop, noop);
      var q2 = new ol.TileQueue(noop, noop);

      var maxLoading = 2;
      var maxNewLoads = 2;

      q1.loadMoreTiles(maxLoading, maxNewLoads);
      q2.loadMoreTiles(maxLoading, maxNewLoads);

      var numTiles = 20;
      for (var i = 0; i < numTiles; ++i) {
        var tile = createImageTile();
        q1.enqueue([tile]);
        q2.enqueue([tile]);
      }

      // Since loading starts immediately, some tiles will be loading
      expect(q1.getCount()).to.equal(numTiles - Math.min(maxLoading, maxNewLoads));
      expect(q2.getCount()).to.equal(numTiles - (Math.min(maxLoading, maxNewLoads) * 2));

      // let all tiles load
      setTimeout(function() {
        expect(q1.getTilesLoading()).to.equal(0);
        expect(q2.getTilesLoading()).to.equal(0);

        expect(q1.getCount()).to.equal(0);
        expect(q2.getCount()).to.equal(0);

        done();
      }, 20);

    });

  });

  describe('heapify', function() {
    it('does convert an arbitrary array into a heap', function() {

      var tq = new ol.TileQueue(function() {});
      addRandomPriorityTiles(tq, 100);

      tq.heapify_();
      expect(function() {
        tq.assertValid();
      }).not.to.throwException();
    });
  });

  describe('reprioritize', function() {
    it('does reprioritize the array', function() {

      var tq = new ol.TileQueue(function() {});
      addRandomPriorityTiles(tq, 100);

      tq.heapify_();

      // now reprioritize, changing the priority of 50 tiles and removing the
      // rest

      var i = 0;
      tq.priorityFunction_ = function() {
        if ((i++) % 2 === 0) {
          return ol.structs.PriorityQueue.DROP;
        }
        return Math.floor(Math.random() * 100);
      };

      tq.reprioritize();
      expect(tq.elements_.length).to.eql(50);
      expect(tq.priorities_.length).to.eql(50);
      expect(function() {
        tq.assertValid();
      }).not.to.throwException();

    });
  });
});

goog.require('ol.Tile');
goog.require('ol.TileQueue');
goog.require('ol.structs.PriorityQueue');
