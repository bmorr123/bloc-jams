// Function to set values of currentlyPlayingSongNumber, currentSongFromAlbum, currentSoundFile, and currentVolume
var setSong = function(songNumber) {
    if(currentSoundFile) {
        currentSoundFile.stop();
    }

    currentlyPlayingSongNumber = parseInt(songNumber);
    currentSongFromAlbum = currentAlbum.songs[songNumber - 1];

    currentSoundFile = new buzz.sound(currentSongFromAlbum.audioUrl, {
        formats: ['mp3'],
        preload: true
    });

    setVolume(currentVolume);
};

// Function to set the current time of the playing song in the seek bar
var setCurrentTimeInPlayerBar = function(currentTime) {
    $('.currently-playing .current-time').text(currentTime);
};

// Function to set the total time of the playing song in the seek bar
var setTotalTimeInPlayerBar = function(totalTime) {
    $('.currently-playing .total-time').text(totalTime);
};

// Function to be able to seek to specific parts of a song
var seek = function(time) {
    if(currentSoundFile) {
        currentSoundFile.setTime(time);
    }
}

// Function to set the currentVolume variable
var setVolume = function(volume) {
    if(currentSoundFile) {
        currentSoundFile.setVolume(volume);
    }
};

// Function to set inital volume in the seek bar
var setInitialVolume = function() {
    var $volumeFill = $('.volume .fill');
    var $volumeThumb = $('.volume .thumb');
    $volumeFill.width(currentVolume + '%');
    $volumeThumb.css({left: currentVolume + '%'});
};

// Function to stop the song when it reaches end
var stopSong = function() {
    currentSoundFile.stop();

    // change pause buttons to play buttons
    var $songNumberCell = getSongNumberCell(currentlyPlayingSongNumber);
    $songNumberCell.html(playButtonTemplate);
    $('.main-controls .play-pause').html(playerBarPlayButton);
}

// Function to return the song number element for a given song number
var getSongNumberCell = function(number) {
    return $('.song-item-number[data-song-number="' + number + '"]');
};

// Function to create an album song row
var createSongRow = function(songNumber, songName, songLength) {
    var template =
        '<tr class="album-view-song-item">'
    +   '   <td class="song-item-number" data-song-number="' + songNumber + '">' + songNumber + '</td>'
    +   '   <td class="song-item-title">' + songName + '</td>'
    +   '   <td class="song-item-duration">' + filterTimeCode(songLength) + '</td>'
    +   '</tr>';

    var $row = $(template);

    var clickHandler = function() {
        var $songNumber = parseInt($(this).attr('data-song-number'));

        if(currentlyPlayingSongNumber !== null) {
            // Revert to song number for currently playing song because user started playing new song
            var $currentlyPlayingCell = getSongNumberCell(currentlyPlayingSongNumber);
            $currentlyPlayingCell.html(currentlyPlayingSongNumber);
        }
        if(currentlyPlayingSongNumber !== $songNumber) {
            // Change this songNumber from a play to a pause button since it wasn't playing, and play the song
            setSong($songNumber);
            currentSoundFile.play();
            updateSeekBarWhileSongPlays();

            // Set initial volume in seek bar
            setInitialVolume();

            $(this).html(pauseButtonTemplate);
            updatePlayerBarSong();
        } else if(currentlyPlayingSongNumber === $songNumber) {
            if(currentSoundFile.isPaused()) {
                // Continue playing the song that is paused
                $(this).html(pauseButtonTemplate);
                $('.main-controls .play-pause').html(playerBarPauseButton);
                currentSoundFile.play();
                updateSeekBarWhileSongPlays();
            } else {
                // Pause the current song because it is already playing
                $(this).html(playButtonTemplate);
                $('.main-controls .play-pause').html(playerBarPlayButton);
                currentSoundFile.pause();
            }
        }
    };

    // Functions for mouseover and mouseleave events
    var onHover = function(event) {
        var $songNumberCell = $(this).find('.song-item-number');
        var $songNumber = parseInt($songNumberCell.attr('data-song-number'));

        if($songNumber !== currentlyPlayingSongNumber) {
            $songNumberCell.html(playButtonTemplate);
        }
    };

    var offHover = function(event) {
        var $songNumberCell = $(this).find('.song-item-number');
        var $songNumber = parseInt($songNumberCell.attr('data-song-number'));

        if($songNumber !== currentlyPlayingSongNumber) {
            $songNumberCell.html($songNumber);
        }
    };

    $row.find('.song-item-number').click(clickHandler);
    $row.hover(onHover, offHover);
    // Returning this variable that now has event listeners attached to it
    return $row;
};

// Function to add current album to html
var setCurrentAlbum = function(album) {
    currentAlbum = album;

    var $albumTitle = $('.album-view-title');
    var $albumArtist = $('.album-view-artist');
    var $albumReleaseInfo = $('.album-view-release-info');
    var $albumImage = $('.album-cover-art');
    var $albumSongList = $('.album-view-song-list');

    $albumTitle.text(album.title);
    $albumArtist.text(album.artist);
    $albumReleaseInfo.text(album.year + ' ' + album.label);
    $albumImage.attr('src', album.albumArtUrl);

    $albumSongList.empty();

    for(var i = 0; i < album.songs.length; i++) {
        var $newRow = createSongRow(i + 1, album.songs[i].title, album.songs[i].duration);
        $albumSongList.append($newRow);
    }
};

// Function to convert the seconds of a number to min:sec form
var filterTimeCode = function(timeInSeconds) {
    var secondsAsNumber = parseFloat(timeInSeconds);
    var wholeSeconds = Math.floor(secondsAsNumber);
    var wholeMinutes = Math.floor(wholeSeconds / 60);

    var remainingSeconds = wholeSeconds - (wholeMinutes * 60);

    if(remainingSeconds < 10) {
        return wholeMinutes + ":0" + remainingSeconds;
    } else {
        return wholeMinutes + ":" + remainingSeconds;
    }
};

// Function to update the seek bar when a song plays
var updateSeekBarWhileSongPlays = function() {
    if(currentSoundFile) {
        currentSoundFile.bind('timeupdate', function(event) {
            // Check to see if song has reached end; stop if so
            if(this.getTime() === this.getDuration()) {
                stopSong();
            }
            var seekBarFillRatio = this.getTime() / this.getDuration();
            var $seekBar = $('.seek-control .seek-bar');

            updateSeekPercentage($seekBar, seekBarFillRatio);
            setCurrentTimeInPlayerBar(filterTimeCode(this.getTime()));
        });
    }
};

// Function to change the progress of the seek bar(s) via percentages
var updateSeekPercentage = function($seekBar, seekBarFillRatio) {
    // Multiply by 100 to determine percentage
    var offsetXPercent = seekBarFillRatio * 100;

    offsetXPercent = Math.max(0, offsetXPercent);
    offsetXPercent = Math.min(100, offsetXPercent);

    var percentageString = offsetXPercent + '%';
    $seekBar.find('.fill').width(percentageString);
    $seekBar.find('.thumb').css({left: percentageString});
};

// Function to determine the fill width and thumb location
var setupSeekBars = function() {
    // Have page load with 50% volume in volume seek bar
    $('.volume .fill').css('width', '50%');
    $('.volume .thumb').css('left', '50%')

    // Returns an array of seek bars
    var $seekBars = $('.player-bar .seek-bar');

    $seekBars.click(function(event) {
        // Finding the distance between where the mouse clicked on the seek bar, and the beginning of the seek bar
        var offsetX = event.pageX - $(this).offset().left;
        var $barWidth = $(this).width();

        var seekBarFillRatio = offsetX / $barWidth;

        if($(this).parent().attr('class') == 'seek-control') {
            seek(seekBarFillRatio * currentSoundFile.getDuration());
        } else {
            setVolume(seekBarFillRatio * 100);
        }

        updateSeekPercentage($(this), seekBarFillRatio);
    });

    // Adding click and drag functionality by finding the thumb seek bar in the seekBars array
    $seekBars.find('.thumb').mousedown(function(event) {
        var $seekBar = $(this).parent();

        $(document).bind('mousemove.thumb', function(event) {
            var offsetX = event.pageX - $seekBar.offset().left;
            var $barWidth = $seekBar.width();

            var seekBarFillRatio = offsetX / $barWidth;

            if($seekBar.parent().attr('class') == 'seek-control') {
                seek(seekBarFillRatio * currentSoundFile.getDuration());
            } else {
                setVolume(seekBarFillRatio * 100);
            }

            updateSeekPercentage($seekBar, seekBarFillRatio);
        });

        $(document).bind('mouseup.thumb', function() {
            $(document).unbind('mousemove.thumb');
            $(document).unbind('mouseup.thumb');
        });
    });
};

// Function to find/return the index of a song, given a song and its album
var trackIndex = function(album, song) {
    return album.songs.indexOf(song);
};

// Function to update the player bar with the currently playing song, and change the play/pause button
var updatePlayerBarSong = function() {
    $('.currently-playing .song-name').text(currentSongFromAlbum.title);
    $('.currently-playing .artist-song-mobile').text(currentSongFromAlbum.title + " - " + currentAlbum.artist);
    $('.currently-playing .artist-name').text(currentAlbum.artist);

    setTotalTimeInPlayerBar(filterTimeCode(currentSongFromAlbum.duration));

    $('.main-controls .play-pause').html(playerBarPauseButton);
};

// Functions to control the song change functionality when the next and prev buttons are pressed
var nextSong = function() {
    var currentSongIndex = trackIndex(currentAlbum, currentSongFromAlbum);
    currentSongIndex++;

    if(currentSongIndex >= currentAlbum.songs.length) {
        currentSongIndex = 0;
    }

    // Save last song number before changing it
    var lastSongNumber = currentlyPlayingSongNumber;

    // Set and play new current song
    setSong(currentSongIndex + 1);
    currentSoundFile.play();
    updateSeekBarWhileSongPlays();

    // Set initial volume in seek bar
    setInitialVolume();

    // Update player bar info
    updatePlayerBarSong();

    getSongNumberCell(lastSongNumber).html(lastSongNumber);
    getSongNumberCell(currentlyPlayingSongNumber).html(pauseButtonTemplate);
};

var previousSong = function() {
    var currentSongIndex = trackIndex(currentAlbum, currentSongFromAlbum);
    // Only change to prev song if current song hasn't played for 5 seconds or longer
    if(currentSoundFile.getTime() <= 5) {
        currentSongIndex--;
    }

    if(currentSongIndex < 0) {
        currentSongIndex = currentAlbum.songs.length - 1;
    }

    // Save last song number before changing it
    var lastSongNumber = currentlyPlayingSongNumber;

    // Set and play new current song
    setSong(currentSongIndex + 1);
    currentSoundFile.play();
    updateSeekBarWhileSongPlays();

    // Set initial volume in seek bar
    setInitialVolume();

    // Update player bar info
    updatePlayerBarSong();

    getSongNumberCell(lastSongNumber).html(lastSongNumber);
    getSongNumberCell(currentlyPlayingSongNumber).html(pauseButtonTemplate);
};

// Function to play/pause a song from the player bar
var togglePlayFromPlayerBar = function() {
    if(!currentSoundFile) {
        // Set and play first song of album because no song is currently playing
        setSong(1);
        currentSoundFile.play();
        updateSeekBarWhileSongPlays();

        // Set initial volume in seek bar
        setInitialVolume();

        updatePlayerBarSong();
        getSongNumberCell(currentlyPlayingSongNumber).html(pauseButtonTemplate);
    } else if(currentSoundFile.isPaused()) {
        getSongNumberCell(currentlyPlayingSongNumber).html(pauseButtonTemplate);
        $(this).html(playerBarPauseButton);
        currentSoundFile.play();
    } else if(currentSoundFile) {
        getSongNumberCell(currentlyPlayingSongNumber).html(playButtonTemplate);
        $(this).html(playerBarPlayButton);
        currentSoundFile.pause();
    }
};

// Album button templates
var playButtonTemplate = '<a class="album-song-button"><span class="ion-play"></span></a>';
var pauseButtonTemplate = '<a class="album-song-button"><span class="ion-pause"></span></a>';
var playerBarPlayButton = '<span class="ion-play"></span>';
var playerBarPauseButton = '<span class="ion-pause"></span>';

// Store state of playing songs and its album
var currentAlbum = null;
var currentlyPlayingSongNumber = null;
var currentSongFromAlbum = null;
var currentSoundFile = null;
var currentVolume = 80;

// Variables to add event handlers to next and prev buttons
var $previousButton = $('.main-controls .previous');
var $nextButton = $('.main-controls .next');
var $playPauseButton = $('.main-controls .play-pause');

$(document).ready(function() {
    setCurrentAlbum(albumPicasso);
    setupSeekBars();
    $previousButton.click(previousSong);
    $nextButton.click(nextSong);
    $playPauseButton.click(togglePlayFromPlayerBar);
});
