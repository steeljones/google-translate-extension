let chineseHref = 'https://translate.google.com/?hl=en&tab=TT&authuser=0#view=home&op=translate&sl=en&tl=zh-CN';
let spanishHref = 'https://translate.google.com/?hl=en&tab=TT&authuser=0#view=home&op=translate&sl=en&tl=es';

let translationCount = 0;

function run(){
  addListeners();
}


function addListeners(){
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) { 
    if(request.url){
      window.location.href = request.url
      translationCount = 0;
      return;
    }
    let { text, language  } = request;



    let textArea = document.querySelector('textarea');
    textArea.value = text;

    setTimeout( () => {
      let outputEl = document.querySelector('.tlid-translation')
      let output = outputEl.innerText;
      chrome.runtime.sendMessage({text:output});
      
      translationCount++
      if(translationCount >= 2){
        return;
      }
      nextTranslation();
    }, 2500 );
  });
}

function nextTranslation(){
  translationCount++;
  if(window.location.hash.includes('tl=zh-CN')){
    window.location.href = spanishHref;
  }else if(window.location.hash.includes('tl=es')){
    window.location.href = chineseHref;
  }
}

run();
