# jQuery Scroll Balance

A jQuery plugin that intelligently uses position: fixed to combat unsightly gaps
in multi-column layouts, when columns are of different heights. See index.html
for a demo.

Requires jquery version 1.7 or higher.

## Installation

With npm:

    npm install scrollbalance

or manually:

    <script type="text/javascript" src="https://www.gitcdn.xyz/repo/gregplaysguitar/ScrollBalance.js/master/ScrollBalance.js"></script>

## Usage

Start with side-by-side columns, for example:

    <div class="column">...</div>
    <div class="column">...</div>
    <div class="column">...</div>

Columns must be side-by-side, which usually means floated, but doesn't have to -
they could be absolutely positioned.
Initialise the plugin like so:

    var scrollbalance = new ScrollBalance($('.column'), {
      // options
    });
    scrollbalance.bind();

Or with jquery:

    $('.column').scrollbalance({});
    var scrollbalance = $('.column').data('scrollbalance'); // access the api


### Options

- minwidth: disable the plugin if the screen width is less than this
    (default 0)
- threshold: threshold for activating the plugin, eg the column heights must
    differ by at least this amount to be affected. (default 100)

Advanced example:

    var scrollbalance = new ScrollBalance($('.column'), {
      // disable on mobile screens
      minwidth: 767,

      // disable if columns differ by less than 200px
      threshold: 200
    });

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
