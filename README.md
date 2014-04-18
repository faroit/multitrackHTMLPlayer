## how to use

in the index.html, replace all the blocks by the ones you want
  
``` html
<div class='audio-container'  name='Example with existing sources'>
  <audio name="fisrt source" url="./data/sample.ogg"></audio>
  <audio name="second source" url="./data/sample.ogg"></audio>
  <audio name="third source" url="./data/sample.ogg"></audio>
</div>
```   

* each block must have the class `audio-container` and a `name` attribute like shown above.
* audio track must have a `name` attribute and an `url` attribute (not src !) 
* all the audio tracks must be in the same domain than your webpage.
* If you want not to preload audio files, add the preload="none" to you audio-container div, exemple : 

``` html
<div class='audio-container'  name='Example with existing sources' preload="none">
  <audio name="fisrt source" url="./data/sample.ogg"></audio>
  <audio name="second source" url="./data/sample.ogg"></audio>
  <audio name="third source" url="./data/sample.ogg"></audio>
</div>
``` 

If you do not want to mix the tracks there is nomute switch which allows you to only hear one track at a time (basically soloing each track)

``` html
<div class='audio-container nomute'  name='Example with existing sources'>
  <audio name="fisrt source" url="./data/sample.ogg"></audio>
  <audio name="second source" url="./data/sample.ogg"></audio>
  <audio name="third source" url="./data/sample.ogg"></audio>
</div>
``` 

And that's all. This seems more stable Under Firefox and Google Chrome. Safari has some problems when playback many tracks as there seems to be a delay for each track. However this is not a problem when you don't want to playback any files simultanously but just soloing each of the tracks one by one (*nomute* class).

## credits
this player has been designed by Bastien Liutkus 
www.binarymind.org and released under the terms of
the BSD license. don't hesitate to contact if you find any issue. 

please acknowledge when using it.

Nomute modification by Fabian-Robert Stöter