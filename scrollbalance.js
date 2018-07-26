/*!
 * ScrollBalance.js v1.1.2
 * https://github.com/gregplaysguitar/ScrollBalance.js/
 *
 * Uses position: fixed to combat unsightly gaps in multi-column layouts,
 * when columns are of different heights.
 *
 * Copyright 2011 Greg Brown
 * https://github.com/gregplaysguitar/ScrollBalance.js/blob/master/license.txt
 *
 */

(function (window, factory) {
  // universal module definition - thanks @desandro
  /* eslint-disable eqeqeq, no-undef */
  if (typeof define == 'function' && define.amd) {
    // AMD
    define(['jquery'], factory);
  } else if (typeof module == 'object' && module.exports) {
    // CommonJS
    module.exports = factory(require('jquery'));
  } else {
    // browser global
    window.ScrollBalance = factory(window.jQuery);
  }
  /* eslint-enable eqeqeq, no-undef */
}(window, function factory ($) {
  'use strict';

  var INNER_CLASSNAME = 'scrollbalance-inner';
  function ScrollBalance (columns, options) {
    this.columns = columns;
    this.columnData = [];
    this.settings = $.extend({
      // threshold for activating the plugin, eg the column heights must
      // differ by at least this amount to be affected.
      threshold: 100,

      // disable the plugin if the screen width is less than this
      minwidth: null
    }, options);

    this.balance_enabled = true;
    this.scrollTop = 0;
    this.setup();
  }

  ScrollBalance.prototype = {
    // "PUBLIC" METHODS:
    initialize: function () {
      /* Position each column inner absolutely within the column,
         and set the column heights, since their content is now
         positioned absolutely.
         Should be called whenever column content changes, or window
         is resized. */

      var that = this;

      function columnHeight (col) {
        var inner = col.find('.' + INNER_CLASSNAME);
        return inner.height() +
          parseInt(col.css('borderTop') || 0) +
          parseInt(col.css('paddingTop') || 0) +
          parseInt(col.css('paddingBottom') || 0) +
          parseInt(col.css('borderBottom') || 0);
      }

      // Calculate the maximum column height, i.e. how high the container
      // should be (don't assume the user is using a clearfix hack on their
      // container), and the container offset. If there's only one column, use
      // the parent for both calculations
      if (this.columns.length === 1) {
        this.containerHeight = this.columns.parent().height();
        this.containerTop = this.columns.parent().offset().top;
      } else {
        var height = 0;
        this.columns.each(function () {
          height = Math.max(height, columnHeight($(this)));
        });
        this.containerHeight = height;
        this.containerTop = this.columns.eq(0).offset().top;
      }

      this.columns.each(function (i) {
        var col = $(this);
        var inner = col.find('.' + INNER_CLASSNAME);

        // save column data to avoid hitting the DOM on scroll
        if (!that.columnData[i]) {
          that.columnData[i] = {
            // default initial values here
            fixTop: 0
          };
        }
        var columnData = that.columnData[i];

        // calculate actual height regardless of what it's previously been
        // set to
        columnData.height = columnHeight(col);

        // disable if not enough difference in height between container and
        // column
        columnData.enabled = (that.containerHeight - columnData.height) >
          that.settings.threshold;

        columnData.fixLeft = col.offset().left +
          (parseInt(col.css('borderLeftWidth'), 10) || 0);

        columnData.minFixTop = Math.min(0, that.winHeight - columnData.height);
        columnData.maxFixTop = 0;

        // uncomment this to have it stick to the bottom too rather than just
        // the top
        // columnData.maxFixTop = Math.max(
        //   0, that.winHeight - columnData.height);

        if (that.balance_enabled && columnData.enabled) {
          inner.css({
            width: col.css('width'),
            // transform: 'translateZ(0px)',
            padding: col.css('padding')
            // other css for this element is handled in balance()
          });
          col.css({
            height: inner.css('height')
          });
        } else {
          // reset state
          inner.css({
            width: '',
            // transform: '',
            padding: ''
          });
          col.height('');
        }
        that.balance(col, columnData, true);
      });
    },
    resize: function (winWidth, winHeight) {
      this.winHeight = winHeight;

      if (this.settings.minwidth !== null) {
        this.balance_enabled = (winWidth >= this.settings.minwidth);
      }
      this.initialize();
    },
    scroll: function (scrollTop, scrollLeft) {
      var scrollDelta = scrollTop - this.scrollTop;
      this.scrollTop = scrollTop;
      this.scrollLeft = scrollLeft;
      this.balance_all(false, scrollDelta);
    },
    bind: function () {
      /* Bind scrollbalance handlers to the scroll and resize events */
      var that = this;
      $(window).on('resize.scrollbalance', function () {
        that.resize($(window).width(), $(window).height());
      });
      $(window).on('scroll.scrollbalance', function () {
        that.scroll($(window).scrollTop(), $(window).scrollLeft());
      });
      $(window).trigger('resize');
      $(window).trigger('scroll');
    },
    unbind: function () {
      /* Unbind all scrollbalance handlers. */
      $(window).off('resize.scrollbalance');
      $(window).off('scroll.scrollbalance');
    },
    disable: function () {
      /* Temporarily disable scrollbalance */
      this.balance_enabled = false;
      this.initialize();
    },
    enable: function () {
      /* Re-enable scrollbalance */
      this.balance_enabled = true;
      this.initialize();
    },
    teardown: function () {
      /* Remove all traces of scrollbalance from the content */

      this.columns.each(function () {
        var col = $(this);
        var inner = col.find('.' + INNER_CLASSNAME);

        if (inner.data('sb-created')) {
          inner.children().appendTo(col);
          inner.remove();
        }
        col.css({
          position: '',
          height: ''
        });
      });
    },

    // "PRIVATE" METHODS:
    setup: function () {
      /* Append an "inner" element to each column, if it isn't already there,
         and move the column's content into this element, so that the
         content's vertical position can be controlled independently of the
         column's (usually floated) position.
         Should only be called once, on setup. */

      this.columns.each(function () {
        var col = $(this);
        var inner = col.find('.' + INNER_CLASSNAME);

        if (col.css('position') === 'static') {
          col.css('position', 'relative');
        }

        if (!inner.length) {
          inner = $('<div>').addClass(INNER_CLASSNAME)
            .append(col.children())
            .data('sb-created', true);
          col.html('').append(inner);
        }
      });
    },
    balance: function (col, columnData, force, scrollDelta) {
      /* Using the scroll position, container offset, and column
         height, determine whether the column should be fixed or
         absolute, and position it accordingly. */

      var state;
      var fixTop = columnData.fixTop;

      if (scrollDelta === undefined) {
        scrollDelta = 0;
      }

      if (!columnData.enabled || !this.balance_enabled) {
        state = 'disabled';
      } else {
        // determine state, one of
        // - top
        // - bottom
        // - fixed

        var topBreakpoint = this.containerTop - columnData.fixTop;
        // var bottomBreakpoint = this.containerTop + this.containerHeight -
        //    this.winHeight + Math.max(
        //      0, this.winHeight - columnData.height - columnData.fixTop);

        var bottomBreakpoint = this.containerTop + this.containerHeight -
          columnData.height - columnData.fixTop;

        if (this.scrollTop < topBreakpoint) {
          state = 'top';
        } else if (this.scrollTop > bottomBreakpoint) {
          state = 'bottom';
        } else {
          state = 'fixed';
          fixTop = columnData.fixTop - scrollDelta;
          fixTop = Math.max(columnData.minFixTop,
                            Math.min(columnData.maxFixTop, fixTop));
        }
      }

      // update column positioning only if changed
      if (columnData.state !== state || columnData.fixTop !== fixTop || force) {
        var inner = col.find('.' + INNER_CLASSNAME);
        if (state === 'disabled') {
          inner.css({
            position: '',
            top: '',
            left: ''
          });
        } else if (state === 'fixed') {
          inner.css({
            position: 'fixed',
            top: fixTop,
            left: columnData.fixLeft - this.scrollLeft
          });
        } else {
          // assume one of "bottom" or "top"
          inner.css({
            position: 'absolute',
            top: (state === 'bottom' ? this.containerHeight -
                  columnData.height : 0) + 'px',
            left: 0
          });
        }
        columnData.fixTop = fixTop;
        columnData.state = state;
      }
    },
    balance_all: function (force, scrollDelta) {
      /* Balance all columns */
      for (var i = 0; i < this.columns.length; i++) {
        if (this.columnData[i]) {
          this.balance(this.columns.eq(i), this.columnData[i], force,
                       scrollDelta);
        }
      }
    }
  };

  // export as jquery plugin
  $.fn.scrollbalance = function (options) {
    // the childSelector option is deprecated, but if set, it will be used
    // to find the columns, and this will be assumed to be a container,
    // for backwards compatibility.
    var columns;
    if (options && options.childSelector) {
      columns = this.find(options.childSelector);
    } else {
      columns = this;
    }

    var scrollbalance = new ScrollBalance(columns, options);
    scrollbalance.initialize();
    scrollbalance.bind();

    this.data('scrollbalance', scrollbalance);
  };

  return ScrollBalance;
}));
