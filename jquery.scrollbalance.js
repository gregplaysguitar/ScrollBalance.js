/*

Example usage:

$('.scrollwrap').scrollbalance({
    childSelector: '.mycolumn'
});

params

childSelector: 
 
topBuffer: the 

threshold: the 



*/
(function($) {

    $.fn.scrollbalance = (function(options){
        var settings = $.extend({
            // selector to find the child elements of container which should be balanced.
            childSelector: '.scrollbox',
            
            // distance to maintain between the top of the stationary element and the top of the container.
            topBuffer: 0,
            
            // threshold for activating the plugin, eg the column heights must differ by at least this amount to be affected.
            threshold: 100,
            
            // filter for columns which should be pinned to the top, even if they are 
            // taller than the viewport
            pinTopFilter: null
        }, options);

        this.each(function() {
            var container = $(this);
            
            
            function top() {
                return container.offset().top;
            };
            
            // make sure container has height
            container.find(settings.childSelector).each(function() {
                if (container.height() < $(this).outerHeight(true)) {
                    container.css('height', $(this).outerHeight(true) + 'px');
                }
            });
            
            container.find(settings.childSelector).each(function() {
                var col = $(this),
                    colHeight = col.outerHeight(true),
                    colWidth = col.width(),
                    maxScroll = container.height() - colHeight;
                
                function pinTop() {
                    return settings.pinTopFilter && col.is(settings.pinTopFilter) || (colHeight < $(window).height());
                };

                // don't do anything if the columns are too close in height.
                if (maxScroll > settings.threshold) {
                    var innerHeight = col.height(),
                        inner = $('<div>').append(col.children());
                    
                    col.html('').append(inner).css({
                        height: innerHeight + 'px',
                        position: 'relative'
                    });
                    
                    inner.css({
                        width: colWidth + 'px',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        paddingLeft: col.css('paddingLeft')
                    });

                    var fixTop, fixLeft;
                    function balance_init() {
                        if (pinTop()) {
                            fixTop = settings.topBuffer;
                        }
                        else {
                            fixTop = $(window).height() - colHeight;
                        }
                        fixLeft = col.offset().left + parseInt(col.css('borderLeftWidth'));
                    };
                    
                    function balance() {
                        if (pinTop()) {
                            var raw_scroll = $(window).scrollTop() - top() + settings.topBuffer;
                        }
                        else {
                            var raw_scroll = ($(window).height() + $(window).scrollTop()) - (top() + colHeight);
                        }
                        var scroll = Math.max(
                            0,
                            Math.min(
                                maxScroll,
                                raw_scroll
                            )
                        );

                        if (scroll && scroll < maxScroll) {
                            inner.css({
                                position: 'fixed',
                                top: fixTop + 'px',
                                left: fixLeft - $(window).scrollLeft() + 'px'
                            });
                        }
                        else if (scroll) {
                            inner.css({
                                position: 'absolute',
                                top: maxScroll + 'px',
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
                    };
                    
                    balance_init();
                    balance();
                    $(window).scroll(balance);
                    $(window).resize(function() {
                        balance_init();
                        balance();
                    });
                }
            });

        });
    });
        

})(jQuery);