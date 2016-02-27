require('document-register-element')
require('../')

var refractor = document.querySelector('x-scroll-refractor')
window.addEventListener('resize', refractor.update.bind(refractor))

var form = document.querySelector('form')
form.addEventListener('change', function () {
  // change direction
  var direction = form.elements.direction.value
  refractor.setAttribute('direction', direction)
  document.documentElement.className = direction

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
