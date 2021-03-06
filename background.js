var Mode = {
  GREEN : {value: 0, name: "green", cf: true, wcm: true},
  YELLOW : {value: 1, name: "yellow", cf: false, wcm: true},
  RED : {value: 1, name: "red", cf: false, wcm: false}
};

var AuthoringUIMode = {
  CLASSIC : "classic",
  TOUCH : "touch"
};

function checkMode(url, callback) {
  if (url.indexOf('/editor.html') == -1) {
    callback(Mode.RED);
    console.log("RED");
  } else {
    chrome.cookies.get({"url": url, "name": "cq-editor-layer.page"}, function(cookie) {
      if (cookie != null) {
        if (cookie.value == "Edit") {
          callback(Mode.GREEN);
          console.log("GREEN");
        } else if (cookie.value == "Preview") {
          callback(Mode.YELLOW);
          console.log("YELLOW");
        } else {
          callback(Mode.RED);
          console.log("RED: " + cookie.value);
        }
      } else {
        chrome.cookies.get({"url": url, "name": "wcmmode"}, function(cookie) {
          if (cookie != null) {
            console.log(cookie.value);
          }
        });
      }
    });
  }
//   if (url.indexOf('/cf') == -1  && url.indexOf('/editor.html') == -1 && url.indexOf('wcmmode=disabled') != -1) {
//     return Mode.RED;
//   } else if (url.indexOf('/cf') == -1  && url.indexOf('/editor.html') == -1 && url.indexOf('wcmmode=disabled') == -1) {
//     return Mode.YELLOW;
//   } else {
//     return Mode.GREEN;
//   }
}

function getAuthoringUIModeKey(tabId) {
  return 'authoringUIMode' + tabId;
}

function setPageActionIconToMode(tabId, mode) {
  var variant = mode != undefined && mode.name != undefined ? mode.name : "none";
  var path = {19: "aem_" + variant + "_19.png", 38: "aem_" + variant + "_38.png"};
  chrome.pageAction.setIcon({path: path, tabId: tabId});
}

function setPageActionTitle(tabId, title) {
  title = title != undefined ? title :  "Unable to identify AEM page mode";
  chrome.pageAction.setTitle({title: title, tabId: tabId});
}

chrome.webNavigation.onCommitted.addListener(
  function(details) {
    if (details.frameId == 0) {
      var tabId = details.tabId;
      chrome.pageAction.setIcon({path: {19: "aem_none_19.png", 38: "aem_none_38.png"}, tabId: tabId});
      chrome.pageAction.setTitle({title: "Loading AEM page...", tabId: tabId});
      chrome.pageAction.show(tabId);
    }
  },
  { url: [{ pathPrefix: '/cf' }, { pathPrefix: '/content' }, { pathPrefix: '/editor.html' }] }
);

chrome.webNavigation.onCompleted.addListener(
  function(details) {
    if (details.frameId == 0) {
      var tabId = details.tabId;
      var url = details.url;
      setupPageAction(tabId, url);
      chrome.cookies.onChanged.addListener(function(changeInfo) {
        if (changeInfo.cause == "explicit" && changeInfo.cookie.name == "cq-editor-layer.page") {
          setupPageAction(tabId, url);
        }
      });
    }
  },
  { url: [{ pathPrefix: '/cf' }, { pathPrefix: '/content' }, { pathPrefix: '/editor.html' }] }
);

function setupPageAction(tabId, url) {
  checkMode(url, function(mode) {
    setPageActionIconToMode(tabId, mode);
    var title;
    if (mode == Mode.RED) {
      title = "AEM page (CF and WCM is disabled)";
    } else if (mode == Mode.YELLOW) {
      title = "AEM page (CF is disabled)";
    } else if (mode == Mode.GREEN) {
      title = "AEM page";
      var authoringUIMode = AuthoringUIMode.TOUCH;
      if (url.indexOf('/editor.html') == -1) {
        authoringUIMode = AuthoringUIMode.CLASSIC;
      }
      var value = {};
      value[getAuthoringUIModeKey(tabId)] = authoringUIMode;
      chrome.storage.local.set(value);
    
    }
    setPageActionTitle(tabId, title);
  });
}

chrome.pageAction.onClicked.addListener(function(tab) {
  var tabId = tab.id;
  var url =  tab.url;
  setPageActionIconToMode(tabId);
  setPageActionTitle(tabId, "Loading AEM page...");
  var mode = checkMode(url, function(mode) {
    if (mode == Mode.RED) {
      var prefix = '/editor.html/content';
      url = url.replace('/content', prefix);
      url = url.replace(/&wcmmode=disabled|\?wcmmode=disabled/gi, '');
      chrome.cookies.set({"url": url.split("editor.html")[0], "name": "cq-editor-layer.page", "value": "Edit"}, function(cookie) {
        chrome.tabs.update(tabId, { url: url });
      });
    } else if (mode == Mode.YELLOW) {
      chrome.tabs.update(tabId, { url: url.replace(/\/cf#|\/editor\.html/gi, '') + "?wcmmode=disabled" });
    } else {
      chrome.tabs.executeScript({
        code: 'document.querySelectorAll(\'[data-layer="Preview"]\')[0].click()'
      });
    }
  });
//   if (mode == Mode.RED) {
//     var key = getAuthoringUIModeKey(tabId);
//     chrome.storage.sync.get({
//       defaultAuthoringUIMode: AuthoringUIMode.CLASSIC
//     }, function(items) {
//       var defaultAuthoringUIMode = items.defaultAuthoringUIMode;
//       chrome.storage.local.get(key, function(items) {
//         var authoringUIMode = items[key];
//         if (authoringUIMode == undefined) {
//           authoringUIMode = defaultAuthoringUIMode;
//         }
//         var prefix = '/editor.html/content';
//         if (authoringUIMode != AuthoringUIMode.TOUCH) {
//           prefix = '/cf#/content';
//         }
//         url = url.replace('/content', prefix);
//         url = url.replace(/&wcmmode=disabled|\?wcmmode=disabled/gi, '');
//         chrome.tabs.update(tabId, { url: url });
//       });
//     });
//   } else if (mode == Mode.YELLOW) {
//     if(url.indexOf('?') == -1) {
//       if(url.indexOf('#') == -1) {
//         chrome.tabs.update(tabId, {url: url + "?wcmmode=disabled"});
//       } else {
//         var urlSplit = url.split("#");
//         chrome.tabs.update(tabId, {url: urlSplit[0] + "?wcmmode=disabled#" + urlSplit[1]});
//       }
//     } else {
//       chrome.tabs.update(tabId, {url: url + "&wcmmode=disabled"});
//     }
//   } else if (mode == Mode.GREEN) {
// //     chrome.tabs.update(tabId, { url: url.replace(/\/cf#|\/editor\.html/gi, '') });
//     // Granite.author.layerManager.loadLayer("Preview")
//     // document.querySelectorAll('[data-layer="Edit"]')[0].click()
//     chrome.tabs.executeScript({
//       code: 'document.querySelectorAll(\'[data-layer="Edit"]\')[0].click()'
//     });
//   } else {
//     setPageActionTitle(tabId);
//   }
});

chrome.runtime.onStartup.addListener(function() {
  chrome.storage.local.clear();
});
