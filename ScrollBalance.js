/*!
 * ScrollBalance.js v1.1.2
 * http://jquery.com/
 *
 * Uses position: fixed to combat unsightly gaps in multi-column layouts,
 * when columns are of different heights.
 *
 * Copyright 2011 Greg Brown
 * https://github.com/gregplaysguitar/ScrollBalance.js/blob/master/license.txt
 *
 */

(function ($) {
  var INNER_CLASSNAME = 'scrollbalance-inner';

  function ScrollBalance (columns, options) {
    this.columns = columns;
    this.columnData = [];
    this.settings = $.extend({
      // distance to maintain between the top of the stationary element
      // and the top of the container.
      topBuffer: 0,

      // threshold for activating the plugin, eg the column heights must
      // differ by at least this amount to be affected.
      threshold: 100,

      // filter for columns which should be pinned to the top, even if
      // taller than the viewport
      pinTopFilter: null,

      // disable the plugin if the screen width is less than this
      minwidth: null
    }, options);

    this.balance_enabled = true;

    this.setup();
  }

  ScrollBalance.prototype = {
    // "PUBLIC" METHODS:
    initialise: function () {
      /* Position each column inner absolutely within the column,
         and set the column heights, since their content is now
         positioned absolutely.
         Should be called whenever column content changes, or window
         is resized. */

      var that = this;
      var pinFilter = this.settings.pinTopFilter;

      this.columns.each(function (i) {
        var col = $(this);
        var inner = col.find('.' + INNER_CLASSNAME);

        if (that.balance_enabled) {
          inner.css({
            width: col.width() + 'px',
            transform: 'translateZ(0px)',
            paddingTop: col.css('paddingTop')
            // other css for this element is handled in balance()
          });
          if (col.css('position') === 'static') {
            col.css('position', 'relative');
          }
          if (col.css('box-sizing') === 'border-box') {
            col.height(inner.height());
          } else {
            col.height(inner.outerHeight(true));
          }
        } else {
          // reset state
          inner.css({
            width: '',
            transform: '',
            paddingTop: ''
          });
          col.height('');
        }

        // save column data to avoid hitting the DOM on scroll
        if (!that.columnData[i]) {
          that.columnData[i] = {};
        }
        that.columnData[i].paddingLeft = col.css('paddingLeft');
        that.columnData[i].height = col.outerHeight(true);
        that.columnData[i].marginTop = parseInt(col.css('marginTop'), 10);
        that.columnData[i].fixLeft = col.offset().left +
          (parseInt(col.css('borderLeftWidth'), 10) || 0);

        // pin the column to the top if it matches a supplied filter,
        // or if the column is shorter than the window
        that.columnData[i].pinTop = pinFilter && col.is(pinFilter) ||
          (that.columnData[i].height < this.win_height);
      });

      // Set column top offset - assume they're all the same
      this.columnTop = this.columns.eq(0).offset().top;

      this.set_container_height();
      this.balance_all(true);
    },
    resize: function (win_width, win_height) {
      this.win_height = win_height;

      if (this.settings.minwidth !== null) {
        if (this.balance_enabled && win_width < this.settings.minwidth) {
          this.disable();
        } else if (!this.balance_enabled &&
          win_width >= this.settings.minwidth) {
          this.enable();
        }
      } else {
        this.initialise();
      }
    },
    scroll: function (scroll_top, scroll_left) {
      this.scroll_top = scroll_top;
      this.scroll_left = scroll_left;
      this.balance_all();
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
      this.initialise();
    },
    enable: function () {
      /* Re-enable scrollbalance */
      this.balance_enabled = true;
      this.initialise();
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

        if (!inner.length) {
          inner = $('<div>').addClass(INNER_CLASSNAME)
            .append(col.children())
            .data('sb-created', true);
          col.html('').append(inner);
        }
      });
    },
    set_container_height: function () {
      /* Calculates the maximum column height, i.e. how high the
         container should be. (Don't assume the user is using a
         clearfix hack on their container). If there's only one
         column, use the parent height. */

      if (this.columns.length === 1) {
        this.container_height = this.columns.parent().height();
      } else {
        var height = 0;
        this.columns.each(function () {
          height = Math.max(height, $(this).outerHeight(true));
        });
        this.container_height = height;
      }
    },
    balance: function (col, columnData, force) {
      /* Using the scroll position, container offset, and column
         height, determine whether the column should be fixed or
         absolute, and position it accordingly. */

      var state;
      var topBuffer = this.settings.topBuffer + columnData.marginTop;
      var maxScroll = this.container_height - columnData.height;

      if (maxScroll < this.settings.threshold || !this.balance_enabled) {
        state = 'disabled';
      } else {
        // convert scrollTop to a value we can use to determine
        // column content positioning. This changes depending on whether
        // the content is pinned to the top or bottom
        var rawScroll;
        if (columnData.pinTop) {
          rawScroll = this.scroll_top - this.columnTop + topBuffer;
        } else {
          rawScroll = (this.win_height + this.scroll_top) -
            (this.columnTop + columnData.height);
        }
        var scroll = Math.max(0, Math.min(maxScroll, rawScroll));

        if (scroll && scroll < maxScroll) {
          // container straddles viewport, so container position
          // is fixed, either at top or bottom depending on
          // pin_top
          state = 'fixed';
        } else if (scroll) {
          // bottom of container is above bottom of viewport, so
          // position content at the bottom of the column
          state = 'bottom';
        } else {
          // top of container is below top of viewport, so
          // position content at the top of the column
          state = 'top';
        }
      }

      // update column positioning only if changed
      if (columnData.state !== state || force) {
        var inner = col.find('.' + INNER_CLASSNAME);
        if (state === 'disabled') {
          inner.css({
            position: '',
            top: 0,
            left: 0,
            paddingLeft: 0
          });
        } else if (state === 'fixed') {
          var fixTop = columnData.pinTop ? topBuffer
                                         : this.win_height - columnData.height;
          inner.css({
            position: 'fixed',
            top: fixTop,
            left: columnData.fixLeft - this.scroll_left,
            paddingLeft: columnData.paddingLeft
          });
        } else if (state === 'bottom') {
          inner.css({
            position: 'absolute',
            top: maxScroll + 'px',
            left: 0,
            paddingLeft: columnData.paddingLeft
          });
        } else if (state === 'top') {
          inner.css({
            position: 'absolute',
            top: 0,
            left: 0,
            paddingLeft: columnData.paddingLeft
          });
        }
        columnData.state = state;
      }
    },
    balance_all: function (force) {
      /* Balance all columns */
      for (var i = 0; i < this.columns.length; i++) {
        if (this.columnData[i]) {
          this.balance(this.columns.eq(i), this.columnData[i], force);
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
    scrollbalance.initialise();
    scrollbalance.bind();

    this.data('scrollbalance', scrollbalance);
  };

  // export for direct use
  window.ScrollBalance = ScrollBalance;
})(window.jQuery);
