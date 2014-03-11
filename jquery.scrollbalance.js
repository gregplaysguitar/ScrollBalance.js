/*

Example usage, where .mycolumn elements are floated columns of differing
heights:

$('.scrollwrap').scrollbalance({
    childSelector: '.mycolumn'
});


*/
(function($) {
    $.fn.scrollbalance = (function(options){
        var inner_classname = 'scrollbalance-inner',
            settings = $.extend({
            // selector to find the child elements of container which should be
            // balanced.
            childSelector: null,
            
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
        
        this.each(function() {
            var container = $(this),
                balance_enabled = true;
            
            function setup() {
                /* Append an "inner" element to each column, and move the 
                   column's content into this element, so that the content's
                   vertical position can be controlled independently of the 
                   column's (usually floated) position. 
                   Should only be called once, on setup. */
                
                container.find(settings.childSelector).each(function() {
                    var col = $(this),
                        original_height = col.height(),
                        inner = $('<div>').addClass(inner_classname)
                                          .append(col.children());
                    
                    col.html('').append(inner).css({
                        position: 'relative'
                    });
                    inner.css('minHeight', original_height);
                });
            };
            
            function container_height() {
                /* Calculates the maximum column height, i.e. how high the 
                   container should be. (Don't assume the user is using a
                   clearfix hack on their container). */
                
                var height = 0;
                container.find(settings.childSelector).each(function() {
                    height = Math.max(height, $(this).outerHeight(true))
                });
                return height;
            };
            
            function teardown() {
                /* Remove all traces of scrollbalance from the content */
                
                container.find(settings.childSelector).each(function() {
                    var col = $(this),
                        inner = col.find('.' + inner_classname);
                    
                    inner.children().appendTo(col);
                    inner.remove();
                    col.css({
                        position: '',
                        height: ''
                    });
                });
            };
            
            function init() {
                /* Position each column inner absolutely within the column,
                   and set the column heights, since their content is now
                   positioned absolutely.
                   Should be called whenever column content changes, or window
                   is resized. */
                
                container.find(settings.childSelector).each(function() {
                    var col = $(this),
                        inner = col.find('.' + inner_classname);
                    inner.css({
                        width: col.width() + 'px',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        paddingLeft: col.css('paddingLeft')
                    });
                    col.css({
                        height: inner.outerHeight(true)
                    });
                });
            };
            
            function top() {
                return container.offset().top;
            };
            
            function balance(col) {
                /* Using the scroll position, container offset, and column 
                   height, determine whether the column should be fixed or
                   absolute, and position it accordingly. */
                
                var inner = col.find('.' + inner_classname),
                    col_height = col.outerHeight(true),
                    
                    // determine the largest distance the column can be offset
                    // vertically
                    max_scroll = container_height() - col_height,
                    
                    // pin the column to the top if it matches a supplied filter,
                    // or if the column is shorter than the window
                    pin_top = settings.pinTopFilter && col.is(settings.pinTopFilter)
                                || (col_height < $(window).height());
                
                if (max_scroll < settings.threshold || !balance_enabled) {
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
                    // column content positioning
                    if (pin_top) {
                        var raw_scroll = $(window).scrollTop() - top() + 
                                         settings.topBuffer;
                    }
                    else {
                        var raw_scroll = ($(window).height() + 
                                          $(window).scrollTop()) - 
                                          (top() + col_height);
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
                        var fix_top = pin_top ? settings.topBuffer :
                                        $(window).height() - col_height,
                            fix_left = col.offset().left + 
                                       parseInt(col.css('borderLeftWidth'));
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
            
            function balance_all() {
                /* Balance all columns */
                container.find(settings.childSelector).each(function() {
                    balance($(this));
                });
            };
            
            setup();
            init();
            balance_all();
            
            $(window).on('resize', init);            
            $(window).on('scroll resize', balance_all);
            
            container.data('scrollbalance', {
                reinitialise: function() {
                    init();
                    balance_all();
                },
                disable: function() {
                    balance_enabled = false;
                    balance_all();
                },
                enable: function() {
                    balance_enabled = true;
                    balance_all();
                },
                teardown: function() {
                    teardown();
                }
            });
        });
    });

})(jQuery);