require('document-register-element')
require('../')

var refractor = document.querySelector('x-scroll-refractor')
window.addEventListener('resize', refractor.update.bind(refractor))

var form = document.querySelector('form')
form.addEventListener('change', function () {
  // change direction
  var direction = form.elements.direction.value
  document.documentElement.className = direction
  refractor.setAttribute('direction', direction)
  if (direction === 'vertical') {
    document.documentElement.scrollLeft = document.body.scrollLeft = 0
  } else {
    document.documentElement.scrollTop = document.body.scrollTop = 0
  }

  // set factor
  refractor.setAttribute('factor', form.elements.factor.value)

  // reverse
  var reverse = form.elements.reverse.checked
  if (reverse) {
    refractor.setAttribute('reverse', 'reverse')
  } else {
    refractor.removeAttribute('reverse')
  }
})
