module.exports = ScrollRefractor

function ScrollRefractor () {
  HTMLElement.call(this)
  this.style.position = 'relative'
  this._onenterFrame = this._onenterFrame.bind(this)
  this._onscrollEnd = this._onscrollEnd.bind(this)
  this._onscroll = this._onscroll.bind(this)
}

ScrollRefractor.prototype = Object.create(
  HTMLElement.prototype, {
    constructor: {
      value: ScrollRefractor,
      enumberable: false,
      configurable: true,
      writable: true
    }
  }
)

ScrollRefractor.observedAttributes = [
  'orientation',
  'reverse',
  'factor'
]

Object.defineProperty(ScrollRefractor.prototype, 'orientation', {
  get: function () {
    return this._orientation
  },
  set: function (orientation) {
    if (!orientation) orientation = 'vertical'
    var vertical = orientation === 'vertical'
    if (!vertical && orientation !== 'horizontal') {
      throw new Error('orientation must be vertical or horizontal')
    }
    var content = this.firstElementChild
    if (vertical) {
      if (content) {
        content.style.left = content.style.right = null
      }
      this.style.width = null
    } else {
      if (content) {
        content.style.top = content.style.bottom = null
      }
      this.style.height = null
    }
    this._offsetBefore = vertical ? 'offsetTop' : 'offsetLeft'
    this._offsetAfter = vertical ? 'offsetBottom' : 'offsetRight'
    this._offsetMain = vertical ? 'offsetHeight' : 'offsetWidth'
    this._offsetPerpendicular = vertical ? 'offsetWidth' : 'offsetHeight'
    this._edgeBefore = vertical ? 'top' : 'left'
    this._edgeAfter = vertical ? 'bottom' : 'right'
    this._size = vertical ? 'height' : 'width'
    this._orientation = orientation
  }
})

Object.defineProperty(ScrollRefractor.prototype, 'reverse', {
  get: function () {
    if (this._reverse === undefined) {
      this.reverse = this.getAttribute('reverse')
    }
    return this._reverse
  },
  set: function (reverse) {
    this._reverse = !!reverse
  }
})

Object.defineProperty(ScrollRefractor.prototype, 'factor', {
  get: function () {
    if (this._factor === undefined) {
      this.factor = this.getAttribute('factor')
    }
    return this._factor || 1.0
  },
  set: function (factor) {
    this._factor = parseFloat(factor)
  }
})

Object.defineProperty(ScrollRefractor.prototype, 'scrollBefore', {
  get: function () {
    if (this._orientation === 'vertical') {
      if (this._scrollReference === document.body) {
        return document.documentElement.scrollTop || this._scrollReference.scrollTop
      } else {
        return this._scrollReference.scrollTop
      }
    } else {
      if (this._scrollReference === document.body) {
        return document.documentElement.scrollLeft || this._scrollReference.scrollLeft
      } else {
        return this._scrollReference.scrollLeft
      }
    }
  }
})

ScrollRefractor.prototype.connectedCallback = function () {
  if (!this._scrollReference) {
    this._scrollReference = this.parentNode
  }
  if (!this.offsetReference) {
    this.offsetReference = this
  }
  if (this._scrollReference === document.body) {
    this._scrollEmitter = window
  } else {
    this._scrollEmitter = this._scrollReference
  }
  this._hidden = false
  this._scrollEmitter.addEventListener('scroll', this._onscroll)
}

ScrollRefractor.prototype.disconnectedCallback = function () {
  this._scrollEmitter.removeEventListener('scroll', this._onscroll)
  this._hidden = true
}

ScrollRefractor.prototype.attributeChangedCallback = function (name) {
  this[name] = this.getAttribute(name)
  this.update()
}

ScrollRefractor.prototype._onscroll = function () {
  this._scrollEmitter.removeEventListener('scroll', this._onscroll)
  this._onenterFrame()
}

ScrollRefractor.prototype._onenterFrame = function () {
  if (this._hidden) return
  var scroll = this.scrollBefore
  if (this._lastScroll === scroll) {
    if (!this._debounce) {
      this._debounce = 1
    } else if (this._debounce < 10) {
      this._debounce++
    } else {
      this._onscrollEnd()
      return
    }
  } else {
    this._debounce = 0
    this._lastScroll = scroll
    this.update()
  }
  requestAnimationFrame(this._onenterFrame)
}

ScrollRefractor.prototype.update = function () {
  var content = this.firstElementChild
  if (!content) return
  if (!content.style.position) {
    content.style.position = 'absolute'
  }
  var factor = this.factor
  var contentSize = content[this._offsetPerpendicular]
  var contentSizePerpendicular = content[this._offsetMain]
  var offsetPerpendicular = this[this._offsetPerpendicular]
  var scrollable = (contentSize - offsetPerpendicular) / factor
  this.style[this._size] = scrollable + contentSizePerpendicular + 'px'

  var scroll = this.scrollBefore
  var offsetBefore = this.offsetReference[this._offsetBefore]
  if (scroll < offsetBefore) {
    content.style[this._edgeBefore] = '0'
    content.style[this._edgeAfter] = null
    content.style.position = 'absolute'
  } else if (scroll > offsetBefore + scrollable) {
    content.style[this._edgeBefore] = null
    content.style[this._edgeAfter] = '0'
    content.style.position = 'absolute'
  } else {
    content.style[this._edgeBefore] = this._scrollReference[this._offsetBefore] + 'px'
    content.style.position = 'fixed'
  }

  scroll -= offsetBefore
  var offset = this._reverse ? (scroll * factor - contentSize + offsetPerpendicular) : -scroll * factor
  offset = Math.max(offset, -contentSize + offsetPerpendicular)
  offset = Math.min(offset, 0)

  if (this._orientation === 'vertical') {
    content.style.transform = 'translate3d(' + offset + 'px,0,0)'
  } else {
    content.style.transform = 'translate3d(0,' + offset + 'px,0)'
  }
}

ScrollRefractor.prototype._onscrollEnd = function () {
  delete this._lastScroll
  this._scrollEmitter.addEventListener('scroll', this._onscroll)
}

customElements.define('x-scroll-refractor', ScrollRefractor)
