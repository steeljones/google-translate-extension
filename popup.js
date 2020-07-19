let chineseHref = 'https://translate.google.com/?hl=en&tab=TT&authuser=0#view=home&op=translate&sl=en&tl=zh-CN';
let spanishHref = 'https://translate.google.com/?hl=en&tab=TT&authuser=0#view=home&op=translate&sl=en&tl=es';

let fullText, tabId, inputEl, output, textToCopy, notificationEl;

let translationCount = 0;

function main(){
  let button = document.getElementById('submit');
  button.addEventListener('click', handleSubmit);

  output = document.getElementById('output');

  chrome.runtime.onMessage.addListener( handleMessage );
  injectTheScript();

  inputEl = document.getElementById( 'input' );
  inputEl.addEventListener('click', handleInputFocus);

  inputEl.focus();

  notificationEl = document.getElementById('notification');
}

function handleMessage(request, sender, sendResponse){
  output = document.getElementById('output');
  

  
  translationCount++;

  
  let { text } = request;

  let newline = String.fromCharCode(13, 10);
  
  fullText += text + '\n\n';
  textToCopy += text + '\n\n';
  output.innerText = fullText;
  
  navigator.clipboard.writeText(textToCopy)

  if(translationCount >= 2){
    notificationEl.classList.remove('hidden')
    return
  }
  
  setTimeout( () => {
    let msg = {text: inputEl.value, language: 'es'}
    chrome.tabs.sendMessage(tabId, msg);
  }, 500 );


}

function handleSubmit(){

  let text = inputEl.value;
  
  fullText = '\n\n' + text + '\n\n';
  textToCopy = "";
  translationCount = 0;
  output.innerText = '';
  notificationEl.classList.add('hidden')
  
  setTimeout( () => {
    let msg = {
      text, language: 'zh-CN', initial: true
    }
    chrome.tabs.sendMessage(tabId, msg);
  }, 500 );
}

function injectTheScript() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    tabId = tabs[0].id
    chrome.tabs.update({url: chineseHref})
    setTimeout( () => {
      chrome.tabs.executeScript({file: "main.js"});
    }, 1000 );
  });
}

function handleInputFocus(){
  let msg = {
    url: chineseHref
  }
  chrome.tabs.sendMessage(tabId, msg);
}

main();
