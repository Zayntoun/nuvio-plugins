/**
 * Akwam Scraper for Nuvio (Movies & TV Series)
 */
function getStreams(tmdbId, mediaType, season, episode) {
  // Force fetch Arabic translations & localized titles from TMDB
  var tmdbUrl = 'https://api.themoviedb.org/3/' + mediaType + '/' + tmdbId + '?api_key=15d2ea6d0dc1d476efbca3eba2e9bbf3&language=ar-SA&append_to_response=translations';

  return fetch(tmdbUrl)
    .then(function(res) { return res.json(); })
    .then(function(meta) {
      // Find the Arabic title from TMDB meta
      var arTitle = meta.name || meta.title;
      if (meta.translations && meta.translations.translations) {
        for (var i = 0; i < meta.translations.translations.length; i++) {
          var t = meta.translations.translations[i];
          if (t.iso_639_1 === 'ar' && t.data && (t.data.name || t.data.title)) {
            arTitle = t.data.name || t.data.title;
            break;
          }
        }
      }

      if (!arTitle) return [];

      // Clean search title (remove punctuation that breaks Akwam search)
      var searchQuery = arTitle.replace(/[^\w\s\u0600-\u06FF]/gi, ' ').trim();
      var searchUrl = 'https://akwam.ss/search?q=' + encodeURIComponent(searchQuery);

      return fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
    })
    .then(function(res) { return res.text(); })
    .then(function(html) {
      // Match movie or series entry link on Akwam
      var linkMatches = html.match(/href="(https:\/\/akwam\.ss\/(?:entry|series|movie)\/[^"]+)"/gi);
      if (!linkMatches || linkMatches.length === 0) return [];

      // Take first matching entry link
      var entryUrl = linkMatches[0].replace('href="', '').replace('"', '');
      return fetch(entryUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
    })
    .then(function(res) { return res.text(); })
    .then(function(pageHtml) {
      // If TV Show, look for specific episode link; if Movie, pageHtml is already target page
      if (mediaType === 'tv' && episode) {
        var epRegex = new RegExp('href="(https:\\\/\\\/akwam\\.ss\\\/episode\\\/[^"]*(?:' + episode + '|الموسم-' + season + ')[^"]*)"', 'i');
        var epMatch = pageHtml.match(epRegex) || pageHtml.match(/href="(https:\/\/akwam\.ss\/episode\/[^"]+)"/i);
        
        if (epMatch) {
          return fetch(epMatch[1], {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
          }).then(function(r) { return r.text(); });
        }
      }
      return pageHtml;
    })
    .then(function(finalPageHtml) {
      if (typeof finalPageHtml !== 'string') return [];

      // Extract video stream URL (.mp4 / .m3u8 or Akwam direct download link)
      var streamMatch = finalPageHtml.match(/href="(https:\/\/[^"]+\.(?:mp4|m3u8)[^"]*)"/i) ||
                          finalPageHtml.match(/src="(https:\/\/[^"]+\.(?:mp4|m3u8)[^"]*)"/i) ||
                          finalPageHtml.match(/href="(https:\/\/akwam\.ss\/download\/[^"]+)"/i);

      if (!streamMatch) return [];

      return [{
        name: "Akwam",
        title: "Akwam HD (Arabic)",
        url: streamMatch[1],
        quality: "1080p",
        headers: {
          "Referer": "https://akwam.ss/",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        }
      }];
    })
    .catch(function(err) {
      console.error("[Akwam] Scraping error:", err);
      return [];
    });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getStreams: getStreams };
}
if (typeof globalThis !== 'undefined') {
  globalThis.getStreams = getStreams;
}
if (typeof global !== 'undefined') {
  global.getStreams = getStreams;
}
