# ScrollBalance.js

A javascript plugin that intelligently uses position: fixed to combat unsightly gaps
in multi-column layouts, when columns are of different heights. See 
<http://gregplaysguitar.github.io/ScrollBalance.js/> for a demo.

Requires jquery version 1.7 or higher.

## Installation

With npm:

    npm install scrollbalance

or via cdn:

    <script type="text/javascript" src="https://www.gitcdn.xyz/repo/gregplaysguitar/ScrollBalance.js/master/ScrollBalance.js"></script>

## Usage

Start with side-by-side columns, for example:

    <div class="column">...</div>
    <div class="column">...</div>
    <div class="column">...</div>

Columns could be floated, inline-block or positioned absolutely - the only 
requirement is that they're side-by-side on the page.

Initialise the plugin like so:

    var scrollbalance = new ScrollBalance($('.column'), {
      // options
    });
    scrollbalance.bind();

Or with jquery:

    $('.column').scrollbalance({});
    var scrollbalance = $('.column').data('scrollbalance'); // access the api


### Options

- `minwidth`  
   disable the plugin if the screen width is less than this (default 0)
- `threshold`  
  threshold for activating the plugin, eg the column heights must differ by at 
  least this amount to be affected. (default 100)

### Methods

- `initialize: function ()`  
  Recalculate column heights and positioning, for example if content changes
- `resize: function (winWidth, winHeight)`  
  Handle a browser resize event
- `scroll: function (scrollTop, scrollLeft)`  
  Handle a browser scroll event
- `bind: function ()`  
  Bind resize and scroll to the window's corresponding events
- `unbind: function ()`  
  Remove resize and scroll from the window's corresponding events  
- `disable: function ()`  
  Disable scrollbalance
- `enable: function ()`  
  Enable scrollbalance
- `teardown: function ()`  
  Remove all traces of scrollbalance from the content

### Scroll / resize event handling

ScrollBalance.bind() binds to the window's resize and scroll events, but you
may want to handle these manually to avoid binding to these events multiple
times:

    var scrollbalance = new ScrollBalance($('.column'));

    $(window).on('resize', function () {
      var winWidth = $(window).width();
      var winHeight = $(window).height();
      scrollbalance.resize(winWidth, winHeight);

      // other resize behaviour
    });

    $(window).on('scroll', function () {
      var scrollTop = $(window).scrollTop();
      var scrollLeft = $(window).scrollLeft();
      scrollbalance.scroll(scrollTop, scrollLeft);

      // other scroll behaviour
    });

### Column wrapper div

To avoid changing the position of the columns, ScrollBalance.js creates a
wrapper div inside each, and appends the column content dynamically. To avoid
this, wrap the column content in a div with the class scrollbalance-inner and
this will be used instead. The div should have no styling. E.g.

    <div class="column"><div class="scrollbalance-inner">...</div></div>
    <div class="column"><div class="scrollbalance-inner">...</div></div>

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

See <http://gregplaysguitar.github.io/ScrollBalance.js/> for a demo.

## License

The plugin is licensed under the MIT License (LICENSE.txt).

Copyright (c) 2011 [Greg Brown](http://gregbrown.co.nz)
