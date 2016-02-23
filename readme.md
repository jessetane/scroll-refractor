# scroll-refractor
A web component that scrolls its content perpendicularly.

## Why
You want to navigate through a horizontal interface by scrolling vertically or vice versa.

## How
The component expands in the direction of scroll proprtional to its content, and then uses `requestAnimationFrame` to translate itself along a perpendicular axis.

## Example
``` html
<x-scroll-refractor direction=horizontal reverse>
  <div>
    <img src="1.jpg">
    <img src="2.jpg">
    <img src="3.jpg">
  </div>
</x-scroll-refractor>
```

## License
Public domain
