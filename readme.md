# scroll-refractor
A web component that scrolls its content perpendicularly.

Check out a [demo](http://jessetane.github.io/scroll-refractor/).

## Why
You want to navigate through a horizontal interface by scrolling vertically or vice versa.

## How
The component expands in the direction of scroll proprtional to its content, and then uses `requestAnimationFrame` to translate its `firstElementChild` along a perpendicular axis.

## Example
``` html
<x-scroll-refractor orientation=vertical factor=0.5 reverse>
  <div>
    <img src=1.jpg>
    <img src=2.jpg>
    <img src=3.jpg>
  </div>
</x-scroll-refractor>
```

## License
Public domain
