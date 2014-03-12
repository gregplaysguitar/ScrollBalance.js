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

    $('.column').scrollbalance();


### Optional parameters

- topBuffer: distance to maintain between the top of the stationary element 
             and the top of the container. (default 0)
- threshold: minimum pixel difference in column heights for the plugin to activate 
             (default 100)
- pinTopFilter: jquery filter to identify columns which should be pinned to the top,               
                even if they are taller than the viewport (default null)

Full example:

    $('.column').scrollbalance({
        // keep a 10px gap between the content and the top of the viewport
        topBuffer: 10,
        
        // always balance columns, even if the difference in height is small
        threshold: 0,
        
        // pin column(s) with the class "sidebar" to top
        pinTopFilter: '.sidebar'
    });


### Dynamic content

If your column heights change dynamically, you'll need to reinitialise the plugin.
For example:

    $('.column').scrollbalance();
    var api = $('.column').data('scrollbalance');
    
    // add some content here
    ...
    
    api.reinitialise();


### Temporarily disabling the plugin

The plugin can be turned on and off with the `enable` and `disable` api methods.
For example, for smaller screen sizes where the columns don't have room to float
side-by-side:
  
    $('.column').scrollbalance();
    var api = $('.column').data('scrollbalance');
    $(window).on('resize', function() {
        if ($(window).width() > 900) {
            api.enable();
        }
        else {
            api.disable();                    
        }
    });


### Removing the plugin from an element

The `teardown` method removes all trace of jquery-scrollbalance from an element.
For example:
    
    $('.column').scrollbalance();
    var api = $('.column').data('scrollbalance');
    api.teardown();


### Demo

See index.html for a demo.

## License

The plugin is licensed under the MIT License (LICENSE.txt).

Copyright (c) 2011 [Greg Brown](http://gregbrown.co.nz)