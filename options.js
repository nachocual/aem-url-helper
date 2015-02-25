function save_options() {
  var authoringUIMode = document.getElementById('authoringUIMode').value;
  chrome.storage.sync.set({
    defaultAuthoringUIMode: authoringUIMode
  }, function() {
    var status = document.getElementById('status');
    status.textContent = 'Default saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
}

function restore_options() {
  chrome.storage.sync.get({
    defaultAuthoringUIMode: 'classic'
  }, function(items) {
    document.getElementById('authoringUIMode').value = items.defaultAuthoringUIMode;
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
