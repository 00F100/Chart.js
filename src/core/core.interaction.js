'use strict';

module.exports = function(Chart) {
	var helpers = Chart.helpers;

	function indexMode(chartInstance, e) {
		var eventPosition = helpers.getRelativePosition(e, chartInstance.chart);
		var elementsArray = [];

		var found = function() {
			if (chartInstance.data.datasets) {
				for (var i = 0; i < chartInstance.data.datasets.length; i++) {
					var meta = chartInstance.getDatasetMeta(i);
					if (chartInstance.isDatasetVisible(i)) {
						for (var j = 0; j < meta.data.length; j++) {
							if (meta.data[j].inRange(eventPosition.x, eventPosition.y)) {
								return meta.data[j];
							}
						}
					}
				}
			}
		}.call(chartInstance);

		if (!found) {
			return elementsArray;
		}

		helpers.each(chartInstance.data.datasets, function(dataset, datasetIndex) {
			if (chartInstance.isDatasetVisible(datasetIndex)) {
				var meta = chartInstance.getDatasetMeta(datasetIndex),
					element = meta.data[found._index];
				if (element && !element._view.skip) {
					elementsArray.push(element);
				}
			}
		}, chartInstance);

		return elementsArray;
	}

	/*
	 * @namespace Chart.Interaction
	 * Contains interaction related functions
	 */
	Chart.Interaction = {
		// Helper function for different modes
		modes: {
			single: function(chartInstance, e) {
				var eventPosition = helpers.getRelativePosition(e, chartInstance.chart);
				var elementsArray = [];

				helpers.each(chartInstance.data.datasets, function(dataset, datasetIndex) {
					if (chartInstance.isDatasetVisible(datasetIndex)) {
						var meta = chartInstance.getDatasetMeta(datasetIndex);
						helpers.each(meta.data, function(element) {
							if (element.inRange(eventPosition.x, eventPosition.y)) {
								elementsArray.push(element);
								return elementsArray;
							}
						});
					}
				});

				return elementsArray.slice(0, 1);
			},

			// Old label mode is the new (v2.4) index mode
			label: indexMode,

			dataset: function(chartInstance, e) {
				var elementsArray = chartInstance.getElementAtEvent(e);

				if (elementsArray.length > 0) {
					elementsArray = chartInstance.getDatasetMeta(elementsArray[0]._datasetIndex).data;
				}

				return elementsArray;
			},
			'x-axis': function(chartInstance, e) {
				var eventPosition = helpers.getRelativePosition(e, chartInstance.chart);
				var elementsArray = [];

				var found = function() {
					if (chartInstance.data.datasets) {
						for (var i = 0; i < chartInstance.data.datasets.length; i++) {
							var meta = chartInstance.getDatasetMeta(i);
							if (chartInstance.isDatasetVisible(i)) {
								for (var j = 0; j < meta.data.length; j++) {
									if (meta.data[j].inLabelRange(eventPosition.x, eventPosition.y)) {
										return meta.data[j];
									}
								}
							}
						}
					}
				}.call(chartInstance);

				if (!found) {
					return elementsArray;
				}

				helpers.each(chartInstance.data.datasets, function(dataset, datasetIndex) {
					if (chartInstance.isDatasetVisible(datasetIndex)) {
						var meta = chartInstance.getDatasetMeta(datasetIndex);
						var index = helpers.findIndex(meta.data, function(it) {
							return found._model.x === it._model.x;
						});
						if (index !== -1 && !meta.data[index]._view.skip) {
							elementsArray.push(meta.data[index]);
						}
					}
				}, chartInstance);

				return elementsArray;
			},

			// Modes introduced in v2.4

			/**
			 * Intersection mode returns all elements that hit test based on the position
			 * of the event
			 * @function Chart.Interaction.modes.intersect
			 * @param chartInstance {ChartInstance} the chart we are returning items from
			 * @param e {Event} the event we are find things at
			 * @return {Chart.Element[]} Array of elements that are under the point. If none are found, an empty array is returned
			 */
			intersect: function(chartInstance, e) {
				var eventPosition = helpers.getRelativePosition(e, chartInstance.chart);
				var elementsArray = [];

				helpers.each(chartInstance.data.datasets, function(dataset, datasetIndex) {
					if (chartInstance.isDatasetVisible(datasetIndex)) {
						var meta = chartInstance.getDatasetMeta(datasetIndex);
						helpers.each(meta.data, function(element) {
							if (element.inRange(eventPosition.x, eventPosition.y)) {
								elementsArray.push(element);
							}
						});
					}
				});

				return elementsArray;
			},

			index: indexMode,

			/**
			 * nearest mode returns the element closest to the point
			 * @function Chart.Interaction.modes.intersect
			 * @param chartInstance {ChartInstance} the chart we are returning items from
			 * @param e {Event} the event we are find things at
			 * @return {Chart.Element[]} Array of elements that are under the point. If none are found, an empty array is returned
			 */
			nearest: function(chartInstance, e) {
				var nearestItems = [];
				var minDistance = Number.POSITIVE_INFINITY;

				var eventPosition = helpers.getRelativePosition(e, chartInstance.chart);

				helpers.each(chartInstance.data.datasets, function(dataset, datasetIndex) {
					if (chartInstance.isDatasetVisible(datasetIndex)) {
						var meta = chartInstance.getDatasetMeta(datasetIndex);
						helpers.each(meta.data, function(element) {
							var distance = Math.round(element.distanceToCenter(eventPosition));

							if (distance < minDistance) {
								nearestItems = [element];
								minDistance = distance;
							} else if (distance === minDistance) {
								// Can have multiple items at the same distance in which case we sort by size
								nearestItems.push(element);
							}
						});
					}
				});

				if (nearestItems.length > 1) {
					// We have multiple items at the same distance from the event. Now sort by smallest
					nearestItems.sort(function(a, b) {
						var sizeA = a.getArea();
						var sizeB = b.getArea();
						var ret = sizeA - sizeB;

						if (ret === 0) {
							// if equal sort by dataset index
							ret = a._datasetIndex - b._datasetIndex;
						}

						return ret;
					});
				}

				// Return only 1 item
				return nearestItems.slice(0, 1);
			},

			nearestIntersect: function(chartInstance, e) {
				var intersect = this.intersect(chartInstance, e);
				var nearestItems = [];
				var minDistance = Number.POSITIVE_INFINITY;
				var eventPosition = helpers.getRelativePosition(e, chartInstance.chart);

				helpers.each(intersect, function(element) {
					var distance = Math.round(element.distanceToCenter(eventPosition));

					if (distance < minDistance) {
						nearestItems = [element];
						minDistance = distance;
					} else if (distance === minDistance) {
						// Can have multiple items at the same distance in which case we sort by size
						nearestItems.push(element);
					}
				});

				if (nearestItems.length > 1) {
					// We have multiple items at the same distance from the event. Now sort by smallest
					nearestItems.sort(function(a, b) {
						var sizeA = a.getArea();
						var sizeB = b.getArea();
						var ret = sizeA - sizeB;

						if (ret === 0) {
							// if equal sort by dataset index
							ret = a._datasetIndex - b._datasetIndex;
						}

						return ret;
					});
				}

				// Return only 1 item
				return nearestItems.slice(0, 1);
			}
		}
	};
};
