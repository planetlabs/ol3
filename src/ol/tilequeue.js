goog.provide('ol.TilePriorityFunction');
goog.provide('ol.TileQueue');

goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('ol.Coordinate');
goog.require('ol.TileState');
goog.require('ol.structs.PriorityQueue');


/**
 * @typedef {function(ol.Tile, string, ol.Coordinate, number): number}
 */
ol.TilePriorityFunction;



/**
 * @constructor
 * @extends {ol.structs.PriorityQueue.<Array>}
 * @param {ol.TilePriorityFunction} tilePriorityFunction
 *     Tile priority function.
 * @param {function(): ?} tileChangeCallback
 *     Function called on each tile change event.
 * @struct
 */
ol.TileQueue = function(tilePriorityFunction, tileChangeCallback) {

  goog.base(
      this,
      /**
       * @param {Array} element Element.
       * @return {number} Priority.
       */
      function(element) {
        return tilePriorityFunction.apply(null, element);
      },
      /**
       * @param {Array} element Element.
       * @return {string} Key.
       */
      function(element) {
        return /** @type {ol.Tile} */ (element[0]).getKey();
      });

  /**
   * @private
   * @type {function(): ?}
   */
  this.tileChangeCallback_ = tileChangeCallback;

  /**
   * @private
   * @type {number}
   */
  this.tilesLoading_ = 0;

  this.maxTotalLoading_ = 16;

  this.maxNewLoads_ = 16;

};
goog.inherits(ol.TileQueue, ol.structs.PriorityQueue);


ol.TileQueue.prototype.enqueue = function(element) {
  ol.TileQueue.base(this, 'enqueue', element);
  //Here we kick off the loading piece
  this.loadMoreTiles_();
}

/**
 * @return {number} Number of tiles loading.
 */
ol.TileQueue.prototype.getTilesLoading = function() {
  return this.tilesLoading_;
};


/**
 * @param {goog.events.Event} event Event.
 * @protected
 */
ol.TileQueue.prototype.handleTileChange = function(event) {
  var tile = /** @type {ol.Tile} */ (event.target);
  var state = tile.getState();
  if (state === ol.TileState.LOADED || state === ol.TileState.ERROR ||
      state === ol.TileState.EMPTY) {
    goog.events.unlisten(tile, goog.events.EventType.CHANGE,
        this.handleTileChange, false, this);
    --this.tilesLoading_;
    this.tileChangeCallback_();
  }
  this.loadMoreTiles_();
};


/**
 * Dequeues tiles until the queue is saturated.
 */
ol.TileQueue.prototype.loadMoreTiles_ = function() {
  var maxTotalLoading = this.maxTotalLoading_;
  var maxNewLoads = this.maxNewLoads_;
  var newLoads = 0;
  var tile, tileStruct;
  while (this.tilesLoading_ < maxTotalLoading && newLoads < maxNewLoads &&
         this.getCount() > 0) {
    tileStruct = this.dequeue();
    var priority = this.priorityFunction_(tileStruct);
    if (priority != ol.structs.PriorityQueue.DROP) {
      tile = tileStruct[0];
      if (tile.getState() === ol.TileState.IDLE) {
        goog.events.listen(tile, goog.events.EventType.CHANGE,
            this.handleTileChange, false, this);
        tile.load();
        ++this.tilesLoading_;
        ++newLoads;
      }
    }
  }
};


/**
 * Maintains the current interface but is now used to set loading thresholds
 * @param  {number} maxTotalLoading max number of concurrent loading tiles
 * @param  {number} maxNewLoads     max new tiles to add at each pass
 */
ol.TileQueue.prototype.loadMoreTiles = function(maxTotalLoading, maxNewLoads) {
  this.maxTotalLoading_ = maxTotalLoading;
  this.maxNewLoads_ = maxNewLoads;
  this.loadMoreTiles_();
}
