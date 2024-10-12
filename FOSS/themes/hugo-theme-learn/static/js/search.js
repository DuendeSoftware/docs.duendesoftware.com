var lunrIndex, pagesIndex;

function endsWith(str, suffix) {
  return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

// Initialize lunrjs using our generated index file
function initLunr() {
  if (!endsWith(baseurl, "/")) {
    baseurl = baseurl + '/'
  };

  // First retrieve the index file
  $.getJSON(baseurl + "index.json")
    .done(function (index) {
      pagesIndex = index;
      // Set up lunrjs by declaring the fields we use
      // Also provide their boost level for the ranking
      lunrIndex = lunr(function () {
        this.ref("uri");
        this.field('title', {
          boost: 25
        });
        this.field('description', {
          boost: 20
        });
        this.field('tags', {
          boost: 10
        });
        this.field("content", {
          boost: 5
        });

        this.pipeline.remove(lunr.stemmer);
        this.searchPipeline.remove(lunr.stemmer);

        // Feed lunr with each file and let lunr actually index them
        pagesIndex.forEach(function (page) {
          this.add(page);
        }, this);
      })
    })
    .fail(function (jqxhr, textStatus, error) {
      var err = textStatus + ", " + error;
      console.error("Error getting Hugo index file:", err);
    });
}

/**
 * Trigger a search in lunr and transform the result
 *
 * @param  {String} query
 * @return {Array}  results
 */
function search(queryTerm) {
  var searchResult = lunrIndex.search(trailingWildcard(requireAll(queryTerm)));
  searchResult = searchResult.slice(0, 10);
  return searchResult.map(result =>
    pagesIndex.filter(page => page.uri === result.ref)[0]);
}

function requireAll(query) {
  return query.split(" ").filter(t => t.length > 1).map(t => "+" + t).join(" ");
}

function trailingWildcard(query) {
  return query + "*";
}

// Let's get started
initLunr();
$(document).ready(function () {
  $("#search-by")
    .autocomplete({
      source: (request, response) => {
        let results = search(request.term).map(item => {
          var numContextWords = 3;
          var context = item.content.match(
            "(?:\\s?(?:[\\w]+)\\s?){0," + numContextWords + "}" +
            request.term + "(?:\\s?(?:[\\w]+)\\s?){0," + numContextWords + "}");
          return {
            title: item.title,
            context,
            description: item.description,
            uri: item.uri
          };
        });

        response(results);
      },
      select: (event, ui) => {
        location.href = ui.item.uri
      }
    })
    .autocomplete("instance")._renderItem = function (ul, item) {
      let text = `» ${item.title}`;
      if (item.description) {
        text += ` (${item.description})`;
      }
      if (item.context) {
        text += `<div class="context">${item.context}</div>`
      }
      return $("<li>")
        .append(`<div>${text}</div>`)
        .appendTo(ul);
    };

});
