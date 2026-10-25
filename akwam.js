/**
 * Akwam Scraper for Nuvio
 */
function getStreams(tmdbId, mediaType, season, episode) {
  var tmdbUrl = 'https://api.themoviedb.org/3/' + mediaType + '/' + tmdbId + '?api_key=15d2ea6d0dc1d476efbca3eba2e9bbf3&language=ar';

  return fetch(tmdbUrl)
    .then(function(res) { return res.json(); })
    .then(function(meta) {
      var title = meta.title || meta.name || meta.original_title;
      if (!title) return [];

      var searchUrl = 'https://akwam.ss/search?q=' + encodeURIComponent(title);
      return fetch(searchUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });
    })
    .then(function(res) { return res.text(); })
    .then(function(html) {
      var linkMatch = html.match(/href="(https:\/\/akwam\.ss\/(?:movie|entry)\/[^"]+)"/i);
      if (!linkMatch) return [];

      return fetch(linkMatch[1], {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });
    })
    .then(function(res) { return res.text(); })
    .then(function(pageHtml) {
      var streamMatch = pageHtml.match(/href="(https:\/\/[^"]+\.(?:mp4|m3u8)[^"]*)"/i) ||
                          pageHtml.match(/src="(https:\/\/[^"]+\.(?:mp4|m3u8)[^"]*)"/i);
      
      if (!streamMatch) return [];

      return [{
        name: "Akwam",
        title: "Akwam HD",
        url: streamMatch[1],
        quality: "1080p",
        headers: { "Referer": "https://akwam.ss/" }
      }];
    })
    .catch(function(err) {
      console.error("[Akwam] Error:", err);
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
