require('document-register-element')
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
