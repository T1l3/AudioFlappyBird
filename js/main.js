/**
 * Audio Flappy Bird
 * by Thibault PIERRE - @T1l3 - http://thibaultpierre.com
 *
 * My post about getUserMedia and web Audio API http://tech.lanetscouade.com/ (soon published) (fr)
 */

$(document).ready(function() {
  navigator.getUserMedia  = navigator.getUserMedia ||
                            navigator.webkitGetUserMedia ||
                            navigator.mozGetUserMedia ||
                            navigator.msGetUserMedia;

  window.AudioContext   = window.AudioContext || window.webkitAudioContext;
  var audioContext      = new AudioContext();
  var audioStreamSource = null;
  var $container        = $('.container');
  var $bird             = $('.bird');
  var $score            = $('.score');
  var containerHeight   = $container.height();
  var birdHeight        = $bird.height();
  var maxAngle          = 45;
  var startTime         = 0;
  var currentTime       = 0;
  var isGameOver        = false;
  var fps               = 20;
  var browserRotations  = ['-webkit-transform', '-moz-transform', '-o-transform', 'transform'];

  var audioInit = function() {
    var analyserNode;
    var gainNode;
    var frequencyData;

    // Ask for microphone
    if (navigator.getUserMedia) {
      navigator.getUserMedia({
        audio: true
      },
      gotAudioStream,
      function() {
        alert('You need to accept the microphone to make Flappy fly')
      });
    } else {
      alert('getUserMedia() is not supported in your browser');
    }
  };

  var gameInit = function() {
    $container.addClass('playing');
    $('.gameover').hide();
    isGameOver = false;
    time = 0;
    startTime = new Date().getTime();
  }

  // success callback when requesting audio input stream
  var gotAudioStream = function(stream) {
    gameInit();

    analyserNode = audioContext.createAnalyser();
    analyserNode.fftSize = 2048;

    // Create an AudioNode from the stream.
    audioStreamSource = audioContext.createMediaStreamSource(stream);
    audioStreamSource.connect(analyserNode);

    // Connect it to the destination to hear yourself (or any other node for processing!)
    //analyserNode.connect(audioContext.destination);
    frequencyData = new Uint8Array(analyserNode.frequencyBinCount);

    updateAudio();
  };

  var collision = function($collider, $obstacles) {
    $obstacles.each(function() {
      var x1 = $collider.offset().left;
      var y1 = $collider.offset().top;
      var h1 = $collider.outerHeight(true);
      var w1 = $collider.outerWidth(true);
      var b1 = y1 + h1;
      var r1 = x1 + w1;
      var x2 = $(this).offset().left;
      var y2 = $(this).offset().top;
      var h2 = $(this).outerHeight(true);
      var w2 = $(this).outerWidth(true);
      var b2 = y2 + h2;
      var r2 = x2 + w2;
      if (!(b1 < y2 || y1 > b2 || r1 < x2 || x1 > r2)) {
        gameOver();
        return true;
      }
    });
    return false;
  }

  var startGame = function() {
    audioInit();
  }

  var gameOver = function() {
    isGameOver = true;
    $container.removeClass('playing');
    $('.gameover').show();
  }


  var updateAudio = function() {
    if(!isGameOver) {
      // An ugly timeout to lowest the fps and compensate with css transitions
      setTimeout(function() {
        // Schedule the next update
        requestAnimationFrame(updateAudio);

        // Get the new frequency data
        analyserNode.getByteFrequencyData(frequencyData);

        var average              = 0;
        var frequencyLength      = frequencyData.length;
        var frequencyActiveCount = 0;

        for (var i = 0; i < frequencyLength; i++) {
          var value = frequencyData[i] / 256;

          // Only save count value != 0 to have a decent average for bad microphones
          if (frequencyData[i] != 0) {
            frequencyActiveCount++;
            average += value;
          }
        }

        average = average / frequencyActiveCount;

        // Make Flappy flyyyyy !
        var birdPosition = average * containerHeight;
        $bird.css('bottom', birdPosition + 'px');

        // Add rotation depending on his altitude
        var angle = 0;
        if(birdPosition != 0) {
          angle = (birdPosition - containerHeight/2 + birdHeight/2) * maxAngle / (containerHeight/2);
        }

        $.each(browserRotations, function(index, value) {
          $bird.css(value, 'rotate(' + angle + 'deg)');
        });

        // Calculate the score
        var endTime = new Date().getTime();
        var currentTime = endTime - startTime;
        $score.text(currentTime);

        // Game Over if collision
        collision($bird, $('.pipe'));

      }, 1000 / fps);
    }
  }

  $('.start').on('click', startGame);
});

