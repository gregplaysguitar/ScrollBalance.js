/*

Example usage:

$('.scrollwrap').scrollbalance({
    childSelector: '.mycolumn'
});


*/
(function($) {

    $.fn.scrollbalance = (function(options){
        var settings = $.extend({
            // selector to find the child elements of container which should be
            // balanced.
            childSelector: '.scrollbox',
            
            // distance to maintain between the top of the stationary element 
            // and the top of the container.
            topBuffer: 0,
            
            // threshold for activating the plugin, eg the column heights must 
            // differ by at least this amount to be affected.
            threshold: 100,
            
            // filter for columns which should be pinned to the top, even if they
            // are taller than the viewport
            pinTopFilter: null
        }, options);

        this.each(function() {
            var container = $(this);

            // Initial setup
            container.find(settings.childSelector).each(function() {
                var col = $(this),
                    inner = $('<div>').addClass('scrollbalance-inner')
                                      .append(col.children());
            
                col.html('').append(inner).css({
                    //height: innerHeight + 'px',
                    position: 'relative'
                });
            });
            
            function balance_init() {
                var height = 0;
                container.find(settings.childSelector).each(function() {
                    var col = $(this),
                        inner = col.find('.scrollbalance-inner');
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
                    height = Math.max(height, inner.outerHeight(true));
                });
                container.css('height', height + 'px');
            };
            balance_init();
            $(window).resize(balance_init);
            
            function top() {
                return container.offset().top;
            };
            
            function balance(col) {
                var inner = col.find('.scrollbalance-inner'),
                    col_height = col.outerHeight(true),
                    max_scroll = container.height() - col_height,
                    pin_top = settings.pinTopFilter && col.is(settings.pinTopFilter)
                                || (col_height < $(window).height());

                if (max_scroll < settings.threshold) {
                    // scrolling behaves normally if columns are too close in
                    // height.
                    inner.css({
                        position: 'relative',
                        top: 0,
                        left: 0
                    });
                }
                else {
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
                        inner.css({
                            position: 'absolute',
                            top: max_scroll + 'px',
                            left: 0
                        });
                    }
                    else {
                        inner.css({
                            position: 'absolute',
                            top: 0,
                            left: 0
                        });
                    }
                }
            };
            
            function balance_all() {
                container.find(settings.childSelector).each(function() {
                    balance($(this));
                });
            };
            balance_all();
            $(window).scroll(balance_all);
            $(window).resize(balance_all);
                        
            container.data('scrollbalance', {
                reinitialise: function() {
                    balance_init();
                    balance_all();
                }
            });
        });
    });

})(jQuery);