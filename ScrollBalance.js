/*

Example usage, where .mycolumn elements are floated columns of differing
heights:

    $('.mycolumn').scrollbalance();

*/

(function($) {
    var INNER_CLASSNAME = 'scrollbalance-inner';

    function ScrollBalance(columns, options) {
        this.columns = columns;
        this.settings = $.extend({
            // distance to maintain between the top of the stationary element 
            // and the top of the container.
            topBuffer: 0,

            // threshold for activating the plugin, eg the column heights must 
            // differ by at least this amount to be affected.
            threshold: 100,

            // filter for columns which should be pinned to the top, even if
            // taller than the viewport
            pinTopFilter: null
        }, options);

        this.balance_enabled = true;

        this.setup();
    };

    // "PUBLIC" METHODS:
    ScrollBalance.prototype.initialise = function() {
        /* Position each column inner absolutely within the column,
           and set the column heights, since their content is now
           positioned absolutely.
           Should be called whenever column content changes, or window
           is resized. */
        this.columns.each(function() {
            var col = $(this),
                inner = col.find('.' + INNER_CLASSNAME);
            inner.css({
                width: col.width() + 'px',
                position: 'absolute',
                top: 0,
                left: 0,
                paddingLeft: col.css('paddingLeft')
            });
            if (col.css('box-sizing') === 'border-box') {
                col.height(inner.height());
            }
            else {
                col.height(inner.outerHeight(true));
            }
        });
        this.balance_all();
    };
    ScrollBalance.prototype.bind = function() {
        /* Bind scrollbalance handlers to the scroll and resize events */
        var that = this;
        $(window).on('resize.scrollbalance', function() {
            that.initialise();
        });
        $(window).on('scroll.scrollbalance', function() {
            that.balance_all();
        });
    };
    ScrollBalance.prototype.unbind = function() {
        /* Unbind all scrollbalance handlers. */
        var that = this;
        $(window).off('resize.scrollbalance');
        $(window).off('scroll.scrollbalance');
    };
    ScrollBalance.prototype.disable = function() {
        /* Temporarily disable scrollbalance */
        this.balance_enabled = false;
        this.balance_all();
    },
    ScrollBalance.prototype.enable = function() {
        /* Re-enable scrollbalance */
        this.balance_enabled = true;
        this.balance_all();
    },
    ScrollBalance.prototype.teardown = function() {
        /* Remove all traces of scrollbalance from the content */

        this.columns.each(function() {
            var col = $(this),
                inner = col.find('.' + INNER_CLASSNAME);

            inner.children().appendTo(col);
            inner.remove();
            col.css({
                position: '',
                height: ''
            });
        });
    };

    // "PRIVATE" METHODS:
    ScrollBalance.prototype.setup = function() {
        /* Append an "inner" element to each column, and move the 
           column's content into this element, so that the content's
           vertical position can be controlled independently of the 
           column's (usually floated) position. 
           Should only be called once, on setup. */

        this.columns.each(function() {
            var col = $(this),
                original_height = col.height(),
                inner = $('<div>').addClass(INNER_CLASSNAME)
                                  .append(col.children());

            col.html('').append(inner).css({
                position: 'relative'
            });
            inner.css('minHeight', original_height);
        });
    };
    ScrollBalance.prototype.container_height = function() {
        /* Calculates the maximum column height, i.e. how high the 
           container should be. (Don't assume the user is using a
           clearfix hack on their container). */

        var height = 0;
        this.columns.each(function() {
            height = Math.max(height, $(this).outerHeight(true))
        });
        return height;
    };
    ScrollBalance.prototype.top = function() {
        /* Return columns' top offset - assume they're all the same in this
           regard. */
        return this.columns.offset().top;
    };

    ScrollBalance.prototype.balance = function(col) {
        /* Using the scroll position, container offset, and column 
           height, determine whether the column should be fixed or
           absolute, and position it accordingly. */

        var inner = col.find('.' + INNER_CLASSNAME),
            col_height = col.outerHeight(true),

            // determine the largest distance the column can be offset
            // vertically
            max_scroll = this.container_height() - col_height,

            // pin the column to the top if it matches a supplied filter,
            // or if the column is shorter than the window
            pin_filter = this.settings.pinTopFilter,
            pin_top = pin_filter && col.is(pin_filter) ||
                      (col_height < $(window).height());

        if (max_scroll < this.settings.threshold || !this.balance_enabled) {
            // scrolling behaves normally if columns are too close in
            // height, or if the plugin has been temporarily disabled
            inner.css({
                position: 'relative',
                top: 0,
                left: 0
            });
        }
        else {
            // convert scrollTop to a value we can use to determine
            // column content positioning. This changes depending on whether 
            // the content is pinned to the top or bottom
            if (pin_top) {
                var raw_scroll = $(window).scrollTop() - this.top() + 
                                 this.settings.topBuffer;
            }
            else {
                var raw_scroll = ($(window).height() + 
                                  $(window).scrollTop()) - 
                                  (this.top() + col_height);
            }
            var scroll = Math.max(
                0,
                Math.min(
                    max_scroll,
                    raw_scroll
                )
            );

            if (scroll && scroll < max_scroll) {
                // container straddles viewport, so container position
                // is fixed, either at top or bottom depending on 
                // pin_top
                var fix_top = pin_top ? this.settings.topBuffer :
                                $(window).height() - col_height,
                    fix_left = col.offset().left + 
                               (parseInt(col.css('borderLeftWidth')) || 0);
                inner.css({
                    position: 'fixed',
                    top: fix_top + 'px',
                    left: fix_left - $(window).scrollLeft() + 'px'
                });
            }
            else if (scroll) {
                // bottom of container is above bottom of viewport, so
                // position content at the bottom of the column
                inner.css({
                    position: 'absolute',
                    top: max_scroll + 'px',
                    left: 0
                });
            }
            else {
                // top of container is below top of viewport, so
                // position content at the top of the column
                inner.css({
                    position: 'absolute',
                    top: 0,
                    left: 0
                });
            }
        }
    };
    ScrollBalance.prototype.balance_all = function() {
        /* Balance all columns */
        for (var i = 0; i < this.columns.length; i++) {
            this.balance(this.columns.eq(i));
        }
    };


    // export as jquery plugin
    $.fn.scrollbalance = (function(options){

        // the childSelector option is deprecated, but if set, it will be used
        // to find the columns, and this will be assumed to be a container,
        // for backwards compatibility.
        if (options && options.childSelector) {
            var columns = this.find(settings.childSelector);
        }
        else {
            var columns = this;
        }

        var scrollbalance = new ScrollBalance(columns, options);
        scrollbalance.initialise();
        scrollbalance.bind();

        this.data('scrollbalance', scrollbalance);
    });

    // export for direct use
    window.ScrollBalance = ScrollBalance;

})(jQuery);
