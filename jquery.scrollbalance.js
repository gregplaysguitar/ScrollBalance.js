/*

Example usage:

$('.scrollwrap').scrollbalance({
    childSelector: '.mycolumn'
});


*/
(function($) {

    $.fn.scrollbalance = (function(options){
        var settings = $.extend({
            childSelector: '.scrollbox'
        }, options);

        this.each(function() {
            var container = $(this),
                top = container.offset().top;
            
            
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
                    return (colHeight < $(window).height());
                };

                if (maxScroll > 100) {
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
                        left: 0
                    });


                    var fixTop, fixLeft;
                    function balance_init() {
                        if (pinTop()) {
                            fixTop = 0;
                        }
                        else {
                            fixTop = $(window).height() - colHeight;
                        }
                        fixLeft = col.offset().left;
                    };
                    
                    function balance() {
                        if (pinTop()) {
                            var raw_scroll = $(window).scrollTop() - top;
                        }
                        else {
                            var raw_scroll = ($(window).height() + $(window).scrollTop()) - (top + colHeight);
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