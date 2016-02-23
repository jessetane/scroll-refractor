var ScrollRefractor = {
  prototype: Object.create(HTMLElement.prototype)
}

Object.defineProperty(ScrollRefractor.prototype, 'direction', {
  get: function () {
    return this._direction
  },
  set: function (direction) {
    var vertical = direction === 'vertical'
    if (!vertical && direction !== 'horizontal') {
      throw new Error('direction must be vertical or horizontal')
    }
    this._scrollBefore = vertical ? 'scrollTop' : 'scrollLeft'
    this._offsetBefore = vertical ? 'offsetTop' : 'offsetLeft'
    this._offsetAfter = vertical ? 'offsetBottom' : 'offsetRight'
    this._offsetMain = vertical ? 'offsetHeight' : 'offsetWidth'
    this._offsetPerpendicular = vertical ? 'offsetWidth' : 'offsetHeight'
    this._edgeBefore = vertical ? 'top' : 'left'
    this._edgeAfter = vertical ? 'bottom' : 'right'
    this._size = vertical ? 'height' : 'width'
    this._direction = direction
    this._reset()
  }
})

Object.defineProperty(ScrollRefractor.prototype, 'reverse', {
  get: function () {
    return this._reverse
  },
  set: function (reverse) {
    this._reverse = !!reverse
    this._reset()
  }
})

ScrollRefractor.prototype.createdCallback = function () {
  this.style.position = 'relative'
  if (!this.getAttribute('direction')) {
    this.direction = 'vertical'
  }
  this._onenterFrame = this._onenterFrame.bind(this)
  this._onscrollEnd = this._onscrollEnd.bind(this)
  this._onscroll = this._onscroll.bind(this)
}

ScrollRefractor.prototype.attachedCallback = function () {
  if (!this._scrollReference) {
    this._scrollReference = this.parentNode
  }
  if (this._scrollReference === document.body) {
    this._scrollEmitter = window
  }
  this._scrollEmitter.addEventListener('scroll', this._onscroll)
}

ScrollRefractor.prototype.detachedCallback = function () {
  this._scrollEmitter.removeEventListener('scroll', this._onscroll)
  this._hidden = true
}

ScrollRefractor.prototype.attributeChangedCallback = function (name) {
  this[name] = this.getAttribute(name)
}

ScrollRefractor.prototype._reset = function () {
  this.style.width = this.style.height = null
  var content = this.firstElementChild
  if (content) {
    content.style.top = content.style.bottom = content.style.left = content.style.right = null
    content.style.transform = 'translate3d(0,0,0)'
  }
  if (this._scrollReference) {
    this._scrollReference.scrollTop = this._scrollReference.scrollLeft = 0
  }
}

ScrollRefractor.prototype._onscroll = function () {
  this._scrollEmitter.removeEventListener('scroll', this._onscroll)
  this._onenterFrame()
}

ScrollRefractor.prototype._onenterFrame = function () {
  if (this._hidden) return
  var scroll = this._scrollReference[this._scrollBefore]
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
  if (!content.style.position) {
    content.style.position = 'absolute'
  }
  var contentSize = content[this._offsetPerpendicular]
  var contentSizePerpendicular = content[this._offsetMain]
  var offsetPerpendicular = this[this._offsetPerpendicular]
  var scrollable = contentSize - offsetPerpendicular
  this.style[this._size] = scrollable + contentSizePerpendicular + 'px'

  var scroll = this._scrollReference[this._scrollBefore]
  var offsetBefore = this[this._offsetBefore]
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
  var offset = this._reverse ? (scroll - contentSize + offsetPerpendicular) : -scroll
  offset = Math.max(offset, -contentSize + offsetPerpendicular)
  offset = Math.min(offset, 0)

  if (this._direction === 'vertical') {
    content.style.transform = 'translate3d(' + offset + 'px,0,0)'
  } else {
    content.style.transform = 'translate3d(0,' + offset + 'px,0)'
  }
}

ScrollRefractor.prototype._onscrollEnd = function () {
  delete this._lastScroll
  this._scrollEmitter.addEventListener('scroll', this._onscroll)
}

module.exports = document.registerElement('x-scroll-refractor', ScrollRefractor)
