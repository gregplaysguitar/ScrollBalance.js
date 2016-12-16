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
    initialise: function () {
      /* Position each column inner absolutely within the column,
         and set the column heights, since their content is now
         positioned absolutely.
         Should be called whenever column content changes, or window
         is resized. */

      var that = this;

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
          that.columnData[i] = {
            // default initial values here
            fixTop: 0
          };
        }
        that.columnData[i].paddingLeft = col.css('paddingLeft');
        that.columnData[i].height = col.outerHeight(true);
        // that.columnData[i].marginTop = parseInt(col.css('marginTop'), 10);
        that.columnData[i].fixLeft = col.offset().left +
          (parseInt(col.css('borderLeftWidth'), 10) || 0);

        that.columnData[i].minFixTop = Math.min(
          0, that.winHeight - that.columnData[i].height);
        that.columnData[i].maxFixTop = 0;

        // uncomment this to have it stick to the bottom too rather than just
        // the top
        // that.columnData[i].maxFixTop = Math.max(
        //   0, that.winHeight - that.columnData[i].height);
      });

      // Set column top offset - assume they're all the same
      this.columnTop = this.columns.eq(0).offset().top;

      this.set_containerHeight();
      this.balance_all(true);
    },
    resize: function (winWidth, winHeight) {
      this.winHeight = winHeight;

      if (this.settings.minwidth !== null) {
        this.balance_enabled = (winWidth >= this.settings.minwidth);
      }
      this.initialise();
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
    set_containerHeight: function () {
      /* Calculates the maximum column height, i.e. how high the
         container should be. (Don't assume the user is using a
         clearfix hack on their container). If there's only one
         column, use the parent height. */

      if (this.columns.length === 1) {
        this.containerHeight = this.columns.parent().height();
      } else {
        var height = 0;
        this.columns.each(function () {
          height = Math.max(height, $(this).outerHeight(true));
        });
        this.containerHeight = height;
      }
    },
    balance: function (col, columnData, force, scrollDelta) {
      /* Using the scroll position, container offset, and column
         height, determine whether the column should be fixed or
         absolute, and position it accordingly. */

      var state;
      var fixTop = columnData.fixTop;
      var maxScroll = this.containerHeight - columnData.height;

      if (scrollDelta === undefined) {
        scrollDelta = 0;
      }

      if (maxScroll < this.settings.threshold || !this.balance_enabled) {
        state = 'disabled';
      } else {
        // determine state, one of
        // - top
        // - bottom
        // - fixed

        var topBreakpoint = this.columnTop - columnData.fixTop;
        var bottomBreakpoint = this.columnTop + this.containerHeight -
           this.winHeight + Math.max(
             0, this.winHeight - columnData.height - columnData.fixTop);

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
            top: 0,
            left: 0,
            paddingLeft: 0
          });
        } else if (state === 'fixed') {
          inner.css({
            position: 'fixed',
            top: fixTop,
            left: columnData.fixLeft - this.scrollLeft,
            paddingLeft: columnData.paddingLeft
          });
        } else {
          // assume one of "bottom" or "top"
          inner.css({
            position: 'absolute',
            top: (state === 'bottom' ? maxScroll : 0) + 'px',
            left: 0,
            paddingLeft: columnData.paddingLeft
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
    scrollbalance.initialise();
    scrollbalance.bind();

    this.data('scrollbalance', scrollbalance);
  };

  // export for direct use
  window.ScrollBalance = ScrollBalance;
})(window.jQuery);
