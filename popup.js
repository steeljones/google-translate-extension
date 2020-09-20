let fullText, inputEl, output, textToCopy, notificationEl, languagesContainer,
    newLanguageSelect;

let translationCount = 0;

let targetLanguages;


function init(){
  loadTargetLanguages();
  
  output = document.getElementById('output');

  document.getElementById( 'input' ).focus();
  
  notificationEl = document.getElementById('notification');
  
  initUI();

  chrome.runtime.onMessage.addListener( handleMessage );  
}

function handleMessage(request, sender, sendResponse){
  /*
    The translate tab sends messages containing the result of a translation to this script.
    This is the handler for those messages
   */
  output = document.getElementById('output');
  translationCount++;

  if( request.languageList ){
    renderNewLanguagesList( request.languageList );
    return
  }

  let { text } = request;
  //let newline = String.fromCharCode(13, 10);
  
  fullText += text + '\n\n';
  textToCopy += text + '\n\n';
  output.innerText = fullText;

  if(translationCount == targetLanguages.length){
    notificationEl.classList.remove('hidden');
    navigator.clipboard.writeText(textToCopy);
  }
}

async function handleSubmit(){
  let inputEl = document.getElementById( 'input' );
  let text = inputEl.value;
  if(!text.trim()) return

  runCodeInClientTab( `document.querySelector('textarea').value = "${text}"` );
  await timeout( 100 );
  
  fullText = '\n\n' + text + '\n\n';
  textToCopy = "";
  translationCount = 0;
  output.innerText = '';
  notificationEl.classList.add('hidden')
  
  for(let l of targetLanguages){
    await waitForTranslation(l)
  }
}

function initUI(){
  let button = document.getElementById('submit');
  button.addEventListener('click', handleSubmit);
  document.getElementById('new-language').addEventListener('change', handleNewLanguage);
}

function renderTargetLanguages(  ){
  languagesContainer = document.getElementById( 'languages' );
  for(let l of targetLanguages){
    appendLanguageElement(l);
  }

  languagesContainer.addEventListener('click', handleLanguagesClick );

  requestNewLanguagesList();
}

function appendLanguageElement(language){
  let languageDivTemplate = `
    <div class="language">
      <span>${language}</span>
      <span class="remove-language" data-language="${language}">&times</span>
    </div>`;
  languagesContainer.insertAdjacentHTML('beforeend', languageDivTemplate)  
}

function requestNewLanguagesList(){
  /*
    Get the list of languages supported by google translate from the client tab and send back to
    popup
  */
  let requestCode = `
    languages = Array.from(document.querySelector('.language_list_tl_list').querySelectorAll('.language_list_item_language_name'))
      .map( el => el.innerText );
    chrome.runtime.sendMessage({ languageList: languages });
  `;
  runCodeInClientTab( requestCode )
}


function renderNewLanguagesList(languages){
  /*
    Render the list of languages from the google translate tab
    */
  newLanguageSelect = document.getElementById('new-language')
  for( let l of languages ){
    let optionTemplate = `
      <option value="${l}">${l}</option>
    `;
    newLanguageSelect.insertAdjacentHTML('beforeend', optionTemplate);
  }
}

function handleLanguagesClick(event){
  if(event.target.classList.contains('remove-language')){
    handleRemoveLanguageClick(event);
  }
}

function handleRemoveLanguageClick(event){
  let language = event.target.dataset.language;
  let index = targetLanguages.indexOf( language );
  if( index > -1 ) targetLanguages.splice( index, 1 );
  chrome.storage.sync.set({targetLanguages}, () => {  
    event.target.parentElement.remove();
  });
}

function handleNewLanguage( event ){
  let language = event.target.value;
  targetLanguages.push(language)
  chrome.storage.sync.set({targetLanguages}, () => {
    appendLanguageElement(language);
    newLanguageSelect.value = "";
  });
}

function loadTargetLanguages(){
  chrome.storage.sync.get(['targetLanguages'], function(result) {
    if(!result.targetLanguages){
      targetLanguages = [];
    }else{
      targetLanguages = result.targetLanguages;
    }
    renderTargetLanguages( );
  });
}

async function waitForTranslation(language){
  /*
    Get a translation for a given language from the google translate tab
    */
  openLanguagesMenu()
  await timeout( 500 );
  clickLanguageLink(language)
  await timeout( 500 )
  requestResult();
  await timeout( 500 );
}

function clickLanguageLink(language){
  /*
    Click a language link on the google translate tab.
    This selects the language as the current target for translation
   */
  runCodeInClientTab(
  `languageLinks = document.querySelector('.language_list_tl_list').querySelectorAll('.language_list_item_language_name');
  for(let n of languageLinks){
    if(n.innerText == "${language}"){
      n.parentElement.click();
      break;
    }
  }`
  )
}

function openLanguagesMenu(){
  /*
    Open the language menu in the google translate tab.  The menu needs to be open to click a language link.
   */
  runCodeInClientTab("document.querySelector('.tlid-open-target-language-list').click()")
}

function runCodeInClientTab(codeString){
  /*
    Run code in the client tab's context.  This lets you access the dom in google translate
   */
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.executeScript({
      code: codeString
    });
  });
}

function requestResult(){
  /*
    Copy the translation result from google translate
   */
  let sendMessageCode = `
    output = document.querySelector('.tlid-translation').innerText;
    chrome.runtime.sendMessage({ text: output });
  `;
  runCodeInClientTab( sendMessageCode );
}

function timeout(ms) {
  /*
    Helper function to await a given number of milliseconds
   */
  return new Promise(resolve => setTimeout(resolve, ms));
}

init();
