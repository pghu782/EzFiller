import { FormData } from '../../angular/src/app/shared/app.models';
import { PageCommand } from '../../angular/src/app/shared/enum.models';

// chrome.runtime.onMessage.addListener((request, sender, respond) => {
//   const handler = new Promise((resolve, reject) => {
//     if (request) {
//       resolve(
//         `Hi from contentPage :) You are currently on: ${window.location.href}`
//       );
//     } else {
//       reject("request is empty.");
//     }
//   });

//   handler.then(message => respond(message)).catch(error => respond(error));

//   return true;
// });

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.command) {
    case PageCommand.SaveForm:
      try {
        var fields = serializeInputs();
        sendResponse({ content: fields, error: false });
      } catch (e) {
        sendResponse({ content: e.message, error: true });
      }
      break;

    case PageCommand.Load:
      try {
        loadSnapshot(request.data);
        sendResponse({ error: false, message: 'Success!' });
      } catch (e) {
        sendResponse({ error: true, message: e.message });
      }
      break;
  }
});

function serializeInputs() {
  const inputs = document.querySelectorAll('input,select');
  const savedControls = [];
  let control;

  for (var i = 0; i < inputs.length; i++) {
    const input = inputs[i] as HTMLInputElement;

    if (input.value.trim() == '') {
      continue;
    }

    control = {};
    control.type = input.type;
    control.name = input.name;
    control.id = input.id;
    control.tag = input.tagName.toLowerCase();
    control.value = input.value;
    savedControls.push(control);
  }

  return savedControls;
}

var port = chrome.runtime.connect();
// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//     const command = message['command'];
//     console.log('Received runtime command: ' + command);
//     const response = { message: 'Aye!' };
//     sendResponse(response);
// });
//console.log(sender.tab ? "from a content script:" + sender.tab.url : "from the extension");

function loadSnapshot(snapshotData: FormData) {
  if (!snapshotData.fill) return;
  let inputs = Array.prototype.slice.call(document.querySelectorAll('input,select'));

  for (let index = 0; index < snapshotData.fill.length; index++) {
    let savedField = snapshotData.fill[index];

    inputs.map(field => {
      return field.name === savedField.name ? (field.value = savedField.value) : false;
    });
  }
}
