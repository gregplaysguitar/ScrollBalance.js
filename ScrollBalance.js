/*

A jQuery plugin that intelligently uses position: fixed to combat unsightly 
gaps in multi-column layouts, when columns are of different heights. See
https://github.com/gregplaysguitar/ScrollBalance.js 

License: https://github.com/gregplaysguitar/ScrollBalance.js/blob/master/license.txt

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

    ScrollBalance.prototype = {
    
    // "PUBLIC" METHODS:
    initialise: function() {
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
                left: 0
            });
            if (col.css('box-sizing') === 'border-box') {
                col.height(inner.height());
            }
            else {
                col.height(inner.outerHeight(true));
            }
        });
        this.balance_all();
    },
    resize: function(win_width, win_height) {
        this.win_height = win_height;
        this.initialise();
    },
    scroll: function(scroll_top, scroll_left) {
        this.scroll_top = scroll_top;
        this.scroll_left = scroll_left;
        this.balance_all();
    },
    bind: function() {
        /* Bind scrollbalance handlers to the scroll and resize events */
        var that = this;
        $(window).on('resize.scrollbalance', function() {
            that.resize($(window).width(), $(window).height());
        });
        $(window).on('scroll.scrollbalance', function() {
            that.scroll($(window).scrollTop(), $(window).scrollLeft());
        });
        $(window).trigger('resize');
        $(window).trigger('scroll');
    },
    unbind: function() {
        /* Unbind all scrollbalance handlers. */
        var that = this;
        $(window).off('resize.scrollbalance');
        $(window).off('scroll.scrollbalance');
    },
    disable: function() {
        /* Temporarily disable scrollbalance */
        this.balance_enabled = false;
        this.balance_all();
    },
    enable: function() {
        /* Re-enable scrollbalance */
        this.balance_enabled = true;
        this.balance_all();
    },
    teardown: function() {
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
    },

    // "PRIVATE" METHODS:
    setup: function() {
        /* Append an "inner" element to each column, and move the 
           column's content into this element, so that the content's
           vertical position can be controlled independently of the 
           column's (usually floated) position. 
           Should only be called once, on setup. */

        this.columns.each(function() {
            var col = $(this),
                // original_height = col.height(),
                inner = $('<div>').addClass(INNER_CLASSNAME)
                                  .append(col.children());

            col.html('').append(inner);
            if (col.css('position') === 'static') {
                col.css('position', 'relative');
            }
            // inner.css('minHeight', original_height);
        });
    },
    container_height: function() {
        /* Calculates the maximum column height, i.e. how high the 
           container should be. (Don't assume the user is using a
           clearfix hack on their container). If there's only one
           column, use the parent height. */
        
        if (this.columns.length === 1) {
            return this.columns.parent().height();
        }
        
        var height = 0;
        this.columns.each(function() {
            height = Math.max(height, $(this).outerHeight(true))
        });
        return height;
    },
    top: function() {
        /* Return columns' top offset - assume they're all the same in this
           regard. */
        return this.columns.offset().top;
    },

    balance: function(col) {
        /* Using the scroll position, container offset, and column 
           height, determine whether the column should be fixed or
           absolute, and position it accordingly. */

        var inner = col.find('.' + INNER_CLASSNAME),
            col_height = col.outerHeight(true),
            padding_left = col.css('paddingLeft'),

            // determine the largest distance the column can be offset
            // vertically
            max_scroll = this.container_height() - col_height,

            // pin the column to the top if it matches a supplied filter,
            // or if the column is shorter than the window
            pin_filter = this.settings.pinTopFilter,
            pin_top = pin_filter && col.is(pin_filter) ||
                      (col_height < this.win_height);

        if (max_scroll < this.settings.threshold || !this.balance_enabled) {
            // scrolling behaves normally if columns are too close in
            // height, or if the plugin has been temporarily disabled
            inner.css({
                position: '',
                top: 0,
                left: 0,
                paddingLeft: 0
            });
        }
        else {
            // convert scrollTop to a value we can use to determine
            // column content positioning. This changes depending on whether 
            // the content is pinned to the top or bottom
            if (pin_top) {
                var raw_scroll = this.scroll_top - this.top() + 
                                 this.settings.topBuffer;
            }
            else {
                var raw_scroll = (this.win_height + this.scroll_top) - 
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
                                this.win_height - col_height,
                    fix_left = col.offset().left + 
                               (parseInt(col.css('borderLeftWidth')) || 0);
                inner.css({
                    position: 'fixed',
                    top: fix_top + 'px',
                    left: fix_left - this.scroll_left + 'px',
                    paddingLeft: padding_left
                });
            }
            else if (scroll) {
                // bottom of container is above bottom of viewport, so
                // position content at the bottom of the column
                inner.css({
                    position: 'absolute',
                    top: max_scroll + 'px',
                    left: 0,
                    paddingLeft: padding_left
                });
            }
            else {
                // top of container is below top of viewport, so
                // position content at the top of the column
                inner.css({
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    paddingLeft: padding_left
                });
            }
        }
    },
    balance_all: function() {
        /* Balance all columns */
        for (var i = 0; i < this.columns.length; i++) {
            this.balance(this.columns.eq(i));
        }
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
