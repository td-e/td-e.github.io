var PLUG_RUSH_HTML = '<div class="pr-widget" data-h="250" data-res="true" data-w="300" id="pr-ked2"></div>';
var PLUG_RUSH_INTERVAL = 2;

// Add spaces so that the intro takes the whole screen
var INTRO_SPACES = '\n';
(function() { for (var i = 0; i < 400; i++) INTRO_SPACES += ' '; })();

var escapeHtml = function(text) {
  return $('<div/>').text(text).html();
};

var makeIntro = function(title, intro) {
  return escapeHtml(title) + '\n\n' + intro + INTRO_SPACES;
};

var showIntro = function(intro) {
  $('#popup-intro-content').text(intro);
  $('#popup-intro').show();
  $('#popup-intro').scrollTop(0);
};

//------------------------------------------------------------------------------

var $dlgStack = [];

// Using $dlgStack.length may cause problem of multiple dlgs having same z-index
var $dlgShowCount = 0;

var showDlg = function(dlgId) {
  $('#popup-intro').hide();

  $dlgShowCount++;

  var dlg = $('#' + dlgId);
  dlg.css('z-index', 1000 + $dlgShowCount);
  dlg.show();

  // Prevent images on the top level to be scrolled (even when they are below the dialog!)
  if ($dlgStack.length == 0) $('body').css('overflow', 'hidden');

  // Remove existing one in the stack
  for (var i = 0; i < $dlgStack.length; i++) {
    var d = $dlgStack[i];
    if (d.attr('id') == dlgId) {
      $dlgStack.splice(i, 1);
      break;
    }
  }

  $dlgStack.push(dlg);
};

var hideTopDlg = function() {
  var dlg = $dlgStack.pop();
  dlg.hide();

  // See showDlg
  if ($dlgStack.length == 0) $('body').css('overflow', 'auto');
};

var toggleDlg = function(dlgId) {
  if ($dlgStack.length == 0) {
    showDlg(dlgId);
    return true;
  }

  var topDlg = $dlgStack[$dlgStack.length - 1];
  if (topDlg.attr('id') == dlgId) {
    hideTopDlg();
    return false;
  } else {
    showDlg(dlgId);
    return true;
  }
};

$(function() {
  $('.dlg').width($.windowWidth());
  $('.dlg').height($.windowHeight());
  $(window).resize(function() {
    $('.dlg').width($.windowWidth());
    $('.dlg').height($.windowHeight());
  });

  $('.dlg-close').click(function() {
    hideTopDlg();
  });
});

//------------------------------------------------------------------------------

var loadGirlAreaSums = function(map) {
  $.ajax({
    'url': 'data/callgirl/sum.json',
    'dataType': 'json',
    'success': function(girlAreaSums) {
      var total = 0;
      for (var i = 0; i < girlAreaSums.length; i++) {
        var girlAreaSum = girlAreaSums[i];
        if (girlAreaSum.girlSum > 0) {
          loadGirlAreaSum(map, girlAreaSum);
          total += girlAreaSum.girlSum;
        }
      }
      $('#dlg-map .dlg-title').text('' + total + ' call girls in Vietnam');
    }
  });
};

var loadGirlAreaSum = function(map, girlAreaSum) {
  var marker = new google.maps.Marker({
    map: map,
    position: {lat: girlAreaSum.lat, lng: girlAreaSum.lon},
    icon: 'http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=' + girlAreaSum.girlSum + '|FF0000|000000'
  });

  google.maps.event.addListener(marker, 'click', function() {
    loadGirlArea(girlAreaSum.name, girlAreaSum.girlSum);
  });
};

//------------------------------------------------------------------------------

var loadGirlArea = function(areaName, girlSum) {
  var fileName = 'data/callgirl/' + areaName.replace(/\s/g, '').replace(/\//g, '-') + '.json';
  $.ajax({
    'url': fileName,
    'dataType': 'json',
    'success': function(girlArea) {
      showDlg('dlg-girl-area');
      $('#dlg-girl-area .dlg-title').text(areaName + ': ' + girlSum + ' call girls');
      girlAreaHtml($('#dlg-girl-area-body'), girlArea);
    }
  });
};

var $girls;

var girlAreaHtml = function(parent, girlArea) {
  $girls = girlArea.girls;

  parent.html('');

  for (var i = 0; i < $girls.length; i++) {
    var girl  = $girls[i];
    var title = girl.thread.title;
    var intro = makeIntro(title, girl.thread.intro);

    var girlElem = $('<div />');
    parent.append(girlElem);

    girlElem.data('intro', intro);
    girlElem.on('click', function(event) {
      var girlElem = $(event.currentTarget);
      var intro    = girlElem.data('intro');
      showIntro(intro);
    });

    var girlHtml =
      '<p><strong>VND ' + girl.price + '</strong>/shot <a href="tel:' + girl.phone + '">' + girl.phone + '</a><br />' +
      '<span class="avoid-menu">' + escapeHtml(title) + '</span>' +
      '<img src="' + girl.thread.imgUrls[0] + '" />' +
      '<a href="javascript:showGirl(' + i + ')">' +
        '<span class="num-imgs">'+ girl.thread.imgUrls.length + ' images &raquo;</span>' +
      '</a></p>';

    girlElem.html(girlHtml);

    if ((i + 1) % (PLUG_RUSH_INTERVAL + 1) == 0) girlElem.append(PLUG_RUSH_HTML);
  }
};

//------------------------------------------------------------------------------

var showGirl = function(idx) {
  showDlg('dlg-girl');

  var girl  = $girls[idx];
  var title = girl.thread.title;
  var intro = makeIntro(title, girl.thread.intro);

  $('#dlg-girl .dlg-title').html(girlPricePhoneHtml(girl));
  $('#dlg-girl-title').text(title);
  $('#dlg-girl-intro-content').text(girl.thread.intro);
  $('#dlg-girl-body').html(girlBodyHtml(girl));

  $('#dlg-girl-body').data('intro', intro);
  $('#dlg-girl-body').on('click', function(event) {
    var body  = $(event.currentTarget);
    var intro = body.data('intro');
    showIntro(intro);
  });
};

var girlPricePhoneHtml = function(girl) {
  return '<strong>VND ' + girl.price + '</strong>/shot ' +
    '<a href="tel:' + girl.phone + '">' + girl.phone + '</a> ' +
    '(' + girl.thread.imgUrls.length + ' images)';
};

var girlBodyHtml = function(girl) {
  var ret = '';
  for (var i = 0; i < girl.thread.imgUrls.length; i++) {
    var imgUrl = girl.thread.imgUrls[i];
    ret += '<img src="' + imgUrl + '" />';
  }
  ret += PLUG_RUSH_HTML;
  return ret;
}

//------------------------------------------------------------------------------

var $nextSegment = LATEST_SEGMENT;
var $imgCount = 0;

var loadLazyImgs = function() {
  $.ajax({
    'url': 'data/photo/segment/' + $nextSegment + '.json',
    'dataType': 'json',

    'success': function(threads) {
      for (var i = 0; i < threads.length; i++) {
        var thread  = threads[i];
        var title   = thread.title;
        var intro   = makeIntro(title, thread.intro);
        var imgUrls = thread.imgUrls;

        var threadElem = $('<div />');
        $('#threads').append(threadElem);

        threadElem.data('intro', intro);
        threadElem.on('click', function(event) {
          var threadElem = $(event.currentTarget);
          var intro      = threadElem.data('intro');
          showIntro(intro);
        });

        threadElem.append('<h4 class="avoid-menu">' + escapeHtml(title) + '<br />(' + imgUrls.length + ' images)</h4>');

        for (var j = 0; j < imgUrls.length; j++) {
          $imgCount++;

          var src = imgUrls[j];
          var img = $('<img />');
          var id = 'img' + $imgCount;
          img.attr('id', id);
          img.data('src', src);

          // Force display of some initial images
          if ($imgCount < 10) img.attr('src', src);

          threadElem.append(img);

          img.on('appear', function(event) {
            var img = $(event.target);
            if (img.attr('src')) return;

            var src = img.data('src');
            img.attr('src', src);
          });
          img.appear();
        }

        if ((i + 1) % PLUG_RUSH_INTERVAL == 0) threadElem.append(PLUG_RUSH_HTML);
      }
    },

    'complete': function() {
      // Do this only once
      if ($nextSegment == LATEST_SEGMENT) {
        setTimeout(function() {
          $('#load-next-segment-on-appear').on('appear', function(event) {
            loadLazyImgs();
          });

          $('#load-next-segment-on-appear').appear();
        }, 5000);
      }

      $nextSegment--;
    }
  });
};

$(loadLazyImgs);

//------------------------------------------------------------------------------

var initMap = function() {
  var map = new google.maps.Map($('#map')[0], {
    center: {lat: 16.004293, lng: 105.507807},
    scrollwheel: false,
    zoom: 5
  });
  loadGirlAreaSums(map);

  // http://stackoverflow.com/questions/743214/how-do-i-resize-a-google-map-with-javascript-after-it-has-loaded
  $(window).resize(function() {
    google.maps.event.trigger(map, 'resize');
  });
  google.maps.event.addListener(map, 'idle', function(){
     google.maps.event.trigger(map, 'resize');
  });
};

$(function() {
  $('#map').width($.windowWidth());
  $(window).resize(function() {
    $('#map').width($.windowWidth());
    $('#map').height($.windowHeight() - $('#dlg-map .dlg-title-bar').height());
  });

  var initMapWasRun = false;
  $('#menu-map').click(function() {
    if (!toggleDlg('dlg-map')) return;

    $('#map').height($.windowHeight() - $('#dlg-map .dlg-title-bar').height());

    if (!initMapWasRun) {
      initMapWasRun = true;
      initMap();
    } else {
      google.maps.event.trigger(map, 'resize');
    }
  });
});

//------------------------------------------------------------------------------

// Returns [navContainerSelector, navItemSelector]; null if dlg-map is on top
var findCurrentNav = function() {
  if ($dlgStack.length == 0) {
    return ['body', '#threads h4'];
  }

  var dlg = $dlgStack[$dlgStack.length - 1];
  var id  = dlg.attr('id');
  if (id == 'dlg-map') return null;

  if (id == 'dlg-girl-area') {
    return ['#dlg-girl-area', '#dlg-girl-area-body > div'];
  }

  if (id == 'dlg-girl') {
    return ['#dlg-girl', '#dlg-girl-body img'];
  }

  return undefined;
};

// Find currently displayed item idx
var findCurrentNavItemIdx = function(navContainerSelector, navItemSelector) {
  var items = $(navItemSelector);
  if (items.length < 2) return -1;

  var top = $(navContainerSelector).scrollTop() + $(items[0]).offset().top;

  // TODO: Use binary search
  for (var i = 0; i < items.length - 1; i++) {
    if ($(items[i]).offset().top <= top && top < $(items[i + 1]).offset().top) {
      return i;
    }
  }

  return -1;
};

$(function() {
  $('#menu-up').click(function() {
    var navs = findCurrentNav();
    if (navs == null) return;

    var navContainerSelector = navs[0];
    var navItemSelector      = navs[1];

    var currentIdx = findCurrentNavItemIdx(navContainerSelector, navItemSelector);
    var items      = $(navItemSelector);

    if (currentIdx == -1 || items[currentIdx - 1] == null) {
      $(navContainerSelector).scrollTop(0);
    } else {
      var prevItem = $(items[currentIdx - 1]);
      var top      = navContainerSelector == 'body' ? prevItem.offset().top : prevItem.offset().top - prevItem.parent().offset().top;
      $(navContainerSelector).scrollTop(top);
    }
  });

  $('#menu-down').click(function() {
    var navs = findCurrentNav();
    if (navs == null) return;

    var navContainerSelector = navs[0];
    var navItemSelector      = navs[1];

    var currentIdx = findCurrentNavItemIdx(navContainerSelector, navItemSelector);
    var items      = $(navItemSelector);

    if (currentIdx == -1 || items[currentIdx + 1] == null) {
      $(navContainerSelector).scrollTop($(navContainerSelector).height());
    } else {
      var nextItem = $(items[currentIdx + 1]);
      var top      = navContainerSelector == 'body' ? nextItem.offset().top : nextItem.offset().top - nextItem.parent().offset().top;
      $(navContainerSelector).scrollTop(top);
    }
  });

  var SPEED_FACTOR  = 1;

  var fapSpeed      = 0;
  var fapTimer      = null;
  var lastScrollTop = 0;

  var stopScroll = function() {
    clearTimeout(fapTimer);
    fapTimer = null;
    fapSpeed = 0;
  };

  $('#menu-fap').click(function() {
    if (fapTimer == null) {
      lastScrollTop = 0;
      fapSpeed = 1;
      fapTimer = setInterval(function () {
        if ($('#popup-intro').is(':visible')) return;

        var navs = findCurrentNav();
        if (!navs) return;

        var navContainerSelector = navs[0];
        var scroller             = $(navContainerSelector);

        // Stop if the user scrolled up
        scrollTop = $(scroller).scrollTop();
        if (scrollTop + 5 < lastScrollTop) {
          stopScroll();
          return;
        }

        var screenSizeFactor = $(window).width() / 350.0;
        var distance         = fapSpeed * SPEED_FACTOR * screenSizeFactor;
        if (distance < 1) distance = 1;

        scrollTop += distance;
        lastScrollTop = scrollTop;
        $(scroller).scrollTop(scrollTop);
      }, 20);
    } else {
      if (fapSpeed == 4) {
        stopScroll();
      } else {
        fapSpeed++;
      }
    }
  });

  $('#menu-help').click(function() {
    toggleDlg('dlg-help');
  });

  $('#popup-intro').click(function() {
    $('#popup-intro').hide();
  });
});
