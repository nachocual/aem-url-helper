chrome.webNavigation.onCommitted.addListener(
  function(details) {
    if (details.frameId == 0) {
      chrome.pageAction.setIcon({path: {19: "aem_none_19.png", 38: "aem_none_38.png"}, tabId: details.tabId});
      chrome.pageAction.setTitle({title: "Loading AEM page...", tabId: details.tabId});
      chrome.pageAction.show(details.tabId);
    }
  },
  { url: [{ pathPrefix: '/cf' }, { pathPrefix: '/content' }] }
);

chrome.webNavigation.onCompleted.addListener(
  function(details) {
    if (details.frameId == 0) {
      if (details.url.indexOf('/cf') == -1 && details.url.indexOf('wcmmode=disabled') != -1) {
        chrome.pageAction.setIcon({path: {19: "aem_red_19.png", 38: "aem_red_38.png"}, tabId: details.tabId});
        chrome.pageAction.setTitle({title: "AEM page (WCM is disabled)", tabId: details.tabId});
      } else if (details.url.indexOf('/cf') == -1  && details.url.indexOf('wcmmode=disabled') == -1) {
        chrome.pageAction.setIcon({path: {19: "aem_yellow_19.png", 38: "aem_yellow_38.png"}, tabId: details.tabId});
        chrome.pageAction.setTitle({title: "AEM page (CF is disabled)", tabId: details.tabId});
      } else {
        chrome.pageAction.setIcon({path: {19: "aem_green_19.png", 38: "aem_green_38.png"}, tabId: details.tabId});
        chrome.pageAction.setTitle({title: "AEM page", tabId: details.tabId});
      }
    }
  },
  { url: [{ pathPrefix: '/cf' }, { pathPrefix: '/content' }] }
);

chrome.pageAction.onClicked.addListener(function(tab) {
  chrome.pageAction.setIcon({path: {19: "aem_none_19.png", 38: "aem_none_38.png"}, tabId: tab.id});
  chrome.pageAction.setTitle({title: "Loading AEM page...", tabId: tab.id});
  if (tab.url.indexOf('/cf') == -1 && tab.url.indexOf('wcmmode=disabled') != -1) {
    console.log('CF added and WCMMode removed');
    var url = tab.url;
    url = url.replace('/content', '/cf#/content');
    url = url.replace(/&wcmmode=disabled|\?wcmmode=disabled/gi, '');
    chrome.tabs.update(tab.id, { url: url });
  } else if (tab.url.indexOf('/cf') == -1  && tab.url.indexOf('wcmmode=disabled') == -1) {
    console.log('WCMmode added');
    if(tab.url.indexOf('?') == -1) {
      chrome.tabs.update(tab.id, {url: tab.url + "?wcmmode=disabled"});
    } else {
      chrome.tabs.update(tab.id, {url: tab.url + "&wcmmode=disabled"});
    }
  } else {
    console.log('CF removed');
    chrome.tabs.update(tab.id, { url: tab.url.replace('/cf#', '') });
  }
});
