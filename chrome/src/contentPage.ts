import {
  FormData,
  FormSnapshot
} from "../../angular//src/app/shared/app.models";

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
    case "save_form":
      try {
        var fields = serializeInputs();
        sendResponse({ content: fields, error: false });
      } catch (e) {
        sendResponse({ content: e.message, error: true });
      }
      break;

    case "load":
      try {
        loadSnapshot(request.data);
        sendResponse({ error: false, message: "Success!" });
      } catch (e) {
        sendResponse({ error: true, message: e.message });
      }
      break;
  }
});

function serializeInputs() {
  var inputs = document.querySelectorAll("input,select");
  var list = [];
  var formObj;

  for (var i = 0; i < inputs.length; i++) {
    formObj = {};
    let elem = inputs[i] as HTMLInputElement;
    var value = elem.value;
    formObj.type = elem.type;

    formObj.name = elem.name;
    formObj.id = elem.id;

    formObj.tag = elem.tagName.toLowerCase();
    formObj.value = value;
    list.push(formObj);
  }

  return list;
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
  let inputs = Array.prototype.slice.call(
    document.querySelectorAll("input,select")
  );

  for (let index = 0; index < snapshotData.fill.length; index++) {
    let savedField = snapshotData.fill[index];

    inputs.map(field => {
      return field.name === savedField.name
        ? (field.value = savedField.value)
        : false;
    });
  }
}
