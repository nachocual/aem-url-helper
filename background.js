var Mode = {
  GREEN : {value: 0, name: "green", cf: true, wcm: true},
  YELLOW : {value: 1, name: "yellow", cf: false, wcm: true},
  RED : {value: 1, name: "red", cf: false, wcm: false}
};

var AuthoringUIMode = {
  CLASSIC : "classic",
  TOUCH : "touch"
};

function checkMode(url) {
  if (url.indexOf('/cf') == -1  && url.indexOf('/editor.html') == -1 && url.indexOf('wcmmode=disabled') != -1) {
    return Mode.RED;
  } else if (url.indexOf('/cf') == -1  && url.indexOf('/editor.html') == -1 && url.indexOf('wcmmode=disabled') == -1) {
    return Mode.YELLOW;
  } else {
    return Mode.GREEN;
  }
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
      var mode = checkMode(url);
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
    }
  },
  { url: [{ pathPrefix: '/cf' }, { pathPrefix: '/content' }, { pathPrefix: '/editor.html' }] }
);

chrome.pageAction.onClicked.addListener(function(tab) {
  var tabId = tab.id;
  var url = tab.url;
  setPageActionIconToMode(tabId);
  setPageActionTitle(tabId, "Loading AEM page...");
  var mode = checkMode(url);
  if (mode == Mode.RED) {
    var key = getAuthoringUIModeKey(tabId);
    chrome.storage.local.get(key, function(items) {
      var authoringUIMode = items[key];
      if (authoringUIMode == undefined) {
        // TODO: let the user select the default
        authoringUIMode = AuthoringUIMode.CLASSIC;
      }
      var prefix = '/editor.html/content';
      if (authoringUIMode != AuthoringUIMode.TOUCH) {
        prefix = '/cf#/content';
      }
      url = url.replace('/content', prefix);
      url = url.replace(/&wcmmode=disabled|\?wcmmode=disabled/gi, '');
      chrome.tabs.update(tabId, { url: url });
    });
  } else if (mode == Mode.YELLOW) {
    if(url.indexOf('?') == -1) {
      chrome.tabs.update(tabId, {url: url + "?wcmmode=disabled"});
    } else {
      chrome.tabs.update(tabId, {url: url + "&wcmmode=disabled"});
    }
  } else if (mode == Mode.GREEN) {
    chrome.tabs.update(tabId, { url: url.replace(/\/cf#|\/editor\.html/gi, '') });
  } else {
    setPageActionTitle(tabId);
  }
});

chrome.runtime.onStartup.addListener(function() {
  chrome.storage.local.clear();
});
