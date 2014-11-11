# VASELINE

A high-performance, bare-bones slider.  
It just loads and slides images; no styling whatsoever is done on the slider, so any styling you want to do, you'll have to do yourself.  
It uses canvas, which makes the slider unavailable to IE<9. If you need to support older IEs, use [ExCanvas](https://code.google.com/p/explorercanvas/).

-----

## Install

`npm install vaseline`

or

`bower install vaseline`

-----

## Usage

live example [here](http://synclop.github.io/Vaseline/), source of the example [here](//github.com/Synclop/Vaseline/tree/master/example)

```js
var v = Vaseline('Canvas') //id of the element to append the slider to
    .prefix('images/') //will get prepended to all images sources
    .suffix('.jpg') //will get appended to all images sources
    .slides('00..05') //will expand to ['images/00.jpg','images/01.jpg',...'images/05.jpg']
    .resolution(1) //set a lower resolution for performance if you'd like
    .cover() //sets the resizing mode to "cover". You can also use the default contain()
    .resize() //sets the slider to fit it's parent
    .autoResize() //will resize automatically on window size change
    .goTo(0) //goes to the first slide
;
```

transitions are done through CSS;  

the classes that are added to the main container are:  

- `vaseline-supports-transforms`: if the browser supports transforms. Use this to fall back to absolute positioning. If the browser does not support transforms, the class will be `vaseline-no-transforms`
- `vaseline-supports-canvas` or `vaseline-no-canvas` if the browser supports canvas

Classes that are added to the slides are:

- `vaseline-display` denotes a slide
- `vaseline-active` denotes the current slide
- `vaseline-inactive` denotes the previous slide
- `vaseline-forward` means the slider has loaded the next image
- `vaseline-backward` means the slider has gone back to a previous image

Additionally, a class of
`vaseline-loading` is added to the parent of the main container while loading the next image. Use it to show a spinner or whatever.

Here is a good starting point (vendor perfixes have been removed to provide a more readable output):

```css

#Canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    min-width: 500px;
    min-height: 200px;
    margin: 0 auto;
    background: #000;
}

.vaseline-container {
    transform: translateZ(0);
}

.vaseline-container .vaseline-display {
    top: 0;
    transition-property: left;
    transition-timing-function: ease-out;
    transition-duration: 1s;
    animation-timing-function: ease-out;
    animation-duration: 1s;
    animation-fill-mode: forwards;
    transform: translateY(100%);
}

.vaseline-supports-transforms .vaseline-display {
    animation-name: ExitTranslateForward;
    left: 0;
}

.vaseline-supports-transforms .vaseline-active {
    transform: translateX(0);
}

.vaseline-supports-transforms .vaseline-active.vaseline-forward {
    animation-name: EnterTranslateForward;
}

.vaseline-supports-transforms .vaseline-active.vaseline-backward {
    animation-name: EnterTranslateBackward;
}

.vaseline-supports-transforms .vaseline-inactive {
    transform: translateX(-100%);
}

.vaseline-supports-transforms .vaseline-inactive.vaseline-forward {
    animation-name: ExitTranslateForward;
}

.vaseline-supports-transforms .vaseline-inactive.vaseline-backward {
    animation-name: ExitTranslateBackward;
}

.vaseline-no-transforms .vaseline-display {
    top: -100%;
    animation-name: ExitPositionForward;
    left: 100%;
}

.vaseline-no-transforms .vaseline-active {
    left: 0;
}

.vaseline-no-transforms .vaseline-active.vaseline-forward {
    animation-name: EnterPositionForward;
}

.vaseline-no-transforms .vaseline-active.vaseline-backward {
    animation-name: EnterPositionBackward;
}

.vaseline-no-transforms .vaseline-inactive {
    left: -100%;
}

.vaseline-no-transforms .vaseline-inactive.vaseline-forward {
    animation-name: ExitPositionForward;
}

.vaseline-no-transforms .vaseline-inactive.vaseline-backward {
    animation-name: ExitPositionBackward;
}

@keyframes ExitTranslateForward {
    0% {transform: translateX(0);}
    100% {transform: translateX(-100%);}
}

@keyframes EnterTranslateForward {
    0% {transform: translateX(100%);}
    100% {transform: translateX(0);}
}

@keyframes ExitTranslateBackward {
    0% {transform: translateX(0);}
    100% {transform: translateX(100%);}
}

@keyframes EnterTranslateBackward {
    0% {transform: translateX(-100%);}
    100% {transform: translateX(0);}
}

@keyframes ExitPositionForward {
    0% {left: 0;}
    100% {left: -100%;}
}

@keyframes EnterPositionForward {
    0% {left: 100%;}
    100% {left: 0;}
}

@keyframes ExitPositionBackward {
    0% {left: 0;}
    100% {left: 100%;}
}

@keyframes EnterPositionBackward {
    0% {left: -100%;}
    100% {left: 0;}
}
```

-----

## Methods

#### goTo(int)
Goes to the slide designed by the argument

#### next(bool), previous(bool)
what is says. If `true` is passed, will wrap to the last/first slide if a limit is reached.

#### slides(array|string)
 Sets slides. Each time this function is called, slides are added to the previous batch. If you want to edit the array, call slides() without arguments and edit the resulting array.  
If you want to empty the slides array, pass `false` as your argument.  
If you pass a string of two number like so: `01..30`, it will create the array for you.

#### resolution(int)
Sets the resolution. 1 is maximum resolution, and lower values are lower resolutions. You might want to set it dynamically if the framerate drops, using [FPSMeter](https://github.com/kaizouman/fpsmeter), for example.

#### resize()
resizes the slider to it's parent container size. You're probably better off using `autoResize` as it already uses a debounced resized event.

#### buffer(int)
The maximum number of images to keep in memory. Defaults to 3. Keep in mind that discarded images are not necessarily removed from memory; they are simply made available to the garbage collector.

#### preloadBuffer(int)
The number of images to preload. Defaults to 2. Note that preloaded images are independant from the normal buffer.

#### cover(), contain()
Sets the image sizing to `cover` or `contain` respectively. Behaviour is similar to the CSS `image-sizing` directive.

#### switchSizing()
switches between `cover` and `contain`

#### redraw()
Redraws the current image. Useful after a `resolution()` or a `resize()` change or any manipulation of the canvas (it is called automatically when `resize()` is triggered by `autoResize()`).

#### each(function|property|string)
Applies a function or a property to every slide  
You can pass either function that will be called in the context of the slide (`this` will be the slide) and will receive the slide number as an argument, e.g.
```js
each(function(i){console.log(this.src());});
```
Or with an object, which property will be applied to each slide. For example:
```js
each({_sizing='cover'});
```
Lastly, you can also call it with a string, which is a method name to call on every slide. For example:
```js
each('load');
```

-----

## Events

Event handlers always receive the event name as a first argument.

#### on(str,function), off(str,function)
where str is one of:

- `show` called when a slide is shown. The event handler receives the slide as a second argument
- `load` called when a slide is loaded; note that it does not necessarily coincide with `show`, as a slide might have been set to load, but the user navigated to another slide before the loading finished; in which case, the slide will continue to load, but another slide will be shown. The event handler receives the slide as a second argument.
- `start` called when a slide starts loading. Note that by the time the event is called, the slide has already started loading. The event handler receives the slide as a second argument.
- `resize` called when the Vaseline instance resizes.

You can use `addEventListener` and `removeEventListener` instead of `on()` and `off()` if you prefer that syntax.

#### Shortcut handlers
Each handler has a shortcut in the form of `'on'+Handler`:

- `onShow(function)`
- `onLoad(function)`
- `onStart(function)`
- `onResize(function)`

#### once(str,fn)
Works like `on()`, but will run the function only once.

## License
MIT
