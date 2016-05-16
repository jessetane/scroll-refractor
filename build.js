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
  if (this.isConnected) {
    this.update()
  }
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

},{}],3:[function(require,module,exports){
function CustomElement () {
  this.__custom = true
  this.__defined = true
  this.__isConnected = false
}

CustomElement.prototype = Object.create(
  HTMLElement.prototype
)

Object.defineProperty(CustomElement.prototype, 'custom', {
  get: function () {
    return this.__custom
  }
})

Object.defineProperty(CustomElement.prototype, 'defined', {
  get: function () {
    return this.__defined
  }
})

Object.defineProperty(CustomElement.prototype, 'isConnected', {
  get: function () {
    return this.__isConnected
  },
  set: function (isConnected) {
    this.__isConnected = isConnected
  }
})

function CustomElementsRegistry () {}

CustomElementsRegistry.prototype.define = function (name, constructor, options) {
  var nodeName = name.toUpperCase()
  if (nodeName in registry) {
    throw new Error('NotSupportedError')
  }
  registry[nodeName] = constructor
  selectors += selectors.length ? (',' + name) : name
  upgradeChildren(document, name, true)
}

function upgradeChildren (element, selector, connected) {
  Array.prototype.slice.call(
    element.querySelectorAll(selector)
  ).forEach(function (child) {
    upgradeElement(child, connected)
  })
}

function upgradeElement (element, connected) {
  var constructor = registry[element.nodeName]
  if (constructor) {
    if (!element.__defined) {
      constructElement(element, constructor)
    }
    if (connected && element.connectedCallback && !element.__isConnected) {
      element.__isConnected = true
      element.connectedCallback()
    }
  }
  upgradeChildren(element, selectors, connected)
}

function constructElement (element, constructor) {
  Object.setPrototypeOf(element, constructor.prototype)
  constructor.call(element)
  if (element.attributeChangedCallback && constructor.observedAttributes) {
    constructor.observedAttributes.forEach(function (attributeName) {
      element.attributeChangedCallback(
        attributeName,
        null,
        element.getAttribute(attributeName)
      )
    })
  }
}

function maybeUpgradeChildren (element) {
  var connected = element.__isConnected || document.contains(element)
  if (connected) {
    upgradeChildren(
      element,
      selectors,
      connected
    )
  }
}

function disconnectChildren (element) {
  Array.prototype.slice.call(
    element.querySelectorAll(selectors)
  ).forEach(disconnectElement)
}

function disconnectElement (element, recursive) {
  if (element.__custom && element.disconnectedCallback && element.__isConnected === true) {
    element.__isConnected = false
    element.disconnectedCallback()
  }
  if (recursive) {
    disconnectChildren(element)
  }
}

function changeAttribute (remove, element, name, value) {
  var callback = element.__custom && element.attributeChangedCallback
  if (callback) {
    var oldValue = element.getAttribute(name)
  }
  if (remove) {
    removeAttribute.call(element, name)
    value = null
  } else {
    setAttribute.call(element, name, value)
  }
  if (callback) {
    attributeChanges.push([ element, name, oldValue ])
    runAttributeChangedCallback(
      element,
      name,
      oldValue,
      value
    )
  }
}

function runAttributeChangedCallback (element, attributeName, oldValue, newValue) {
  if (oldValue === newValue) return
  var constructor = registry[element.nodeName]
  var observedAttributes = constructor.observedAttributes
  if (observedAttributes && arrayIncludes(observedAttributes, attributeName)) {
    element.attributeChangedCallback(
      attributeName,
      oldValue,
      newValue
    )
  }
}

function arrayIncludes (array, item) {
  var includes = false
  array.forEach(function (_item) {
    if (!includes && _item === item) {
      includes = true
    }
  })
  return includes
}

if (!window.customElements) {
  window.customElements = new CustomElementsRegistry()
  window.HTMLElement = CustomElement

  var registry = {}
  var selectors = ''
  var attributeChanges = []
  var appendChild = Element.prototype.appendChild
  var insertBefore = Element.prototype.insertBefore
  var removeChild = Element.prototype.removeChild
  var remove = Element.prototype.remove
  var setAttribute = Element.prototype.setAttribute
  var removeAttribute = Element.prototype.removeAttribute
  var createElement = document.createElement

  Element.prototype.appendChild = function (child) {
    child.remove()
    appendChild.call(this, child)
    if (selectors) {
      maybeUpgradeChildren(this)
    }
    return child
  }

  Element.prototype.insertBefore = function (child, otherChild) {
    child.remove()
    insertBefore.call(this, child, otherChild)
    if (selectors) {
      maybeUpgradeChildren(this)
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
    if (selectors && child.nodeType === 1) {
      disconnectElement(child, true)
    }
    return child
  }

  Element.prototype.remove = function () {
    if (!this.parentNode) return
    remove.call(this)
    if (selectors && this.nodeType === 1) {
      disconnectElement(this, true)
    }
    return this
  }

  Element.prototype.setAttribute = function (name, value) {
    changeAttribute(false, this, name, value)
  }

  Element.prototype.removeAttribute = function (name) {
    changeAttribute(true, this, name)
  }

  document.createElement = function (name) {
    name = name.toUpperCase()
    var element = createElement.call(document, name)
    var constructor = registry[name]
    if (constructor) {
      constructElement(element, constructor)
    }
    return element
  }

  new MutationObserver(function (changes) {
    if (!selectors) return
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
          if (child.nodeType === 1) {
            upgradeElement(child, selectors, true)
          }
        }
        childCount = removed.length
        n = -1
        while (++n < removed) {
          child = removed[n]
          if (child.nodeType === 1) {
            disconnectElement(child, true)
          }
        }
      } else if (change.type === 'attributes') {
        child = change.target
        if (child.__custom && child.attributeChangedCallback) {
          var attributeName = change.attributeName
          var oldValue = change.oldValue
          var lastKnownChange = attributeChanges[0]
          if (lastKnownChange &&
              lastKnownChange[0] === child &&
              lastKnownChange[1] === attributeName &&
              lastKnownChange[2] === oldValue) {
            attributeChanges.shift()
          } else {
            runAttributeChangedCallback(
              child,
              attributeName,
              oldValue,
              child.getAttribute(attributeName)
            )
          }
        }
      }
    }
  }).observe(document, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeOldValue: true
  })
}

},{}]},{},[1]);
