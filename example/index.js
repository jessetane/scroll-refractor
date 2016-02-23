require('document-register-element')
require('../')

var refractor = document.querySelector('x-scroll-refractor')
var form = document.querySelector('form')

window.addEventListener('resize', refractor.update.bind(refractor))
form.addEventListener('change', update)
update()

function update () {
  // change direction
  var direction = form.elements.direction.value
  refractor.setAttribute('direction', direction)
  document.documentElement.className = direction

  // reverse
  var reverse = form.elements.reverse.checked
  if (reverse) {
    refractor.setAttribute('reverse', 'reverse')
  } else {
    refractor.removeAttribute('reverse')
  }
}
