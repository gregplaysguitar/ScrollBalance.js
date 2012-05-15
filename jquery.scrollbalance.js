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
            threshold: 100
        }, options);

        this.each(function() {
            var container = $(this),
                cols = container.find(settings.childSelector);
            
  
            /*
            
            Setup:
            - Add wrap div
            - Calculate column width
            
            Initialisation:
            - Calculate container height, reset if necessary
            - Calculate column height
            - Calculate window width & height
            - Add/remove balance listener if appropriate
            
            On scroll:
            - Balance listener fires
            
            */
            
            
            // Setup
            cols.each(function() {
                var col = $(this),
                    inner = $('<div>').append(col.children());
            
                col.html('').append(inner).css({
                    position: 'relative'
                });
                
                inner.css({
                    position: 'absolute',
                    top: 0,
                    left: 0
                });
                
                col.data('scrollbalance-data', {
                    inner: inner
                });
            });
            
            
            // Initialisation
            function initialise() {
                var maxHeight = 0;
                
                cols.each(function() {
                    var col = $(this),
                        data = col.data('scrollbalance-data'),
                        colWidth = col.width();
                    
                    data['inner'].css({
                        width: colWidth + 'px',
                        paddingLeft: col.css('paddingLeft')
                    });
                    
                    col.css('height', data['inner'].outerHeight(true));

                    data['colHeight'] = col.outerHeight() + parseInt(col.css('marginTop'));
                    maxHeight = Math.max(data['colHeight'], maxHeight);

                    data['pinTop'] = (data['colHeight'] < $(window).height());
                    
                    if (data['pinTop']) {
                        data['fixTop'] = settings.topBuffer;
                    }
                    else {
                        data['fixTop'] = $(window).height() - data['colHeight'];
                    }
                    data['fixLeft'] = col.offset().left + parseInt(col.css('borderLeftWidth'));
                });
                
                // make sure container has height
                if (container.height() < maxHeight) {
                    container.height(maxHeight);
                }
                
                cols.each(function() {
                    var col = $(this),
                        data = $(this).data('scrollbalance-data');

                    data['maxScroll'] = container.height() - col.outerHeight(true);
                });

                
            };
            

            // balance
            function balance() {
                var top = container.offset().top,
                    scrollTop = $(window).scrollTop();
                
                cols.each(function() {
                    var col = $(this),
                        data = col.data('scrollbalance-data');

                    
                    if (data['maxScroll'] <= settings.threshold) {
                        // don't do anything if the columns are too close in height.
                        data['inner'].css({
                            position: 'absolute',
                            top: 0,
                            left: 0
                        }); 
                    }
                    else {
                        if (data['pinTop']) {
                            var raw_scroll = scrollTop - top + settings.topBuffer;
                        }
                        else {
                            var raw_scroll = ($(window).height() + scrollTop) - (top + data['colHeight']);
                        }
                        var scroll = Math.max(
                            0,
                            Math.min(
                                data['maxScroll'],
                                raw_scroll
                            )
                        );
    
                        if (scroll && scroll < data['maxScroll']) {
                            // element is fixed when window is scrolling between 'up' and 'down' states below
                            data['inner'].css({
                                position: 'fixed',
                                top: data['fixTop'] + 'px',
                                left: data['fixLeft'] - $(window).scrollLeft() + 'px'
                            });
                        }
                        else if (scroll) {
                            // element is at the bottom of the container when window is scrolled down
                            data['inner'].css({
                                position: 'absolute',
                                top: data['maxScroll'] + 'px',
                                left: 0
                            });
                        }
                        else {
                            // element is at the top of the container when window is scrolled up
                            data['inner'].css({
                                position: 'absolute',
                                top: 0,
                                left: 0
                            });
                        }
                    }
                });
            };
            
            initialise();
            balance();
            $(window).scroll(balance);
            $(window).resize(function() {
                initialise();
                balance();
            });
            
            container.data('scrollbalance-initialise', function() {
                initialise();
                balance();
            });
            
        });
        
        return this;
    });
        

})(jQuery);
