/*!
 * ScrollBalance.js v1.1.2
 * https://github.com/gregplaysguitar/ScrollBalance.js/
 *
 * Uses position: fixed to combat unsightly gaps in multi-column layouts,
 * when columns are of different heights.
 *
 * Copyright 2011 Greg Brown
 * https://github.com/gregplaysguitar/ScrollBalance.js/blob/master/license.txt
 *
 */

var INNER_CLASSNAME = 'scrollbalance-inner'

export default class ScrollBalance {
  constructor (columns, options) {
    this.columns = columns
    this.columnData = []
    this.settings = Object.assign({
      // threshold for activating the plugin, eg the column heights must
      // differ by at least this amount to be affected.
      threshold: 100,
      // disable the plugin if the screen width is less than this
      minwidth: null
    }, options || {})
    this.balance_enabled = true
    this.scrollTop = 0
    this.setup()
  }

  getOffset (el) {
    /* helper, returns elment offset */
    el = el.getBoundingClientRect()
    return {
      left: el.left + window.scrollX,
      top: el.top + window.scrollY
    }
  }

  windowSize () {
    /* helper, returns window dimentions */
    var e = window
    var a = 'inner'
    if (!('innerWidth' in window)) {
      a = 'client'
      e = document.documentElement || document.body
    }
    return {width: e[a + 'Width'], height: e[a + 'Height']}
  }

  windowScroll () {
    /* helper, returns current window scroll position */
    var doc = document.documentElement
    return {
      left: (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0),
      top: (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0)
    }
  }
  // "PUBLIC" METHODS:
  initialize () {
    /* Position each column inner absolutely within the column,
       and set the column heights, since their content is now
       positioned absolutely.
       Should be called whenever column content changes, or window
       is resized. */

    function columnHeight (col) {
      // TODO border included?
      var inner = col.querySelector('.' + INNER_CLASSNAME)
      var styles = window.getComputedStyle(inner)
      var margin = parseFloat(styles.marginTop) +
                   parseFloat(styles.marginBottom)
      return Math.ceil(inner.offsetHeight + margin)
    }

    // Calculate the maximum column height, i.e. how high the container
    // should be (don't assume the user is using a clearfix hack on their
    // container), and the container offset. If there's only one column, use
    // the parent for both calculations
    if (this.columns.length === 1) {
      this.containerHeight = this.columns[0].parentElement.offsetHeight
      this.containerTop = this.getOffset(this.columns[0].parentElement).top
    } else {
      var height = 0
      this.columns.forEach((column) => {
        height = Math.max(height, columnHeight(column))
      })
      this.containerHeight = height
      this.containerTop = this.getOffset(this.columns[0]).top
    }

    this.columns.forEach((column, i) => {
      var inner = column.querySelector('.' + INNER_CLASSNAME)
      var columnStyles = window.getComputedStyle(column)

      // save column data to avoid hitting the DOM on scroll
      if (!this.columnData[i]) {
        this.columnData[i] = {
          // default initial values here
          fixTop: 0
        }
      }
      var columnData = this.columnData[i]

      // calculate actual height regardless of what it's previously been
      // set to
      columnData.height = columnHeight(column)

      // disable if not enough difference in height between container and
      // column
      columnData.enabled = (this.containerHeight - columnData.height) >
        this.settings.threshold
      // TODO border included
      columnData.fixLeft = this.getOffset(column).left //+
        // (parseInt(col.css('borderLeftWidth'), 10) || 0)

      columnData.minFixTop = Math.min(0, this.winHeight - columnData.height)
      columnData.maxFixTop = 0

      // uncomment this to have it stick to the bottom too rather than just
      // the top
      // columnData.maxFixTop = Math.max(
      //   0, this.winHeight - columnData.height)

      if (this.balance_enabled && columnData.enabled) {
        // other css for this element is handled in balance()
        inner.style.width = columnStyles.width
        inner.style.padding = columnStyles.padding
        // inner.style.transform = 'translateZ(0px)'
        column.style.height = columnStyles.height
      } else {
        // reset state
        inner.style.width = null
        inner.style.padding = null
        // inner.style.transform = null
        column.style.height = null
      }
      this.balance(column, columnData, true)
    })
  }
  resize (winWidth, winHeight) {
    this.winHeight = winHeight

    if (this.settings.minwidth !== null) {
      this.balance_enabled = (winWidth >= this.settings.minwidth)
    }
    this.initialize()
  }
  scroll (scrollTop, scrollLeft) {
    var scrollDelta = scrollTop - this.scrollTop
    this.scrollTop = scrollTop
    this.scrollLeft = scrollLeft
    this.balanceAll(false, scrollDelta)
  }
  bind () {
    let resizeTimer
    /* Bind scrollbalance handlers to the scroll and resize events */
    window.addEventListener('resize', (e) => {
      // debounced
      clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(() => {
        const wSize = this.windowSize()
        this.resize(wSize.width, wSize.height)
      }, 250)
    })
    window.addEventListener('scroll', (e) => {
      const wScroll = this.windowScroll()
      this.scroll(wScroll.top, wScroll.left)
    })
    // init call
    const wSize = this.windowSize()
    const wScroll = this.windowScroll()
    this.resize(wSize.width, wSize.height)
    this.scroll(wScroll.top, wScroll.left)
  }
  unbind () {
    /* Unbind all scrollbalance handlers. */
    window.removeEventListener('resize', this.resize)
    window.removeEventListener('scroll', this.scroll)
  }
  disable () {
    /* Temporarily disable scrollbalance */
    this.balance_enabled = false
    this.initialize()
  }
  enable () {
    /* Re-enable scrollbalance */
    this.balance_enabled = true
    this.initialize()
  }
  teardown () {
    /* Remove all traces of scrollbalance from the content */
    this.columns.forEach((column) => {
      var inner = column.querySelector('.' + INNER_CLASSNAME)

      if (inner.setAttribute('data-sb-created')) {
        // TODO check this moves content
        column.parentElement.append(inner.children)
      }
      column.style.position = null
      column.style.height = null
    })
  }

  // "PRIVATE" METHODS:
  setup () {
    /* Append an "inner" element to each column, if it isn't already there,
       and move the column's content into this element, so that the
       content's vertical position can be controlled independently of the
       column's (usually floated) position.
       Should only be called once, on setup. */

    this.columns.forEach((column) => {
      var inner = column.querySelector('.' + INNER_CLASSNAME)
      var columnStyles = window.getComputedStyle(column)
      if (columnStyles.position === 'static') {
        column.style.position = 'relative'
      }

      if (!inner) {
        inner = document.createElement('div')
        inner.className = INNER_CLASSNAME
        inner.innerHTML = column.innerHTML
        inner.setAttribute('data-sb-created', true)
        column.innerHTML = ''
        column.append(inner)
      }
    })
  }
  balance (column, columnData, force, scrollDelta) {
    /* Using the scroll position, container offset, and column
       height, determine whether the column should be fixed or
       absolute, and position it accordingly. */

    var state
    var fixTop = columnData.fixTop

    if (scrollDelta === undefined) {
      scrollDelta = 0
    }

    if (!columnData.enabled || !this.balance_enabled) {
      state = 'disabled'
    } else {
      // determine state, one of
      // - top
      // - bottom
      // - fixed

      var topBreakpoint = this.containerTop - columnData.fixTop
      // var bottomBreakpoint = this.containerTop + this.containerHeight -
      //    this.winHeight + Math.max(
      //      0, this.winHeight - columnData.height - columnData.fixTop)

      var bottomBreakpoint = this.containerTop + this.containerHeight -
        columnData.height - columnData.fixTop

      if (this.scrollTop < topBreakpoint) {
        state = 'top'
      } else if (this.scrollTop > bottomBreakpoint) {
        state = 'bottom'
      } else {
        state = 'fixed'
        fixTop = columnData.fixTop - scrollDelta
        fixTop = Math.max(columnData.minFixTop,
                          Math.min(columnData.maxFixTop, fixTop))
      }
    }

    // update column positioning only if changed
    if (columnData.state !== state || columnData.fixTop !== fixTop || force) {
      var inner = column.querySelector('.' + INNER_CLASSNAME)
      if (state === 'disabled') {
        inner.style.position = null
        inner.style.top = null
        inner.style.left = null
      } else if (state === 'fixed') {
        inner.style.position = 'fixed'
        inner.style.top = `${fixTop}px`
        inner.style.left = `${columnData.fixLeft - this.scrollLeft}px`
      } else {
        // assume one of "bottom" or "top"
        inner.style.position = 'absolute'
        inner.style.top = `${(state === 'bottom' ? this.containerHeight -
                              columnData.height : 0)}px`
        inner.style.left = null
      }
      columnData.fixTop = fixTop
      columnData.state = state
    }
  }
  balanceAll (force, scrollDelta) {
    /* Balance all columns */
    for (var i = 0; i < this.columns.length; i++) {
      if (this.columnData[i]) {
        this.balance(this.columns[i], this.columnData[i], force,
                     scrollDelta)
      }
    }
  }
}
