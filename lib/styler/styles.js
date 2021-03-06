var d3 = require('d3');
var clone = require('clone');
/**
 * Scales for utility functions to use
 */

var zoomScale = d3.scale.linear().domain([0.25, 1, 4]);
var strokeScale = d3.scale.linear().domain([0.25, 1, 4]).range([5, 12, 19]);
var fontScale = d3.scale.linear().domain([0.25, 1, 4]).range([10, 14, 18]);

/**
 * Scales for utility functions to use
 */

var notFocusedColor = '#e0e0e0';

/**
 * Expose `utils` for the style functions to use
 */

exports.utils = {
  pixels: function(zoom, min, normal, max) {
    return zoomScale.range([min, normal, max])(zoom);
  },
  strokeWidth: function(display) {
    return strokeScale(display.zoom.scale());
  },
  fontSize: function(display, data) {
    return Math.floor(fontScale(display.zoom.scale()));
  },
  defineSegmentCircleMarker: function(display, segment, radius, fillColor) {
    var markerId = 'circleMarker-' + segment.getId();
    display.svg.append('defs').append('svg:marker')
      .attr('id', markerId)
      .attr('refX', radius)
      .attr('refY', radius)
      .attr('markerWidth', radius * 2)
      .attr('markerHeight', radius * 2)
      .attr('markerUnits', 'userSpaceOnUse')
      .append('svg:circle')
      .attr('cx', radius)
      .attr('cy', radius)
      .attr('r', radius)
      .attr('fill', segment.focused ? fillColor : notFocusedColor);

    return 'url(#' + markerId + ')';
  }
};

/**
 * Default Wireframe Edge/Vertex Rules
 */

exports.wireframe_vertices = {
  cx: 0,
  cy: 0,
  r: 3,
  fill: '#000'
};

exports.wireframe_edges = {
  stroke: '#444',
  'stroke-width': 2,
  'stroke-dasharray': '3px 2px',
  fill: 'none'
};

/**
 * Default Merged Stops Rules
 */

var stops_merged = exports.stops_merged = {
  fill: function(display, data, index, utils) {
    return '#fff';
  },
  r: function(display, data, index, utils) {
    return utils.pixels(display.zoom.scale(), 4, 6, 8);
  },
  stroke: function(display, data, index, utils) {
    var point = data.owner;
    if (!point.isFocused()) return notFocusedColor;
    return '#000';
  },
  'stroke-width': function(display, data, index, utils) {
    return 1;
  },

  /**
   *  Transitive-specific attribute specifying the shape of the main stop marker.
   *  Can be 'roundedrect', 'rectangle' or 'circle'
   */

  'marker-type': [
    'circle',
    function(display, data, index, utils) {
      var point = data.owner;
      if ((point.containsBoardPoint() || point.containsAlightPoint()) && !
        point.containsTransferPoint()) return 'circle';
    }
  ],

  /**
   *  Transitive-specific attribute specifying any additional padding, in pixels,
   *  to apply to main stop marker. A value of zero (default) results in a that
   *  marker is flush to the edges of the pattern segment(s) the point is set against.
   *  A value greater than zero creates a marker that is larger than the width of
   *  the segments(s).
   */

  'marker-padding': 3,

  visibility: function(display, data) {
    if (!data.owner.containsSegmentEndPoint()) return 'hidden';
  }
};

/**
 * Stops Along a Pattern
 */

var stops_pattern = exports.stops_pattern = {
  cx: 0,
  cy: 0,
  r: [
    4,
    function(display, data, index, utils) {
      return utils.pixels(display.zoom.scale(), 1, 2, 4);
    },
    function(display, data, index, utils) {
      var point = data.owner;
      var busOnly = true;
      point.getPatterns().forEach(function(pattern) {
        if (pattern.route && pattern.route.route_type !== 3) busOnly =
          false;
      });
      if (busOnly && !point.containsSegmentEndPoint()) {
        return 0.5 * utils.pixels(display.zoom.scale(), 2, 4, 6.5);
      }
    }
  ],
  stroke: 'none',
  visibility: function(display, data) {
    if (display.zoom.scale() < 1.5) return 'hidden';
    if (data.owner.containsSegmentEndPoint()) return 'hidden';
  }
};

/**
 * Default place rules
 */

exports.places = {
  cx: 0,
  cy: 0,
  r: 7,
  stroke: '0px',
  fill: '#000'
};

/**
 * Default MultiPoint rules -- based on Stop rules
 */

var multipoints_merged = exports.multipoints_merged = clone(stops_merged);

multipoints_merged.visibility = true;

/**
 * Default Multipoint Stops along a pattern
 */

exports.multipoints_pattern = clone(stops_pattern);

/**
 * Default label rules
 */

var labels = exports.labels = {
  'font-size': function(display, data, index, utils) {
    return utils.fontSize(display, data) + 'px';
  },
  'font-weight': function(display, data, index, utils) {
    var point = data.owner.parent;
    if (point.containsBoardPoint() || point.containsAlightPoint())
      return 'bold';
  },

  /**
   * 'orientations' is a transitive-specific attribute used to specify allowable
   * label placement orientations expressed as one of eight compass directions
   * relative to the point being labeled:
   *
   *        'N'
   *    'NW' |  'NE'
   *       \ | /
   *  'W' -- O -- 'E'
   *       / | \
   *    'SW' | 'SE'
   *        'S
   *
   * Labels oriented 'E' or 'W' are rendered horizontally, 'N' and 'S' vertically,
   * and all others at a 45-degree angle.
   *
   * Returns an array of allowed orientation codes in the order that they will be
   * tried by the labeler.
   */

  orientations: [
    ['E', 'W']
  ]
};

/**
 * All path segments
 * TODO: update old route-pattern-specific code below
 */

exports.segments = {
  stroke: [
    '#007AC9',
    function(display, data) {
      var segment = data;
      if (!segment.focused) return notFocusedColor;
      if (segment.type === 'TRANSIT') {
        if (segment.patterns[0].route_id === 'HSL:1300V' || 
            segment.patterns[0].route_id === 'HSL:1300M'|| 
            segment.patterns[0].route_id === 'HSL:1300') {
          return '#FF640E';
        } else {
          return '#007AC9';
        }
      } else if (segment.type === 'CAR') {
        return 'rgba(0,0,0,0)';
      } else if (segment.type === 'BICYCLE') {
        return 'rgba(0,0,0,0)';
      } else if (segment.type === 'WALK') {
        return 'rgba(0,0,0,0.33)';
      }
    }
  ],
  'stroke-dasharray': [
    false,
    function(display, data) {
      var segment = data;
      if (segment.frequency && segment.frequency.average < 12) {
        if (segment.frequency.average > 6) return '6px, 6px';
        return '12px, 2px';
      }
    }
  ],
  'stroke-width': [
    '6px',
    function(display, data, index, utils) {
      var segment = data;

      if (segment.mode === 3) {
        return utils.pixels(display.zoom.scale(), 2, 2, 2) + 'px';
      }
      return utils.pixels(display.zoom.scale(), 4, 4, 4) + 'px';
    }
  ],
  envelope: [

    function(display, data, index, utils) {
      var segment = data;
      if (segment.type !== 'TRANSIT') {
        return '8px';
      }
      if (segment.mode === 3) {
        return utils.pixels(display.zoom.scale(), 4, 6, 10) + 'px';
      }
      return utils.pixels(display.zoom.scale(), 6, 10, 14) + 'px';
    }
  ]
};

/**
 * Segments Front
 */

exports.segments_front = {
  stroke: '#006eb5',
  'stroke-width': function(display, data, index, utils) {
    return utils.pixels(display.zoom.scale(), 3, 6, 10) / 2 + 'px';
  },
  fill: 'none',
  display: 'none'
};

/**
 * Segments Halo
 */

exports.segments_halo = {
  stroke: '#fff',
  'stroke-width': function(display, data, index, utils) {
    //return data.computeLineWidth(display) + 8;
    return 0;
  },
  'stroke-linecap': 'round',
  fill: 'none'
};

/**
 * Label Containers
 */

exports.segment_label_containers = {
  fill: function(display, data) {
    if (!data.isFocused()) return notFocusedColor;
  },
  'stroke-width': function(display, data) {
    return 0;
  },
  rx: 3,
  ry: 3
};