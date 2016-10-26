# jQuery Scroll Balance

A jQuery plugin that intelligently uses position: fixed to combat unsightly gaps 
in multi-column layouts, when columns are of different heights. See index.html 
for a demo.

Requires jquery version 1.7 or higher.

## Usage

Start with side-by-side columns, for example:
    
    <div class="column">...</div>
    <div class="column">...</div>
    <div class="column">...</div>

Columns must be side-by-side, which usually means floated, but doesn't have to -
they could be absolutely positioned.
Initialise the plugin like so:

    var scrollbalance = new ScrollBalance($('.column'), options);
    scrollbalance.bind();
    
Or with jquery:

    $('.column').scrollbalance(options);
    var scrollbalance = $('.column').data('scrollbalance'); // access the api


### Optional parameters

- topBuffer: distance to maintain between the top of the stationary element 
             and the top of the container. (default 0)
- threshold: minimum pixel difference in column heights for the plugin to 
             activate (default 100)
- pinTopFilter: jquery filter to identify columns which should be pinned to 
                the top, even if they are taller than the viewport (default 
                null)

Advanced example:
    
    var scrollbalance = new ScrollBalance($('.column'), {
        // keep a 10px gap between the content and the top of the viewport
        topBuffer: 10,
        
        // always balance columns, even if the difference in height is small
        threshold: 0,
        
        // pin column(s) with the class "sidebar" to top
        pinTopFilter: '.sidebar'
    });
    scrollbalance.bind();

### Column wrapper div

To avoid changing the position of the columns, ScrollBalance.js creates a 
wrapper div inside each, and appends the column content dynamically. To avoid
this, wrap the column content in a div with the class scrollbalance-inner and
this will be used instead. The div should have no styling.

### Dynamic content

If your column heights change dynamically, you'll need to call the initialise
method - for example:

    var scrollbalance = new ScrollBalance($('.column'));
    
    // add some content here
    ...
    
    scrollbalance.initialise();


### Temporarily disabling the plugin

The plugin can be turned on and off with the `enable` and `disable` api
methods. For example, for smaller screen sizes where the columns don't have
room to float side-by-side:
  
    var scrollbalance = new ScrollBalance($('.column'));

    $(window).on('resize', function() {
        if ($(window).width() > 900) {
            scrollbalance.enable();
        }
        else {
            scrollbalance.disable();                    
        }
    });


### Removing the plugin from an element

The `teardown` method removes all trace of jquery-scrollbalance from an element.
For example:
    
    var scrollbalance = new ScrollBalance($('.column'));
    scrollbalance.teardown();


### Demo

See index.html for a demo.

## License

The plugin is licensed under the MIT License (LICENSE.txt).

Copyright (c) 2011 [Greg Brown](http://gregbrown.co.nz)
