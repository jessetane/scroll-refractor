(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
require('custom-elements')
require('../')

var refractor = document.querySelector('x-scroll-refractor')
window.addEventListener('resize', refractor.update.bind(refractor))

var form = document.querySelector('form')
form.addEventListener('change', function () {
  // update orientation
  var orientation = form.elements.orientation.value
  document.documentElement.className = orientation
  refractor.setAttribute('orientation', orientation)
  if (orientation === 'vertical') {
    document.documentElement.scrollLeft = document.body.scrollLeft = 0
  } else {
    document.documentElement.scrollTop = document.body.scrollTop = 0
  }

  // set or unset reverse
  var reverse = form.elements.reverse.checked
  if (reverse) {
    refractor.setAttribute('reverse', 'reverse')
  } else {
    refractor.removeAttribute('reverse')
  }

  // update factor
  refractor.setAttribute('factor', form.elements.factor.value)
})

},{"../":2,"custom-elements":3}],2:[function(require,module,exports){
module.exports = ScrollRefractor

ScrollRefractor.prototype = Object.create(
  HTMLElement.prototype
)

function ScrollRefractor () {
  HTMLElement.call(this)
  this.style.position = 'relative'
  if (!this.getAttribute('orientation')) {
    this.orientation = 'vertical'
  }
  this._onenterFrame = this._onenterFrame.bind(this)
  this._onscrollEnd = this._onscrollEnd.bind(this)
  this._onscroll = this._onscroll.bind(this)
}

Object.defineProperty(ScrollRefractor.prototype, 'orientation', {
  get: function () {
    return this._orientation
  },
  set: function (orientation) {
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

document.defineElement('x-scroll-refractor', ScrollRefractor)

},{}],3:[function(require,module,exports){
function defineElement (name, constructor, options) {
  name = name.toLowerCase()
  if (name in registry) {
    throw new Error('NotSupportedError')
  }
  registry[name] = constructor
  registry[name.toUpperCase()] = constructor
  selectors = selectors.length ? (',' + name) : name
  Array.prototype.slice.call(
    document.querySelectorAll(name)
  ).forEach(function (element) {
    Object.setPrototypeOf(element, constructor.prototype)
    constructor.call(element)
    if (element.attachedCallback) {
      element.attachedCallback()
    }
  })
}

function CustomHTMLElement () {
  createHiddenProperty(this, '__constructed__', true)
  createHiddenProperty(this, '__attached__', false)
}

CustomHTMLElement.prototype = Object.create(
  HTMLElement.prototype
)

function createHiddenProperty (object, property, value) {
  Object.defineProperty(object, property, {
    value: value,
    writable: true,
    enumerable: false,
    configurable: false
  })
}

if (!document.defineElement) {
  var registry = {}
  var selectors = ''
  var appendChild = Element.prototype.appendChild
  var insertBefore = Element.prototype.insertBefore
  var removeChild = Element.prototype.removeChild
  var remove = Element.prototype.remove
  var realCreateElement = document.createElement

  Element.prototype.appendChild = function (child) {
    child.remove()
    appendChild.call(this, child)
    if (registry[child.nodeName] && child.attachedCallback) {
      child.__attached__ = true
      child.attachedCallback()
    }
    return child
  }

  Element.prototype.insertBefore = function (child, otherChild) {
    child.remove()
    insertBefore.call(this, child, otherChild)
    if (registry[child.nodeName] && child.attachedCallback) {
      child.__attached__ = true
      child.attachedCallback()
    }
    return child
  }

  Element.prototype.replaceChild = function (child, otherChild) {
    this.insertBefore(child, otherChild)
    if (otherChild) {
      return otherChild.remove()
    }
  }

  Element.prototype.removeChild = function (child) {
    removeChild.call(this, child)
    if (registry[child.nodeName] && child.detachedCallback) {
      child.__attached__ = false
      child.detachedCallback()
    }
    return child
  }

  Element.prototype.remove = function () {
    if (!this.parentNode) return
    remove.call(this)
    if (registry[this.nodeName] && this.detachedCallback) {
      this.__attached__ = false
      this.detachedCallback()
    }
    return this
  }

  document.createElement = function (name) {
    var element = realCreateElement.call(document, name)
    var constructor = registry[name.toLowerCase()]
    if (constructor) {
      Object.setPrototypeOf(element, constructor.prototype)
      constructor.call(element)
    }
    return element
  }

  document.defineElement = defineElement

  window.HTMLElement = CustomHTMLElement

  new MutationObserver(function (changes) {
    var changeCount = changes.length
    var i = -1
    while (++i < changeCount) {
      var change = changes[i]
      if (change.type === 'childList') {
        var added = change.addedNodes
        var removed = change.removedNodes
        var childCount = added.length
        var n = -1
        while (++n < childCount) {
          var child = added[n]
          var constructor = registry[child.nodeName]
          if (constructor) {
            if (child.__constructed__ === undefined) {
              Object.setPrototypeOf(child, constructor.prototype)
              constructor.call(child)
            }
            if (child.attachedCallback && child.__attached__ === false) {
              child.__attached__ = true
              child.attachedCallback()
            }
          }
        }
        childCount = removed.length
        n = -1
        while (++n < removed) {
          child = removed[n]
          if (registry[child.nodeName] && child.detachedCallback && child.__attached__ === true) {
            child.__attached__ = false
            child.detachedCallback()
          }
        }
      } else {
        child = change.target
        if (child.attributeChangedCallback && change.attributeName !== 'style') {
          var newValue = child.getAttribute(change.attributeName)
          if (newValue !== change.oldValue) {
            child.attributeChangedCallback(
              change.attributeName,
              change.oldValue,
              newValue
            )
          }
        }
      }
    }
  }).observe(document, {
    childList: true,
    attributes: true,
    attributeOldValue: true,
    subtree: true
  })
}

},{}]},{},[1]);
