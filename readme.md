# jQuery Scroll Balance

A jQuery plugin that intelligently uses position: fixed to combat unsightly gaps 
in multi-column layouts, when columns are of different heights. See index.html 
for a demo.

Requires jquery version 1.7 or higher.

## Usage

Assuming you have markup like the following:
    
    <div class="wrap">
        <div class="column">...</div>
        <div class="column">...</div>
        <div class="column">...</div>
    </div>

Initialise the plugin like so:

    $('.wrap').scrollbalance({
      childSelector: '.column'
    });


### Optional parameters

- topBuffer: distance to maintain between the top of the stationary element 
             and the top of the container. (default 0)
- threshold: minimum pixel difference in column heights for the plugin to activate 
             (default 100)
- pinTopFilter: jquery filter to identify columns which should be pinned to the top,               
                even if they are taller than the viewport (default null)


### Dynamic content

If your column heights change dynamically, you'll need to reinitialise the plugin.
For example:

    $('.wrap').scrollbalance({
      childSelector: '.column'
    });
    var api = $('.wrap').data('scrollbalance');
    
    // add some content here
    ...
    
    api.reinitialise();


### Temporarily disabling the plugin

The plugin can be turned on and off with the `enable` and `disable` api methods.
For example, for smaller screen sizes where the columns don't have room to float
side-by-side:
  
    var api = $('.wrap').data('scrollbalance');
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
    
    var api = $('.wrap').data('scrollbalance');
    api.teardown();


### Demo

See index.html for a demo.

## License

The plugin is licensed under the MIT License (LICENSE.txt).

Copyright (c) 2011 [Greg Brown](http://gregbrown.co.nz)